import {Accordion} from '@wakey/ui';

interface FAQItem {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface FAQProps {
  title: string;
  description?: React.ReactNode;
  items: FAQItem[];
}

export function FAQ({title, description, items}: FAQProps) {
  return (
    <section className="bg-sand px-4 py-8 md:p-0 md:grid md:grid-cols-24 md:px-8 md:pt-16 md:pb-24">
      <h2 className="text-h3 font-display md:col-span-24">{title}</h2>

      {/* Text Column - spans cols 1-7 */}
      {description && (
        <div className="text-base md:text-s1 pt-16 md:pt-20 md:col-span-7">
          {description}
        </div>
      )}

      {/* Accordion Column - always starts at col 11 */}
      <div className="pt-8 md:pt-20 md:col-start-11 md:col-span-14">
        <Accordion items={items} defaultOpenIndex={0} />
      </div>
    </section>
  );
}
