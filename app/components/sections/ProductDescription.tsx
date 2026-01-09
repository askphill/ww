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
    <section className="bg-sand rounded-card p-8 md:py-12 md:px-6">
      {/* Title + Description Grid */}
      <div className="grid md:grid-cols-12">
        {/* Title - hidden on mobile, ~4 cols on desktop */}
        <h3 className="hidden md:block md:col-span-4 text-h3 font-display">
          {title}
        </h3>
        {/* Description - full width mobile, ~8 cols desktop */}
        <div
          className="md:col-span-8 text-h3 font-display max-w-4xl"
          dangerouslySetInnerHTML={{__html: descriptionHtml}}
        />
      </div>

      {/* USP List */}
      {usps.length > 0 && (
        <ul className="font-itc text-paragraph max-w-md pt-16 md:pt-24 pl-16 md:pl-0 space-y-4">
          {usps.map((usp, index) => (
            <li key={index}>{usp}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
