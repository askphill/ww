import {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {useEmailBuilder} from './hooks/useEmailBuilder';
import {BuilderCanvas} from './BuilderCanvas';
import {PropertyPanel} from './PropertyPanel';
import {ExportModal} from './ExportModal';

interface EmailBuilderProps {
  templateId?: number;
}

export function EmailBuilder({templateId}: EmailBuilderProps) {
  const navigate = useNavigate();
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const {
    sections,
    selectedSection,
    selectedSectionId,
    templateName,
    templateDescription,
    isDirty,
    addSection,
    removeSection,
    moveSection,
    updateSection,
    selectSection,
    setTemplateName,
    setTemplateDescription,
    setSections,
    markSaved,
  } = useEmailBuilder();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  // Load template if editing
  useEffect(() => {
    if (templateId) {
      loadTemplate(templateId);
    }
  }, [templateId]);

  async function loadTemplate(id: number) {
    try {
      const response = await fetch(`/api/email/templates/${id}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = (await response.json()) as {
          name: string;
          description?: string;
          sections: string;
        };
        setTemplateName(data.name);
        setTemplateDescription(data.description || '');
        setSections(JSON.parse(data.sections));
      }
    } catch (error) {
      console.error('Failed to load template:', error);
    }
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      const body = {
        name: templateName,
        description: templateDescription,
        sections: JSON.stringify(sections),
      };

      const url = templateId
        ? `/api/email/templates/${templateId}`
        : '/api/email/templates';
      const method = templateId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {'Content-Type': 'application/json'},
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = (await response.json()) as {id: number};
        markSaved();
        if (!templateId) {
          navigate(`/email/builder/${data.id}`, {replace: true});
        }
      }
    } catch (error) {
      console.error('Failed to save template:', error);
    } finally {
      setIsSaving(false);
    }
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveDragId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragId(null);
    const {active, over} = event;

    if (!over) return;

    // Reordering existing sections
    if (active.id !== over.id) {
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        moveSection(oldIndex, newIndex);
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="border-0 bg-transparent text-2xl font-bold text-foreground focus:outline-none focus:ring-0"
              placeholder="Untitled Template"
            />
            {isDirty && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                Unsaved
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Click + to add sections to your email template
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsExportOpen(true)}
            disabled={sections.length === 0}
            className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
          >
            Export HTML
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || sections.length === 0}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Main builder area */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Canvas and Properties */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <BuilderCanvas
              sections={sections}
              selectedSectionId={selectedSectionId}
              onSelectSection={selectSection}
              onRemoveSection={removeSection}
              onAddSection={addSection}
            />
          </div>
          <div className="lg:col-span-1">
            <PropertyPanel
              section={selectedSection || null}
              onUpdate={(config) => {
                if (selectedSectionId) {
                  updateSection(selectedSectionId, config);
                }
              }}
            />
          </div>
        </div>

        <DragOverlay>
          {activeDragId && (
            <div className="rounded-md border border-primary bg-primary/10 px-4 py-2 text-sm">
              Dragging...
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Export modal */}
      {isExportOpen && (
        <ExportModal
          sections={sections}
          onClose={() => setIsExportOpen(false)}
        />
      )}
    </div>
  );
}
