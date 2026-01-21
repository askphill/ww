import {useState, useRef, useEffect} from 'react';
import {createPortal} from 'react-dom';
import {useDroppable} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import type {EmailSection, SectionType} from '@wakey/email';
import {
  HeaderSectionView,
  HeroSectionView,
  ImageSectionView,
  ProductGridSectionView,
  TextBlockSectionView,
  ImageTextSplitSectionView,
  CtaButtonSectionView,
  FooterSectionView,
} from '@wakey/email';

interface SectionTypeItem {
  type: SectionType;
  label: string;
  icon: React.ReactNode;
}

const sectionTypes: SectionTypeItem[] = [
  {
    type: 'header',
    label: 'Header',
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="3" y="3" width="18" height="6" rx="1" />
      </svg>
    ),
  },
  {
    type: 'hero',
    label: 'Hero',
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="3" y="3" width="18" height="18" rx="1" />
        <path d="M3 15l6-6 4 4 8-8" />
      </svg>
    ),
  },
  {
    type: 'image',
    label: 'Image',
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="M21 15l-5-5L5 21" />
      </svg>
    ),
  },
  {
    type: 'product_grid',
    label: 'Products',
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="3" y="3" width="7" height="9" rx="1" />
        <rect x="14" y="3" width="7" height="9" rx="1" />
        <rect x="3" y="15" width="7" height="6" rx="1" />
        <rect x="14" y="15" width="7" height="6" rx="1" />
      </svg>
    ),
  },
  {
    type: 'text_block',
    label: 'Text',
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M4 7V4h16v3" />
        <path d="M12 4v16" />
        <path d="M8 20h8" />
      </svg>
    ),
  },
  {
    type: 'image_text_split',
    label: 'Image + Text',
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="3" y="3" width="8" height="18" rx="1" />
        <path d="M14 6h7" />
        <path d="M14 10h7" />
        <path d="M14 14h5" />
      </svg>
    ),
  },
  {
    type: 'cta_button',
    label: 'Button',
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="4" y="8" width="16" height="8" rx="2" />
      </svg>
    ),
  },
  {
    type: 'footer',
    label: 'Footer',
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="3" y="15" width="18" height="6" rx="1" />
      </svg>
    ),
  },
];

interface AddSectionButtonProps {
  onAddSection: (type: SectionType) => void;
  position?: 'top' | 'bottom' | 'between';
  alwaysVisible?: boolean;
}

