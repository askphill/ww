interface ImageBannerProps {
  backgroundImage?: string;
  backgroundImageMobile?: string;
  backgroundVideo?: string;
  backgroundVideoMobile?: string;
  mediaAlt?: string;
  label?: string;
  text: string;
  textColor?: string;
  overlayColor?: string;
  overlayOpacity?: number;
  alignment?: 'left' | 'center' | 'right';
}

export function ImageBanner({
  backgroundImage,
  backgroundImageMobile,
  backgroundVideo,
  backgroundVideoMobile,
  mediaAlt = '',
  label,
  text,
  textColor = '#ffffff',
  overlayColor,
  overlayOpacity = 50,
  alignment = 'center',
}: ImageBannerProps) {
  const alignmentClasses = {
    left: 'items-start text-left',
    center: 'items-center text-center',
    right: 'items-end text-right',
  };

  const hasVideo = backgroundVideo || backgroundVideoMobile;

  return (
    <section className="relative min-h-svh overflow-clip">
      {/* Background Media */}
      <div className="absolute inset-0">
        {hasVideo ? (
          <>
            {/* Mobile video */}
            {backgroundVideoMobile && (
              <video
                className="absolute inset-0 w-full h-full object-cover md:hidden"
                src={backgroundVideoMobile}
                autoPlay
                loop
                muted
                playsInline
                preload="none"
                aria-label={mediaAlt}
              />
            )}
            {/* Desktop video */}
            <video
              className={`absolute inset-0 w-full h-full object-cover ${backgroundVideoMobile ? 'hidden md:block' : ''}`}
              src={backgroundVideo}
              autoPlay
              loop
              muted
              playsInline
              preload="none"
              aria-label={mediaAlt}
            />
          </>
        ) : (
          <picture>
            {backgroundImageMobile && (
              <source media="(max-width: 767px)" srcSet={backgroundImageMobile} />
            )}
            <img
              src={backgroundImage}
              alt={mediaAlt}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </picture>
        )}

        {/* Overlay */}
        {overlayColor && (
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: overlayColor,
              opacity: overlayOpacity / 100,
            }}
          />
        )}
      </div>

      {/* Content */}
      <div
        className={`relative z-10 flex flex-col justify-center ${alignmentClasses[alignment]} min-h-svh px-4 py-20 md:px-8`}
      >
        <div className="max-w-160">
          {label && (
            <p
              className="text-paragraph mb-4"
              style={{color: textColor}}
            >
              {label}
            </p>
          )}
          <p
            className="text-h3 font-display prose-wakey"
            style={{color: textColor}}
            dangerouslySetInnerHTML={{__html: text}}
          />
        </div>
      </div>
    </section>
  );
}
