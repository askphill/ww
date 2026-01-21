import {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';

interface TemplateData {
  id: number;
  name: string;
  description: string | null;
  sections: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export function Templates() {
  const [templates, setTemplates] = useState<TemplateData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const response = await fetch(`/api/email/templates/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (response.ok) {
        setTemplates(templates.filter((t) => t.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete template:', error);
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
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Email Templates</h1>
        <Link
          to="/email/builder"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          New Template
        </Link>
      </div>

      {templates.length === 0 ? (
        <div className="rounded-lg border border-dashed border-muted-foreground/25 p-12 text-center">
          <p className="text-muted-foreground">No templates yet</p>
          <Link
            to="/email/builder"
            className="mt-4 inline-block text-primary hover:underline"
          >
            Create your first template
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => {
            const sectionCount = JSON.parse(template.sections).length;
            return (
              <div
                key={template.id}
                className="rounded-lg border border-border bg-card p-4"
              >
                <h3 className="font-medium text-card-foreground">
                  {template.name}
                </h3>
                {template.description && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {template.description}
                  </p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  {sectionCount} section{sectionCount !== 1 ? 's' : ''}
                </p>
                <div className="mt-4 flex gap-2">
                  <Link
                    to={`/email/builder/${template.id}`}
                    className="rounded bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDuplicate(template.id)}
                    className="rounded bg-muted px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted/80"
                  >
                    Duplicate
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="rounded bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive hover:bg-destructive/20"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
