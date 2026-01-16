import {Button} from '@wakey/ui';
import {sanitizeHtml} from '~/lib/sanitize';

interface TextMediaProps {
  videoUrl: string;
  videoAlt?: string;
  text: string;
  buttonText?: string;
  buttonUrl?: string;
}

export function TextMedia({
  videoUrl,
  videoAlt = '',
  text,
  buttonText,
  buttonUrl,
}: TextMediaProps) {
  return (
    <section className="flex flex-col overflow-hidden relative md:h-svh md:min-h-section md:grid md:grid-cols-24 md:gap-0">
      {/* Video - spans columns 1-12 on desktop */}
      <div className="order-2 md:order-none overflow-hidden relative md:col-span-12">
        <video
          className="w-full h-full block object-cover object-center"
          src={videoUrl}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          aria-label={videoAlt}
        />
      </div>

      {/* Content - spans columns 13-24 on desktop, uses nested 12-col grid */}
      <div className="order-1 md:order-none bg-sand overflow-hidden relative pt-8 px-4 pb-32 md:col-span-12 md:pt-6 md:pb-4 md:pl-0 md:pr-8 md:grid md:grid-cols-12 md:items-start">
        {/* Text positioned in last 8 columns (cols 5-12 of nested grid) */}
        <div className="md:col-start-5 md:col-span-8">
          <p
            className="block relative pb-8 text-h3 font-display md:pb-6"
            dangerouslySetInnerHTML={{__html: sanitizeHtml(text)}}
          />
          {buttonText && buttonUrl && (
            <Button href={buttonUrl} variant="outline" className="w-full">
              {buttonText}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
