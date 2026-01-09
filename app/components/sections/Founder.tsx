interface FounderProps {
  image: string;
  imageAlt?: string;
  heading: string;
  children: React.ReactNode;
  signature: string;
  name: string;
}

export function Founder({
  image,
  imageAlt = '',
  heading,
  children,
  signature,
  name,
}: FounderProps) {
  return (
    <section className="md:grid md:grid-cols-2">
      {/* Image Column - Sticky on desktop */}
      <div className="hidden md:block sticky top-0 h-dvh">
        <div className="relative h-full rounded-card overflow-hidden">
          <img
            src={image}
            alt={imageAlt}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Image - Mobile only */}
      <div className="md:hidden rounded-card overflow-hidden aspect-3/4">
        <img
          src={image}
          alt={imageAlt}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Text Column */}
      <div className="bg-softorange rounded-card overflow-hidden min-h-dvh flex flex-col justify-center px-8 py-20 md:px-24 md:py-32">
        <h2 className="text-h3 font-display max-w-140">{heading}</h2>

        <div className="text-paragraph mt-20 max-w-132 space-y-6">{children}</div>

        <img
          src={signature}
          alt="Signature"
          className="mt-8 max-w-72"
        />

        <p className="text-small mt-2">{name}</p>
      </div>
    </section>
  );
}
