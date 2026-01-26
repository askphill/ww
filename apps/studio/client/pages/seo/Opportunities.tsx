import {useState, useRef, useEffect, Fragment} from 'react';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {api} from '../../lib/api';
import {formatNumber, formatPosition} from '../../lib/utils';
import {Button} from '../../components/ui/button';
import {Badge} from '../../components/ui/badge';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../../components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../components/ui/table';
import {Input} from '../../components/ui/input';

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
        <Button
          onClick={() => checkMutation.mutate()}
          disabled={!trackingData?.keywords.length}
          isLoading={checkMutation.isPending}
        >
          {checkMutation.isPending ? 'Checking...' : 'Check Positions'}
        </Button>
      </div>

      {/* Add Keyword Section */}
      <Card>
        <div className="p-6">
          <CardTitle>Add Keyword</CardTitle>
          <CardDescription>
            Enter a keyword or search from your GSC data
          </CardDescription>
          <div className="relative mt-4" ref={searchRef}>
            <div className="flex gap-2">
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={handleKeyDown}
                placeholder="Type a keyword to track..."
                className="flex-1"
              />
              <Button
                onClick={() => handleAddKeyword(searchQuery)}
                disabled={!searchQuery.trim()}
                isLoading={addMutation.isPending}
              >
                {addMutation.isPending ? 'Adding...' : 'Add'}
              </Button>
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
      </Card>

      {/* Tracked Keywords Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Tracked Keywords ({trackingData?.keywords.length || 0})
          </CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Keyword</TableHead>
              <TableHead className="text-right">Position</TableHead>
              <TableHead className="text-right">Change (7d)</TableHead>
              <TableHead>Last Checked</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trackingData?.keywords.map((kw) => (
              <Fragment key={kw.id}>
                <TableRow
                  className="cursor-pointer"
                  onClick={() =>
                    setExpandedKeyword(expandedKeyword === kw.id ? null : kw.id)
                  }
                >
                  <TableCell className="font-medium text-foreground">
                    {kw.keyword}
                  </TableCell>
                  <TableCell className="text-right">
                    <PositionBadge position={kw.currentPosition} />
                  </TableCell>
                  <TableCell className="text-right">
                    <ChangeBadge change={kw.change} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {kw.lastChecked || 'Never'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeMutation.mutate(kw.id);
                      }}
                      className="text-destructive hover:text-destructive"
                    >
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
                {expandedKeyword === kw.id && (
                  <tr>
                    <TableCell colSpan={5} className="bg-muted/20 p-0">
                      <div className="px-6 py-4">
                        <PositionHistory keywordId={kw.id} />
                      </div>
                    </TableCell>
                  </tr>
                )}
              </Fragment>
            ))}
            {(!trackingData?.keywords ||
              trackingData.keywords.length === 0) && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-muted-foreground"
                >
                  No keywords being tracked yet. Add a keyword above to get
                  started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Google Search Console Section */}
      <div className="flex items-center justify-between pt-8">
        <h1 className="text-2xl font-bold text-foreground">
          Google Search Console
        </h1>
        <Button
          onClick={() => syncMutation.mutate()}
          isLoading={syncMutation.isPending}
        >
          {syncMutation.isPending ? 'Syncing...' : 'Sync GSC Data'}
        </Button>
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
      <Card>
        <CardHeader>
          <CardTitle>Top Queries</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Query</TableHead>
              <TableHead className="text-right">Clicks</TableHead>
              <TableHead className="text-right">Impressions</TableHead>
              <TableHead className="text-right">Position</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {queriesData?.queries.map((query, i) => (
              <TableRow key={i}>
                <TableCell className="text-foreground">{query.query}</TableCell>
                <TableCell className="text-right text-foreground">
                  {formatNumber(query.totalClicks)}
                </TableCell>
                <TableCell className="text-right text-foreground">
                  {formatNumber(query.totalImpressions)}
                </TableCell>
                <TableCell className="text-right text-foreground">
                  {formatPosition(query.avgPosition)}
                </TableCell>
              </TableRow>
            ))}
            {(!queriesData?.queries || queriesData.queries.length === 0) && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-8 text-center text-muted-foreground"
                >
                  No data yet. Click "Sync GSC Data" to fetch data.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Content Opportunities */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Content Opportunities</CardTitle>
          <Button
            onClick={() => analyzeMutation.mutate()}
            isLoading={analyzeMutation.isPending}
          >
            {analyzeMutation.isPending
              ? 'Analyzing...'
              : 'Analyze Opportunities'}
          </Button>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Keyword</TableHead>
              <TableHead className="text-right">Score</TableHead>
              <TableHead className="text-right">Impressions</TableHead>
              <TableHead className="text-right">Clicks</TableHead>
              <TableHead className="text-right">Position</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {opportunitiesData?.opportunities.map((opp) => (
              <TableRow key={opp.id}>
                <TableCell className="font-medium text-foreground">
                  {opp.keyword}
                </TableCell>
                <TableCell className="text-right">
                  <ScoreBadge score={opp.opportunityScore} />
                </TableCell>
                <TableCell className="text-right text-foreground">
                  {formatNumber(opp.impressions30d || 0)}
                </TableCell>
                <TableCell className="text-right text-foreground">
                  {formatNumber(opp.clicks30d || 0)}
                </TableCell>
                <TableCell className="text-right text-foreground">
                  {formatPosition(opp.currentPosition || 0)}
                </TableCell>
              </TableRow>
            ))}
            {(!opportunitiesData?.opportunities ||
              opportunitiesData.opportunities.length === 0) && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-muted-foreground"
                >
                  No opportunities found. Sync GSC data first, then click
                  "Analyze Opportunities".
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* AI Insights Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>AI Insights</CardTitle>
            <CardDescription>
              AI-powered opportunities based on GSC data and website content
            </CardDescription>
          </div>
          <Button
            onClick={() => generateInsightsMutation.mutate()}
            isLoading={generateInsightsMutation.isPending}
          >
            {generateInsightsMutation.isPending
              ? 'Generating...'
              : 'Generate Insights'}
          </Button>
        </CardHeader>
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
                          <Badge key={i} variant="default">
                            {query}
                          </Badge>
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
      </Card>
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
    <Card>
      <div className="p-6">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
    </Card>
  );
}

