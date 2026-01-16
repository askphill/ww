import {google} from 'googleapis';
import type {FetchOptions, GscQuery} from '../types/index.js';

const webmasters = google.webmasters('v3');

function getAuth() {
  const clientId = process.env.GSC_CLIENT_ID;
  const clientSecret = process.env.GSC_CLIENT_SECRET;
  const refreshToken = process.env.GSC_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      'Missing GSC credentials. Set GSC_CLIENT_ID, GSC_CLIENT_SECRET, and GSC_REFRESH_TOKEN in .env',
    );
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({refresh_token: refreshToken});

  return oauth2Client;
}

export async function fetchGscData(options: FetchOptions): Promise<GscQuery[]> {
  const siteUrl = process.env.GSC_SITE_URL;

  if (!siteUrl) {
    throw new Error('Missing GSC_SITE_URL in .env');
  }

  const auth = getAuth();

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - options.days);

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
  if (options.country.toLowerCase() !== 'all') {
    requestBody.dimensionFilterGroups = [
      {
        filters: [
          {
            dimension: 'country',
            operator: 'equals',
            expression: options.country.toLowerCase(),
          },
        ],
      },
    ];
  }

  const response = await webmasters.searchanalytics.query({
    auth,
    siteUrl,
    requestBody,
  });

  if (!response.data.rows) {
    return [];
  }

  return response.data.rows.map((row) => ({
    query: row.keys?.[0] ?? '',
    date: row.keys?.[1] ?? '',
    country: options.country,
    clicks: row.clicks ?? 0,
    impressions: row.impressions ?? 0,
    ctr: row.ctr ?? 0,
    position: row.position ?? 0,
  }));
}

export async function fetchGscDataForUrls(
  urls: string[],
  days: number,
): Promise<
  Map<string, {impressions: number; clicks: number; avgPosition: number}>
> {
  const siteUrl = process.env.GSC_SITE_URL;

  if (!siteUrl) {
    throw new Error('Missing GSC_SITE_URL in .env');
  }

  const auth = getAuth();

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const results = new Map<
    string,
    {impressions: number; clicks: number; avgPosition: number}
  >();

  // Fetch data for each URL
  for (const url of urls) {
    const fullUrl = `${siteUrl}${url}`;

    try {
      const response = await webmasters.searchanalytics.query({
        auth,
        siteUrl,
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
