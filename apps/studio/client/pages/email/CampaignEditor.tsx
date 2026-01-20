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

  // Schedule state
  const [scheduleType, setScheduleType] = useState<'now' | 'later'>('now');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

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

      // Initialize schedule state if campaign is scheduled
      if (campaign.scheduledAt) {
        setScheduleType('later');
        const scheduledDateTime = new Date(campaign.scheduledAt);
        setScheduledDate(scheduledDateTime.toISOString().split('T')[0]);
        setScheduledTime(
          scheduledDateTime.toTimeString().split(':').slice(0, 2).join(':'),
        );
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

  // Schedule campaign mutation
  const scheduleMutation = useMutation({
    mutationFn: (data: {scheduledAt?: string}) =>
      api.email.campaigns.schedule(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['email', 'campaigns']});
      queryClient.invalidateQueries({queryKey: ['email', 'campaign', id]});
      navigate(`/email/campaigns/${id}`);
    },
  });

  // Cancel scheduled campaign mutation
  const cancelMutation = useMutation({
    mutationFn: () => api.email.campaigns.cancel(Number(id)),
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

  // Get minimum datetime (15 minutes from now)
  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 15);
    return now;
  };

  const getMinDate = () => {
    return getMinDateTime().toISOString().split('T')[0];
  };

  const getMinTime = () => {
    const minDateTime = getMinDateTime();
    const today = new Date().toISOString().split('T')[0];
    // Only enforce min time if selected date is today
    if (scheduledDate === today) {
      return minDateTime.toTimeString().split(':').slice(0, 2).join(':');
    }
    return '00:00';
  };

  // Get user's timezone
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Validate scheduled time is at least 15 minutes in future
  const isScheduledTimeValid = () => {
    if (scheduleType === 'now') return true;
    if (!scheduledDate || !scheduledTime) return false;

    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    const minDateTime = getMinDateTime();
    return scheduledDateTime >= minDateTime;
  };

  const handleSendOrSchedule = async () => {
    // Validate required fields
    if (!name.trim()) {
      setSendError('Please enter a campaign name');
      return;
    }
    if (!subject.trim()) {
      setSendError('Please enter a subject line');
      return;
    }
    if (!templateId) {
      setSendError('Please select a template');
      return;
    }
    if (selectedSegmentIds.length === 0) {
      setSendError('Please select at least one segment');
      return;
    }

    setSendError(null);
    setIsSending(true);

    try {
      // First save/create the campaign if needed
      if (isNew) {
        const result = await api.email.campaigns.create({
          name: name.trim(),
          subject: subject.trim(),
          templateId,
          segmentIds: selectedSegmentIds,
        });

        // Then schedule/send it
        if (scheduleType === 'later') {
          const scheduledAt = new Date(
            `${scheduledDate}T${scheduledTime}`,
          ).toISOString();
          await api.email.campaigns.schedule(result.campaign.id, {scheduledAt});
        } else {
          await api.email.campaigns.schedule(result.campaign.id, {});
        }

        queryClient.invalidateQueries({queryKey: ['email', 'campaigns']});
        navigate(`/email/campaigns/${result.campaign.id}`);
      } else {
        // Update existing campaign first
        await api.email.campaigns.update(Number(id), {
          name: name.trim(),
          subject: subject.trim(),
          templateId,
          segmentIds: selectedSegmentIds,
        });

        // Then schedule/send it
        if (scheduleType === 'later') {
          const scheduledAt = new Date(
            `${scheduledDate}T${scheduledTime}`,
          ).toISOString();
          scheduleMutation.mutate({scheduledAt});
        } else {
          scheduleMutation.mutate({});
        }
      }
    } catch (err) {
      setSendError(
        err instanceof Error ? err.message : 'Failed to schedule campaign',
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleCancelScheduled = async () => {
    if (
      confirm(
        'Are you sure you want to cancel this scheduled campaign? It will return to draft status.',
      )
    ) {
      cancelMutation.mutate();
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isScheduling =
    scheduleMutation.isPending || cancelMutation.isPending || isSending;
  const saveError = createMutation.error || updateMutation.error;
  const scheduleError =
    scheduleMutation.error || cancelMutation.error || sendError;

  if (!isNew && campaignLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Check if campaign is editable (only draft status)
  const isEditable = isNew || campaignData?.campaign?.status === 'draft';

  // Check if campaign is scheduled (can be cancelled)
  const isScheduled = campaignData?.campaign?.status === 'scheduled';

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
            {isScheduled ? 'Campaign Scheduled' : 'Campaign Not Editable'}
          </h2>
          <p className="text-muted-foreground">
            {isScheduled ? (
              <>
                This campaign is scheduled to send on{' '}
                {new Date(
                  campaignData.campaign.scheduledAt!,
                ).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
                .
              </>
            ) : (
              'This campaign has already been sent and cannot be edited. View the campaign details instead.'
            )}
          </p>
          <div className="mt-4 flex justify-center gap-3">
            {isScheduled && (
              <button
                onClick={handleCancelScheduled}
                disabled={cancelMutation.isPending}
                className="rounded-md border border-red-500 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-500/20 disabled:opacity-50 dark:text-red-400"
              >
                {cancelMutation.isPending
                  ? 'Cancelling...'
                  : 'Cancel Scheduled Send'}
              </button>
            )}
            <button
              onClick={() => navigate(`/email/campaigns/${id}`)}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              View Campaign Details
            </button>
          </div>
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

          {/* Schedule Section */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-medium text-foreground">
              Schedule
            </h2>
            <div className="space-y-4">
              {/* Schedule Type Selection */}
              <div className="space-y-2">
                <label className="flex cursor-pointer items-center gap-3 rounded-md border border-border p-3 hover:bg-muted/50">
                  <input
                    type="radio"
                    name="scheduleType"
                    checked={scheduleType === 'now'}
                    onChange={() => setScheduleType('now')}
                    className="h-4 w-4 border-border text-primary focus:ring-primary"
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Send Now
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Send immediately to all recipients
                    </p>
                  </div>
                </label>

                <label className="flex cursor-pointer items-center gap-3 rounded-md border border-border p-3 hover:bg-muted/50">
                  <input
                    type="radio"
                    name="scheduleType"
                    checked={scheduleType === 'later'}
                    onChange={() => setScheduleType('later')}
                    className="h-4 w-4 border-border text-primary focus:ring-primary"
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Schedule for Later
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Choose a specific date and time
                    </p>
                  </div>
                </label>
              </div>

              {/* Date/Time Picker (shown when Schedule for Later is selected) */}
              {scheduleType === 'later' && (
                <div className="space-y-3 rounded-md border border-border bg-muted/30 p-3">
                  <div>
                    <label
                      htmlFor="scheduledDate"
                      className="mb-1 block text-xs font-medium text-foreground"
                    >
                      Date
                    </label>
                    <input
                      id="scheduledDate"
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      min={getMinDate()}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="scheduledTime"
                      className="mb-1 block text-xs font-medium text-foreground"
                    >
                      Time
                    </label>
                    <input
                      id="scheduledTime"
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      min={getMinTime()}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Timezone: {userTimezone}
                  </p>
                  {!isScheduledTimeValid() &&
                    scheduledDate &&
                    scheduledTime && (
                      <p className="text-xs text-red-500">
                        Scheduled time must be at least 15 minutes from now
                      </p>
                    )}
                </div>
              )}

              {/* Schedule Error */}
              {scheduleError && (
                <div className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400">
                  {scheduleError instanceof Error
                    ? scheduleError.message
                    : scheduleError}
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={handleSendOrSchedule}
                  disabled={
                    isScheduling ||
                    (scheduleType === 'later' && !isScheduledTimeValid())
                  }
                  className="w-full rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isScheduling ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      {scheduleType === 'now' ? 'Sending...' : 'Scheduling...'}
                    </span>
                  ) : scheduleType === 'now' ? (
                    'Send Campaign Now'
                  ) : (
                    'Schedule Campaign'
                  )}
                </button>

                <button
                  onClick={handleSaveAsDraft}
                  disabled={isSaving}
                  className="w-full rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
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
