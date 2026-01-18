import {useState} from 'react';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import Markdown from 'react-markdown';
import {api} from '../../lib/api';
import {formatNumber, formatPosition} from '../../lib/utils';

export function Overview() {
  const queryClient = useQueryClient();
  const [generatingPlanId, setGeneratingPlanId] = useState<number | null>(null);
  const [generatingBlogPostId, setGeneratingBlogPostId] = useState<
    number | null
  >(null);

  const {data, isLoading} = useQuery({
    queryKey: ['gsc', 'summary'],
    queryFn: api.gsc.getSummary,
  });

  const {data: queriesData} = useQuery({
    queryKey: ['gsc', 'queries'],
    queryFn: () => api.gsc.getQueries(20),
  });

  const {data: opportunitiesData} = useQuery({
    queryKey: ['opportunities'],
    queryFn: () => api.opportunities.list(),
  });

  const {data: insightsData} = useQuery({
    queryKey: ['insights'],
    queryFn: () => api.opportunities.getInsights(),
  });

  const syncMutation = useMutation({
    mutationFn: () => api.gsc.sync(30, 'all'),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['gsc']});
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: () => api.opportunities.analyze(1, 50),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['opportunities']});
    },
  });

  const generateInsightsMutation = useMutation({
    mutationFn: () => api.opportunities.generateInsights(),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['insights']});
    },
  });

  const generatePlanMutation = useMutation({
    mutationFn: (id: number) => api.opportunities.generatePlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['insights']});
      setGeneratingPlanId(null);
    },
    onError: () => {
      setGeneratingPlanId(null);
    },
  });

  const generateBlogPostMutation = useMutation({
    mutationFn: (id: number) => api.opportunities.generateBlogPost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['insights']});
      setGeneratingBlogPostId(null);
    },
    onError: () => {
      setGeneratingBlogPostId(null);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({id, status}: {id: number; status: string}) =>
      api.opportunities.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['opportunities']});
    },
  });

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
        <h1 className="text-2xl font-bold text-foreground">SEO Overview</h1>
        <button
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {syncMutation.isPending ? 'Syncing...' : 'Sync GSC Data'}
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total Clicks"
          value={formatNumber(data?.totals.clicks ?? 0)}
          description="Last 30 days"
        />
        <MetricCard
          label="Total Impressions"
          value={formatNumber(data?.totals.impressions ?? 0)}
          description="Last 30 days"
        />
        <MetricCard
          label="Avg. Position"
          value={formatPosition(data?.totals.avgPosition ?? 0)}
          description="Last 30 days"
        />
        <MetricCard
          label="Queries Tracked"
          value={formatNumber(queriesData?.queries.length ?? 0)}
          description="Unique queries"
        />
      </div>

      {/* AI Insights Section */}
      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-lg font-medium text-foreground">AI Insights</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              AI-powered opportunities based on GSC data and website content
            </p>
          </div>
          <button
            onClick={() => generateInsightsMutation.mutate()}
            disabled={generateInsightsMutation.isPending}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {generateInsightsMutation.isPending
              ? 'Generating...'
              : 'Generate Insights'}
          </button>
        </div>
        <div className="divide-y divide-border">
          {insightsData?.insights.map((insight) => (
            <div key={insight.id} className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <InsightTypeBadge type={insight.insightType} />
                    <ImpactBadge impact={insight.potentialImpact} />
                  </div>
                  <h3 className="mt-2 font-medium text-foreground">
                    {insight.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {insight.description}
                  </p>
                  {insight.relatedQueries.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium uppercase text-muted-foreground">
                        Related Queries
                      </p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {insight.relatedQueries.map((query, i) => (
                          <span
                            key={i}
                            className="inline-block rounded bg-muted px-2 py-1 text-xs text-muted-foreground"
                          >
                            {query}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {insight.matchingExistingContent &&
                    insight.matchingExistingContent.length > 0 && (
                      <div className="warning-box mt-3 rounded border p-3">
                        <p className="warning-box-title text-xs font-medium uppercase">
                          Existing Content That May Cover This Topic
                        </p>
                        <ul className="warning-box-content mt-1 list-inside list-disc text-sm">
                          {insight.matchingExistingContent.map((content, i) => (
                            <li key={i}>{content}</li>
                          ))}
                        </ul>
                        <p className="warning-box-hint mt-2 text-xs">
                          Consider optimizing existing content before creating
                          new.
                        </p>
                      </div>
                    )}
                  {insight.recommendedAction && !insight.plan && (
                    <div className="mt-3 rounded bg-muted/50 p-3">
                      <p className="text-xs font-medium uppercase text-muted-foreground">
                        Recommended Action
                      </p>
                      <p className="mt-1 text-sm text-foreground">
                        {insight.recommendedAction}
                      </p>
                    </div>
                  )}
                  {insight.plan && <ActionPlanCard plan={insight.plan} />}
                  {insight.blogPost && (
                    <BlogPostCard blogPost={insight.blogPost} />
                  )}
                </div>
                <div className="flex shrink-0 flex-col gap-2">
                  <button
                    onClick={() => {
                      setGeneratingPlanId(insight.id);
                      generatePlanMutation.mutate(insight.id);
                    }}
                    disabled={generatingPlanId === insight.id}
                    className="rounded-md border border-primary bg-transparent px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 disabled:opacity-50"
                  >
                    {generatingPlanId === insight.id
                      ? 'Generating...'
                      : insight.plan
                        ? 'Regenerate Plan'
                        : 'Generate Plan'}
                  </button>
                  {insight.insightType === 'content_gap' && (
                    <button
                      onClick={() => {
                        setGeneratingBlogPostId(insight.id);
                        generateBlogPostMutation.mutate(insight.id);
                      }}
                      disabled={generatingBlogPostId === insight.id}
                      className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      {generatingBlogPostId === insight.id
                        ? 'Writing...'
                        : insight.blogPost
                          ? 'Regenerate Blog Post'
                          : 'Generate Blog Post'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {(!insightsData?.insights || insightsData.insights.length === 0) && (
            <div className="px-6 py-8 text-center text-muted-foreground">
              No AI insights yet. Sync GSC data first, then click "Generate
              Insights" to get AI-powered recommendations.
            </div>
          )}
        </div>
      </div>

      {/* Top Queries Table */}
      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-lg font-medium text-foreground">Top Queries</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Query
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Clicks
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Impressions
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Position
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {queriesData?.queries.map((query, i) => (
                <tr key={i} className="hover:bg-muted/30">
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-foreground">
                    {query.query}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-foreground">
                    {formatNumber(query.totalClicks)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-foreground">
                    {formatNumber(query.totalImpressions)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-foreground">
                    {formatPosition(query.avgPosition)}
                  </td>
                </tr>
              ))}
              {(!queriesData?.queries || queriesData.queries.length === 0) && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-8 text-center text-muted-foreground"
                  >
                    No data yet. Click "Sync GSC Data" to fetch data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Content Opportunities */}
      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-medium text-foreground">
            Content Opportunities
          </h2>
          <button
            onClick={() => analyzeMutation.mutate()}
            disabled={analyzeMutation.isPending}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {analyzeMutation.isPending
              ? 'Analyzing...'
              : 'Analyze Opportunities'}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Keyword
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Score
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Impressions
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Clicks
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Position
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {opportunitiesData?.opportunities.map((opp) => (
                <tr key={opp.id} className="hover:bg-muted/30">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-foreground">
                    {opp.keyword}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <ScoreBadge score={opp.opportunityScore} />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-foreground">
                    {formatNumber(opp.impressions30d || 0)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-foreground">
                    {formatNumber(opp.clicks30d || 0)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-foreground">
                    {formatPosition(opp.currentPosition || 0)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <select
                      value={opp.status}
                      onChange={(e) =>
                        updateStatusMutation.mutate({
                          id: opp.id,
                          status: e.target.value,
                        })
                      }
                      className="rounded border border-input bg-background px-2 py-1 text-sm"
                    >
                      <option value="identified">Identified</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="skipped">Skipped</option>
                    </select>
                  </td>
                </tr>
              ))}
              {(!opportunitiesData?.opportunities ||
                opportunitiesData.opportunities.length === 0) && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-muted-foreground"
                  >
                    No opportunities found. Sync GSC data first, then click
                    "Analyze Opportunities".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function ScoreBadge({score}: {score: number}) {
  let color = 'bg-muted text-muted-foreground';
  if (score >= 70) {
    color = 'bg-chart-3/20 text-chart-3';
  } else if (score >= 50) {
    color = 'bg-chart-2/20 text-chart-2';
  } else if (score >= 30) {
    color = 'bg-chart-4/20 text-chart-4';
  }

  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${color}`}
    >
      {Math.round(score)}
    </span>
  );
}

function InsightTypeBadge({type}: {type: string}) {
  const labels: Record<string, {label: string; color: string}> = {
    content_gap: {
      label: 'Content Gap',
      color: 'badge-red',
    },
    position_opportunity: {
      label: 'Position Opportunity',
      color: 'badge-amber',
    },
    ctr_improvement: {
      label: 'CTR Improvement',
      color: 'badge-blue',
    },
  };

  const config = labels[type] || {
    label: type,
    color: 'bg-muted text-muted-foreground',
  };

  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${config.color}`}
    >
      {config.label}
    </span>
  );
}

function ImpactBadge({impact}: {impact: number}) {
  let color = 'bg-muted text-muted-foreground';
  if (impact >= 70) {
    color = 'badge-green';
  } else if (impact >= 50) {
    color = 'badge-amber';
  } else if (impact >= 30) {
    color = 'badge-orange';
  }

  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${color}`}
    >
      Impact: {Math.round(impact)}
    </span>
  );
}

function ActionPlanCard({plan}: {plan: string}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(plan);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="action-plan mt-4 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <p className="action-plan-title text-xs font-medium uppercase">
          Action Plan
        </p>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted"
        >
          {copied ? (
            <>
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>
      <div className="action-plan-content prose prose-sm mt-2 max-w-none">
        <Markdown>{plan}</Markdown>
      </div>
    </div>
  );
}

function BlogPostCard({blogPost}: {blogPost: string}) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(blogPost);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="blog-post-card mt-4 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <p className="blog-post-title text-xs font-medium uppercase">
          Generated Blog Post
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="blog-post-button rounded px-2 py-1 text-xs font-medium"
          >
            {expanded ? 'Collapse' : 'Expand'}
          </button>
          <button
            onClick={handleCopy}
            className="blog-post-button flex items-center gap-1 rounded px-2 py-1 text-xs font-medium"
          >
            {copied ? (
              <>
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Copy Markdown
              </>
            )}
          </button>
        </div>
      </div>
      <div
        className={`prose prose-sm mt-2 max-w-none overflow-hidden ${expanded ? '' : 'max-h-64'}`}
      >
        <Markdown>{blogPost}</Markdown>
      </div>
      {!expanded && (
        <div className="mt-2 text-center">
          <button
            onClick={() => setExpanded(true)}
            className="blog-post-button text-xs font-medium hover:underline"
          >
            Show full blog post...
          </button>
        </div>
      )}
    </div>
  );
}
