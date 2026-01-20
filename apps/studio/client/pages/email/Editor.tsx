import {useState, useEffect} from 'react';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {useParams, useNavigate} from 'react-router-dom';
import {api} from '../../lib/api';

interface ComponentInstance {
  id: string;
  type: string;
  props: Record<string, unknown>;
}

interface Template {
  id: number;
  name: string;
  subject: string;
  previewText: string | null;
  components: ComponentInstance[];
  variables: Record<string, unknown> | null;
  category: string | null;
  status: 'draft' | 'active' | 'archived';
  createdAt: string;
  updatedAt: string | null;
}

// Available component types for the library
const COMPONENT_TYPES = [
  {
    type: 'Header',
    name: 'Header',
    description: 'Logo and branding header',
    icon: 'layout-top',
  },
  {
    type: 'Hero',
    name: 'Hero',
    description: 'Large image with headline and CTA',
    icon: 'image',
  },
  {
    type: 'TextBlock',
    name: 'Text Block',
    description: 'Body text content',
    icon: 'text',
  },
  {
    type: 'CallToAction',
    name: 'Call to Action',
    description: 'Button for driving clicks',
    icon: 'pointer',
  },
  {
    type: 'ProductGrid',
    name: 'Product Grid',
    description: 'Showcase products in a grid',
    icon: 'grid',
  },
  {
    type: 'Divider',
    name: 'Divider',
    description: 'Visual separator',
    icon: 'minus',
  },
  {
    type: 'Footer',
    name: 'Footer',
    description: 'Unsubscribe link and legal info',
    icon: 'layout-bottom',
  },
];

