import {Stars} from '@wakey/ui';
import type {ProductGridSection as ProductGridSectionType} from '../types';

interface Props {
  config: ProductGridSectionType['config'];
}

export function ProductGridSection({config}: Props) {
  const {
    products,
    columns,
    backgroundColor,
    showRatings,
    titleStyle,
    priceStyle,
  } = config;

  // Grid columns class
  const gridColsClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
  }[columns];

  return (
    <section className={`w-full bg-${backgroundColor}`}>
      <div className="p-8">
        <div className={`grid ${gridColsClass} gap-4`}>
          {products.map((product, index) => (
            <a
              key={index}
              href={product.url}
              className="block text-center no-underline"
            >
              {product.imageUrl && (
                <img
                  src={product.imageUrl}
                  alt={product.title}
                  className="w-full max-w-[200px] mx-auto mb-3 block"
                />
              )}
              <p className={`${titleStyle} font-display text-black m-0`}>
                {product.title}
              </p>
              {showRatings && product.rating && (
                <div className="my-2 flex justify-center">
                  <Stars rating={product.rating} color="black" size="sm" />
                </div>
              )}
              <p className={`mt-2 ${priceStyle} font-display text-black m-0`}>
                {product.price}
              </p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
