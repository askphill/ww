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
    <section className="bg-sand rounded-card p-8 md:px-8 md:pt-16 md:pb-24">
      <h2 className="text-h3 font-display">{title}</h2>

      <div className="md:grid md:grid-cols-12 md:gap-12 pt-16 md:pt-20">
        {/* Text Column */}
        {description && (
          <div className="text-s1 font-body pb-12 md:pb-0 md:col-span-4 md:pr-12">
            {description}
          </div>
        )}

        {/* Accordion Column */}
        <div className={description ? 'md:col-span-8' : 'md:col-span-12'}>
          <Accordion items={items} defaultOpenIndex={0} />
        </div>
      </div>
    </section>
  );
}
