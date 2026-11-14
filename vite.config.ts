import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

function apiEndpointTester() {
  return {
    name: 'api-endpoint-tester',
    configureServer(server: any) {
      server.middlewares.use('/api/ping-endpoint', async (req: any, res: any) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          return res.end(JSON.stringify({ error: 'Method not allowed' }));
        }

        let body = '';
        req.on('data', (chunk: any) => {
          body += chunk;
        });

        req.on('end', async () => {
          try {
            const parsed = JSON.parse(body || '{}');
            const targetUrl = parsed.url;
            const payload = parsed.payload || {};

            if (!targetUrl) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, message: 'URL is required' }));
            }

            const response = await fetch(targetUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
              redirect: 'follow',
            });

            const text = await response.text();

            if (text.includes('doPost') && (text.includes('見つかりません') || text.includes('not found'))) {
              res.setHeader('Content-Type', 'application/json');
              return res.end(
                JSON.stringify({
                  success: false,
                  code: 'NO_DOPOST',
                  message:
                    'Google Apps Script responded: "Script function not found: doPost". In your Google Sheet → Extensions → Apps Script, make sure function doPost(e) is defined, then click Deploy → Manage deployments → Edit → Version: New version → Deploy.',
                  details: 'Function doPost is missing or not deployed in active deployment version.',
                })
              );
            }

            if (targetUrl.endsWith('/dev') || text.includes('現在、ファイルを開くことができません') || text.includes('ページが見つかりません')) {
              res.setHeader('Content-Type', 'application/json');
              return res.end(
                JSON.stringify({
                  success: false,
                  code: 'DEV_URL_OR_NOT_FOUND',
                  message:
                    'Google Apps Script warning: URLs ending in "/dev" are private test links requiring your Google account session. For public website forms, deploy as a Web app with "Who has access: Anyone" and use the URL ending in "/exec".',
                  suggestion: targetUrl.replace(/\/dev$/, '/exec'),
                })
              );
            }

            if (
              text.includes('accounts.google.com/ServiceLogin') ||
              text.includes('accounts.google.com/v3/signin') ||
              text.includes('Sign in - Google Accounts')
            ) {
              res.setHeader('Content-Type', 'application/json');
              return res.end(
                JSON.stringify({
                  success: false,
                  code: 'AUTH_REQUIRED',
                  message:
                    'Access Denied: Your Google Apps Script deployment requires Google Sign-In. Click Deploy -> Manage deployments -> Edit -> set "Who has access" to "Anyone" -> Deploy, and use the URL ending in "/exec".',
                })
              );
            }

            let scriptJson: any = null;
            try {
              scriptJson = JSON.parse(text);
            } catch {
              scriptJson = null;
            }

            if (scriptJson && scriptJson.status === 'error') {
              res.setHeader('Content-Type', 'application/json');
              return res.end(
                JSON.stringify({
                  success: false,
                  code: 'SCRIPT_ERROR',
                  message: `Google Apps Script Error: ${scriptJson.message}`,
                })
              );
            }

            res.setHeader('Content-Type', 'application/json');
            return res.end(
              JSON.stringify({
                success: true,
                status: response.status,
                spreadsheetName: scriptJson?.spreadsheetName || null,
                spreadsheetUrl: scriptJson?.spreadsheetUrl || null,
                message: scriptJson?.spreadsheetName
                  ? `Verified! Row appended to Google Sheet "${scriptJson.spreadsheetName}".`
                  : 'Verified! Google Apps Script successfully received the payload and executed.',
                responseSnippet: text.slice(0, 150),
              })
            );
          } catch (err: any) {
            res.setHeader('Content-Type', 'application/json');
            return res.end(
              JSON.stringify({
                success: false,
                message: `Connection error: ${err.message || 'Network request failed'}`,
              })
            );
          }
        });
      });

      server.middlewares.use('/api/fetch-sheet', async (req: any, res: any) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          return res.end(JSON.stringify({ error: 'Method not allowed' }));
        }

        let body = '';
        req.on('data', (chunk: any) => {
          body += chunk;
        });

        req.on('end', async () => {
          try {
            const parsed = JSON.parse(body || '{}');
            const targetUrl = parsed.url;

            if (!targetUrl) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, message: 'URL is required' }));
            }

            const response = await fetch(targetUrl, {
              method: 'GET',
              redirect: 'follow',
            });
            const text = await response.text();

            if (targetUrl.endsWith('/dev') || text.includes('現在、ファイルを開くことができません') || text.includes('ページが見つかりません')) {
              res.setHeader('Content-Type', 'application/json');
              return res.end(
                JSON.stringify({
                  success: false,
                  code: 'DEV_URL_OR_NOT_FOUND',
                  message: 'URL ends with "/dev" (private test link). Deploy as Web App ("Who has access: Anyone") and switch to the "/exec" URL.',
                })
              );
            }

            if (
              text.includes('accounts.google.com/ServiceLogin') ||
              text.includes('accounts.google.com/v3/signin') ||
              text.includes('Sign in - Google Accounts')
            ) {
              res.setHeader('Content-Type', 'application/json');
              return res.end(
                JSON.stringify({
                  success: false,
                  code: 'AUTH_REQUIRED',
                  message: 'Access Denied: In Apps Script, set "Who has access" to "Anyone" and deploy a new Web App version.',
                })
              );
            }

            let scriptJson: any = null;
            try {
              scriptJson = JSON.parse(text);
            } catch {
              scriptJson = null;
            }

            if (!scriptJson) {
              res.setHeader('Content-Type', 'application/json');
              return res.end(
                JSON.stringify({
                  success: false,
                  code: 'NO_DOGET',
                  message: 'Your Apps Script did not return JSON. Paste the updated script (with doGet & doPost) from Integrations Hub and deploy a New version.',
                })
              );
            }

            if (scriptJson.status === 'error') {
              res.setHeader('Content-Type', 'application/json');
              return res.end(
                JSON.stringify({
                  success: false,
                  code: 'SCRIPT_ERROR',
                  message: scriptJson.message,
                })
              );
            }

            res.setHeader('Content-Type', 'application/json');
            return res.end(
              JSON.stringify({
                success: true,
                spreadsheetName: scriptJson.spreadsheetName || 'Connected Google Sheet',
                spreadsheetUrl: scriptJson.spreadsheetUrl || null,
                sheets: scriptJson.sheets || null,
              })
            );
          } catch (err: any) {
            res.setHeader('Content-Type', 'application/json');
            return res.end(
              JSON.stringify({
                success: false,
                message: `Failed to fetch live sheet: ${err.message || 'Network error'}`,
              })
            );
          }
        });
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiEndpointTester()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
