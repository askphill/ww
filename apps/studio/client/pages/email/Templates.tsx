import {useQuery} from '@tanstack/react-query';
import {useNavigate} from 'react-router-dom';
import {api} from '../../lib/api';

type TemplateStatus = 'draft' | 'active' | 'archived';

interface Template {
  id: number;
  name: string;
  subject: string;
  previewText: string | null;
  category: string | null;
  status: TemplateStatus;
  createdAt: string;
  updatedAt: string | null;
}

export function Templates() {
  const navigate = useNavigate();

  const {data, isLoading} = useQuery({
    queryKey: ['email', 'templates'],
    queryFn: () => api.email.templates.list(),
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Templates</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data?.templates.length || 0} email templates
          </p>
        </div>
        <button
          onClick={() => navigate('/email/templates/new')}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Create Template
        </button>
      </div>

      {/* Templates Grid */}
      {data?.templates && data.templates.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onClick={() => navigate(`/email/templates/${template.id}`)}
            />
          ))}
        </div>
      ) : (
        <EmptyState onCreateClick={() => navigate('/email/templates/new')} />
      )}
    </div>
  );
}

function TemplateCard({
  template,
  onClick,
}: {
  template: Template;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-muted/30"
    >
      <div className="mb-2 flex items-start justify-between">
        <h3 className="font-medium text-foreground">{template.name}</h3>
        <StatusBadge status={template.status} />
      </div>
      <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
        {template.subject || 'No subject line'}
      </p>
      <p className="mt-auto text-xs text-muted-foreground">
        Last modified {formatDate(template.updatedAt || template.createdAt)}
      </p>
    </button>
  );
}

function StatusBadge({status}: {status: TemplateStatus}) {
  const styles: Record<TemplateStatus, string> = {
    draft: 'bg-muted text-muted-foreground',
    active: 'bg-green-500/20 text-green-600 dark:text-green-400',
    archived: 'bg-red-500/20 text-red-600 dark:text-red-400',
  };

  const labels: Record<TemplateStatus, string> = {
    draft: 'Draft',
    active: 'Active',
    archived: 'Archived',
  };

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function EmptyState({onCreateClick}: {onCreateClick: () => void}) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <svg
          className="h-6 w-6 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      </div>
      <h3 className="mb-2 text-lg font-medium text-foreground">
        No templates yet
      </h3>
      <p className="mb-6 text-sm text-muted-foreground">
        Create your first email template to start building campaigns.
      </p>
      <button
        onClick={onCreateClick}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Create Your First Template
      </button>
    </div>
  );
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}
