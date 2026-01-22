import {useState, useRef, useEffect, Fragment} from 'react';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {api} from '../../lib/api';
import {formatNumber, formatPosition} from '../../lib/utils';

export function Opportunities() {
  const queryClient = useQueryClient();

  // Keyword Ranking state
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [expandedKeyword, setExpandedKeyword] = useState<number | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Keyword Ranking queries
  const {data: trackingData, isLoading: trackingLoading} = useQuery({
    queryKey: ['tracking', 'keywords'],
    queryFn: api.tracking.list,
  });

  const {data: suggestionsData} = useQuery({
    queryKey: ['tracking', 'suggestions', searchQuery],
    queryFn: () => api.tracking.getSuggestions(searchQuery),
    enabled: searchQuery.length >= 2,
  });

  // Keyword Ranking mutations
  const addMutation = useMutation({
    mutationFn: api.tracking.add,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['tracking']});
      setSearchQuery('');
      setShowSuggestions(false);
    },
  });

  const removeMutation = useMutation({
    mutationFn: api.tracking.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['tracking']});
    },
  });

  const checkMutation = useMutation({
    mutationFn: api.tracking.checkPositions,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['tracking']});
    },
  });

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddKeyword = (keyword: string) => {
    if (keyword.trim()) {
      addMutation.mutate(keyword.trim().toLowerCase());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      handleAddKeyword(searchQuery);
    }
  };

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

  if (isLoading || trackingLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Keyword Ranking Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Keyword Ranking
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track your Google ranking positions for specific keywords
          </p>
        </div>
        <button
          onClick={() => checkMutation.mutate()}
          disabled={checkMutation.isPending || !trackingData?.keywords.length}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {checkMutation.isPending ? 'Checking...' : 'Check Positions'}
        </button>
      </div>

      {/* Add Keyword Section */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-medium text-foreground">Add Keyword</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter a keyword or search from your GSC data
        </p>
        <div className="relative mt-4" ref={searchRef}>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={handleKeyDown}
              placeholder="Type a keyword to track..."
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={() => handleAddKeyword(searchQuery)}
              disabled={!searchQuery.trim() || addMutation.isPending}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {addMutation.isPending ? 'Adding...' : 'Add'}
            </button>
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions &&
            suggestionsData?.suggestions &&
            suggestionsData.suggestions.length > 0 && (
              <div className="absolute z-10 mt-1 w-full rounded-md border border-border bg-card shadow-lg">
                <ul className="max-h-60 overflow-auto py-1">
                  {suggestionsData.suggestions.map((suggestion) => (
                    <li key={suggestion.query}>
                      <button
                        onClick={() => handleAddKeyword(suggestion.query)}
                        className="flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-muted"
                      >
                        <span className="text-foreground">
                          {suggestion.query}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {suggestion.totalImpressions.toLocaleString()} imp ·
                          pos {formatPosition(suggestion.avgPosition)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
        </div>
        {addMutation.isError && (
          <p className="mt-2 text-sm text-destructive">
            {addMutation.error?.message || 'Failed to add keyword'}
          </p>
        )}
      </div>

      {/* Tracked Keywords Table */}
      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-lg font-medium text-foreground">
            Tracked Keywords ({trackingData?.keywords.length || 0})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Keyword
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Position
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Change (7d)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Last Checked
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {trackingData?.keywords.map((kw) => (
                <Fragment key={kw.id}>
                  <tr
                    className="cursor-pointer hover:bg-muted/30"
                    onClick={() =>
                      setExpandedKeyword(
                        expandedKeyword === kw.id ? null : kw.id,
                      )
                    }
                  >
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-foreground">
                      {kw.keyword}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <PositionBadge position={kw.currentPosition} />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <ChangeBadge change={kw.change} />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">
                      {kw.lastChecked || 'Never'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeMutation.mutate(kw.id);
                        }}
                        className="text-sm text-destructive hover:underline"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                  {expandedKeyword === kw.id && (
                    <tr>
                      <td colSpan={5} className="bg-muted/20 px-6 py-4">
                        <PositionHistory keywordId={kw.id} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {(!trackingData?.keywords ||
                trackingData.keywords.length === 0) && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-muted-foreground"
                  >
                    No keywords being tracked yet. Add a keyword above to get
                    started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Google Search Console Section */}
      <div className="flex items-center justify-between pt-8">
        <h1 className="text-2xl font-bold text-foreground">
          Google Search Console
        </h1>
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
                </tr>
              ))}
              {(!opportunitiesData?.opportunities ||
                opportunitiesData.opportunities.length === 0) && (
                <tr>
                  <td
                    colSpan={5}
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
                  {insight.recommendedAction && (
                    <div className="mt-3 rounded bg-muted/50 p-3">
                      <p className="text-xs font-medium uppercase text-muted-foreground">
                        Recommended Action
                      </p>
                      <p className="mt-1 text-sm text-foreground">
                        {insight.recommendedAction}
                      </p>
                    </div>
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

function PositionBadge({position}: {position: number | null}) {
  if (position === null) {
    return (
      <span className="inline-flex rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
        Not ranked
      </span>
    );
  }

  let color = 'bg-muted text-muted-foreground';
  if (position <= 3) {
    color = 'bg-green-500/20 text-green-600 dark:text-green-400';
  } else if (position <= 10) {
    color = 'bg-blue-500/20 text-blue-600 dark:text-blue-400';
  } else if (position <= 20) {
    color = 'bg-amber-500/20 text-amber-600 dark:text-amber-400';
  }

  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${color}`}
    >
      #{position}
    </span>
  );
}

function ChangeBadge({change}: {change: number | null}) {
  if (change === null) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }

  // Negative change means improvement (moved up in rankings)
  if (change < 0) {
    return (
      <span className="inline-flex items-center text-sm font-medium text-green-600 dark:text-green-400">
        <svg
          className="mr-1 h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 15l7-7 7 7"
          />
        </svg>
        {Math.abs(change)}
      </span>
    );
  }

  if (change > 0) {
    return (
      <span className="inline-flex items-center text-sm font-medium text-red-600 dark:text-red-400">
        <svg
          className="mr-1 h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
        {change}
      </span>
    );
  }

  return <span className="text-sm text-muted-foreground">0</span>;
}

function PositionHistory({keywordId}: {keywordId: number}) {
  const {data, isLoading} = useQuery({
    queryKey: ['tracking', 'history', keywordId],
    queryFn: () => api.tracking.getHistory(keywordId, 30),
  });

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground">Loading history...</div>
    );
  }

  if (!data?.history || data.history.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No position history yet. Click "Check Positions" to start tracking.
      </div>
    );
  }

  return (
    <div>
      <h4 className="mb-3 text-sm font-medium text-foreground">
        Position History (Last 30 days)
      </h4>
      <div className="flex flex-wrap gap-2">
        {data.history.map((entry, i) => (
          <div
            key={i}
            className="flex flex-col items-center rounded border border-border bg-card px-3 py-2"
          >
            <span className="text-xs text-muted-foreground">{entry.date}</span>
            <span className="text-sm font-medium text-foreground">
              {entry.position ? `#${entry.position}` : '—'}
            </span>
          </div>
        ))}
      </div>
      {data.history[0]?.url && (
        <p className="mt-3 text-xs text-muted-foreground">
          Ranking URL:{' '}
          <a
            href={data.history[0].url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {data.history[0].url}
          </a>
        </p>
      )}
    </div>
  );
}
