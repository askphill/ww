import {google} from 'googleapis';

export interface GscQueryData {
  query: string;
  date: string;
  country: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GscUrlData {
  url: string;
  impressions: number;
  clicks: number;
  avgPosition: number;
}

export interface GscCredentials {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  siteUrl: string;
}

function getAuth(credentials: GscCredentials) {
  const oauth2Client = new google.auth.OAuth2(
    credentials.clientId,
    credentials.clientSecret,
  );
  oauth2Client.setCredentials({refresh_token: credentials.refreshToken});
  return oauth2Client;
}

export async function fetchGscQueries(
  credentials: GscCredentials,
  days: number,
  country: string = 'all',
): Promise<GscQueryData[]> {
  const webmasters = google.webmasters('v3');
  const auth = getAuth(credentials);

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const requestBody: {
    startDate: string;
    endDate: string;
    dimensions: string[];
    dimensionFilterGroups?: Array<{
      filters: Array<{dimension: string; operator: string; expression: string}>;
    }>;
    rowLimit: number;
  } = {
    startDate: startDate.toISOString().split('T')[0] ?? '',
    endDate: endDate.toISOString().split('T')[0] ?? '',
    dimensions: ['query', 'date'],
    rowLimit: 5000,
  };

  // Only filter by country if not "all"
  if (country.toLowerCase() !== 'all') {
    requestBody.dimensionFilterGroups = [
      {
        filters: [
          {
            dimension: 'country',
            operator: 'equals',
            expression: country.toLowerCase(),
          },
        ],
      },
    ];
  }

  const response = await webmasters.searchanalytics.query({
    auth,
    siteUrl: credentials.siteUrl,
    requestBody,
  });

  if (!response.data.rows) {
    return [];
  }

  return response.data.rows.map((row) => ({
    query: row.keys?.[0] ?? '',
    date: row.keys?.[1] ?? '',
    country,
    clicks: row.clicks ?? 0,
    impressions: row.impressions ?? 0,
    ctr: row.ctr ?? 0,
    position: row.position ?? 0,
  }));
}

export async function fetchGscUrlData(
  credentials: GscCredentials,
  urls: string[],
  days: number,
): Promise<Map<string, GscUrlData>> {
  const webmasters = google.webmasters('v3');
  const auth = getAuth(credentials);

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const results = new Map<string, GscUrlData>();

  for (const url of urls) {
    const fullUrl = `${credentials.siteUrl}${url}`;

    try {
      const response = await webmasters.searchanalytics.query({
        auth,
        siteUrl: credentials.siteUrl,
        requestBody: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          dimensions: ['page'],
          dimensionFilterGroups: [
            {
              filters: [
                {
                  dimension: 'page',
                  operator: 'equals',
                  expression: fullUrl,
                },
              ],
            },
          ],
        },
      });

      const row = response.data.rows?.[0];
      if (row) {
        results.set(url, {
          url,
          impressions: row.impressions ?? 0,
          clicks: row.clicks ?? 0,
          avgPosition: row.position ?? 0,
        });
      }
    } catch {
      // Skip URLs that fail
      continue;
    }
  }

  return results;
}
