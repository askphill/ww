import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {useNavigate} from 'react-router-dom';
import {api} from '../../lib/api';

type PeriodOption = '7d' | '30d' | '90d';

export function Dashboard() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<PeriodOption>('30d');

  const {data: overviewData, isLoading: overviewLoading} = useQuery({
    queryKey: ['email', 'analytics', 'overview'],
    queryFn: () => api.email.analytics.overview(),
  });

  const {data: engagementData, isLoading: engagementLoading} = useQuery({
    queryKey: ['email', 'analytics', 'engagement', period],
    queryFn: () => api.email.analytics.engagement(period),
  });

  const {data: campaignsData, isLoading: campaignsLoading} = useQuery({
    queryKey: ['email', 'analytics', 'campaigns'],
    queryFn: () => api.email.analytics.campaigns(10),
  });

  const overview = overviewData?.overview;
  const engagement = engagementData?.engagement || [];
  const campaigns = campaignsData?.campaigns || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Email Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Monitor your email marketing performance
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <OverviewCard
          title="Total Subscribers"
          value={overview?.totalSubscribers ?? 0}
          loading={overviewLoading}
        />
        <OverviewCard
          title="Active Subscribers"
          value={overview?.activeSubscribers ?? 0}
          loading={overviewLoading}
          subtitle={
            overview
              ? `${overview.growthRate7d >= 0 ? '+' : ''}${overview.growthRate7d}% (7d)`
              : undefined
          }
          subtitlePositive={overview ? overview.growthRate7d >= 0 : true}
        />
        <OverviewCard
          title="Emails Sent (30d)"
          value={overview?.totalSent30d ?? 0}
          loading={overviewLoading}
        />
        <OverviewCard
          title="Avg Open Rate"
          value={`${overview?.avgOpenRate ?? 0}%`}
          loading={overviewLoading}
        />
        <OverviewCard
          title="Avg Click Rate"
          value={`${overview?.avgClickRate ?? 0}%`}
          loading={overviewLoading}
        />
      </div>

      {/* Engagement Chart */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            Engagement Over Time
          </h2>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as PeriodOption)}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>

        {engagementLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : engagement.length > 0 ? (
          <EngagementChart data={engagement} />
        ) : (
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            No engagement data available for this period
          </div>
        )}
      </div>

      {/* Campaign Performance Table */}
      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              Campaign Performance
            </h2>
            <button
              onClick={() => navigate('/email/campaigns')}
              className="text-sm text-primary hover:underline"
            >
              View All
            </button>
          </div>
        </div>

        {campaignsLoading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : campaigns.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Campaign
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Sent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Delivered
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Open Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Click Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {campaigns.map((campaign) => (
                  <tr
                    key={campaign.id}
                    onClick={() => navigate(`/email/campaigns/${campaign.id}`)}
                    className="cursor-pointer hover:bg-muted/30"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-foreground">
                          {campaign.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {campaign.subject}
                        </p>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-foreground">
                      {campaign.stats.sent.toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-foreground">
                      {campaign.stats.delivered.toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-foreground">
                      {campaign.stats.openRate}%
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-foreground">
                      {campaign.stats.clickRate}%
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">
                      {campaign.sentAt ? formatDate(campaign.sentAt) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex h-48 items-center justify-center text-muted-foreground">
            No campaigns sent yet
          </div>
        )}
      </div>
    </div>
  );
}

function OverviewCard({
  title,
  value,
  loading,
  subtitle,
  subtitlePositive = true,
}: {
  title: string;
  value: string | number;
  loading: boolean;
  subtitle?: string;
  subtitlePositive?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      {loading ? (
        <div className="mt-2 h-8 w-16 animate-pulse rounded bg-muted" />
      ) : (
        <div className="mt-2">
          <p className="text-2xl font-bold text-foreground">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subtitle && (
            <p
              className={`mt-1 text-xs ${
                subtitlePositive
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

interface EngagementDataPoint {
  date: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
  openRate: number;
  clickRate: number;
}

function EngagementChart({data}: {data: EngagementDataPoint[]}) {
  if (data.length === 0) return null;

  // Calculate chart dimensions
  const width = 800;
  const height = 256;
  const padding = {top: 20, right: 20, bottom: 40, left: 50};
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Get max values for scaling
  const maxOpenRate = Math.max(...data.map((d) => d.openRate), 1);
  const maxClickRate = Math.max(...data.map((d) => d.clickRate), 1);
  const maxRate = Math.max(maxOpenRate, maxClickRate, 10); // Minimum 10% for scale

  // Calculate scale
  const xScale = chartWidth / Math.max(data.length - 1, 1);
  const yScale = chartHeight / maxRate;

  // Generate path for a line
  const generatePath = (
    values: number[],
    xScale: number,
    yScale: number,
    chartHeight: number,
  ) => {
    return values
      .map((v, i) => {
        const x = i * xScale;
        const y = chartHeight - v * yScale;
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  };

  const openRatePath = generatePath(
    data.map((d) => d.openRate),
    xScale,
    yScale,
    chartHeight,
  );
  const clickRatePath = generatePath(
    data.map((d) => d.clickRate),
    xScale,
    yScale,
    chartHeight,
  );

  // Generate Y-axis labels
  const yAxisLabels = [0, 25, 50, 75, 100].filter((v) => v <= maxRate + 10);
  if (yAxisLabels[yAxisLabels.length - 1] < maxRate) {
    yAxisLabels.push(Math.ceil(maxRate / 10) * 10);
  }

  // Generate X-axis labels (show only some dates)
  const xAxisLabels: {index: number; label: string}[] = [];
  const step = Math.ceil(data.length / 6);
  for (let i = 0; i < data.length; i += step) {
    const date = new Date(data[i].date);
    xAxisLabels.push({
      index: i,
      label: date.toLocaleDateString('en-US', {month: 'short', day: 'numeric'}),
    });
  }

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex gap-6">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-blue-500" />
          <span className="text-sm text-muted-foreground">Open Rate</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-green-500" />
          <span className="text-sm text-muted-foreground">Click Rate</span>
        </div>
      </div>

      {/* Chart */}
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-64 w-full min-w-[600px]"
          preserveAspectRatio="xMidYMid meet"
        >
          <g transform={`translate(${padding.left}, ${padding.top})`}>
            {/* Y-axis grid lines */}
            {yAxisLabels.map((value) => (
              <g key={value}>
                <line
                  x1={0}
                  y1={chartHeight - value * yScale}
                  x2={chartWidth}
                  y2={chartHeight - value * yScale}
                  className="stroke-border"
                  strokeDasharray="4"
                />
                <text
                  x={-10}
                  y={chartHeight - value * yScale}
                  className="fill-muted-foreground text-xs"
                  textAnchor="end"
                  dominantBaseline="middle"
                >
                  {value}%
                </text>
              </g>
            ))}

            {/* X-axis labels */}
            {xAxisLabels.map(({index, label}) => (
              <text
                key={index}
                x={index * xScale}
                y={chartHeight + 20}
                className="fill-muted-foreground text-xs"
                textAnchor="middle"
              >
                {label}
              </text>
            ))}

            {/* Open Rate line */}
            <path
              d={openRatePath}
              fill="none"
              className="stroke-blue-500"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Click Rate line */}
            <path
              d={clickRatePath}
              fill="none"
              className="stroke-green-500"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data points - Open Rate */}
            {data.map((d, i) => (
              <circle
                key={`open-${i}`}
                cx={i * xScale}
                cy={chartHeight - d.openRate * yScale}
                r={3}
                className="fill-blue-500"
              />
            ))}

            {/* Data points - Click Rate */}
            {data.map((d, i) => (
              <circle
                key={`click-${i}`}
                cx={i * xScale}
                cy={chartHeight - d.clickRate * yScale}
                r={3}
                className="fill-green-500"
              />
            ))}
          </g>
        </svg>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryStat
          label="Total Sent"
          value={data.reduce((sum, d) => sum + d.sent, 0).toLocaleString()}
        />
        <SummaryStat
          label="Total Delivered"
          value={data.reduce((sum, d) => sum + d.delivered, 0).toLocaleString()}
        />
        <SummaryStat
          label="Total Opens"
          value={data.reduce((sum, d) => sum + d.opened, 0).toLocaleString()}
        />
        <SummaryStat
          label="Total Clicks"
          value={data.reduce((sum, d) => sum + d.clicked, 0).toLocaleString()}
        />
      </div>
    </div>
  );
}

function SummaryStat({label, value}: {label: string; value: string}) {
  return (
    <div className="text-center">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
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
