import {useState, useEffect, useRef, useCallback} from 'react';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {useParams, useNavigate} from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import {api} from '../../lib/api';
import {useAuth} from '../../hooks/useAuth';

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

// Available component types for the library, grouped by category
const COMPONENT_TYPES = [
  {
    type: 'Header',
    name: 'Header',
    description: 'Logo and branding header',
    icon: 'layout-top',
    category: 'Layout',
  },
  {
    type: 'Hero',
    name: 'Hero',
    description: 'Large image with headline and CTA',
    icon: 'image',
    category: 'Content',
  },
  {
    type: 'TextBlock',
    name: 'Text Block',
    description: 'Body text content',
    icon: 'text',
    category: 'Content',
  },
  {
    type: 'CallToAction',
    name: 'Call to Action',
    description: 'Button for driving clicks',
    icon: 'pointer',
    category: 'Content',
  },
  {
    type: 'ProductGrid',
    name: 'Product Grid',
    description: 'Showcase products in a grid',
    icon: 'grid',
    category: 'Content',
  },
  {
    type: 'Divider',
    name: 'Divider',
    description: 'Visual separator',
    icon: 'misc',
    category: 'Layout',
  },
  {
    type: 'Footer',
    name: 'Footer',
    description: 'Unsubscribe link and legal info',
    icon: 'layout-bottom',
    category: 'Layout',
  },
];

// Group components by category
const COMPONENT_CATEGORIES = [
  {
    name: 'Layout',
    components: COMPONENT_TYPES.filter((c) => c.category === 'Layout'),
  },
  {
    name: 'Content',
    components: COMPONENT_TYPES.filter((c) => c.category === 'Content'),
  },
];

