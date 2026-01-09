import {Accordion} from '~/components/Accordion';

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
    <section className="bg-sand rounded-card p-8 md:pl-8 md:pr-8 md:pt-16 md:pb-24">
      <h2 className="text-h3 font-display">{title}</h2>

      <div className="md:grid md:grid-cols-24 pt-16 md:pt-20">
        {/* Text Column - spans cols 1-7 */}
        {description && (
          <div className="text-s1 font-body pb-12 md:pb-0 md:col-span-7">
            {description}
          </div>
        )}

        {/* Accordion Column - starts at col 9 */}
        <div className={description ? 'md:col-start-9 md:col-span-16' : 'md:col-span-24'}>
          <Accordion items={items} defaultOpenIndex={0} />
        </div>
      </div>
    </section>
  );
}
