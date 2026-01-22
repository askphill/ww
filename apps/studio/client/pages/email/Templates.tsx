import {useEffect, useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import type {EmailSection} from '@wakey/email';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';

interface TemplateData {
  id: number;
  name: string;
  description: string | null;
  sections: string;
  createdAt: string | null;
  updatedAt: string | null;
}

function TemplatePreview({sections}: {sections: EmailSection[]}) {
  function renderSection(section: EmailSection) {
    switch (section.type) {
      case 'header':
        return <HeaderSectionView key={section.id} config={section.config} />;
      case 'hero':
        return <HeroSectionView key={section.id} config={section.config} />;
      case 'image':
        return <ImageSectionView key={section.id} config={section.config} />;
      case 'product_grid':
        return (
          <ProductGridSectionView key={section.id} config={section.config} />
        );
      case 'text_block':
        return (
          <TextBlockSectionView key={section.id} config={section.config} />
        );
      case 'image_text_split':
        return (
          <ImageTextSplitSectionView key={section.id} config={section.config} />
        );
      case 'cta_button':
        return (
          <CtaButtonSectionView key={section.id} config={section.config} />
        );
      case 'footer':
        return <FooterSectionView key={section.id} config={section.config} />;
      default:
        return null;
    }
  }

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden bg-white">
      <div className="flex justify-center">
        <div
          className="pointer-events-none origin-top"
          style={{
            width: '600px',
            transform: 'scale(0.4)',
          }}
        >
          {sections.map((section) => renderSection(section))}
        </div>
      </div>
      {sections.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
          No sections
        </div>
      )}
    </div>
  );
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Icons
function PlusIcon({className}: {className?: string}) {
  return (
    <svg
      className={className}
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
  );
}

function DotsIcon({className}: {className?: string}) {
  return (
    <svg
      className={className}
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM12.5 8.625C13.1213 8.625 13.625 8.12132 13.625 7.5C13.625 6.87868 13.1213 6.375 12.5 6.375C11.8787 6.375 11.375 6.87868 11.375 7.5C11.375 8.12132 11.8787 8.625 12.5 8.625Z"
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </svg>
  );
}

function PencilIcon({className}: {className?: string}) {
  return (
    <svg
      className={className}
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M11.8536 1.14645C11.6583 0.951184 11.3417 0.951184 11.1465 1.14645L3.71455 8.57836C3.62459 8.66832 3.55263 8.77461 3.50251 8.89155L2.04044 12.303C1.9599 12.491 2.00189 12.709 2.14646 12.8536C2.29103 12.9981 2.50905 13.0401 2.69697 12.9596L6.10847 11.4975C6.2254 11.4474 6.3317 11.3754 6.42166 11.2855L13.8536 3.85355C14.0488 3.65829 14.0488 3.34171 13.8536 3.14645L11.8536 1.14645ZM4.42166 9.28547L11.5 2.20711L12.7929 3.5L5.71455 10.5784L4.21924 11.2192L3.78081 10.7808L4.42166 9.28547Z"
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </svg>
  );
}

function CopyIcon({className}: {className?: string}) {
  return (
    <svg
      className={className}
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M1 9.50006C1 10.3285 1.67157 11.0001 2.5 11.0001H4L4 10.0001H2.5C2.22386 10.0001 2 9.7762 2 9.50006L2 2.50006C2 2.22392 2.22386 2.00006 2.5 2.00006L9.5 2.00006C9.77614 2.00006 10 2.22392 10 2.50006V4.00002H5.5C4.67158 4.00002 4 4.67159 4 5.50002V12.5C4 13.3284 4.67158 14 5.5 14H12.5C13.3284 14 14 13.3284 14 12.5V5.50002C14 4.67159 13.3284 4.00002 12.5 4.00002H11V2.50006C11 1.67163 10.3284 1.00006 9.5 1.00006H2.5C1.67157 1.00006 1 1.67163 1 2.50006V9.50006ZM5 5.50002C5 5.22388 5.22386 5.00002 5.5 5.00002H12.5C12.7761 5.00002 13 5.22388 13 5.50002V12.5C13 12.7762 12.7761 13 12.5 13H5.5C5.22386 13 5 12.7762 5 12.5V5.50002Z"
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </svg>
  );
}

