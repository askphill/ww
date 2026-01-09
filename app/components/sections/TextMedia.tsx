import {Button} from '~/components/Button';

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
    <section className="overflow-hidden relative rounded-card md:h-svh md:min-h-section md:grid md:grid-cols-2">
      {/* Video */}
      <div className="overflow-hidden relative rounded-card">
        <video
          className="w-full h-full block object-cover object-center"
          src={videoUrl}
          autoPlay
          loop
          muted
          playsInline
          preload="none"
          aria-label={videoAlt}
        />
      </div>

      {/* Content */}
      <div className="bg-sand overflow-hidden relative pt-8 px-4 pb-32 rounded-card md:pt-6 md:pr-8 md:pb-4 md:flex md:flex-col md:items-end">
       <div className="max-w-124">
       <p
          className="block relative pb-8 text-h3 font-display md:pb-6"
          dangerouslySetInnerHTML={{__html: text}}
        />
        {buttonText && buttonUrl && (
          <Button
            href={buttonUrl}
            variant="outline"
            className="w-full"
          >
            {buttonText}
          </Button>
        )}

       </div>
      </div>
    </section>
  );
}