export function Editor() {
  const {id} = useParams<{id: string}>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {user} = useAuth();
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
  const [showAIGenerateModal, setShowAIGenerateModal] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Auto-save timer ref
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialLoadRef = useRef(true);

  // Drag and drop state
  const [activeDragType, setActiveDragType] = useState<string | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [isDraggingFromLibrary, setIsDraggingFromLibrary] = useState(false);

  // Configure sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum distance before drag starts
      },
    }),
  );

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const {active} = event;
    const isFromLibrary = String(active.id).startsWith('library-');
    setIsDraggingFromLibrary(isFromLibrary);
    setActiveDragId(String(active.id));

    if (active.data.current?.type) {
      setActiveDragType(active.data.current.type);
    } else if (!isFromLibrary) {
      // Dragging an existing canvas component
      const component = components.find((c) => c.id === active.id);
      if (component) {
        setActiveDragType(component.type);
      }
    }
  };

  // Handle drag over for sorting
  const handleDragOver = (event: DragOverEvent) => {
    // We can use this for visual feedback during sorting
    // Currently not needed but available for future enhancements
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const {active, over} = event;
    const isFromLibrary = String(active.id).startsWith('library-');

    // Reset drag state
    setActiveDragType(null);
    setActiveDragId(null);
    setIsDraggingFromLibrary(false);

    if (!over) return;

    if (isFromLibrary) {
      // Dragging from library - add new component
      const componentType = active.data.current?.type;
      if (!componentType) return;

      const newComponent: ComponentInstance = {
        id: `${componentType}-${Date.now()}`,
        type: componentType,
        props: {},
      };

      // Check if dropping on canvas drop zone or on a specific component
      if (over.id === 'canvas-drop-zone') {
        // Add at the end
        setComponents([...components, newComponent]);
      } else {
        // Insert at position - find the index of the component being hovered
        const overIndex = components.findIndex((c) => c.id === over.id);
        if (overIndex !== -1) {
          const newComponents = [...components];
          newComponents.splice(overIndex, 0, newComponent);
          setComponents(newComponents);
        } else {
          // Fallback - add at end
          setComponents([...components, newComponent]);
        }
      }

      setSelectedComponentId(newComponent.id);
      setHasUnsavedChanges(true);
    } else {
      // Reordering existing components
      if (active.id !== over.id) {
        const oldIndex = components.findIndex((c) => c.id === active.id);
        const newIndex = components.findIndex((c) => c.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          setComponents(arrayMove(components, oldIndex, newIndex));
          setHasUnsavedChanges(true);
        }
      }
    }
  };

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
      // Ensure all components have IDs (handle legacy data without IDs)
      const componentsWithIds = (t.components || []).map((c, index) => ({
        ...c,
        id: c.id || `${c.type}-${Date.now()}-${index}`,
      }));
      setComponents(componentsWithIds);
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
      setSaveError(null);
      queryClient.invalidateQueries({queryKey: ['email', 'template', id]});
    },
    onError: (error: Error) => {
      setSaveStatus('error');
      setSaveError(error.message || 'Failed to save template');
      // Clear error after 5 seconds
      setTimeout(() => setSaveError(null), 5000);
    },
  });

  // Auto-save function (debounced)
  const triggerAutoSave = useCallback(() => {
    if (isNewTemplate || isInitialLoadRef.current) return;

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new timeout for auto-save after 5 seconds of inactivity
    autoSaveTimeoutRef.current = setTimeout(() => {
      if (hasUnsavedChanges && !updateMutation.isPending) {
        setSaveStatus('saving');
        updateMutation.mutate({
          name: templateName,
          subject,
          previewText: previewText || undefined,
          components,
        });
      }
    }, 5000);
  }, [
    isNewTemplate,
    hasUnsavedChanges,
    templateName,
    subject,
    previewText,
    components,
    updateMutation,
  ]);

  // Track changes and trigger auto-save
  useEffect(() => {
    if (isInitialLoadRef.current) return;
    if (!isLoading && !isNewTemplate) {
      setHasUnsavedChanges(true);
      triggerAutoSave();
    }
  }, [
    templateName,
    subject,
    previewText,
    components,
    isLoading,
    isNewTemplate,
    triggerAutoSave,
  ]);

  // Mark initial load complete after template data is loaded
  useEffect(() => {
    if (templateData && isInitialLoadRef.current) {
      // Use a small delay to ensure all state updates from templateData have completed
      setTimeout(() => {
        isInitialLoadRef.current = false;
      }, 100);
    }
  }, [templateData]);

  // Cleanup auto-save timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Save handler
  const handleSave = async () => {
    // Clear any pending auto-save since we're saving manually
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
      autoSaveTimeoutRef.current = null;
    }

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

  // State for unsaved changes navigation warning
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(
    null,
  );

  // Navigate with unsaved changes check
  const handleNavigate = useCallback(
    (to: string) => {
      if (
        hasUnsavedChanges &&
        !updateMutation.isPending &&
        !createMutation.isPending
      ) {
        setPendingNavigation(to);
        setShowUnsavedModal(true);
      } else {
        navigate(to);
      }
    },
    [
      hasUnsavedChanges,
      updateMutation.isPending,
      createMutation.isPending,
      navigate,
    ],
  );

  // Handle beforeunload event for browser tab/window close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  if (!isNewTemplate && isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Get active component info for drag overlay
  const activeComponentInfo = activeDragType
    ? COMPONENT_TYPES.find((c) => c.type === activeDragType)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
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
              onClick={() => handleNavigate('/email/templates')}
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
              onClick={() => setShowAIGenerateModal(true)}
              className="flex items-center gap-1.5 rounded-md border border-primary/50 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/20"
            >
              <SparklesIcon className="h-4 w-4" />
              Generate with AI
            </button>
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
            <p className="mb-4 text-xs text-muted-foreground">
              Drag components to the canvas or click to add
            </p>
            <div className="space-y-4">
              {COMPONENT_CATEGORIES.map((category) => (
                <div key={category.name}>
                  <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {category.name}
                  </h3>
                  <div className="space-y-2">
                    {category.components.map((componentType) => (
                      <DraggableComponentItem
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
              ))}
            </div>
          </div>

          {/* Center Panel - Canvas */}
          <CanvasDropZone
            components={components}
            selectedComponentId={selectedComponentId}
            isDragging={!!activeDragType}
            isDraggingFromLibrary={isDraggingFromLibrary}
            activeDragId={activeDragId}
            onSelectComponent={setSelectedComponentId}
            onDeleteComponent={(id) => {
              setComponents(components.filter((c) => c.id !== id));
              if (selectedComponentId === id) {
                setSelectedComponentId(null);
              }
              setHasUnsavedChanges(true);
            }}
            onAddComponent={(type) => {
              const newComponent: ComponentInstance = {
                id: `${type}-${Date.now()}`,
                type,
                props: {},
              };
              setComponents([...components, newComponent]);
              setSelectedComponentId(newComponent.id);
              setHasUnsavedChanges(true);
            }}
            onGenerateWithAI={() => setShowAIGenerateModal(true)}
          />

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
            defaultEmail={user?.email || ''}
            onClose={() => setShowTestEmailModal(false)}
          />
        )}

        {/* AI Generate Modal */}
        {showAIGenerateModal && (
          <AIGenerateModal
            hasExistingComponents={components.length > 0}
            onGenerate={(result) => {
              // Replace components with generated ones
              setComponents(result.components);
              if (result.suggestedSubject && !subject) {
                setSubject(result.suggestedSubject);
              }
              if (result.suggestedPreviewText && !previewText) {
                setPreviewText(result.suggestedPreviewText);
              }
              setHasUnsavedChanges(true);
              setShowAIGenerateModal(false);
            }}
            onClose={() => setShowAIGenerateModal(false)}
          />
        )}

        {/* Drag Overlay - shows ghost preview when dragging */}
        <DragOverlay>
          {activeComponentInfo ? (
            <div className="w-56 rounded-md border border-primary bg-card p-3 shadow-lg opacity-80">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/20 text-primary">
                  <ComponentIcon type={activeComponentInfo.type} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {activeComponentInfo.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {activeComponentInfo.description}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </DragOverlay>

        {/* Error Toast */}
        {saveError && (
          <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 shadow-lg">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/20">
              <CrossIcon className="h-4 w-4 text-red-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Save failed</p>
              <p className="text-xs text-muted-foreground">{saveError}</p>
            </div>
            <button
              onClick={() => setSaveError(null)}
              className="ml-2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <CrossIcon className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Unsaved Changes Modal */}
        {showUnsavedModal && pendingNavigation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-lg bg-card p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/20">
                  <WarningIcon className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-foreground">
                    Unsaved changes
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    You have unsaved changes that will be lost.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowUnsavedModal(false);
                    setPendingNavigation(null);
                  }}
                  className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Save before navigating
                    handleSave();
                    // Wait a bit for save to complete then proceed
                    const navTo = pendingNavigation;
                    setTimeout(() => {
                      setShowUnsavedModal(false);
                      setPendingNavigation(null);
                      navigate(navTo);
                    }, 500);
                  }}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Save and leave
                </button>
                <button
                  onClick={() => {
                    const navTo = pendingNavigation;
                    setShowUnsavedModal(false);
                    setPendingNavigation(null);
                    setHasUnsavedChanges(false); // Prevent beforeunload warning
                    navigate(navTo);
                  }}
                  className="rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
                >
                  Leave without saving
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DndContext>
  );
}

// Draggable Component Library Item
function DraggableComponentItem({
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
  const {attributes, listeners, setNodeRef, isDragging} = useDraggable({
    id: `library-${type}`,
    data: {type},
  });

  return (
    <button
      ref={setNodeRef}
      onClick={onAdd}
      className={`w-full cursor-grab rounded-md border border-border bg-background p-3 text-left transition-colors hover:border-primary hover:bg-muted active:cursor-grabbing ${
        isDragging ? 'opacity-50' : ''
      }`}
      {...listeners}
      {...attributes}
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

// Canvas Drop Zone
function CanvasDropZone({
  components,
  selectedComponentId,
  isDragging,
  isDraggingFromLibrary,
  activeDragId,
  onSelectComponent,
  onDeleteComponent,
  onAddComponent,
  onGenerateWithAI,
}: {
  components: ComponentInstance[];
  selectedComponentId: string | null;
  isDragging: boolean;
  isDraggingFromLibrary: boolean;
  activeDragId: string | null;
  onSelectComponent: (id: string) => void;
  onDeleteComponent: (id: string) => void;
  onAddComponent: (type: string) => void;
  onGenerateWithAI: () => void;
}) {
  const {setNodeRef, isOver} = useDroppable({
    id: 'canvas-drop-zone',
  });

  const componentIds = components.map((c) => c.id);

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-1 flex-col overflow-y-auto bg-muted/30 p-4 transition-colors ${
        isDragging && isOver ? 'bg-primary/10' : ''
      } ${isDragging ? 'ring-2 ring-inset ring-primary/30' : ''}`}
    >
      {components.length === 0 ? (
        <EmptyCanvasState
          onAddComponent={onAddComponent}
          onGenerateWithAI={onGenerateWithAI}
          isDragging={isDragging}
          isOver={isOver}
        />
      ) : (
        <SortableContext
          items={componentIds}
          strategy={verticalListSortingStrategy}
        >
          <div className="mx-auto w-full max-w-[600px] space-y-2">
            {components.map((component) => (
              <SortableCanvasComponent
                key={component.id}
                component={component}
                isSelected={component.id === selectedComponentId}
                isDraggingThis={activeDragId === component.id}
                onSelect={() => onSelectComponent(component.id)}
                onDelete={() => onDeleteComponent(component.id)}
              />
            ))}
            {/* Drop zone indicator when dragging from library */}
            {isDraggingFromLibrary && (
              <div
                className={`flex w-full items-center justify-center gap-2 rounded-md border-2 border-dashed py-8 text-sm transition-colors ${
                  isOver
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground'
                }`}
              >
                <PlusIcon className="h-4 w-4" />
                Drop component here
              </div>
            )}
            {/* Add Component Button when not dragging */}
            {!isDragging && (
              <button
                onClick={() => onAddComponent('TextBlock')}
                className="flex w-full items-center justify-center gap-2 rounded-md border-2 border-dashed border-border py-4 text-sm text-muted-foreground hover:border-primary hover:text-foreground"
              >
                <PlusIcon className="h-4 w-4" />
                Add Component
              </button>
            )}
          </div>
        </SortableContext>
      )}
    </div>
  );
}

// Sortable Canvas Component - allows dragging to reorder
function SortableCanvasComponent({
  component,
  isSelected,
  isDraggingThis,
  onSelect,
  onDelete,
}: {
  component: ComponentInstance;
  isSelected: boolean;
  isDraggingThis: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const {attributes, listeners, setNodeRef, transform, transition, isDragging} =
    useSortable({id: component.id});

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const componentInfo = COMPONENT_TYPES.find((c) => c.type === component.type);

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`group relative cursor-pointer rounded-md border-2 bg-card p-4 transition-colors ${
        isSelected
          ? 'border-primary bg-primary/5'
          : isDragging || isDraggingThis
            ? 'border-primary/50 opacity-50'
            : 'border-transparent hover:border-border'
      }`}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="absolute left-2 top-2 hidden cursor-grab rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground group-hover:block active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVerticalIcon className="h-4 w-4" />
      </button>

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
      <div className="flex items-center gap-3 pl-6">
        <div className="flex h-10 w-10 items-center justify-center rounded bg-muted text-muted-foreground">
          <ComponentIcon type={component.type} />
        </div>
        <div className="min-w-0 flex-1">
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
  onGenerateWithAI,
  isDragging,
  isOver,
}: {
  onAddComponent: (type: string) => void;
  onGenerateWithAI: () => void;
  isDragging?: boolean;
  isOver?: boolean;
}) {
  return (
    <div
      className={`flex flex-1 flex-col items-center justify-center rounded-lg border-2 border-dashed text-center transition-colors ${
        isDragging
          ? isOver
            ? 'border-primary bg-primary/10'
            : 'border-primary/50'
          : 'border-transparent'
      }`}
    >
      {isDragging ? (
        <>
          <div
            className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full transition-colors ${
              isOver ? 'bg-primary/20' : 'bg-muted'
            }`}
          >
            <PlusIcon
              className={`h-8 w-8 ${isOver ? 'text-primary' : 'text-muted-foreground'}`}
            />
          </div>
          <h3 className="mb-2 text-lg font-medium text-foreground">
            {isOver ? 'Release to add component' : 'Drop component here'}
          </h3>
          <p className="max-w-md text-sm text-muted-foreground">
            Drop the component to add it to your email template
          </p>
        </>
      ) : (
        <>
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <LayoutIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-foreground">
            Start building your email
          </h3>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            Drag components from the left panel, or generate a complete email
            with AI.
          </p>
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={onGenerateWithAI}
              className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <SparklesIcon className="h-4 w-4" />
              Generate with AI
            </button>
            <button
              onClick={() => onAddComponent('Hero')}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              or start from scratch
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// Component schemas - matching server-side definitions
// These are duplicated client-side to avoid server imports
const COMPONENT_SCHEMAS: Record<
  string,
  {
    type: string;
    name: string;
    description: string;
    props: Record<
      string,
      {
        type: string;
        label: string;
        description: string;
        required: boolean;
        default?: unknown;
        options?: Array<{value: string | number; label: string}>;
        itemSchema?: Record<
          string,
          {
            type: string;
            label: string;
            description: string;
            required: boolean;
            options?: Array<{value: string | number; label: string}>;
          }
        >;
        maxItems?: number;
      }
    >;
  }
> = {
  Header: {
    type: 'Header',
    name: 'Header',
    description: 'Logo and branding header',
    props: {
      logoUrl: {
        type: 'string',
        label: 'Logo URL',
        description: 'URL of your logo image',
        required: true,
        default: '',
      },
      backgroundColor: {
        type: 'color',
        label: 'Background Color',
        description: 'Background color of the header',
        required: false,
        default: '#1a1a1a',
      },
    },
  },
  Hero: {
    type: 'Hero',
    name: 'Hero',
    description: 'Hero section with headline, image, and call-to-action button',
    props: {
      headline: {
        type: 'string',
        label: 'Headline',
        description:
          'Main headline text. Use {{firstName}} for personalization.',
        required: true,
        default: 'Welcome to Wakey',
      },
      subheadline: {
        type: 'string',
        label: 'Subheadline',
        description:
          'Secondary text below the headline. Use {{firstName}} for personalization.',
        required: false,
        default: '',
      },
      imageUrl: {
        type: 'string',
        label: 'Image URL',
        description: 'URL of the hero image',
        required: false,
        default: '',
      },
      buttonText: {
        type: 'string',
        label: 'Button Text',
        description: 'Text displayed on the CTA button',
        required: false,
        default: 'Shop Now',
      },
      buttonUrl: {
        type: 'string',
        label: 'Button URL',
        description: 'URL the button links to',
        required: false,
        default: 'https://www.wakey.care',
      },
      backgroundColor: {
        type: 'color',
        label: 'Background Color',
        description: 'Background color of the hero section',
        required: false,
        default: '#1a1a1a',
      },
    },
  },
  TextBlock: {
    type: 'TextBlock',
    name: 'Text Block',
    description: 'Body text content with formatting support',
    props: {
      content: {
        type: 'textarea',
        label: 'Content',
        description:
          'Text content. Supports basic HTML (bold, italic, links). Use {{firstName}} for personalization.',
        required: true,
        default: 'Enter your text here...',
      },
      alignment: {
        type: 'select',
        label: 'Alignment',
        description: 'Text alignment',
        required: false,
        default: 'left',
        options: [
          {value: 'left', label: 'Left'},
          {value: 'center', label: 'Center'},
          {value: 'right', label: 'Right'},
        ],
      },
      fontSize: {
        type: 'select',
        label: 'Font Size',
        description: 'Text size',
        required: false,
        default: 'paragraph',
        options: [
          {value: 'paragraph', label: 'Paragraph'},
          {value: 'small', label: 'Small'},
        ],
      },
    },
  },
  CallToAction: {
    type: 'CallToAction',
    name: 'Call to Action',
    description: 'CTA button for driving clicks',
    props: {
      text: {
        type: 'string',
        label: 'Button Text',
        description: 'Text displayed on the button',
        required: true,
        default: 'Shop Now',
      },
      url: {
        type: 'string',
        label: 'Button URL',
        description: 'URL the button links to',
        required: true,
        default: 'https://www.wakey.care',
      },
      variant: {
        type: 'select',
        label: 'Style',
        description: 'Button style variant',
        required: false,
        default: 'primary',
        options: [
          {value: 'primary', label: 'Primary (Yellow)'},
          {value: 'secondary', label: 'Secondary (Outline)'},
        ],
      },
    },
  },
  ProductGrid: {
    type: 'ProductGrid',
    name: 'Product Grid',
    description: 'Grid layout for showcasing products with images and prices',
    props: {
      products: {
        type: 'array',
        label: 'Products',
        description: 'Array of products to display (max 6)',
        required: true,
        maxItems: 6,
        itemSchema: {
          imageUrl: {
            type: 'string',
            label: 'Image URL',
            description: 'URL of the product image',
            required: true,
          },
          title: {
            type: 'string',
            label: 'Title',
            description: 'Product title',
            required: true,
          },
          price: {
            type: 'string',
            label: 'Price',
            description: 'Product price (e.g., "$29.99")',
            required: true,
          },
          url: {
            type: 'string',
            label: 'URL',
            description: 'Link to the product page',
            required: true,
          },
        },
        default: [],
      },
      columns: {
        type: 'select',
        label: 'Columns',
        description:
          'Number of columns on desktop (mobile always shows 1 column)',
        required: false,
        default: 2,
        options: [
          {value: 2, label: '2 Columns'},
          {value: 3, label: '3 Columns'},
        ],
      },
    },
  },
  Divider: {
    type: 'Divider',
    name: 'Divider',
    description: 'Horizontal line for visual separation',
    props: {
      color: {
        type: 'color',
        label: 'Color',
        description: 'Color of the divider line',
        required: false,
        default: '#e0e0e0',
      },
      spacing: {
        type: 'select',
        label: 'Spacing',
        description: 'Vertical spacing around the divider',
        required: false,
        default: 'medium',
        options: [
          {value: 'small', label: 'Small'},
          {value: 'medium', label: 'Medium'},
          {value: 'large', label: 'Large'},
        ],
      },
    },
  },
  Footer: {
    type: 'Footer',
    name: 'Footer',
    description:
      'Email footer with unsubscribe link, physical address, and social links',
    props: {
      unsubscribeUrl: {
        type: 'string',
        label: 'Unsubscribe URL',
        description:
          'URL for the unsubscribe page (will be auto-generated with token)',
        required: true,
        default: '{{unsubscribeUrl}}',
      },
      address: {
        type: 'textarea',
        label: 'Physical Address',
        description: 'Your physical mailing address (required by CAN-SPAM)',
        required: true,
        default: 'Wakey Care Inc.\n123 Main Street\nLos Angeles, CA 90001',
      },
      socialLinks: {
        type: 'array',
        label: 'Social Links',
        description: 'Social media profile links (Instagram, TikTok)',
        required: false,
        maxItems: 2,
        itemSchema: {
          platform: {
            type: 'select',
            label: 'Platform',
            description: 'Social media platform',
            required: true,
            options: [
              {value: 'instagram', label: 'Instagram'},
              {value: 'tiktok', label: 'TikTok'},
            ],
          },
          url: {
            type: 'string',
            label: 'URL',
            description: 'Profile URL',
            required: true,
          },
        },
        default: [],
      },
    },
  },
};

// Properties Panel - generates form from component schema
function PropertiesPanel({
  component,
  onUpdate,
}: {
  component: ComponentInstance;
  onUpdate: (props: Record<string, unknown>) => void;
}) {
  const componentInfo = COMPONENT_TYPES.find((c) => c.type === component.type);
  const schema = COMPONENT_SCHEMAS[component.type];

  // Get the current value for a prop, falling back to schema default
  const getPropValue = (propName: string, schemaDefault: unknown) => {
    if (component.props[propName] !== undefined) {
      return component.props[propName];
    }
    return schemaDefault;
  };

  // Update a single prop
  const updateProp = (propName: string, value: unknown) => {
    onUpdate({[propName]: value});
  };

  // Add an item to an array prop
  const addArrayItem = (
    propName: string,
    itemSchema: Record<
      string,
      {type: string; options?: Array<{value: string | number; label: string}>}
    >,
  ) => {
    const currentArray = (getPropValue(propName, []) as unknown[]) || [];
    // Create new item with defaults from itemSchema
    const newItem: Record<string, unknown> = {};
    for (const [key, fieldSchema] of Object.entries(itemSchema)) {
      if (fieldSchema.type === 'select' && fieldSchema.options?.length) {
        newItem[key] = fieldSchema.options[0].value;
      } else {
        newItem[key] = '';
      }
    }
    onUpdate({[propName]: [...currentArray, newItem]});
  };

  // Update an item in an array prop
  const updateArrayItem = (
    propName: string,
    index: number,
    fieldName: string,
    value: unknown,
  ) => {
    const currentArray = [...((getPropValue(propName, []) as unknown[]) || [])];
    const item = currentArray[index] as Record<string, unknown>;
    currentArray[index] = {...item, [fieldName]: value};
    onUpdate({[propName]: currentArray});
  };

  // Remove an item from an array prop
  const removeArrayItem = (propName: string, index: number) => {
    const currentArray = [...((getPropValue(propName, []) as unknown[]) || [])];
    currentArray.splice(index, 1);
    onUpdate({[propName]: currentArray});
  };

  // Render a form field based on schema type
  const renderField = (
    propName: string,
    propSchema: {
      type: string;
      label: string;
      description: string;
      required: boolean;
      default?: unknown;
      options?: Array<{value: string | number; label: string}>;
      itemSchema?: Record<
        string,
        {
          type: string;
          label: string;
          description: string;
          required: boolean;
          options?: Array<{value: string | number; label: string}>;
        }
      >;
      maxItems?: number;
    },
  ) => {
    const value = getPropValue(propName, propSchema.default);
    const isTextField =
      propSchema.type === 'string' || propSchema.type === 'textarea';
    const showVariableHint =
      isTextField &&
      (propSchema.description.includes('{{') ||
        propSchema.label.toLowerCase().includes('text') ||
        propSchema.label.toLowerCase().includes('headline') ||
        propSchema.label.toLowerCase().includes('content'));

    return (
      <div key={propName} className="space-y-1">
        <label className="block text-sm font-medium text-foreground">
          {propSchema.label}
          {propSchema.required && <span className="text-red-500"> *</span>}
        </label>

        {propSchema.type === 'string' && (
          <input
            type="text"
            value={(value as string) || ''}
            onChange={(e) => updateProp(propName, e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder={propSchema.description}
          />
        )}

        {propSchema.type === 'textarea' && (
          <textarea
            value={(value as string) || ''}
            onChange={(e) => updateProp(propName, e.target.value)}
            rows={4}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder={propSchema.description}
          />
        )}

        {propSchema.type === 'color' && (
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={(value as string) || '#000000'}
              onChange={(e) => updateProp(propName, e.target.value)}
              className="h-9 w-12 cursor-pointer rounded border border-border bg-transparent"
            />
            <input
              type="text"
              value={(value as string) || ''}
              onChange={(e) => updateProp(propName, e.target.value)}
              className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="#000000"
            />
          </div>
        )}

        {propSchema.type === 'select' && propSchema.options && (
          <select
            value={value as string | number}
            onChange={(e) => {
              // Try to parse as number if the option values are numbers
              const optionValue = propSchema.options!.find(
                (o) => String(o.value) === e.target.value,
              );
              updateProp(propName, optionValue?.value ?? e.target.value);
            }}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {propSchema.options.map((option) => (
              <option key={String(option.value)} value={String(option.value)}>
                {option.label}
              </option>
            ))}
          </select>
        )}

        {propSchema.type === 'number' && (
          <input
            type="number"
            value={(value as number) ?? ''}
            onChange={(e) =>
              updateProp(
                propName,
                e.target.value === '' ? undefined : Number(e.target.value),
              )
            }
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder={propSchema.description}
          />
        )}

        {propSchema.type === 'array' && propSchema.itemSchema && (
          <div className="space-y-3">
            {((value as unknown[]) || []).map((item, index) => (
              <div
                key={index}
                className="relative rounded-md border border-border bg-muted/30 p-3"
              >
                <button
                  onClick={() => removeArrayItem(propName, index)}
                  className="absolute right-2 top-2 rounded p-1 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground"
                  title="Remove item"
                >
                  <CrossIcon className="h-3 w-3" />
                </button>
                <div className="space-y-2 pr-6">
                  {Object.entries(propSchema.itemSchema!).map(
                    ([fieldName, fieldSchema]) => (
                      <div key={fieldName}>
                        <label className="mb-1 block text-xs font-medium text-muted-foreground">
                          {fieldSchema.label}
                        </label>
                        {fieldSchema.type === 'select' &&
                        fieldSchema.options ? (
                          <select
                            value={
                              (item as Record<string, unknown>)[fieldName] as
                                | string
                                | number
                            }
                            onChange={(e) =>
                              updateArrayItem(
                                propName,
                                index,
                                fieldName,
                                e.target.value,
                              )
                            }
                            className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          >
                            {fieldSchema.options.map((option) => (
                              <option
                                key={String(option.value)}
                                value={String(option.value)}
                              >
                                {option.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={
                              ((item as Record<string, unknown>)[
                                fieldName
                              ] as string) || ''
                            }
                            onChange={(e) =>
                              updateArrayItem(
                                propName,
                                index,
                                fieldName,
                                e.target.value,
                              )
                            }
                            className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            placeholder={fieldSchema.description}
                          />
                        )}
                      </div>
                    ),
                  )}
                </div>
              </div>
            ))}
            {(!propSchema.maxItems ||
              ((value as unknown[]) || []).length < propSchema.maxItems) && (
              <button
                onClick={() => addArrayItem(propName, propSchema.itemSchema!)}
                className="flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-border py-2 text-sm text-muted-foreground hover:border-primary hover:text-foreground"
              >
                <PlusIcon className="h-3 w-3" />
                Add {propSchema.label.replace(/s$/, '')}
              </button>
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          {propSchema.description}
        </p>

        {showVariableHint && (
          <p className="text-xs text-primary/80">
            Tip: Use {'{{firstName}}'} for personalization
          </p>
        )}
      </div>
    );
  };

  if (!schema) {
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
        <p className="text-sm text-muted-foreground">
          No properties available for this component.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded bg-muted text-muted-foreground">
          <ComponentIcon type={component.type} />
        </div>
        <div>
          <p className="font-medium text-foreground">{schema.name}</p>
          <p className="text-xs text-muted-foreground">{schema.description}</p>
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <div className="space-y-4">
          {Object.entries(schema.props).map(([propName, propSchema]) =>
            renderField(propName, propSchema),
          )}
        </div>
      </div>
    </div>
  );
}

// Preview Modal - shows rendered email preview in desktop/mobile widths
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

  // Fetch preview with sample variables applied
  const {
    data: previewData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['email', 'template', 'preview', templateId],
    queryFn: () =>
      templateId
        ? api.email.templates.preview(templateId, {
            // Sample variables for preview
            firstName: 'Friend',
            lastName: 'Customer',
            email: 'friend@example.com',
          })
        : null,
    enabled: !!templateId,
  });

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [onClose]);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        // Close when clicking the backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="flex h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-medium text-foreground">
              Email Preview
            </h3>
            {previewData?.variables && (
              <span className="text-xs text-muted-foreground">
                Preview with sample data
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Desktop/Mobile toggle */}
            <div className="flex rounded-md border border-border">
              <button
                onClick={() => setPreviewWidth('desktop')}
                className={`flex items-center gap-1 rounded-l-md px-3 py-1.5 text-sm transition-colors ${
                  previewWidth === 'desktop'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
                title="Desktop view (600px)"
              >
                <DesktopIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Desktop</span>
              </button>
              <button
                onClick={() => setPreviewWidth('mobile')}
                className={`flex items-center gap-1 rounded-r-md px-3 py-1.5 text-sm transition-colors ${
                  previewWidth === 'mobile'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
                title="Mobile view (375px)"
              >
                <MobileIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Mobile</span>
              </button>
            </div>
            <button
              onClick={onClose}
              className="ml-2 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              title="Close (Esc)"
            >
              <CrossIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center overflow-auto bg-muted/30 p-4">
          {!templateId ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/20">
                <WarningIcon className="h-8 w-8 text-yellow-500" />
              </div>
              <h4 className="mb-2 text-lg font-medium text-foreground">
                Save template first
              </h4>
              <p className="max-w-sm text-sm text-muted-foreground">
                Save your template to generate a preview. New templates need to
                be saved before they can be previewed.
              </p>
            </div>
          ) : isLoading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">
                Generating preview...
              </p>
            </div>
          ) : error ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
                <CrossIcon className="h-8 w-8 text-red-500" />
              </div>
              <h4 className="mb-2 text-lg font-medium text-foreground">
                Preview failed
              </h4>
              <p className="max-w-sm text-sm text-muted-foreground">
                {error instanceof Error
                  ? error.message
                  : 'Failed to generate preview. Try saving the template again.'}
              </p>
            </div>
          ) : previewData?.html ? (
            <div
              className="flex h-full justify-center transition-all duration-300"
              style={{width: '100%'}}
            >
              <iframe
                srcDoc={previewData.html}
                className="h-full rounded-lg border border-border bg-white shadow-sm transition-all duration-300"
                style={{
                  width: previewWidth === 'desktop' ? '600px' : '375px',
                  maxWidth: '100%',
                }}
                title="Email preview"
              />
            </div>
          ) : (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <LayoutIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <h4 className="mb-2 text-lg font-medium text-foreground">
                No content to preview
              </h4>
              <p className="max-w-sm text-sm text-muted-foreground">
                Add some components to your template and save to see a preview.
              </p>
            </div>
          )}
        </div>
        {/* Footer with width indicator */}
        <div className="border-t border-border bg-card px-4 py-2">
          <p className="text-center text-xs text-muted-foreground">
            {previewWidth === 'desktop' ? '600px width' : '375px width'} •
            Sample variables applied (firstName: &quot;Friend&quot;)
          </p>
        </div>
      </div>
    </div>
  );
}

// Test Email Modal - sends a test email to verify rendering
function TestEmailModal({
  templateId,
  defaultEmail,
  onClose,
}: {
  templateId: number;
  defaultEmail: string;
  onClose: () => void;
}) {
  // Pre-fill with user's email if available
  const [email, setEmail] = useState(defaultEmail);
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

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [onClose]);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        // Close when clicking the backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-md rounded-lg bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-medium text-foreground">
            Send Test Email
          </h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            title="Close (Esc)"
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
            <p className="mb-4 text-sm text-muted-foreground">
              Send a test email to preview how your template looks in a real
              email client.
            </p>
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
                autoFocus
              />
            </div>

            {status === 'error' && (
              <div className="mb-4 flex items-center gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2">
                <CrossIcon className="h-4 w-4 flex-shrink-0 text-red-500" />
                <p className="text-sm text-red-500">{errorMessage}</p>
              </div>
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
                {status === 'sending' ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Sending...
                  </span>
                ) : (
                  'Send Test Email'
                )}
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

function GripVerticalIcon({className}: {className?: string}) {
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
        d="M8 6h.01M8 12h.01M8 18h.01M16 6h.01M16 12h.01M16 18h.01"
      />
    </svg>
  );
}

function DesktopIcon({className}: {className?: string}) {
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
        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}

function MobileIcon({className}: {className?: string}) {
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
        d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
      />
    </svg>
  );
}

function SparklesIcon({className}: {className?: string}) {
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
        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
      />
    </svg>
  );
}

// AI Generate Modal Component
function AIGenerateModal({
  hasExistingComponents,
  onGenerate,
  onClose,
}: {
  hasExistingComponents: boolean;
  onGenerate: (result: {
    components: ComponentInstance[];
    suggestedSubject: string;
    suggestedPreviewText: string;
  }) => void;
  onClose: () => void;
}) {
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState<
    'idle' | 'generating' | 'confirm' | 'error'
  >('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [generatedResult, setGeneratedResult] = useState<{
    components: ComponentInstance[];
    suggestedSubject: string;
    suggestedPreviewText: string;
  } | null>(null);

  const examplePrompts = [
    'Welcome email for new subscribers',
    'Product launch announcement',
    'Weekly newsletter with featured products',
    'Thank you email after purchase',
    'Reminder to complete checkout',
  ];

  const handleGenerate = async () => {
    if (!prompt.trim() || prompt.length < 10) {
      setErrorMessage(
        'Please enter a more detailed description (at least 10 characters)',
      );
      setStatus('error');
      return;
    }

    setStatus('generating');
    setErrorMessage('');

    try {
      const result = await api.email.templates.generate(prompt);
      setGeneratedResult(result.template);

      // If there are existing components, ask for confirmation
      if (hasExistingComponents) {
        setStatus('confirm');
      } else {
        // No existing components, apply directly
        onGenerate(result.template);
      }
    } catch (err) {
      setStatus('error');
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to generate template',
      );
    }
  };

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [onClose]);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-lg rounded-lg bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SparklesIcon className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-medium text-foreground">
              Generate with AI
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            title="Close (Esc)"
          >
            <CrossIcon className="h-5 w-5" />
          </button>
        </div>

        {status === 'confirm' && generatedResult ? (
          <div>
            <div className="mb-4 rounded-md border border-yellow-500/30 bg-yellow-500/10 p-3">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                This will replace your existing template content. Are you sure?
              </p>
            </div>
            <div className="mb-4 rounded-md bg-muted p-3">
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                Generated template
              </p>
              <p className="text-sm text-foreground">
                {generatedResult.components.length} components including:{' '}
                {generatedResult.components.map((c) => c.type).join(', ')}
              </p>
              {generatedResult.suggestedSubject && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Subject: {generatedResult.suggestedSubject}
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setStatus('idle');
                  setGeneratedResult(null);
                }}
                className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={() => onGenerate(generatedResult)}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Replace Content
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              Describe the email you want to create and AI will generate a
              complete template following Wakey brand guidelines.
            </p>

            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-foreground">
                What kind of email do you want to create?
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Describe your email..."
                rows={3}
                autoFocus
              />
            </div>

            <div className="mb-4">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Example prompts:
              </p>
              <div className="flex flex-wrap gap-2">
                {examplePrompts.map((example) => (
                  <button
                    key={example}
                    onClick={() => setPrompt(example)}
                    className="rounded-md border border-border bg-background px-2 py-1 text-xs text-muted-foreground hover:border-primary hover:text-foreground"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>

            {status === 'error' && (
              <div className="mb-4 flex items-center gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2">
                <CrossIcon className="h-4 w-4 flex-shrink-0 text-red-500" />
                <p className="text-sm text-red-500">{errorMessage}</p>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={status === 'generating' || !prompt.trim()}
                className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {status === 'generating' ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Generating...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="h-4 w-4" />
                    Generate
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
