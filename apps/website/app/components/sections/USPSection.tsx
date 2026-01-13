import {useRef} from 'react';
import {useContinuousCarousel} from '@wakey/hooks';
import {USPIllustration} from '~/components/USPIllustration';

interface USPItem {
  title: string;
  body: string;
}

interface USPSectionProps {
  items: USPItem[];
}

function USPIcon() {
  return <USPIllustration className="w-36 md:w-40" />;
}

function USPCard({title, body}: USPItem) {
  return (
    <div className="flex flex-col items-center justify-center bg-blue px-4 pt-32 pb-8 w-72 shrink-0 gap-2 md:gap-0 md:flex-row-reverse md:items-stretch md:w-144 md:px-6 md:pt-32 md:pb-6 pointer-events-none">
      <div className="flex-shrink-0">
        <USPIcon />
      </div>
      <div className="flex flex-col justify-end md:pr-6 md:flex-1">
        <div
          className="text-s2 font-display pb-2"
          dangerouslySetInnerHTML={{__html: title}}
        />
        <div
          className="font-itc text-paragraph"
          dangerouslySetInnerHTML={{__html: body}}
        />
      </div>
    </div>
  );
}

export function USPSection({items}: USPSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const {wrapperRef, isDesktop} = useContinuousCarousel();

  if (items.length === 0) return null;

  // Mobile: horizontal scroll
  if (!isDesktop) {
    return (
      <section className="overflow-hidden">
        <div
          ref={scrollRef}
          className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
        >
          {items.map((item, index) => (
            <div key={index} className="flex-none snap-center bg-blue overflow-hidden">
              <USPCard title={item.title} body={item.body} />
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Desktop: continuous autoplay carousel
  return (
    <section className="overflow-hidden">
      <div
        ref={wrapperRef}
        className="flex cursor-grab active:cursor-grabbing select-none"
        style={{willChange: 'transform'}}
      >
        {items.map((item, index) => (
          <div key={index} className="flex-none">
            <USPCard title={item.title} body={item.body} />
          </div>
        ))}
      </div>
    </section>
  );
}
