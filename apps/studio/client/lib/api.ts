const API_BASE = '/api';

interface ApiError {
  error: string;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = 'An error occurred';
    try {
      const error = (await response.json()) as ApiError;
      errorMessage = error.error || errorMessage;
    } catch {
      // Response body is not valid JSON (e.g., plain text "Internal Server Error")
      const text = await response.text().catch(() => '');
      if (text) {
        errorMessage = text;
      }
    }
    throw new Error(errorMessage);
  }
  return response.json() as Promise<T>;
}

export const api = {
  // Auth
  auth: {
    sendMagicLink: (email: string) =>
      fetch(`${API_BASE}/auth/send-magic-link`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email}),
        credentials: 'include',
      }).then(handleResponse<{success: boolean}>),

    me: () =>
      fetch(`${API_BASE}/auth/me`, {
        credentials: 'include',
      }).then(handleResponse<{user: {id: string; email: string}}>),

    logout: () =>
      fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      }).then(handleResponse<{success: boolean}>),
  },

  // GSC
  gsc: {
    getSummary: () =>
      fetch(`${API_BASE}/gsc`, {credentials: 'include'}).then(
        handleResponse<{
          daily: Array<{
            date: string;
            totalClicks: number;
            totalImpressions: number;
            avgPosition: number;
          }>;
          totals: {
            clicks: number;
            impressions: number;
            avgPosition: number;
          };
        }>,
      ),

    getQueries: (limit = 50) =>
      fetch(`${API_BASE}/gsc/queries?limit=${limit}`, {
        credentials: 'include',
      }).then(
        handleResponse<{
          queries: Array<{
            query: string;
            totalClicks: number;
            totalImpressions: number;
            avgPosition: number;
            avgCtr: number;
          }>;
        }>,
      ),

    sync: (days = 30, country = 'all') =>
      fetch(`${API_BASE}/gsc/sync`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({days, country}),
        credentials: 'include',
      }).then(handleResponse<{success: boolean; imported: number}>),
  },

  // Opportunities
  opportunities: {
    list: (status?: string, limit = 50) => {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      params.set('limit', limit.toString());
      return fetch(`${API_BASE}/opportunities?${params}`, {
        credentials: 'include',
      }).then(
        handleResponse<{
          opportunities: Array<{
            id: number;
            keyword: string;
            impressions30d: number;
            clicks30d: number;
            currentPosition: number;
            opportunityScore: number;
            status: string;
            createdAt: string;
          }>;
        }>,
      );
    },

    analyze: (minImpressions = 1, maxPosition = 50) =>
      fetch(`${API_BASE}/opportunities/analyze`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({minImpressions, maxPosition}),
        credentials: 'include',
      }).then(handleResponse<{success: boolean; created: number}>),

    updateStatus: (id: number, status: string) =>
      fetch(`${API_BASE}/opportunities/${id}`, {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({status}),
        credentials: 'include',
      }).then(handleResponse<{success: boolean}>),

    // AI Insights
    getInsights: (limit = 50) => {
      const params = new URLSearchParams();
      params.set('limit', limit.toString());
      return fetch(`${API_BASE}/opportunities/insights?${params}`, {
        credentials: 'include',
      }).then(
        handleResponse<{
          insights: Array<{
            id: number;
            insightType: string;
            title: string;
            description: string;
            relatedQueries: string[];
            potentialImpact: number;
            recommendedAction: string;
            matchingExistingContent: string[];
            plan: string | null;
            blogPost: string | null;
            createdAt: string;
            updatedAt: string | null;
          }>;
        }>,
      );
    },

    generateInsights: () =>
      fetch(`${API_BASE}/opportunities/insights/generate`, {
        method: 'POST',
        credentials: 'include',
      }).then(
        handleResponse<{
          success: boolean;
          created: number;
          totalGenerated: number;
        }>,
      ),

    generatePlan: (id: number) =>
      fetch(`${API_BASE}/opportunities/insights/${id}/plan`, {
        method: 'POST',
        credentials: 'include',
      }).then(handleResponse<{success: boolean; plan: string}>),

    generateBlogPost: (id: number) =>
      fetch(`${API_BASE}/opportunities/insights/${id}/blog-post`, {
        method: 'POST',
        credentials: 'include',
      }).then(handleResponse<{success: boolean; blogPost: string}>),

    deleteInsight: (id: number) =>
      fetch(`${API_BASE}/opportunities/insights/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      }).then(handleResponse<{success: boolean}>),
  },

  // Email Marketing
  email: {
    subscribers: {
      list: (page = 1, limit = 50, search?: string, status?: string) => {
        const params = new URLSearchParams();
        params.set('page', page.toString());
        params.set('limit', limit.toString());
        if (search) params.set('search', search);
        if (status) params.set('status', status);
        return fetch(`${API_BASE}/email/subscribers?${params}`, {
          credentials: 'include',
        }).then(
          handleResponse<{
            subscribers: Array<{
              id: number;
              email: string;
              firstName: string | null;
              lastName: string | null;
              shopifyCustomerId: string | null;
              visitorId: string | null;
              status: 'active' | 'unsubscribed' | 'bounced';
              source: string | null;
              tags: string | null;
              subscribedAt: string | null;
              createdAt: string;
              updatedAt: string | null;
            }>;
            pagination: {
              page: number;
              limit: number;
              total: number;
              totalPages: number;
            };
          }>,
        );
      },

      get: (id: number) =>
        fetch(`${API_BASE}/email/subscribers/${id}`, {
          credentials: 'include',
        }).then(
          handleResponse<{
            subscriber: {
              id: number;
              email: string;
              firstName: string | null;
              lastName: string | null;
              shopifyCustomerId: string | null;
              visitorId: string | null;
              status: 'active' | 'unsubscribed' | 'bounced';
              source: string | null;
              tags: string | null;
              subscribedAt: string | null;
              createdAt: string;
              updatedAt: string | null;
            };
            segments: Array<{
              segmentId: number;
              segmentName: string;
              addedAt: string;
            }>;
          }>,
        ),

      create: (data: {
        email: string;
        firstName?: string;
        lastName?: string;
        source?: string;
        tags?: string[];
      }) =>
        fetch(`${API_BASE}/email/subscribers`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(data),
          credentials: 'include',
        }).then(
          handleResponse<{
            subscriber: {
              id: number;
              email: string;
              firstName: string | null;
              lastName: string | null;
              status: 'active' | 'unsubscribed' | 'bounced';
              source: string | null;
              createdAt: string;
            };
          }>,
        ),

      update: (
        id: number,
        data: {
          email?: string;
          firstName?: string;
          lastName?: string;
          status?: 'active' | 'unsubscribed' | 'bounced';
          source?: string;
          tags?: string[];
        },
      ) =>
        fetch(`${API_BASE}/email/subscribers/${id}`, {
          method: 'PATCH',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(data),
          credentials: 'include',
        }).then(
          handleResponse<{
            subscriber: {
              id: number;
              email: string;
              firstName: string | null;
              lastName: string | null;
              status: 'active' | 'unsubscribed' | 'bounced';
              source: string | null;
              updatedAt: string;
            };
          }>,
        ),

      delete: (id: number) =>
        fetch(`${API_BASE}/email/subscribers/${id}`, {
          method: 'DELETE',
          credentials: 'include',
        }).then(handleResponse<{success: boolean}>),
    },
  },

  // Keyword Tracking
  tracking: {
    list: () =>
      fetch(`${API_BASE}/tracking`, {credentials: 'include'}).then(
        handleResponse<{
          keywords: Array<{
            id: number;
            keyword: string;
            createdAt: string;
            currentPosition: number | null;
            currentUrl: string | null;
            lastChecked: string | null;
            change: number | null;
          }>;
        }>,
      ),

    add: (keyword: string) =>
      fetch(`${API_BASE}/tracking`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({keyword}),
        credentials: 'include',
      }).then(
        handleResponse<{
          success: boolean;
          keyword: {id: number; keyword: string};
        }>,
      ),

    remove: (id: number) =>
      fetch(`${API_BASE}/tracking/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      }).then(handleResponse<{success: boolean}>),

    getHistory: (id: number, days = 30) =>
      fetch(`${API_BASE}/tracking/${id}/history?days=${days}`, {
        credentials: 'include',
      }).then(
        handleResponse<{
          history: Array<{
            position: number | null;
            url: string | null;
            date: string;
          }>;
        }>,
      ),

    checkPositions: () =>
      fetch(`${API_BASE}/tracking/check`, {
        method: 'POST',
        credentials: 'include',
      }).then(
        handleResponse<{
          success: boolean;
          checked: number;
          stored: number;
          results: Array<{
            keyword: string;
            position: number | null;
            url: string | null;
          }>;
        }>,
      ),

    getSuggestions: (query: string) =>
      fetch(`${API_BASE}/tracking/suggestions?q=${encodeURIComponent(query)}`, {
        credentials: 'include',
      }).then(
        handleResponse<{
          suggestions: Array<{
            query: string;
            totalImpressions: number;
            avgPosition: number;
          }>;
        }>,
      ),
  },
};
