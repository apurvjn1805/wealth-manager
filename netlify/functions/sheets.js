// netlify/functions/sheets.js
// Secure proxy — API keys and OAuth secrets stay server-side.

const SHEET_ID = process.env.SHEET_ID;
const API_KEY = process.env.GOOGLE_API_KEY;
const OAUTH_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const OAUTH_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const OAUTH_REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;

const BASE = 'https://sheets.googleapis.com/v4/spreadsheets';
const ALLOWED_TABS = new Set(['Snapshots', 'SIPs', 'deleteSnapshot']);
const PROD = process.env.NODE_ENV === 'production';
const headers = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
};

async function getAccessToken() {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: OAUTH_CLIENT_ID,
      client_secret: OAUTH_CLIENT_SECRET,
      refresh_token: OAUTH_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  });
  const data = await res.json();
  if (!data.access_token) {
    throw new Error('Failed to get access token');
  }
  return data.access_token;
}

function fail(statusCode, error) {
  return { statusCode, headers, body: JSON.stringify({ error }) };
}

function checkAuth(event) {
  const auth = event.headers?.authorization || event.headers?.Authorization || '';
  if (!auth.startsWith('Basic ')) return false;
  const decoded = Buffer.from(auth.slice(6), 'base64').toString();
  const [user, pass] = decoded.split(':');
  return user === process.env.AUTH_USER && pass === process.env.AUTH_PASS;
}

function parseBody(event) {
  try {
    return JSON.parse(event.body || '{}');
  } catch {
    return null;
  }
}

function validSnapshot(data) {
  return !!data && typeof data.label === 'string' && typeof data.netWorth === 'number';
}

function validSipPayload(data) {
  return !!data && Array.isArray(data.sips);
}

function validDeleteSnapshotPayload(data) {
  return !!data && Array.isArray(data.snapshots);
}

function ensureEnv() {
  const required = [
    'SHEET_ID',
    'GOOGLE_API_KEY',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_REFRESH_TOKEN',
    'AUTH_USER',
    'AUTH_PASS',
  ];
  return required.every((key) => !!process.env[key]);
}

