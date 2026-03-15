// netlify/functions/sheets.js
// Secure proxy — API keys and OAuth secrets stay server-side.

const SHEET_ID = process.env.SHEET_ID;
const API_KEY = process.env.GOOGLE_API_KEY;
const OAUTH_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const OAUTH_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const OAUTH_REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;

const BASE = 'https://sheets.googleapis.com/v4/spreadsheets';
const ALLOWED_TABS = new Set(['Snapshots', 'SIPs', 'deleteSnapshot', 'fullSync']);
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

async function getSheetId(title, token) {
  const res = await fetch(`${BASE}/${SHEET_ID}?key=${API_KEY}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  const sheet = data.sheets?.find(s => s.properties.title === title);
  return sheet ? sheet.properties.sheetId : 0;
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

function toNumeric(value) {
  if (value === undefined || value === null || value === '') return 0;
  if (typeof value === 'number') return value;
  const cleaned = String(value).replace(/[^0-9.-]/g, '');
  return parseFloat(cleaned) || 0;
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
      const ranges = ['Snapshots!A:ZZ', 'SIPs!A:ZZ'].join('&ranges=');
      const url = `${BASE}/${SHEET_ID}/values:batchGet?ranges=${ranges}&key=${API_KEY}&majorDimension=COLUMNS`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.error) throw new Error(json.error.message || 'Sheets read failed');

      const snapshotColumns = json.valueRanges?.[0]?.values || [];
      const snapshots = [];

      // Data starts from column index 3 (Column D)
      for (let i = 3; i < snapshotColumns.length; i++) {
        const col = snapshotColumns[i];
        if (!col || !col[1]) continue;

        snapshots.push({
          label: col[1] || 'N/A',
          netWorth: toNumeric(col[2]),
          cash: toNumeric(col[3]),
          debt: toNumeric(col[4]),
          equity: toNumeric(col[5]),
          detail: {
            sbi: toNumeric(col[8]),
            icici: toNumeric(col[9]),
            hdfc: toNumeric(col[10]),
            food: toNumeric(col[11]),
            mfInv: toNumeric(col[12]),
            mfGain: toNumeric(col[13]),
            stocks: toNumeric(col[14]),
            fd: toNumeric(col[15]),
            gold: toNumeric(col[16]),
            mfDebt: toNumeric(col[17]),
            ppf: toNumeric(col[18]),
            epf: toNumeric(col[19]),
            given: toNumeric(col[21]),
            flatDeposit: toNumeric(col[22]),
            misc: toNumeric(col[23]),
            avinake: toNumeric(col[24]),
          }
        });
      }

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

      // Re-fetch SIPs with standard dimension if needed, or parse from columns
      // For now, let's keep it simple and assume the UI wants rows for SIPs
      const sipUrl = `${BASE}/${SHEET_ID}/values/SIPs!A:Z?key=${API_KEY}`;
      const sipRes = await fetch(sipUrl);
      const sipGrid = await sipRes.json();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          snapshots: snapshots.reverse(), // Reverse to keep chronological order if needed by UI
          sips: parseGrid(sipGrid, sipAliases),
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

      const values = [[
        '', // Row 1 (Year)
        data.label, // Row 2 (Date)
        data.netWorth, // Row 3
        data.cash, // Row 4
        data.debt, // Row 5
        data.equity, // Row 6
        '', // Row 7
        '|| Details below ||', // Row 8
        d.sbi || 0, // Row 9
        d.icici || 0, // Row 10
        d.hdfc || 0, // Row 11
        d.food || 0, // Row 12
        d.mfInv || 0, // Row 13
        d.mfGain || 0, // Row 14
        d.stocks || 0, // Row 15
        d.fd || 0, // Row 16
        d.gold || 0, // Row 17
        d.mfDebt || 0, // Row 18
        d.ppf || 0, // Row 19
        d.epf || 0, // Row 20
        0, // Row 21 (Santosh)
        d.given || 0, // Row 22
        d.flatDeposit || 0, // Row 23
        d.misc || 0, // Row 24
        d.avinake || 0, // Row 25
      ]];

      const batchUpdateUrl = `${BASE}/${SHEET_ID}:batchUpdate`;
      const sheetId = await getSheetId('Snapshots', token);

      // Ensure labels exist in Column C
      const labels = [
        [''], ['Type'], ['Net Worth'], ['CASH'], ['Debt Inv.'], ['Equity Inv.'], [''], ['|| Details below ||'],
        ['SBI'], ['ICICI'], ['HDFC'], ['Food Wallet'], ['MF Equity (Inv. Amount)'], ['MF Gains'], ['Stocks'],
        ['FD'], ['Gold'], ['MF Debt'], ['PPF'], ['EPF (UAN 101619682423)'], ['Santosh'], ['Given'], ['Flat deposit'], ['Misc.'], ['Avinake']
      ];
      await fetch(`${BASE}/${SHEET_ID}/values/Snapshots!C1:C25?valueInputOption=RAW`, {
        method: 'PUT', headers: authHeader, body: JSON.stringify({ values: labels })
      });

      // 1. Insert column at D
      await fetch(batchUpdateUrl, {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({
          requests: [{
            insertDimension: {
              range: { sheetId, dimension: 'COLUMNS', startIndex: 3, endIndex: 4 },
              inheritFromBefore: false,
            },
          }],
        }),
      });

      // 2. Write values to Column D
      await fetch(`${BASE}/${SHEET_ID}/values/Snapshots!D1:D25?valueInputOption=RAW`, {
        method: 'PUT', headers: authHeader, body: JSON.stringify({ values, majorDimension: 'COLUMNS' })
      });

      // 3. Apply formatting
      await fetch(batchUpdateUrl, {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({
          requests: [
            { repeatCell: { range: { sheetId, startRowIndex: 2, endRowIndex: 3, startColumnIndex: 3, endColumnIndex: 4 }, cell: { userEnteredFormat: { backgroundColor: { red: 0.8, green: 1.0, blue: 0.8 }, textFormat: { bold: true } } }, fields: 'userEnteredFormat(backgroundColor,textFormat)' } },
            { repeatCell: { range: { sheetId, startRowIndex: 3, endRowIndex: 4, startColumnIndex: 3, endColumnIndex: 4 }, cell: { userEnteredFormat: { backgroundColor: { red: 0.8, green: 0.9, blue: 1.0 }, textFormat: { bold: true } } }, fields: 'userEnteredFormat(backgroundColor,textFormat)' } }
          ]
        }),
      });

      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    if (tab === 'fullSync' || tab === 'deleteSnapshot') {
      const snaps = (data.snapshots || []).slice().reverse(); // UI sends chronological, but fullSync writes newest at top/left in some versions? No, UI sends in same order it expects. 
      // Actually, sheets.js `read` reverses them. 
      // If `read` returns `[Oldest, ..., Newest]`, UI has that.
      // If UI sends `[Oldest, ..., Newest]` to `fullSync`, we want them as columns D, E, F...
      // `columns` array below: `snaps.map` will produce `[D, E, F...]`.
      // Column D should be Newest. So we need `snaps` to be `[Newest, ..., Oldest]`.
      const orderedSnaps = snaps; // Assuming UI order is correct for columns D, E, F

      const labels = [
        [''], ['Type'], ['Net Worth'], ['CASH'], ['Debt Inv.'], ['Equity Inv.'], [''], ['|| Details below ||'],
        ['SBI'], ['ICICI'], ['HDFC'], ['Food Wallet'], ['MF Equity (Inv. Amount)'], ['MF Gains'], ['Stocks'],
        ['FD'], ['Gold'], ['MF Debt'], ['PPF'], ['EPF (UAN 101619682423)'], ['Santosh'], ['Given'], ['Flat deposit'], ['Misc.'], ['Avinake']
      ];

      const columns = orderedSnaps.map(s => {
        const d = s.detail || {};
        return [
          '', s.label, s.netWorth, s.cash, s.debt, s.equity, '', '|| Details below ||',
          d.sbi || 0, d.icici || 0, d.hdfc || 0, d.food || 0, d.mfInv || 0, d.mfGain || 0, d.stocks || 0,
          d.fd || 0, d.gold || 0, d.mfDebt || 0, d.ppf || 0, d.epf || 0, 0, d.given || 0, d.flatDeposit || 0, d.misc || 0, d.avinake || 0
        ];
      });

      await fetch(`${BASE}/${SHEET_ID}/values/Snapshots!A1:ZZ100:clear`, { method: 'POST', headers: authHeader });

      const valuesToWrite = labels.map((row, i) => [
        '', '', row[0], ...columns.map(col => col[i])
      ]);

      await fetch(`${BASE}/${SHEET_ID}/values/Snapshots!A1?valueInputOption=RAW`, {
        method: 'PUT', headers: authHeader, body: JSON.stringify({ values: valuesToWrite })
      });

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