function ScoreBadge({score}: {score: number}) {
  let variant: 'default' | 'chart-2' | 'chart-3' | 'chart-4' = 'default';
  if (score >= 70) {
    variant = 'chart-3';
  } else if (score >= 50) {
    variant = 'chart-2';
  } else if (score >= 30) {
    variant = 'chart-4';
  }

  return <Badge variant={variant}>{Math.round(score)}</Badge>;
}

function InsightTypeBadge({type}: {type: string}) {
  const config: Record<
    string,
    {label: string; variant: 'red' | 'amber' | 'blue'}
  > = {
    content_gap: {label: 'Content Gap', variant: 'red'},
    position_opportunity: {label: 'Position Opportunity', variant: 'amber'},
    ctr_improvement: {label: 'CTR Improvement', variant: 'blue'},
  };

  const {label, variant} = config[type] || {
    label: type,
    variant: 'default' as const,
  };

  return <Badge variant={variant as 'red' | 'amber' | 'blue'}>{label}</Badge>;
}

function ImpactBadge({impact}: {impact: number}) {
  let variant: 'default' | 'green' | 'amber' | 'orange' = 'default';
  if (impact >= 70) {
    variant = 'green';
  } else if (impact >= 50) {
    variant = 'amber';
  } else if (impact >= 30) {
    variant = 'orange';
  }

  return <Badge variant={variant}>Impact: {Math.round(impact)}</Badge>;
}

function PositionBadge({position}: {position: number | null}) {
  if (position === null) {
    return <Badge variant="default">Not ranked</Badge>;
  }

  let variant:
    | 'default'
    | 'position-top'
    | 'position-good'
    | 'position-moderate' = 'default';
  if (position <= 3) {
    variant = 'position-top';
  } else if (position <= 10) {
    variant = 'position-good';
  } else if (position <= 20) {
    variant = 'position-moderate';
  }

  return <Badge variant={variant}>#{position}</Badge>;
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
          <Card key={i} className="px-3 py-2">
            <span className="text-xs text-muted-foreground">{entry.date}</span>
            <span className="block text-sm font-medium text-foreground">
              {entry.position ? `#${entry.position}` : '—'}
            </span>
          </Card>
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