function AddSectionButton({
  onAddSection,
  position = 'between',
  alwaysVisible = false,
}: AddSectionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({
    top: 0,
    left: 0,
    openUpward: false,
  });
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const popoverHeight = 200; // Approximate height of popover
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpward = spaceBelow < popoverHeight + 16;

      setPopoverPosition({
        top: openUpward ? rect.top - 8 : rect.bottom + 8,
        left: rect.left + rect.width / 2,
        openUpward,
      });
    }
  }, [isOpen]);

  const positionClasses = {
    top: 'top-0 -translate-y-1/2',
    bottom: 'bottom-0 translate-y-1/2',
    between: 'bottom-0 translate-y-1/2',
  };

  return (
    <div
      className={`pointer-events-none absolute left-0 right-0 z-20 flex justify-center ${positionClasses[position]}`}
    >
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`pointer-events-auto flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm transition-all hover:scale-110 hover:border-primary hover:bg-primary hover:text-primary-foreground ${
          alwaysVisible || isOpen
            ? 'opacity-100'
            : 'opacity-0 group-hover:opacity-100'
        }`}
        title="Add section"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 15 15"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M8 2.75C8 2.47386 7.77614 2.25 7.5 2.25C7.22386 2.25 7 2.47386 7 2.75V7H2.75C2.47386 7 2.25 7.22386 2.25 7.5C2.25 7.77614 2.47386 8 2.75 8H7V12.25C7 12.5261 7.22386 12.75 7.5 12.75C7.77614 12.75 8 12.5261 8 12.25V8H12.25C12.5261 8 12.75 7.77614 12.75 7.5C12.75 7.22386 12.5261 7 12.25 7H8V2.75Z"
            fill="currentColor"
            fillRule="evenodd"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {isOpen &&
        createPortal(
          <div
            ref={popoverRef}
            className={`fixed z-50 -translate-x-1/2 rounded-lg border border-border bg-card p-2 shadow-lg ${
              popoverPosition.openUpward ? '-translate-y-full' : ''
            }`}
            style={{top: popoverPosition.top, left: popoverPosition.left}}
          >
            <div className="grid grid-cols-2 gap-1" style={{minWidth: '240px'}}>
              {sectionTypes.map((item) => (
                <button
                  key={item.type}
                  onClick={() => {
                    onAddSection(item.type);
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-accent"
                >
                  <span className="text-muted-foreground">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

interface EmptyStateAddButtonProps {
  onAddSection: (type: SectionType) => void;
}

function EmptyStateAddButton({onAddSection}: EmptyStateAddButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({
    top: 0,
    left: 0,
    openUpward: false,
  });
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const popoverHeight = 200;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpward = spaceBelow < popoverHeight + 16;

      setPopoverPosition({
        top: openUpward ? rect.top - 8 : rect.bottom + 8,
        left: rect.left + rect.width / 2,
        openUpward,
      });
    }
  }, [isOpen]);

  return (
    <div className="flex h-[400px] flex-col items-center justify-center text-muted-foreground">
      <p className="text-lg">Start building your email</p>
      <p className="mb-4 mt-1 text-sm">Click + to add your first section</p>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white shadow-md transition-all hover:scale-110"
        title="Add section"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 15 15"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M8 2.75C8 2.47386 7.77614 2.25 7.5 2.25C7.22386 2.25 7 2.47386 7 2.75V7H2.75C2.47386 7 2.25 7.22386 2.25 7.5C2.25 7.77614 2.47386 8 2.75 8H7V12.25C7 12.5261 7.22386 12.75 7.5 12.75C7.77614 12.75 8 12.5261 8 12.25V8H12.25C12.5261 8 12.75 7.77614 12.75 7.5C12.75 7.22386 12.5261 7 12.25 7H8V2.75Z"
            fill="currentColor"
            fillRule="evenodd"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {isOpen &&
        createPortal(
          <div
            ref={popoverRef}
            className={`fixed z-50 -translate-x-1/2 rounded-lg border border-border bg-card p-2 shadow-lg ${
              popoverPosition.openUpward ? '-translate-y-full' : ''
            }`}
            style={{top: popoverPosition.top, left: popoverPosition.left}}
          >
            <div className="grid grid-cols-2 gap-1" style={{minWidth: '240px'}}>
              {sectionTypes.map((item) => (
                <button
                  key={item.type}
                  onClick={() => {
                    onAddSection(item.type);
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-accent"
                >
                  <span className="text-muted-foreground">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

interface SortableSectionProps {
  section: EmailSection;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}

function SortableSection({
  section,
  isSelected,
  onSelect,
  onRemove,
}: SortableSectionProps) {
  const {attributes, listeners, setNodeRef, transform, transition, isDragging} =
    useSortable({id: section.id});

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  function renderSection() {
    switch (section.type) {
      case 'header':
        return <HeaderSectionView config={section.config} />;
      case 'hero':
        return <HeroSectionView config={section.config} />;
      case 'image':
        return <ImageSectionView config={section.config} />;
      case 'product_grid':
        return <ProductGridSectionView config={section.config} />;
      case 'text_block':
        return <TextBlockSectionView config={section.config} />;
      case 'image_text_split':
        return <ImageTextSplitSectionView config={section.config} />;
      case 'cta_button':
        return <CtaButtonSectionView config={section.config} />;
      case 'footer':
        return <FooterSectionView config={section.config} />;
      default:
        return null;
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative ${isDragging ? 'z-50 opacity-50' : ''}`}
    >
      <div
        onClick={onSelect}
        className={`relative cursor-pointer transition-all ${
          isSelected
            ? 'ring-2 ring-primary ring-offset-2'
            : 'hover:ring-1 hover:ring-primary/50'
        }`}
      >
        {renderSection()}
        <div className="absolute inset-0 bg-transparent" />
      </div>
      <div
        className={`absolute -left-9 top-1/2 flex -translate-y-1/2 flex-col gap-1.5 opacity-0 transition-all duration-200 group-hover:opacity-100 ${
          isSelected ? 'opacity-100' : ''
        }`}
      >
        <button
          {...attributes}
          {...listeners}
          className="flex h-7 w-7 cursor-grab items-center justify-center rounded-md border border-border bg-background text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-foreground active:cursor-grabbing"
          title="Drag to reorder"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 15 15"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5.5 4.625C6.12132 4.625 6.625 4.12132 6.625 3.5C6.625 2.87868 6.12132 2.375 5.5 2.375C4.87868 2.375 4.375 2.87868 4.375 3.5C4.375 4.12132 4.87868 4.625 5.5 4.625ZM9.5 4.625C10.1213 4.625 10.625 4.12132 10.625 3.5C10.625 2.87868 10.1213 2.375 9.5 2.375C8.87868 2.375 8.375 2.87868 8.375 3.5C8.375 4.12132 8.87868 4.625 9.5 4.625ZM6.625 7.5C6.625 8.12132 6.12132 8.625 5.5 8.625C4.87868 8.625 4.375 8.12132 4.375 7.5C4.375 6.87868 4.87868 6.375 5.5 6.375C6.12132 6.375 6.625 6.87868 6.625 7.5ZM9.5 8.625C10.1213 8.625 10.625 8.12132 10.625 7.5C10.625 6.87868 10.1213 6.375 9.5 6.375C8.87868 6.375 8.375 6.87868 8.375 7.5C8.375 8.12132 8.87868 8.625 9.5 8.625ZM6.625 11.5C6.625 12.1213 6.12132 12.625 5.5 12.625C4.87868 12.625 4.375 12.1213 4.375 11.5C4.375 10.8787 4.87868 10.375 5.5 10.375C6.12132 10.375 6.625 10.8787 6.625 11.5ZM9.5 12.625C10.1213 12.625 10.625 12.1213 10.625 11.5C10.625 10.8787 10.1213 10.375 9.5 10.375C8.87868 10.375 8.375 10.8787 8.375 11.5C8.375 12.1213 8.87868 12.625 9.5 12.625Z"
              fill="currentColor"
              fillRule="evenodd"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background text-muted-foreground shadow-sm transition-colors hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
          title="Remove section"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 15 15"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5.5 1C5.22386 1 5 1.22386 5 1.5C5 1.77614 5.22386 2 5.5 2H9.5C9.77614 2 10 1.77614 10 1.5C10 1.22386 9.77614 1 9.5 1H5.5ZM3 3.5C3 3.22386 3.22386 3 3.5 3H5H10H11.5C11.7761 3 12 3.22386 12 3.5C12 3.77614 11.7761 4 11.5 4H11V12C11 12.5523 10.5523 13 10 13H5C4.44772 13 4 12.5523 4 12V4H3.5C3.22386 4 3 3.77614 3 3.5ZM5 4H10V12H5V4Z"
              fill="currentColor"
              fillRule="evenodd"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

interface BuilderCanvasProps {
  sections: EmailSection[];
  selectedSectionId: string | null;
  onSelectSection: (id: string | null) => void;
  onRemoveSection: (id: string) => void;
  onAddSection: (type: SectionType, index?: number) => void;
}

export function BuilderCanvas({
  sections,
  selectedSectionId,
  onSelectSection,
  onRemoveSection,
  onAddSection,
}: BuilderCanvasProps) {
  const {setNodeRef, isOver} = useDroppable({
    id: 'canvas',
  });

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-6 py-4">
        <h2 className="text-lg font-medium text-foreground">Email Preview</h2>
      </div>
      <div className="overflow-y-auto bg-muted/30 p-6">
        <div
          ref={setNodeRef}
          className={`email-canvas mx-auto w-full max-w-[600px] min-h-[400px] bg-white shadow-md transition-all antialiased ${
            isOver ? 'ring-2 ring-primary ring-dashed' : ''
          }`}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onSelectSection(null);
            }
          }}
        >
          {sections.length === 0 ? (
            <EmptyStateAddButton
              onAddSection={(type) => onAddSection(type, 0)}
            />
          ) : (
            <SortableContext
              items={sections.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="relative px-10">
                {sections.map((section, index) => (
                  <div key={section.id} className="group relative">
                    {index === 0 && (
                      <AddSectionButton
                        onAddSection={(type) => onAddSection(type, 0)}
                        position="top"
                      />
                    )}
                    <SortableSection
                      section={section}
                      isSelected={section.id === selectedSectionId}
                      onSelect={() => onSelectSection(section.id)}
                      onRemove={() => onRemoveSection(section.id)}
                    />
                    <AddSectionButton
                      onAddSection={(type) => onAddSection(type, index + 1)}
                      position="bottom"
                    />
                  </div>
                ))}
              </div>
            </SortableContext>
          )}
        </div>
      </div>
    </div>
  );
}