function normalizeHeader(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function pickHeaderRow(values, aliases) {
  if (!Array.isArray(values) || values.length === 0) return { headers: [], rows: [] };
  let headerIndex = 0;
  let bestScore = -1;
  for (let i = 0; i < values.length; i += 1) {
    const row = values[i] || [];
    const score = row.reduce((acc, cell) => acc + (aliases[normalizeHeader(cell)] ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      headerIndex = i;
    }
  }
  return { headers: values[headerIndex] || [], rows: values.slice(headerIndex + 1) };
}

function normalizeNumeric(value) {
  if (typeof value === 'string') {
    return value.replace(/,/g, '').trim();
  }
  return value;
}

function parseGrid(grid, aliases) {
  if (!grid || !Array.isArray(grid.values) || grid.values.length < 2) return [];
  const { headers, rows } = pickHeaderRow(grid.values, aliases);
  const mappedHeaders = headers.map((h) => aliases[normalizeHeader(h)] || null);
  return rows
    .map((row) => {
      const record = {};
      mappedHeaders.forEach((key, i) => {
        if (!key) return;
        const raw = row[i] ?? '';
        record[key] = normalizeNumeric(raw);
      });
      return record;
    })
    .filter((row) => Object.keys(row).length > 0);
}

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return fail(405, 'Method not allowed');
  }
  if (!ensureEnv()) {
    return fail(500, 'Server configuration error');
  }
  if (!checkAuth(event)) {
    return {
      statusCode: 401,
      headers: { ...headers, 'WWW-Authenticate': 'Basic realm="Wealth Tracker"' },
      body: JSON.stringify({ error: 'Unauthorized' }),
    };
  }

  const payload = parseBody(event);
  if (!payload) {
    return fail(400, 'Invalid JSON body');
  }

  const { action, tab, data } = payload;
  if (action !== 'read' && action !== 'write') {
    return fail(400, 'Invalid action');
  }
  if (action === 'write' && !ALLOWED_TABS.has(tab)) {
    return fail(400, 'Invalid tab');
  }

  try {
    if (action === 'read') {
      const ranges = ['Snapshots!A:Z', 'SIPs!A:Z'].join('&ranges=');
      const url = `${BASE}/${SHEET_ID}/values:batchGet?ranges=${ranges}&key=${API_KEY}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.error) throw new Error(json.error.message || 'Sheets read failed');

      const snapshotAliases = {
        label: 'label',
        networth: 'netWorth',
        cash: 'cash',
        equity: 'equity',
        debt: 'debt',
        hdfc: 'hdfc',
        icici: 'icici',
        sbi: 'sbi',
        food: 'food',
        foodwallet: 'food',
        mfinv: 'mfInv',
        mfinvested: 'mfInv',
        mfgain: 'mfGain',
        mfgains: 'mfGain',
        stocks: 'stocks',
        epf: 'epf',
        gold: 'gold',
        fd: 'fd',
        mfdebt: 'mfDebt',
        ppf: 'ppf',
        given: 'given',
        givensantosh: 'given',
        avinake: 'avinake',
        misc: 'misc',
      };
      const sipAliases = {
        name: 'name',
        fundname: 'name',
        amt: 'amt',
        monthlyamount: 'amt',
        day: 'day',
        sipdate: 'day',
        type: 'type',
        active: 'active',
        activetruefalse: 'active',
      };

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          snapshots: parseGrid(json.valueRanges?.[0], snapshotAliases),
          sips: parseGrid(json.valueRanges?.[1], sipAliases),
        }),
      };
    }

    const token = await getAccessToken();
    const authHeader = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    if (tab === 'Snapshots') {
      if (!validSnapshot(data)) return fail(400, 'Invalid snapshot payload');
      const d = data.detail || {};
      const row = [
        data.label, data.netWorth, data.cash, data.equity, data.debt,
        d.hdfc || 0, d.icici || 0, d.sbi || 0, d.food || 0,
        d.mfInv || 0, d.mfGain || 0, d.stocks || 0,
        d.epf || 0, d.gold || 0, d.fd || 0, d.mfDebt || 0, d.ppf || 0, d.given || 0, d.avinake || 0, d.misc || 0,
      ];
      const res = await fetch(
        `${BASE}/${SHEET_ID}/values/Snapshots!A:T:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
        { method: 'POST', headers: authHeader, body: JSON.stringify({ values: [row] }) },
      );
      const json = await res.json();
      if (json.error) throw new Error(json.error.message || 'Snapshots write failed');
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    if (tab === 'SIPs') {
      if (!validSipPayload(data)) return fail(400, 'Invalid SIP payload');
      const rows = data.sips.map((s) => [s.name, s.amt, s.day, s.type, s.active ? 'TRUE' : 'FALSE']);
      await fetch(`${BASE}/${SHEET_ID}/values/SIPs!A2:Z:clear`, { method: 'POST', headers: authHeader });
      if (rows.length > 0) {
        const res = await fetch(
          `${BASE}/${SHEET_ID}/values/SIPs!A2:E?valueInputOption=RAW`,
          { method: 'PUT', headers: authHeader, body: JSON.stringify({ values: rows }) },
        );
        const json = await res.json();
        if (json.error) throw new Error(json.error.message || 'SIPs write failed');
      }
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    if (tab === 'deleteSnapshot') {
      if (!validDeleteSnapshotPayload(data)) return fail(400, 'Invalid delete payload');
      const snaps = data.snapshots;
      const headerRow = ['label', 'netWorth', 'cash', 'equity', 'debt', 'hdfc', 'icici', 'sbi', 'food', 'mfInv', 'mfGain', 'stocks', 'epf', 'gold', 'fd', 'mfDebt', 'ppf', 'given', 'avinake', 'misc'];
      const rows = snaps.map((s) => {
        const d = s.detail || {};
        return [s.label, s.netWorth, s.cash, s.equity, s.debt, d.hdfc || 0, d.icici || 0, d.sbi || 0, d.food || 0, d.mfInv || 0, d.mfGain || 0, d.stocks || 0, d.epf || 0, d.gold || 0, d.fd || 0, d.mfDebt || 0, d.ppf || 0, d.given || 0, d.avinake || 0, d.misc || 0];
      });
      await fetch(`${BASE}/${SHEET_ID}/values/Snapshots!A1:T:clear`, { method: 'POST', headers: authHeader });
      const res = await fetch(
        `${BASE}/${SHEET_ID}/values/Snapshots!A1:T?valueInputOption=RAW`,
        { method: 'PUT', headers: authHeader, body: JSON.stringify({ values: [headerRow, ...rows] }) },
      );
      const json = await res.json();
      if (json.error) throw new Error(json.error.message || 'Snapshot delete failed');
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    return fail(400, 'Unknown action');
  } catch (err) {
    if (!PROD) {
      return fail(500, err.message || 'Server error');
    }
    return fail(500, 'Internal server error');
  }
}
