import {useState} from 'react';

interface AccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface AccordionProps {
  items: AccordionItem[];
  defaultOpenIndex?: number;
}

export function Accordion({items, defaultOpenIndex = 0}: AccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(defaultOpenIndex);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <ul>
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <li
            key={item.id}
            className="group last:border-b border-black/20"
            data-open={isOpen ? '' : undefined}
          >
            <button
              type="button"
              className="flex w-full items-center justify-between border-t border-black/20 py-4 text-left md:text-paragraph text-s2 font-display cursor-pointer"
              id={`accordion-button-${item.id}`}
              aria-expanded={isOpen}
              aria-controls={`accordion-panel-${item.id}`}
              onClick={() => toggleItem(index)}
            >
              <span>{item.title}</span>
              <div className="relative w-4 h-4 md:w-5 md:h-5">
                {/* Minus icon (shown when open) */}
                <svg
                  className="absolute inset-0 w-4 h-4 md:w-5 md:h-5 transition-all duration-300 ease-out opacity-0 -rotate-180 group-data-[open]:opacity-100 group-data-[open]:rotate-0"
                  viewBox="0 0 23 23"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M19.4434 11.9844L3.44336 11.9844"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                {/* Plus icon (shown when closed) */}
                <svg
                  className="absolute inset-0 w-4 h-4 md:w-5 md:h-5 transition-all duration-300 ease-out opacity-100 rotate-0 group-data-[open]:opacity-0 group-data-[open]:rotate-180"
                  viewBox="0 0 23 23"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M11.1211 1.98438L11.1211 21.9844"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M21.1211 11.9844L1.12109 11.9844"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </button>
            <article
              id={`accordion-panel-${item.id}`}
              aria-labelledby={`accordion-button-${item.id}`}
              role="region"
              className="grid transition-[grid-template-rows] duration-300 ease-out"
              style={{
                gridTemplateRows: isOpen ? '1fr' : '0fr',
              }}
            >
              <div className="overflow-hidden">
                <div className="pb-4 text-paragraph">{item.content}</div>
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
