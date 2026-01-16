interface IngredientItem {
  id: string;
  name: string;
  image: string;
  imageAlt?: string;
}

interface IngredientsSectionProps {
  title?: string;
  ingredientsList: string;
  items: IngredientItem[];
}

export function IngredientsSection({
  title = 'Ingredients',
  ingredientsList,
  items,
}: IngredientsSectionProps) {
  return (
    <section>
      {/* Text Container */}
      <div className="bg-sand p-8 px-4 md:p-8 md:pb-12 md:grid md:grid-cols-12 md:gap-0">
        <h2 className="text-h3 font-display md:col-span-5">{title}</h2>
        <div
          className="text-s2 md:text-s1 pt-28 pl-16 md:pt-48 md:pl-0 md:col-span-7"
          dangerouslySetInnerHTML={{__html: ingredientsList}}
        />
      </div>

      {/* Ingredient Cards Slider */}
      <div className="overflow-x-auto scrollbar-hide snap-x snap-mandatory flex">
        {items.map((item) => {
          const gradientId = `radial-gradient-${item.id}`;
          return (
            <div
              key={item.id}
              className="flex-shrink-0 w-full md:w-1/3 aspect-[3/4] relative overflow-hidden snap-start"
            >
              <img
                src={item.image}
                alt={item.imageAlt || item.name.replace(/<[^>]*>/g, '')}
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
              {/* Text Overlay with Radial Gradient */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  {/* Radial Gradient SVG */}
                  <svg
                    viewBox="0 0 234 234"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-48 h-48 md:w-56 md:h-56"
                  >
                    <circle
                      opacity="0.2"
                      cx="117.121"
                      cy="116.789"
                      r="116.252"
                      fill={`url(#${gradientId})`}
                    />
                    <defs>
                      <radialGradient
                        id={gradientId}
                        cx="0"
                        cy="0"
                        r="1"
                        gradientUnits="userSpaceOnUse"
                        gradientTransform="translate(117.121 116.789) rotate(90) scale(116.252)"
                      >
                        <stop />
                        <stop offset="1" stopOpacity="0" />
                      </radialGradient>
                    </defs>
                  </svg>
                  {/* Text positioned over the gradient */}
                  <span
                    className="ingredient-text absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-h3 md:text-paragraph font-display text-sand text-center whitespace-nowrap"
                    dangerouslySetInnerHTML={{__html: item.name}}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
