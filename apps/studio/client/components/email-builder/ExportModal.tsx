import {useState} from 'react';
import type {EmailSection} from '@wakey/email';
import {renderToEmail} from '@wakey/email';

interface ExportModalProps {
  sections: EmailSection[];
  onClose: () => void;
}

export function ExportModal({sections, onClose}: ExportModalProps) {
  const [copied, setCopied] = useState(false);
  const html = renderToEmail(sections);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(html);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 flex max-h-[90vh] w-full max-w-4xl flex-col rounded-lg bg-background shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">Export HTML</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-hidden p-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Copy the HTML below and paste it into Klaviyo or your email
              platform.
            </p>
            <button
              onClick={handleCopy}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              {copied ? 'Copied!' : 'Copy HTML'}
            </button>
          </div>
          <div className="h-[400px] overflow-auto rounded-md border border-border bg-muted/30">
            <pre className="whitespace-pre-wrap p-4 text-xs text-foreground">
              {html}
            </pre>
          </div>
        </div>
        <div className="border-t border-border px-6 py-4">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
