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
    <section className="md:grid md:grid-cols-24">
      {/* Image Column - Sticky on desktop, spans cols 1-12 */}
      <div className="hidden md:block md:col-span-12 sticky top-0 h-dvh">
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

      {/* Text Column - spans cols 13-24, uses nested 12-col grid */}
      <div className="bg-softorange rounded-card overflow-hidden min-h-dvh flex flex-col justify-center px-8 py-8 md:col-span-12 md:grid md:grid-cols-12 md:pl-0 md:pr-8 md:py-16">
        {/* Header - starts at col 2 */}
        <h2 className="text-h3 font-display pr-16 md:col-start-2 md:col-span-10">{heading}</h2>

        {/* Body content - starts at col 4 */}
        <div className="text-paragraph ml-16 mt-20 max-w-96 space-y-6 md:col-start-4 md:col-span-7 md:ml-0 md:mt-36">{children}</div>

        <img
          src={signature}
          alt="Signature"
          className="mt-8 max-w-32 ml-16 md:col-start-4 md:col-span-7 md:ml-0"
        />

        <p className="text-small mt-2 ml-16 pt-2 md:col-start-4 md:col-span-7 md:ml-0">{name}</p>
      </div>
    </section>
  );
}
