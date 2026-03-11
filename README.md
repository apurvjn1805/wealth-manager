# Wealth Tracker

Angular-based personal finance dashboard with Google Sheets as storage and Netlify Functions as the secure backend proxy.

## Architecture

```text
Browser (Angular app) -> Netlify Function -> Google Sheets API
```

- Frontend code lives in `frontend/` (Angular standalone components).
- Serverless backend lives in `netlify/functions/sheets.js`.
- Secrets stay in Netlify environment variables (never in browser source).

## Setup Guide

### 1) Google Sheet setup

1. Create a Google Sheet.
2. Add tabs named exactly:
   - `Snapshots`
   - `SIPs`
   - `Breakdown`
3. In `Snapshots`, add row 1:
   ```text
   label | netWorth | cash | equity | debt | hdfc | icici | sbi | food | mfInv | mfGain | stocks | epf | gold | fd | mfDebt | ppf | given | avinake | misc
   ```
4. In `SIPs`, add row 1:
   ```text
   name | amt | day | type | active
   ```
5. Share the sheet as **Anyone with link -> Viewer**.
6. Copy the `SHEET_ID` from the URL.

### 2) Google Cloud credentials

#### API key (reads)

1. Create a project in [Google Cloud Console](https://console.cloud.google.com).
2. Enable Google Sheets API.
3. Create API key and restrict it to Google Sheets API.

#### OAuth refresh token (writes)

1. Create OAuth Client ID (Web application).
2. Add redirect URI: `https://developers.google.com/oauthplayground`.
3. In [OAuth Playground](https://developers.google.com/oauthplayground), use your own OAuth credentials.
4. Request scope: `https://www.googleapis.com/auth/spreadsheets`.
5. Authorize, exchange code for tokens, and copy the refresh token.

## Deploy to Netlify

1. Push repo to GitHub.
2. In Netlify: **Add new site -> Import from GitHub**.
3. Build settings are already in `netlify.toml`:
   - Build command: `npm --prefix frontend install && npm --prefix frontend run build`
   - Publish directory: `frontend/dist/frontend/browser`
   - Functions directory: `netlify/functions`
4. Add environment variables in **Site settings -> Environment variables**:

| Key | Value |
|-----|-------|
| `SHEET_ID` | Google Sheet ID |
| `GOOGLE_API_KEY` | Sheets API key |
| `GOOGLE_CLIENT_ID` | OAuth client id |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret |
| `GOOGLE_REFRESH_TOKEN` | OAuth refresh token |
| `AUTH_USER` | Login username |
| `AUTH_PASS` | Strong login password |

5. Trigger deploy.

## Local development

```bash
npm install -g netlify-cli
cp .env.example .env
cd frontend && npm install
netlify dev
```

`netlify dev` serves both Angular app and Netlify Functions together.

## Security notes

- Keep all secrets only in Netlify env vars.
- Use a strong `AUTH_PASS` and rotate periodically.
- Access the app only over HTTPS.
- If you need multi-user auth, migrate from Basic auth to a token/session provider.