export function Editor() {
  const {id} = useParams<{id: string}>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNewTemplate = id === 'new';

  // State for template data
  const [templateName, setTemplateName] = useState('Untitled Template');
  const [subject, setSubject] = useState('');
  const [previewText, setPreviewText] = useState('');
  const [components, setComponents] = useState<ComponentInstance[]>([]);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(
    null,
  );
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    'idle' | 'saving' | 'saved' | 'error'
  >('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Modal states
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showTestEmailModal, setShowTestEmailModal] = useState(false);

  // Fetch existing template if editing
  const {data: templateData, isLoading} = useQuery({
    queryKey: ['email', 'template', id],
    queryFn: () => api.email.templates.get(Number(id)),
    enabled: !isNewTemplate && !!id,
  });

  // Initialize state from fetched template
  useEffect(() => {
    if (templateData?.template) {
      const t = templateData.template;
      setTemplateName(t.name);
      setSubject(t.subject);
      setPreviewText(t.previewText || '');
      setComponents(t.components || []);
      setHasUnsavedChanges(false);
    }
  }, [templateData]);

  // Create template mutation
  const createMutation = useMutation({
    mutationFn: (data: {name: string; subject: string; previewText?: string}) =>
      api.email.templates.create(data),
    onSuccess: (data) => {
      navigate(`/email/templates/${data.template.id}`, {replace: true});
      queryClient.invalidateQueries({queryKey: ['email', 'templates']});
    },
  });

  // Update template mutation
  const updateMutation = useMutation({
    mutationFn: (data: {
      name?: string;
      subject?: string;
      previewText?: string;
      components?: ComponentInstance[];
    }) => api.email.templates.update(Number(id), data),
    onSuccess: () => {
      setSaveStatus('saved');
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      queryClient.invalidateQueries({queryKey: ['email', 'template', id]});
    },
    onError: () => {
      setSaveStatus('error');
    },
  });

  // Track changes
  useEffect(() => {
    if (!isLoading && templateData) {
      setHasUnsavedChanges(true);
    }
  }, [templateName, subject, previewText, components]);

  // Save handler
  const handleSave = async () => {
    if (isNewTemplate) {
      createMutation.mutate({
        name: templateName,
        subject,
        previewText: previewText || undefined,
      });
    } else {
      setSaveStatus('saving');
      updateMutation.mutate({
        name: templateName,
        subject,
        previewText: previewText || undefined,
        components,
      });
    }
  };

  // Get selected component
  const selectedComponent = components.find(
    (c) => c.id === selectedComponentId,
  );

  if (!isNewTemplate && isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Mobile Warning */}
      <div className="flex items-center gap-2 border-b border-border bg-yellow-500/10 p-3 md:hidden">
        <WarningIcon className="h-5 w-5 flex-shrink-0 text-yellow-600" />
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          The email editor works best on larger screens. Consider using a
          desktop device for the best experience.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/email/templates')}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <input
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="bg-transparent text-lg font-medium text-foreground focus:outline-none focus:ring-0"
            placeholder="Template name"
          />
        </div>
        <div className="flex items-center gap-2">
          {/* Save Status */}
          <span className="text-sm text-muted-foreground">
            {saveStatus === 'saving' && 'Saving...'}
            {saveStatus === 'saved' &&
              lastSaved &&
              `Saved at ${lastSaved.toLocaleTimeString()}`}
            {saveStatus === 'error' && (
              <span className="text-red-500">Error saving</span>
            )}
          </span>

          <button
            onClick={() => setShowPreviewModal(true)}
            disabled={components.length === 0}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            Preview
          </button>
          <button
            onClick={() => setShowTestEmailModal(true)}
            disabled={components.length === 0}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            Send Test
          </button>
          <button
            onClick={handleSave}
            disabled={
              createMutation.isPending ||
              updateMutation.isPending ||
              (!hasUnsavedChanges && !isNewTemplate)
            }
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {createMutation.isPending || updateMutation.isPending
              ? 'Saving...'
              : 'Save'}
          </button>
        </div>
      </div>

      {/* Subject & Preview Text Inputs */}
      <div className="border-b border-border bg-background px-4 py-3">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Subject Line
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Enter email subject line"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Preview Text
            </label>
            <input
              type="text"
              value={previewText}
              onChange={(e) => setPreviewText(e.target.value)}
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Preview text shown in inbox"
            />
          </div>
        </div>
      </div>

      {/* Three Panel Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Component Library */}
        <div className="hidden w-64 flex-shrink-0 overflow-y-auto border-r border-border bg-card p-4 md:block">
          <h2 className="mb-4 text-sm font-semibold text-foreground">
            Components
          </h2>
          <div className="space-y-2">
            {COMPONENT_TYPES.map((componentType) => (
              <ComponentLibraryItem
                key={componentType.type}
                type={componentType.type}
                name={componentType.name}
                description={componentType.description}
                onAdd={() => {
                  const newComponent: ComponentInstance = {
                    id: `${componentType.type}-${Date.now()}`,
                    type: componentType.type,
                    props: {},
                  };
                  setComponents([...components, newComponent]);
                  setSelectedComponentId(newComponent.id);
                  setHasUnsavedChanges(true);
                }}
              />
            ))}
          </div>
        </div>

        {/* Center Panel - Canvas */}
        <div className="flex flex-1 flex-col overflow-y-auto bg-muted/30 p-4">
          {components.length === 0 ? (
            <EmptyCanvasState
              onAddComponent={(type) => {
                const newComponent: ComponentInstance = {
                  id: `${type}-${Date.now()}`,
                  type,
                  props: {},
                };
                setComponents([newComponent]);
                setSelectedComponentId(newComponent.id);
                setHasUnsavedChanges(true);
              }}
            />
          ) : (
            <div className="mx-auto w-full max-w-[600px] space-y-2">
              {components.map((component) => (
                <CanvasComponent
                  key={component.id}
                  component={component}
                  isSelected={component.id === selectedComponentId}
                  onSelect={() => setSelectedComponentId(component.id)}
                  onDelete={() => {
                    setComponents(
                      components.filter((c) => c.id !== component.id),
                    );
                    if (selectedComponentId === component.id) {
                      setSelectedComponentId(null);
                    }
                    setHasUnsavedChanges(true);
                  }}
                />
              ))}
              {/* Add Component Button at bottom */}
              <button
                onClick={() => {
                  // For now, show a simple dropdown or just add a TextBlock
                  const newComponent: ComponentInstance = {
                    id: `TextBlock-${Date.now()}`,
                    type: 'TextBlock',
                    props: {},
                  };
                  setComponents([...components, newComponent]);
                  setSelectedComponentId(newComponent.id);
                  setHasUnsavedChanges(true);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-md border-2 border-dashed border-border py-4 text-sm text-muted-foreground hover:border-primary hover:text-foreground"
              >
                <PlusIcon className="h-4 w-4" />
                Add Component
              </button>
            </div>
          )}
        </div>

        {/* Right Panel - Properties */}
        <div className="hidden w-72 flex-shrink-0 overflow-y-auto border-l border-border bg-card p-4 md:block">
          <h2 className="mb-4 text-sm font-semibold text-foreground">
            Properties
          </h2>
          {selectedComponent ? (
            <PropertiesPanel
              component={selectedComponent}
              onUpdate={(updatedProps) => {
                setComponents(
                  components.map((c) =>
                    c.id === selectedComponent.id
                      ? {...c, props: {...c.props, ...updatedProps}}
                      : c,
                  ),
                );
                setHasUnsavedChanges(true);
              }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Select a component to edit its properties
            </p>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {showPreviewModal && (
        <PreviewModal
          templateId={isNewTemplate ? null : Number(id)}
          components={components}
          onClose={() => setShowPreviewModal(false)}
        />
      )}

      {/* Test Email Modal */}
      {showTestEmailModal && !isNewTemplate && (
        <TestEmailModal
          templateId={Number(id)}
          onClose={() => setShowTestEmailModal(false)}
        />
      )}
    </div>
  );
}

// Component Library Item
function ComponentLibraryItem({
  type,
  name,
  description,
  onAdd,
}: {
  type: string;
  name: string;
  description: string;
  onAdd: () => void;
}) {
  return (
    <button
      onClick={onAdd}
      className="w-full rounded-md border border-border bg-background p-3 text-left transition-colors hover:border-primary hover:bg-muted"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded bg-muted text-muted-foreground">
          <ComponentIcon type={type} />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{name}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
    </button>
  );
}

// Canvas Component
function CanvasComponent({
  component,
  isSelected,
  onSelect,
  onDelete,
}: {
  component: ComponentInstance;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const componentInfo = COMPONENT_TYPES.find((c) => c.type === component.type);

  return (
    <div
      onClick={onSelect}
      className={`group relative cursor-pointer rounded-md border-2 bg-card p-4 transition-colors ${
        isSelected
          ? 'border-primary bg-primary/5'
          : 'border-transparent hover:border-border'
      }`}
    >
      {/* Delete button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute right-2 top-2 hidden rounded-md p-1 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground group-hover:block"
      >
        <CrossIcon className="h-4 w-4" />
      </button>

      {/* Component preview */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded bg-muted text-muted-foreground">
          <ComponentIcon type={component.type} />
        </div>
        <div>
          <p className="font-medium text-foreground">
            {componentInfo?.name || component.type}
          </p>
          <p className="text-sm text-muted-foreground">
            {Object.keys(component.props).length > 0
              ? `${Object.keys(component.props).length} properties set`
              : 'Using default values'}
          </p>
        </div>
      </div>
    </div>
  );
}

// Empty Canvas State
function EmptyCanvasState({
  onAddComponent,
}: {
  onAddComponent: (type: string) => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <LayoutIcon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mb-2 text-lg font-medium text-foreground">
        Start building your email
      </h3>
      <p className="mb-6 max-w-md text-sm text-muted-foreground">
        Drag components from the left panel or click the button below to add
        your first component.
      </p>
      <button
        onClick={() => onAddComponent('Hero')}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Add Hero Component
      </button>
    </div>
  );
}

// Properties Panel (placeholder - will be expanded in US-027)
function PropertiesPanel({
  component,
  onUpdate,
}: {
  component: ComponentInstance;
  onUpdate: (props: Record<string, unknown>) => void;
}) {
  const componentInfo = COMPONENT_TYPES.find((c) => c.type === component.type);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded bg-muted text-muted-foreground">
          <ComponentIcon type={component.type} />
        </div>
        <div>
          <p className="font-medium text-foreground">
            {componentInfo?.name || component.type}
          </p>
          <p className="text-xs text-muted-foreground">
            {componentInfo?.description}
          </p>
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <p className="mb-2 text-xs text-muted-foreground">
          Property editing will be implemented in a future update. For now, you
          can add and arrange components.
        </p>
        <p className="text-xs text-muted-foreground">
          Tip: Use {'{{firstName}}'} for personalization in text fields.
        </p>
      </div>
    </div>
  );
}

// Preview Modal (placeholder - will be expanded in US-029)
function PreviewModal({
  templateId,
  components,
  onClose,
}: {
  templateId: number | null;
  components: ComponentInstance[];
  onClose: () => void;
}) {
  const [previewWidth, setPreviewWidth] = useState<'desktop' | 'mobile'>(
    'desktop',
  );
  const {data: previewData, isLoading} = useQuery({
    queryKey: ['email', 'template', 'preview', templateId],
    queryFn: () =>
      templateId ? api.email.templates.preview(templateId) : null,
    enabled: !!templateId,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-lg font-medium text-foreground">Preview</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPreviewWidth('desktop')}
              className={`rounded-md px-3 py-1 text-sm ${
                previewWidth === 'desktop'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              Desktop
            </button>
            <button
              onClick={() => setPreviewWidth('mobile')}
              className={`rounded-md px-3 py-1 text-sm ${
                previewWidth === 'mobile'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              Mobile
            </button>
            <button
              onClick={onClose}
              className="ml-4 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <CrossIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center overflow-auto bg-muted/30 p-4">
          {isLoading ? (
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          ) : previewData?.html ? (
            <iframe
              srcDoc={previewData.html}
              className="h-full rounded-lg border border-border bg-white"
              style={{width: previewWidth === 'desktop' ? '600px' : '375px'}}
              title="Email preview"
            />
          ) : (
            <p className="text-muted-foreground">
              Save the template to see a preview
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Test Email Modal (placeholder - will be expanded in US-030)
function TestEmailModal({
  templateId,
  onClose,
}: {
  templateId: number;
  onClose: () => void;
}) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<
    'idle' | 'sending' | 'success' | 'error'
  >('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const sendTest = async () => {
    if (!email) return;
    setStatus('sending');
    setErrorMessage('');
    try {
      await api.email.templates.sendTest(templateId, email);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to send test email',
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-medium text-foreground">
            Send Test Email
          </h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <CrossIcon className="h-5 w-5" />
          </button>
        </div>

        {status === 'success' ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20">
              <CheckIcon className="h-6 w-6 text-green-500" />
            </div>
            <h4 className="mb-2 font-medium text-foreground">Email sent</h4>
            <p className="mb-4 text-sm text-muted-foreground">
              Check your inbox at {email}
            </p>
            <button
              onClick={onClose}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-foreground">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="you@example.com"
              />
            </div>

            {status === 'error' && (
              <p className="mb-4 text-sm text-red-500">{errorMessage}</p>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={sendTest}
                disabled={!email || status === 'sending'}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {status === 'sending' ? 'Sending...' : 'Send Test'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Icons
function ComponentIcon({type}: {type: string}) {
  switch (type) {
    case 'Header':
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
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      );
    case 'Hero':
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
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      );
    case 'TextBlock':
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
            d="M4 6h16M4 12h8m-8 6h16"
          />
        </svg>
      );
    case 'CallToAction':
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
            d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
          />
        </svg>
      );
    case 'ProductGrid':
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
            d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
          />
        </svg>
      );
    case 'Divider':
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
            d="M20 12H4"
          />
        </svg>
      );
    case 'Footer':
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
            d="M19 13l-7 7-7-7m14-8l-7 7-7-7"
          />
        </svg>
      );
    default:
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
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      );
  }
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

function WarningIcon({className}: {className?: string}) {
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
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );
}

function PlusIcon({className}: {className?: string}) {
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
        d="M12 4v16m8-8H4"
      />
    </svg>
  );
}

function CrossIcon({className}: {className?: string}) {
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
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

function LayoutIcon({className}: {className?: string}) {
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
        d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
      />
    </svg>
  );
}

function CheckIcon({className}: {className?: string}) {
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
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}
