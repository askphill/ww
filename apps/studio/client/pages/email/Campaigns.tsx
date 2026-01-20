import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {useNavigate} from 'react-router-dom';
import {api} from '../../lib/api';

type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled';

interface Campaign {
  id: number;
  name: string;
  subject: string;
  templateId: number | null;
  segmentIds: string | null;
  status: CampaignStatus;
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  stats: {
    total: number;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
  };
}

export function Campaigns() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>('');

  const {data, isLoading} = useQuery({
    queryKey: ['email', 'campaigns', statusFilter],
    queryFn: () => api.email.campaigns.list(statusFilter || undefined),
  });

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
  };

  const filteredCampaigns = data?.campaigns || [];

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
          <h1 className="text-2xl font-bold text-foreground">Campaigns</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {filteredCampaigns.length} campaign
            {filteredCampaigns.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => navigate('/email/campaigns/new')}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Create Campaign
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-4">
        <select
          value={statusFilter}
          onChange={handleStatusChange}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="sending">Sending</option>
          <option value="sent">Sent</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Campaigns Table */}
      {filteredCampaigns.length > 0 ? (
        <div className="rounded-lg border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Sent Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Open Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Click Rate
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredCampaigns.map((campaign) => (
                  <CampaignRow
                    key={campaign.id}
                    campaign={campaign}
                    onClick={() => navigate(`/email/campaigns/${campaign.id}`)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState onCreateClick={() => navigate('/email/campaigns/new')} />
      )}
    </div>
  );
}

function CampaignRow({
  campaign,
  onClick,
}: {
  campaign: Campaign;
  onClick: () => void;
}) {
  const openRate = calculateRate(
    campaign.stats.opened,
    campaign.stats.delivered,
  );
  const clickRate = calculateRate(
    campaign.stats.clicked,
    campaign.stats.delivered,
  );

  return (
    <tr onClick={onClick} className="cursor-pointer hover:bg-muted/30">
      <td className="px-6 py-4">
        <div>
          <p className="font-medium text-foreground">{campaign.name}</p>
          <p className="text-sm text-muted-foreground">{campaign.subject}</p>
        </div>
      </td>
      <td className="whitespace-nowrap px-6 py-4">
        <StatusBadge
          status={campaign.status}
          scheduledAt={campaign.scheduledAt}
        />
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">
        {campaign.sentAt ? formatDate(campaign.sentAt) : '—'}
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-foreground">
        {campaign.stats.delivered > 0 ? `${openRate}%` : '—'}
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-foreground">
        {campaign.stats.delivered > 0 ? `${clickRate}%` : '—'}
      </td>
    </tr>
  );
}

function StatusBadge({
  status,
  scheduledAt,
}: {
  status: CampaignStatus;
  scheduledAt: string | null;
}) {
  const styles: Record<CampaignStatus, string> = {
    draft: 'bg-muted text-muted-foreground',
    scheduled: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
    sending: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400',
    sent: 'bg-green-500/20 text-green-600 dark:text-green-400',
    cancelled: 'bg-red-500/20 text-red-600 dark:text-red-400',
  };

  const labels: Record<CampaignStatus, string> = {
    draft: 'Draft',
    scheduled: 'Scheduled',
    sending: 'Sending',
    sent: 'Sent',
    cancelled: 'Cancelled',
  };

  return (
    <div className="flex flex-col">
      <span
        className={`inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}
      >
        {labels[status]}
      </span>
      {status === 'scheduled' && scheduledAt && (
        <span className="mt-1 text-xs text-muted-foreground">
          {formatScheduledTime(scheduledAt)}
        </span>
      )}
    </div>
  );
}

function EmptyState({onCreateClick}: {onCreateClick: () => void}) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <svg
          className="h-6 w-6 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      </div>
      <h3 className="mb-2 text-lg font-medium text-foreground">
        No campaigns yet
      </h3>
      <p className="mb-6 text-sm text-muted-foreground">
        Create your first email campaign to start reaching your subscribers.
      </p>
      <button
        onClick={onCreateClick}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Create Your First Campaign
      </button>
    </div>
  );
}

function calculateRate(numerator: number, denominator: number): string {
  if (denominator === 0) return '0';
  return ((numerator / denominator) * 100).toFixed(1);
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

function formatScheduledTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diff = date.getTime() - now.getTime();

    if (diff < 0) {
      return 'Past due';
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    }

    if (hours > 0) {
      return `in ${hours}h ${minutes}m`;
    }

    return `in ${minutes}m`;
  } catch {
    return '';
  }
}
