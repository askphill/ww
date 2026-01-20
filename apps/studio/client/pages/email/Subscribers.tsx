import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {api} from '../../lib/api';

type SubscriberStatus = 'active' | 'unsubscribed' | 'bounced';

interface Subscriber {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  shopifyCustomerId: string | null;
  visitorId: string | null;
  status: SubscriberStatus;
  source: string | null;
  tags: string | null;
  subscribedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
}

interface SubscribersResponse {
  subscribers: Subscriber[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function Subscribers() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const limit = 50;

  const {data, isLoading} = useQuery({
    queryKey: ['email', 'subscribers', page, limit, search, statusFilter],
    queryFn: () =>
      api.email.subscribers.list(page, limit, search, statusFilter),
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  // Calculate active count from current data
  const activeCount =
    data?.subscribers.filter((s) => s.status === 'active').length || 0;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Subscribers</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data?.pagination.total || 0} total subscribers
            {statusFilter === '' && ` (${activeCount} shown as active)`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <input
          type="text"
          value={search}
          onChange={handleSearchChange}
          placeholder="Search by email or name..."
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <select
          value={statusFilter}
          onChange={handleStatusChange}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="unsubscribed">Unsubscribed</option>
          <option value="bounced">Bounced</option>
        </select>
      </div>

      {/* Subscribers Table */}
      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-lg font-medium text-foreground">
            Subscribers ({data?.pagination.total || 0})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Subscribed Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data?.subscribers.map((subscriber) => (
                <tr key={subscriber.id} className="hover:bg-muted/30">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-foreground">
                    {subscriber.email}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-foreground">
                    {formatName(subscriber.firstName, subscriber.lastName)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <StatusBadge status={subscriber.status} />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">
                    {formatSource(subscriber.source)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">
                    {formatDate(
                      subscriber.subscribedAt || subscriber.createdAt,
                    )}
                  </td>
                </tr>
              ))}
              {(!data?.subscribers || data.subscribers.length === 0) && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-muted-foreground"
                  >
                    {search || statusFilter
                      ? 'No subscribers match your filters.'
                      : 'No subscribers yet. Sync from Shopify or add subscribers manually.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-6 py-4">
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * limit + 1} to{' '}
              {Math.min(page * limit, data.pagination.total)} of{' '}
              {data.pagination.total} subscribers
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setPage((p) => Math.min(data.pagination.totalPages, p + 1))
                }
                disabled={page >= data.pagination.totalPages}
                className="rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({status}: {status: SubscriberStatus}) {
  const styles: Record<SubscriberStatus, string> = {
    active: 'bg-green-500/20 text-green-600 dark:text-green-400',
    unsubscribed: 'bg-muted text-muted-foreground',
    bounced: 'bg-red-500/20 text-red-600 dark:text-red-400',
  };

  const labels: Record<SubscriberStatus, string> = {
    active: 'Active',
    unsubscribed: 'Unsubscribed',
    bounced: 'Bounced',
  };

  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function formatName(firstName: string | null, lastName: string | null): string {
  const parts = [firstName, lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : '—';
}

function formatSource(source: string | null): string {
  if (!source) return '—';

  const sourceLabels: Record<string, string> = {
    shopify_sync: 'Shopify Sync',
    shopify_webhook: 'Shopify',
    manual: 'Manual',
  };

  return sourceLabels[source] || source;
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}
