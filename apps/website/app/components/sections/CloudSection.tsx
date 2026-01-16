interface CloudSectionProps {
  images?: string[];
}

// Image positions based on 1500px design width (converted to percentages)
// Each position repeats 3 times vertically (at 0, 1200, 2400 base offsets)
const imagePositions = [
  // Round 1 (base: 0)
  {left: 20.67, top: 0, width: 15.93}, // img-1
  {left: 70.67, top: 1.87, width: 9.27}, // img-2
  {left: 51.33, top: 14.87, width: 9.27}, // img-3
  {left: 19.67, top: 33.07, width: 1.93}, // img-4
  {left: 90.67, top: 28.47, width: 11.33}, // img-5
  {left: 0, top: 47.27, width: 12.07}, // img-6
  {left: 44.67, top: 49.33, width: 5.6}, // img-7
  {left: 76.33, top: 48, width: 15.93}, // img-8
  // Round 2 (base: 80 = 1200/1500*100)
  {left: 20.67, top: 80, width: 15.93}, // img-9
  {left: 70.67, top: 81.87, width: 9.27}, // img-10
  {left: 51.33, top: 94.87, width: 9.27}, // img-11
  {left: 19.67, top: 113.07, width: 1.93}, // img-12
  {left: 90.67, top: 108.47, width: 11.33}, // img-13
  {left: 0, top: 127.27, width: 12.07}, // img-14
  {left: 44.67, top: 129.33, width: 5.6}, // img-15
  {left: 76.33, top: 128, width: 15.93}, // img-16
  // Round 3 (base: 160 = 2400/1500*100)
  {left: 20.67, top: 160, width: 15.93}, // img-17
  {left: 70.67, top: 161.87, width: 9.27}, // img-18
  {left: 51.33, top: 188.2, width: 9.27}, // img-19
  {left: 19.67, top: 193.07, width: 1.93}, // img-20
  {left: 90.67, top: 188.47, width: 11.33}, // img-21
  {left: 0, top: 207.27, width: 12.07}, // img-22
  {left: 44.67, top: 209.33, width: 5.6}, // img-23
];

const defaultImage =
  'https://cdn.shopify.com/s/files/1/0609/8747/4152/files/happy.jpg?v=1709234975';

export function CloudSection({images}: CloudSectionProps) {
  // Use provided images or fall back to default
  const imageList =
    images && images.length > 0 ? images : Array(23).fill(defaultImage);

  return (
    <section className="relative min-h-dvh bg-sand overflow-hidden flex justify-center items-center flex-col h-dvh">
      {/* Animated text overlay */}
      <div className="absolute inset-0 flex justify-center items-center flex-col text-center z-10 h-dvh">
        {/* Headline 1: "Making the world a better place" */}
        <div className="flex justify-center items-center flex-col font-display text-h1 text-black">
          <div className="overflow-hidden py-1 -my-1 px-5 -mx-5">
            <span
              className="inline-block opacity-0 animate-cloud-text"
              style={{animationDelay: '0.05s'}}
            >
              Making
            </span>{' '}
            <span
              className="inline-block opacity-0 animate-cloud-text"
              style={{animationDelay: '0.1s'}}
            >
              the
            </span>{' '}
            <span
              className="inline-block opacity-0 animate-cloud-text italic"
              style={{animationDelay: '0.15s'}}
            >
              world
            </span>
          </div>
          <div className="overflow-hidden py-1 -my-1 px-5 -mx-5">
            <span
              className="inline-block opacity-0 animate-cloud-text"
              style={{animationDelay: '0.2s'}}
            >
              a
            </span>{' '}
            <span
              className="inline-block opacity-0 animate-cloud-text"
              style={{animationDelay: '0.25s'}}
            >
              better
            </span>{' '}
            <span
              className="inline-block opacity-0 animate-cloud-text"
              style={{animationDelay: '0.3s'}}
            >
              place
            </span>
          </div>
        </div>

        {/* Headline 2: "one morning at a time" */}
        <div className="absolute inset-0 flex justify-center items-center flex-col font-display text-h1 text-black">
          <div className="overflow-hidden py-1 -my-1 px-5 -mx-5">
            <span
              className="inline-block opacity-0 animate-cloud-text"
              style={{animationDelay: '2.55s'}}
            >
              one
            </span>{' '}
            <span
              className="inline-block opacity-0 animate-cloud-text italic"
              style={{animationDelay: '2.6s'}}
            >
              morning
            </span>
          </div>
          <div className="overflow-hidden py-1 -my-1 px-5 -mx-5">
            <span
              className="inline-block opacity-0 animate-cloud-text"
              style={{animationDelay: '2.65s'}}
            >
              at
            </span>{' '}
            <span
              className="inline-block opacity-0 animate-cloud-text"
              style={{animationDelay: '2.7s'}}
            >
              a
            </span>{' '}
            <span
              className="inline-block opacity-0 animate-cloud-text"
              style={{animationDelay: '2.75s'}}
            >
              time
            </span>
          </div>
        </div>
      </div>

      {/* Scrolling image gallery */}
      <div
        className="w-full relative animate-cloud-scroll"
        style={{height: '453.33vw'}}
      >
        {/* First set of images */}
        <div className="relative" style={{height: '226.67vw'}}>
          {imagePositions.map((pos, index) => (
            <div
              key={`set1-${index}`}
              className="absolute"
              style={{
                left: `${pos.left}vw`,
                top: `${pos.top}vw`,
                width: `${pos.width}vw`,
                opacity: 0,
                animation: 'fadeIn 0.6s ease-out forwards',
                animationDelay: `${index * 40}ms`,
              }}
            >
              <img
                src={imageList[index % imageList.length]}
                alt=""
                className="block w-full h-auto"
                loading={index < 3 ? 'eager' : 'lazy'}
              />
            </div>
          ))}
        </div>

        {/* Second set (duplicate for seamless loop) */}
        <div className="relative" style={{height: '226.67vw'}}>
          {imagePositions.map((pos, index) => (
            <div
              key={`set2-${index}`}
              className="absolute"
              style={{
                left: `${pos.left}vw`,
                top: `${pos.top}vw`,
                width: `${pos.width}vw`,
              }}
            >
              <img
                src={imageList[index % imageList.length]}
                alt=""
                className="block w-full h-auto"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Fade-in keyframes for staggered image appearance */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @media (prefers-reduced-motion: reduce) {
              .animate-cloud-text,
              .animate-cloud-scroll {
                animation: none !important;
              }
              .animate-cloud-text {
                opacity: 1 !important;
              }
            }
          `,
        }}
      />
    </section>
  );
}
