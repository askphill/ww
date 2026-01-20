import {useState} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import {api} from '../../lib/api';

type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled';
type SendStatus =
  | 'pending'
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'clicked'
  | 'bounced'
  | 'complained';

interface CampaignDetail {
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
  template: {
    id: number;
    name: string;
    subject: string;
  } | null;
  segments: Array<{
    id: number;
    name: string;
    subscriberCount: number;
  }>;
  stats: {
    total: number;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
  };
}

interface Recipient {
  id: number;
  subscriberId: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  status: SendStatus;
  sentAt: string | null;
  deliveredAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
}

export function CampaignDetail() {
  const {id} = useParams<{id: string}>();
  const navigate = useNavigate();
  const [recipientPage, setRecipientPage] = useState(1);
  const recipientsPerPage = 20;

  const campaignId = id ? parseInt(id) : null;

  const {data: campaignData, isLoading: campaignLoading} = useQuery({
    queryKey: ['email', 'campaigns', campaignId],
    queryFn: () => api.email.campaigns.get(campaignId!),
    enabled: !!campaignId,
  });

  const {data: recipientsData, isLoading: recipientsLoading} = useQuery({
    queryKey: ['email', 'campaigns', campaignId, 'recipients', recipientPage],
    queryFn: () =>
      api.email.campaigns.recipients(
        campaignId!,
        recipientPage,
        recipientsPerPage,
      ),
    enabled: !!campaignId,
  });

  if (campaignLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!campaignData?.campaign) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <p className="text-muted-foreground">Campaign not found</p>
          <button
            onClick={() => navigate('/email/campaigns')}
            className="mt-4 text-primary hover:underline"
          >
            Back to campaigns
          </button>
        </div>
      </div>
    );
  }

  const campaign = campaignData.campaign as CampaignDetail;
  const stats = campaign.stats;
  const recipients = recipientsData?.recipients || [];
  const pagination = recipientsData?.pagination;

  const openRate = calculateRate(stats.opened, stats.delivered);
  const clickRate = calculateRate(stats.clicked, stats.delivered);
  const bounceRate = calculateRate(stats.bounced, stats.sent);
  const deliveryRate = calculateRate(stats.delivered, stats.sent);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/email/campaigns')}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-muted"
        >
          <ArrowLeftIcon className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">
            {campaign.name}
          </h1>
          <p className="text-sm text-muted-foreground">{campaign.subject}</p>
        </div>
        <StatusBadge status={campaign.status} />
      </div>

      {/* Campaign Info */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Template
            </p>
            <p className="mt-1 text-sm text-foreground">
              {campaign.template?.name || 'No template'}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Segments
            </p>
            <p className="mt-1 text-sm text-foreground">
              {campaign.segments.length > 0
                ? campaign.segments.map((s) => s.name).join(', ')
                : 'No segments'}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Sent Date
            </p>
            <p className="mt-1 text-sm text-foreground">
              {campaign.sentAt ? formatDate(campaign.sentAt) : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Created
            </p>
            <p className="mt-1 text-sm text-foreground">
              {formatDate(campaign.createdAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="Sent"
          value={stats.sent.toLocaleString()}
          sublabel={`of ${stats.total.toLocaleString()}`}
        />
        <StatCard
          label="Delivered"
          value={stats.delivered.toLocaleString()}
          sublabel={`${deliveryRate}%`}
          highlight={parseFloat(deliveryRate) > 95}
        />
        <StatCard
          label="Opened"
          value={stats.opened.toLocaleString()}
          sublabel={`${openRate}%`}
          highlight={parseFloat(openRate) > 20}
        />
        <StatCard
          label="Clicked"
          value={stats.clicked.toLocaleString()}
          sublabel={`${clickRate}%`}
          highlight={parseFloat(clickRate) > 2}
        />
        <StatCard
          label="Bounced"
          value={stats.bounced.toLocaleString()}
          sublabel={`${bounceRate}%`}
          warning={parseFloat(bounceRate) > 5}
        />
        <StatCard
          label="Unsubscribed"
          value="—"
          sublabel="tracked separately"
        />
      </div>

      {/* Recipients Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Recipients</h2>
          {pagination && (
            <p className="text-sm text-muted-foreground">
              {pagination.total.toLocaleString()} recipient
              {pagination.total !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {recipientsLoading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : recipients.length > 0 ? (
          <>
            <div className="rounded-lg border border-border bg-card">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Sent
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Opened
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Clicked
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {recipients.map((recipient) => (
                      <RecipientRow key={recipient.id} recipient={recipient} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setRecipientPage((p) => Math.max(1, p - 1))}
                    disabled={recipientPage <= 1}
                    className="rounded-md border border-border px-3 py-1 text-sm hover:bg-muted disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setRecipientPage((p) => p + 1)}
                    disabled={recipientPage >= pagination.totalPages}
                    className="rounded-md border border-border px-3 py-1 text-sm hover:bg-muted disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
            <p className="text-muted-foreground">No recipients yet</p>
            {campaign.status === 'draft' && (
              <p className="mt-2 text-sm text-muted-foreground">
                Recipients will appear here after the campaign is sent
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sublabel,
  highlight,
  warning,
}: {
  label: string;
  value: string;
  sublabel?: string;
  highlight?: boolean;
  warning?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs font-medium uppercase text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-1 text-2xl font-bold ${
          warning
            ? 'text-red-600 dark:text-red-400'
            : highlight
              ? 'text-green-600 dark:text-green-400'
              : 'text-foreground'
        }`}
      >
        {value}
      </p>
      {sublabel && (
        <p className="mt-1 text-xs text-muted-foreground">{sublabel}</p>
      )}
    </div>
  );
}

function RecipientRow({recipient}: {recipient: Recipient}) {
  const name =
    [recipient.firstName, recipient.lastName].filter(Boolean).join(' ') || '—';

  return (
    <tr className="hover:bg-muted/30">
      <td className="whitespace-nowrap px-4 py-3 text-sm text-foreground">
        {recipient.email}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
        {name}
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        <SendStatusBadge status={recipient.status} />
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
        {recipient.sentAt ? formatDateTime(recipient.sentAt) : '—'}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
        {recipient.openedAt ? formatDateTime(recipient.openedAt) : '—'}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
        {recipient.clickedAt ? formatDateTime(recipient.clickedAt) : '—'}
      </td>
    </tr>
  );
}

function StatusBadge({status}: {status: CampaignStatus}) {
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
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function SendStatusBadge({status}: {status: SendStatus}) {
  const styles: Record<SendStatus, string> = {
    pending: 'bg-muted text-muted-foreground',
    sent: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
    delivered: 'bg-green-500/20 text-green-600 dark:text-green-400',
    opened: 'bg-purple-500/20 text-purple-600 dark:text-purple-400',
    clicked: 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400',
    bounced: 'bg-red-500/20 text-red-600 dark:text-red-400',
    complained: 'bg-orange-500/20 text-orange-600 dark:text-orange-400',
  };

  const labels: Record<SendStatus, string> = {
    pending: 'Pending',
    sent: 'Sent',
    delivered: 'Delivered',
    opened: 'Opened',
    clicked: 'Clicked',
    bounced: 'Bounced',
    complained: 'Complained',
  };

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function ArrowLeftIcon({className}: {className?: string}) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 19l-7-7m0 0l7-7m-7 7h18"
      />
    </svg>
  );
}

function calculateRate(numerator: number, denominator: number): string {
  if (denominator === 0) return '0.0';
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

function formatDateTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}
