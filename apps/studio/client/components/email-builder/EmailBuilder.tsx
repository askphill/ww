import {useEffect, useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
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

// Icons
function ArrowLeftIcon({className}: {className?: string}) {
  return (
    <svg
      className={className}
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6.85355 3.14645C7.04882 3.34171 7.04882 3.65829 6.85355 3.85355L3.70711 7H12.5C12.7761 7 13 7.22386 13 7.5C13 7.77614 12.7761 8 12.5 8H3.70711L6.85355 11.1464C7.04882 11.3417 7.04882 11.6583 6.85355 11.8536C6.65829 12.0488 6.34171 12.0488 6.14645 11.8536L2.14645 7.85355C1.95118 7.65829 1.95118 7.34171 2.14645 7.14645L6.14645 3.14645C6.34171 2.95118 6.65829 2.95118 6.85355 3.14645Z"
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </svg>
  );
}

function DownloadIcon({className}: {className?: string}) {
  return (
    <svg
      className={className}
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7.50005 1.04999C7.74858 1.04999 7.95005 1.25146 7.95005 1.49999V8.41359L10.1819 6.18179C10.3576 6.00605 10.6425 6.00605 10.8182 6.18179C10.994 6.35753 10.994 6.64245 10.8182 6.81819L7.81825 9.81819C7.64251 9.99392 7.35759 9.99392 7.18185 9.81819L4.18185 6.81819C4.00611 6.64245 4.00611 6.35753 4.18185 6.18179C4.35759 6.00605 4.64251 6.00605 4.81825 6.18179L7.05005 8.41359V1.49999C7.05005 1.25146 7.25152 1.04999 7.50005 1.04999ZM2.5 10C2.77614 10 3 10.2239 3 10.5V12C3 12.5539 3.44565 13 3.99635 13H11.0012C11.5529 13 12 12.5528 12 12V10.5C12 10.2239 12.2239 10 12.5 10C12.7761 10 13 10.2239 13 10.5V12C13 13.1041 12.1062 14 11.0012 14H3.99635C2.89019 14 2 13.103 2 12V10.5C2 10.2239 2.22386 10 2.5 10Z"
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </svg>
  );
}

function CheckIcon({className}: {className?: string}) {
  return (
    <svg
      className={className}
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z"
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </svg>
  );
}

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
      } else {
        const errorData = await response.json().catch(() => ({}));
        const message =
          (errorData as {error?: string}).error || 'Failed to save template';
        alert(message);
      }
    } catch (error) {
      console.error('Failed to save template:', error);
      alert('Failed to save template. Please try again.');
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
        <div className="flex items-center gap-4">
          <Link
            to="/email/templates"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </Link>
          <div>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="border-0 bg-transparent text-xl font-bold text-foreground focus:outline-none focus:ring-0"
              placeholder="Untitled Template"
            />
            <p className="text-sm text-muted-foreground">
              Click + to add sections to your email template
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExportOpen(true)}
            disabled={sections.length === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50"
          >
            <DownloadIcon className="h-4 w-4" />
            Export
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || sections.length === 0 || !isDirty}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {!isDirty && <CheckIcon className="h-4 w-4" />}
            {isSaving ? 'Saving...' : isDirty ? 'Save' : 'Saved'}
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