function TrashIcon({className}: {className?: string}) {
  return (
    <svg
      className={className}
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
  );
}

function MailIcon({className}: {className?: string}) {
  return (
    <svg
      className={className}
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M1 2C0.447715 2 0 2.44772 0 3V12C0 12.5523 0.447715 13 1 13H14C14.5523 13 15 12.5523 15 12V3C15 2.44772 14.5523 2 14 2H1ZM1 3L14 3V3.92494C13.9174 3.92486 13.8338 3.94751 13.7589 3.99505L7.5 7.96703L1.24112 3.99505C1.16621 3.94751 1.0826 3.92486 1 3.92494V3ZM1 4.90797V12H14V4.90797L7.74112 8.87995C7.59394 8.97335 7.40606 8.97335 7.25888 8.87995L1 4.90797Z"
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </svg>
  );
}

interface TemplateCardProps {
  template: TemplateData;
  onDuplicate: () => void;
  onDelete: () => void;
}

function TemplateCard({template, onDuplicate, onDelete}: TemplateCardProps) {
  const navigate = useNavigate();
  const sections = JSON.parse(template.sections) as EmailSection[];

  return (
    <div
      className="group relative overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-border/80 hover:shadow-lg cursor-pointer"
      onClick={() => navigate(`/email/builder/${template.id}`)}
    >
      {/* Preview */}
      <div className="border-b border-border">
        <TemplatePreview sections={sections} />
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-medium text-card-foreground">
              {template.name}
            </h3>
            {template.description && (
              <p className="mt-1 truncate text-sm text-muted-foreground">
                {template.description}
              </p>
            )}
          </div>

          {/* Actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              onClick={(e) => e.stopPropagation()}
              className="flex h-8 w-8 items-center justify-center rounded-md opacity-0 transition-opacity hover:bg-accent group-hover:opacity-100"
            >
              <DotsIcon className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/email/builder/${template.id}`);
                }}
              >
                <PencilIcon className="h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate();
                }}
              >
                <CopyIcon className="h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="text-destructive focus:text-destructive"
              >
                <TrashIcon className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Meta info */}
        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MailIcon className="h-3.5 w-3.5" />
            {sections.length} section{sections.length !== 1 ? 's' : ''}
          </span>
          {template.updatedAt && (
            <span>Updated {formatDate(template.updatedAt)}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export function Templates() {
  const [templates, setTemplates] = useState<TemplateData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<number | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    try {
      const response = await fetch('/api/email/templates', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = (await response.json()) as TemplateData[];
        setTemplates(data);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function openDeleteDialog(id: number) {
    setTemplateToDelete(id);
    setDeleteDialogOpen(true);
  }

  async function handleDelete() {
    if (templateToDelete === null) return;

    try {
      const response = await fetch(`/api/email/templates/${templateToDelete}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (response.ok) {
        setTemplates(templates.filter((t) => t.id !== templateToDelete));
      }
    } catch (error) {
      console.error('Failed to delete template:', error);
    } finally {
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    }
  }

  async function handleDuplicate(id: number) {
    try {
      const response = await fetch(`/api/email/templates/${id}/duplicate`, {
        method: 'POST',
        credentials: 'include',
      });
      if (response.ok) {
        fetchTemplates();
      }
    } catch (error) {
      console.error('Failed to duplicate template:', error);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Email Templates</h1>
          <p className="text-sm text-muted-foreground">
            Create and manage your email templates
          </p>
        </div>
        <Link
          to="/email/builder"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <PlusIcon className="h-4 w-4" />
          New Template
        </Link>
      </div>

      {/* Content */}
      {templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <MailIcon className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 font-medium text-foreground">No templates yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Get started by creating your first email template
          </p>
          <Link
            to="/email/builder"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <PlusIcon className="h-4 w-4" />
            Create Template
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onDuplicate={() => handleDuplicate(template.id)}
              onDelete={() => openDeleteDialog(template.id)}
            />
          ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete template?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              template.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
