import {useState, useEffect} from 'react';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {useParams, useNavigate} from 'react-router-dom';
import {api} from '../../lib/api';

interface Template {
  id: number;
  name: string;
  subject: string;
  previewText: string | null;
  category: string | null;
  status: 'draft' | 'active' | 'archived';
}

interface Segment {
  id: number;
  name: string;
  type: 'shopify_sync' | 'custom';
  subscriberCount: number;
}

export function CampaignEditor() {
  const {id} = useParams<{id: string}>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = !id || id === 'new';

  // Form state
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [previewText, setPreviewText] = useState('');
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [selectedSegmentIds, setSelectedSegmentIds] = useState<number[]>([]);

  // Preview modal state
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewWidth, setPreviewWidth] = useState<'desktop' | 'mobile'>(
    'desktop',
  );

  // Fetch existing campaign if editing
  const {data: campaignData, isLoading: campaignLoading} = useQuery({
    queryKey: ['email', 'campaign', id],
    queryFn: () => api.email.campaigns.get(Number(id)),
    enabled: !isNew,
  });

  // Fetch templates for dropdown
  const {data: templatesData} = useQuery({
    queryKey: ['email', 'templates'],
    queryFn: () => api.email.templates.list(),
  });

  // Fetch segments for selection
  const {data: segmentsData} = useQuery({
    queryKey: ['email', 'segments'],
    queryFn: () => api.email.segments.list(),
  });

  // Initialize form with existing campaign data
  useEffect(() => {
    if (campaignData?.campaign) {
      const campaign = campaignData.campaign;
      setName(campaign.name);
      setSubject(campaign.subject);
      setPreviewText('');
      setTemplateId(campaign.templateId);

      // Parse segmentIds from JSON string
      if (campaign.segmentIds) {
        try {
          const ids = JSON.parse(campaign.segmentIds) as number[];
          setSelectedSegmentIds(ids);
        } catch {
          setSelectedSegmentIds([]);
        }
      }
    }
  }, [campaignData]);

  // Create campaign mutation
  const createMutation = useMutation({
    mutationFn: (data: {
      name: string;
      subject: string;
      templateId: number;
      segmentIds?: number[];
    }) => api.email.campaigns.create(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({queryKey: ['email', 'campaigns']});
      navigate(`/email/campaigns/${response.campaign.id}`);
    },
  });

  // Update campaign mutation
  const updateMutation = useMutation({
    mutationFn: (data: {
      name?: string;
      subject?: string;
      templateId?: number;
      segmentIds?: number[] | null;
    }) => api.email.campaigns.update(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['email', 'campaigns']});
      queryClient.invalidateQueries({queryKey: ['email', 'campaign', id]});
    },
  });

  // Filter to only show active/draft templates (not archived)
  const availableTemplates: Template[] = (
    templatesData?.templates || []
  ).filter((t) => t.status !== 'archived');

  // Get segments with subscriber counts
  const availableSegments: Segment[] = segmentsData?.segments || [];

  // Calculate estimated recipients (deduplicated across segments)
  const estimatedRecipients = calculateEstimatedRecipients(
    selectedSegmentIds,
    availableSegments,
  );

  const handleSaveAsDraft = async () => {
    if (!name.trim()) {
      alert('Please enter a campaign name');
      return;
    }
    if (!subject.trim()) {
      alert('Please enter a subject line');
      return;
    }
    if (!templateId) {
      alert('Please select a template');
      return;
    }

    if (isNew) {
      createMutation.mutate({
        name: name.trim(),
        subject: subject.trim(),
        templateId,
        segmentIds:
          selectedSegmentIds.length > 0 ? selectedSegmentIds : undefined,
      });
    } else {
      updateMutation.mutate({
        name: name.trim(),
        subject: subject.trim(),
        templateId,
        segmentIds: selectedSegmentIds.length > 0 ? selectedSegmentIds : null,
      });
    }
  };

  const handlePreview = async () => {
    if (!templateId) {
      alert('Please select a template first');
      return;
    }

    setShowPreview(true);
    setPreviewLoading(true);
    setPreviewError(null);

    try {
      const result = await api.email.templates.preview(templateId, {
        firstName: 'Friend',
      });
      setPreviewHtml(result.html);
    } catch (err) {
      setPreviewError(
        err instanceof Error ? err.message : 'Failed to load preview',
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSegmentToggle = (segmentId: number) => {
    setSelectedSegmentIds((prev) =>
      prev.includes(segmentId)
        ? prev.filter((id) => id !== segmentId)
        : [...prev, segmentId],
    );
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const saveError = createMutation.error || updateMutation.error;

  if (!isNew && campaignLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Check if campaign is editable (only draft status)
  const isEditable = isNew || campaignData?.campaign?.status === 'draft';

  if (!isNew && !isEditable) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/email/campaigns')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeftIcon />
            <span>Back to Campaigns</span>
          </button>
        </div>
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <h2 className="mb-2 text-lg font-medium text-foreground">
            Campaign Not Editable
          </h2>
          <p className="text-muted-foreground">
            This campaign has already been sent or scheduled and cannot be
            edited. View the campaign details instead.
          </p>
          <button
            onClick={() => navigate(`/email/campaigns/${id}`)}
            className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            View Campaign Details
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/email/campaigns')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeftIcon />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {isNew ? 'Create Campaign' : 'Edit Campaign'}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isNew
                ? 'Set up your email campaign'
                : `Editing: ${campaignData?.campaign?.name || ''}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePreview}
            disabled={!templateId}
            className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            Preview
          </button>
          <button
            onClick={handleSaveAsDraft}
            disabled={isSaving}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save as Draft'}
          </button>
        </div>
      </div>

      {/* Error display */}
      {saveError && (
        <div className="rounded-md border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {saveError instanceof Error
            ? saveError.message
            : 'Failed to save campaign'}
        </div>
      )}

      {/* Form */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main form - 2 columns */}
        <div className="space-y-6 lg:col-span-2">
          {/* Campaign Details */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-medium text-foreground">
              Campaign Details
            </h2>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="mb-1 block text-sm font-medium text-foreground"
                >
                  Campaign Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Summer Sale Announcement"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Internal name to identify this campaign
                </p>
              </div>

              <div>
                <label
                  htmlFor="subject"
                  className="mb-1 block text-sm font-medium text-foreground"
                >
                  Subject Line
                </label>
                <input
                  id="subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g., Your exclusive early access is here"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  This overrides the template subject line
                </p>
              </div>

              <div>
                <label
                  htmlFor="previewText"
                  className="mb-1 block text-sm font-medium text-foreground"
                >
                  Preview Text{' '}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </label>
                <input
                  id="previewText"
                  type="text"
                  value={previewText}
                  onChange={(e) => setPreviewText(e.target.value)}
                  placeholder="e.g., Get 30% off your next order"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Shown after the subject in some email clients
                </p>
              </div>
            </div>
          </div>

          {/* Template Selection */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-medium text-foreground">
              Email Template
            </h2>
            <div>
              <label
                htmlFor="template"
                className="mb-1 block text-sm font-medium text-foreground"
              >
                Select Template
              </label>
              <select
                id="template"
                value={templateId || ''}
                onChange={(e) =>
                  setTemplateId(e.target.value ? Number(e.target.value) : null)
                }
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Choose a template...</option>
                {availableTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}{' '}
                    {template.status === 'draft' ? '(Draft)' : ''}
                  </option>
                ))}
              </select>
              {availableTemplates.length === 0 && (
                <p className="mt-2 text-sm text-muted-foreground">
                  No templates available.{' '}
                  <button
                    onClick={() => navigate('/email/templates/new')}
                    className="text-primary hover:underline"
                  >
                    Create a template
                  </button>
                </p>
              )}
              {templateId && (
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={handlePreview}
                    className="text-sm text-primary hover:underline"
                  >
                    Preview template
                  </button>
                  <span className="text-muted-foreground">|</span>
                  <button
                    onClick={() => navigate(`/email/templates/${templateId}`)}
                    className="text-sm text-primary hover:underline"
                  >
                    Edit template
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Segment Selection */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-medium text-foreground">
              Recipients
            </h2>
            <div className="space-y-3">
              {availableSegments.length > 0 ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    Select one or more segments to target
                  </p>
                  <div className="max-h-64 space-y-2 overflow-y-auto">
                    {availableSegments.map((segment) => (
                      <label
                        key={segment.id}
                        className="flex cursor-pointer items-center gap-3 rounded-md border border-border p-3 hover:bg-muted/50"
                      >
                        <input
                          type="checkbox"
                          checked={selectedSegmentIds.includes(segment.id)}
                          onChange={() => handleSegmentToggle(segment.id)}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">
                            {segment.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {segment.subscriberCount.toLocaleString()}{' '}
                            subscriber
                            {segment.subscriberCount !== 1 ? 's' : ''} |{' '}
                            {segment.type === 'shopify_sync'
                              ? 'Shopify'
                              : 'Custom'}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No segments available. Sync from Shopify or create custom
                  segments.
                </p>
              )}
            </div>

            {/* Estimated Recipients */}
            <div className="mt-4 rounded-md border border-border bg-muted/50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  Estimated Recipients
                </span>
                <span className="text-2xl font-bold text-foreground">
                  {estimatedRecipients.toLocaleString()}
                </span>
              </div>
              {selectedSegmentIds.length > 1 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Subscribers in multiple segments will only receive one email
                </p>
              )}
              {selectedSegmentIds.length === 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Select at least one segment to send to
                </p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-medium text-foreground">
              Quick Actions
            </h2>
            <div className="space-y-2">
              <button
                onClick={handleSaveAsDraft}
                disabled={isSaving}
                className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save as Draft'}
              </button>
              <button
                onClick={handlePreview}
                disabled={!templateId}
                className="w-full rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                Preview Email
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <PreviewModal
          html={previewHtml}
          isLoading={previewLoading}
          error={previewError}
          width={previewWidth}
          onWidthChange={setPreviewWidth}
          onClose={() => {
            setShowPreview(false);
            setPreviewHtml(null);
          }}
        />
      )}
    </div>
  );
}

function calculateEstimatedRecipients(
  selectedIds: number[],
  segments: Segment[],
): number {
  if (selectedIds.length === 0) return 0;

  // For now, sum up subscriber counts
  // Note: This is an estimate since subscribers may be in multiple segments
  // The actual count would require server-side deduplication
  const total = segments
    .filter((s) => selectedIds.includes(s.id))
    .reduce((sum, s) => sum + s.subscriberCount, 0);

  return total;
}

function PreviewModal({
  html,
  isLoading,
  error,
  width,
  onWidthChange,
  onClose,
}: {
  html: string | null;
  isLoading: boolean;
  error: string | null;
  width: 'desktop' | 'mobile';
  onWidthChange: (width: 'desktop' | 'mobile') => void;
  onClose: () => void;
}) {
  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const iframeWidth = width === 'desktop' ? 600 : 375;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-lg border border-border bg-card">
        {/* Modal header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-medium text-foreground">Email Preview</h2>
          <div className="flex items-center gap-4">
            {/* Width toggle */}
            <div className="flex items-center gap-1 rounded-md border border-border p-1">
              <button
                onClick={() => onWidthChange('desktop')}
                className={`rounded px-2 py-1 text-xs font-medium ${
                  width === 'desktop'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <DesktopIcon />
              </button>
              <button
                onClick={() => onWidthChange('mobile')}
                className={`rounded px-2 py-1 text-xs font-medium ${
                  width === 'mobile'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <MobileIcon />
              </button>
            </div>
            <button
              onClick={onClose}
              title="Close (Esc)"
              className="text-muted-foreground hover:text-foreground"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        {/* Modal content */}
        <div className="flex-1 overflow-auto p-6">
          {isLoading && (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          )}
          {error && (
            <div className="rounded-md border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
          {!isLoading && !error && html && (
            <div className="flex justify-center">
              <div
                className="overflow-hidden rounded-lg border border-border bg-white"
                style={{width: iframeWidth}}
              >
                <iframe
                  srcDoc={html}
                  title="Email preview"
                  className="h-[600px] w-full"
                  sandbox="allow-same-origin"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal footer */}
        <div className="flex items-center justify-between border-t border-border px-6 py-3">
          <span className="text-xs text-muted-foreground">
            Preview width: {iframeWidth}px | Sample data applied
          </span>
          <button
            onClick={onClose}
            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function ArrowLeftIcon() {
  return (
    <svg
      className="h-5 w-5"
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

function DesktopIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}

function MobileIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}
