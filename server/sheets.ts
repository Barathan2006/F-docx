export interface SpreadsheetSummary {
  id: string;
  name: string;
  webViewLink: string;
  modifiedTime?: string;
}

export class GoogleTokenExpiredError extends Error {
  constructor(message = 'Google Sheets OAuth token expired or revoked. Please reconnect.') {
    super(message);
    this.name = 'GoogleTokenExpiredError';
  }
}

export async function verifyGoogleWorkspaceToken(accessToken: string): Promise<{
  email: string | null;
  scopes: string[];
}> {
  const infoRes = await fetch(
    `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${encodeURIComponent(accessToken)}`
  );
  if (!infoRes.ok) {
    throw new GoogleTokenExpiredError('Invalid or expired Google OAuth access token.');
  }
  const info = (await infoRes.json()) as { email?: string; scope?: string };
  const scopes = info.scope ? info.scope.split(' ').filter(Boolean) : [];
  return {
    email: info.email || null,
    scopes,
  };
}

export async function listUserSpreadsheets(accessToken: string): Promise<SpreadsheetSummary[]> {
  const params = new URLSearchParams({
    q: "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false",
    fields: 'files(id,name,webViewLink,modifiedTime)',
    orderBy: 'modifiedTime desc',
    pageSize: '50',
  });

  const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (res.status === 401 || res.status === 403) {
    throw new GoogleTokenExpiredError('Google Drive/Sheets authorization expired. Please reconnect.');
  }

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to list spreadsheets (${res.status}): ${errText}`);
  }

  const data = (await res.json()) as { files?: SpreadsheetSummary[] };
  return data.files || [];
}

export async function createGoogleSpreadsheet(
  accessToken: string,
  title: string,
  sheetName: string,
  headers: string[]
): Promise<{ spreadsheetId: string; spreadsheetName: string; spreadsheetUrl: string }> {
  const cleanSheetName = (sheetName || 'Responses').replace(/[:\\/?*\[\]]/g, '_').slice(0, 80);

  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: { title: title || 'f-docx Form Responses' },
      sheets: [{ properties: { title: cleanSheetName } }],
    }),
  });

  if (createRes.status === 401 || createRes.status === 403) {
    throw new GoogleTokenExpiredError('Google Sheets authorization expired. Please reconnect.');
  }

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Failed to create spreadsheet (${createRes.status}): ${errText}`);
  }

  const created = (await createRes.json()) as {
    spreadsheetId: string;
    spreadsheetUrl: string;
    properties: { title: string };
  };

  if (headers.length > 0) {
    const range = encodeURIComponent(`'${cleanSheetName}'!A1`);
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${created.spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [headers],
        }),
      }
    );
  }

  return {
    spreadsheetId: created.spreadsheetId,
    spreadsheetName: created.properties?.title || title,
    spreadsheetUrl: created.spreadsheetUrl,
  };
}

export async function appendRowToGoogleSpreadsheet(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string,
  headers: string[],
  rowValues: (string | number | boolean)[]
): Promise<void> {
  const cleanSheetName = (sheetName || 'Responses').replace(/[:\\/?*\[\]]/g, '_').slice(0, 80);

  // Check if sheet exists & has headers
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (metaRes.status === 401 || metaRes.status === 403) {
    throw new GoogleTokenExpiredError('Google Sheets token expired or missing permissions.');
  }

  if (metaRes.ok) {
    const meta = (await metaRes.json()) as {
      sheets?: { properties?: { title?: string } }[];
    };
    const exists = meta.sheets?.some((s) => s.properties?.title === cleanSheetName);
    if (!exists) {
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [{ addSheet: { properties: { title: cleanSheetName } } }],
        }),
      });
    }

    // Check row 1 header presence
    const row1Range = encodeURIComponent(`'${cleanSheetName}'!1:1`);
    const row1Res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${row1Range}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (row1Res.ok) {
      const row1Data = (await row1Res.json()) as { values?: string[][] };
      const existingHeaders = row1Data.values?.[0] || [];
      if (existingHeaders.length === 0 && headers.length > 0) {
        const headerRange = encodeURIComponent(`'${cleanSheetName}'!A1`);
        await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${headerRange}?valueInputOption=USER_ENTERED`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ values: [headers] }),
          }
        );
      }
    }
  }

  const appendRange = encodeURIComponent(`'${cleanSheetName}'!A1`);
  const appendRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${appendRange}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [rowValues],
      }),
    }
  );

  if (appendRes.status === 401 || appendRes.status === 403) {
    throw new GoogleTokenExpiredError('Google Sheets authorization expired while appending row.');
  }

  if (!appendRes.ok) {
    const errText = await appendRes.text();
    throw new Error(`Google Sheets append failed (${appendRes.status}): ${errText}`);
  }
}
