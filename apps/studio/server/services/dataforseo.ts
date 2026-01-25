export interface DataForSeoCredentials {
  login: string;
  password: string;
}

export interface KeywordRankResult {
  keyword: string;
  position: number | null; // null if not in top 100
  url: string | null; // which page ranks
  title: string | null;
}

interface SerpItem {
  type: string;
  rank_group: number;
  rank_absolute: number;
  domain: string;
  url: string;
  title: string;
}

interface SerpTask {
  id: string;
  status_code: number;
  status_message: string;
  result?: Array<{
    keyword: string;
    items?: SerpItem[];
  }>;
}

interface SerpResponse {
  tasks?: SerpTask[];
}

/**
 * Check Google ranking for a keyword using DataForSEO SERP API
 * Returns the position of wakey.care in search results
 */
export async function checkKeywordPosition(
  credentials: DataForSeoCredentials,
  keyword: string,
  targetDomain: string = 'wakey.care',
  location: number = 2528, // Netherlands (Google location code)
  language: string = 'nl',
): Promise<KeywordRankResult> {
  const endpoint =
    'https://api.dataforseo.com/v3/serp/google/organic/live/advanced';

  // Use btoa() for Cloudflare Workers compatibility (Buffer not available)
  const authString = btoa(`${credentials.login}:${credentials.password}`);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${authString}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([
      {
        keyword,
        location_code: location,
        language_code: language,
        depth: 100, // Check top 100 results
      },
    ]),
  });

  if (!response.ok) {
    throw new Error(
      `DataForSEO API error: ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as SerpResponse;

  // Find our domain in the results
  const task = data.tasks?.[0];
  if (!task || task.status_code !== 20000) {
    throw new Error(
      `DataForSEO task failed: ${task?.status_message || 'Unknown error'}`,
    );
  }

  const items = task.result?.[0]?.items || [];

  // Look for organic results containing our domain
  for (const item of items) {
    if (item.type === 'organic' && item.domain?.includes(targetDomain)) {
      return {
        keyword,
        position: item.rank_group,
        url: item.url,
        title: item.title,
      };
    }
  }

  // Not found in top 100
  return {
    keyword,
    position: null,
    url: null,
    title: null,
  };
}

/**
 * Check positions for multiple keywords
 * DataForSEO live mode only allows one task at a time, so we check sequentially
 */
export async function checkMultipleKeywordPositions(
  credentials: DataForSeoCredentials,
  keywords: string[],
  targetDomain: string = 'wakey.care',
  location: number = 2528,
  language: string = 'nl',
): Promise<KeywordRankResult[]> {
  if (keywords.length === 0) return [];

  const results: KeywordRankResult[] = [];

  // Check keywords one at a time (DataForSEO live mode limitation)
  for (const keyword of keywords) {
    try {
      const result = await checkKeywordPosition(
        credentials,
        keyword,
        targetDomain,
        location,
        language,
      );
      results.push(result);
    } catch (err) {
      console.error(`Error checking keyword "${keyword}":`, err);
      results.push({
        keyword,
        position: null,
        url: null,
        title: null,
      });
    }
  }

  return results;
}
