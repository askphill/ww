interface ProductDescriptionProps {
  title?: string;
  descriptionHtml: string;
  usps?: string[];
}

export function ProductDescription({
  title = 'Why you love it',
  descriptionHtml,
  usps = [],
}: ProductDescriptionProps) {
  return (
    <section className="bg-sand p-8 md:p-0 md:grid md:grid-cols-24 md:px-8 md:py-12">
      {/* Title - hidden on mobile */}
      <h3 className="hidden md:block md:col-span-10 text-h3 font-display">
        {title}
      </h3>

      {/* Description - starts at col 11 */}
      <div
        className="md:col-start-11 md:col-span-14 text-h3 font-display"
        dangerouslySetInnerHTML={{__html: descriptionHtml}}
      />

      {/* USP List - stays at col 1 */}
      {usps.length > 0 && (
        <ul className="font-body text-paragraph pt-16 md:pt-24 pl-16 md:pl-0 space-y-4 md:col-start-1 md:col-span-6">
          {usps.map((usp, index) => (
            <li key={index}>{usp}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
