import {useEffect} from 'react';
import {Link, useFetcher} from 'react-router';

interface NavProduct {
  id: string;
  title: string;
  handle: string;
  image: string | null;
  subtitle: string | null;
}

interface LinkItem {
  title: string;
  href: string;
}

const LEARN_LINKS: LinkItem[] = [
  {title: 'About us', href: '/about'},
  {title: 'FAQ', href: '/faq'},
  {title: 'Blog', href: '/blog'},
];

interface NavigationDropdownProps {
  isOpen: boolean;
  onClose?: () => void;
}

/**
 * Dropdown navigation panel that slides down from under the header
 * Contains Shop and Learn sections with navigation links
 * Uses CSS grid for smooth height animation (push effect)
 * Fetches active products from Shopify dynamically
 */
export function NavigationDropdown({isOpen, onClose}: NavigationDropdownProps) {
  const fetcher = useFetcher<{products: NavProduct[]}>();

  useEffect(() => {
    if (fetcher.state === 'idle' && !fetcher.data) {
      void fetcher.load('/api/nav-products');
    }
  }, [fetcher]);

  const products = fetcher.data?.products || [];

  return (
    <div
      id="navigation-dropdown"
      className="grid transition-[grid-template-rows] duration-300"
      style={{
        gridTemplateRows: isOpen ? '1fr' : '0fr',
        transitionTimingFunction: 'var(--ease-out-expo)',
      }}
    >
      <div className="overflow-hidden">
        <nav
          className={`
            w-full flex justify-center md:px-6
            transition-all duration-300
            ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}
          `}
          style={{transitionTimingFunction: 'var(--ease-out-expo)'}}
          aria-label="Main navigation"
          aria-hidden={!isOpen}
        >
          <div className="w-full mx-2 md:mx-0 md:max-w-[600px] bg-white md:rounded-card-s px-4 py-6 md:px-6 md:py-8">
            <div className="flex flex-col gap-6 md:gap-8">
              {/* Shop section - dynamic products */}
              <div>
                <h2 className="text-small font-display uppercase tracking-wide text-black/60 mb-3 md:mb-4">
                  Shop
                </h2>
                <ul className="flex flex-col gap-2 md:gap-3">
                  {products.map((product) => (
                    <li key={product.id}>
                      <Link
                        to={`/products/${product.handle}`}
                        className="flex items-center gap-2 md:gap-3 hover:opacity-80 transition-opacity"
                        onClick={onClose}
                        tabIndex={isOpen ? 0 : -1}
                      >
                        {product.image && (
                          <img
                            src={product.image}
                            alt={product.title}
                            className="w-11 h-11 md:w-14 md:h-14 object-contain rounded-lg flex-shrink-0"
                          />
                        )}
                        <div className="flex flex-col gap-1 md:gap-1.5">
                          <span className="text-label font-display uppercase leading-tight whitespace-nowrap">
                            {product.title}
                          </span>
                          {product.subtitle && (
                            <span className="text-small font-body italic opacity-60">
                              {product.subtitle}
                            </span>
                          )}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Learn section - static links */}
              <div>
                <h2 className="text-small font-display uppercase tracking-wide text-black/60 mb-3 md:mb-4">
                  Learn
                </h2>
                <ul className="flex flex-col gap-2 md:gap-3">
                  {LEARN_LINKS.map((item) => (
                    <li key={item.href}>
                      <Link
                        to={item.href}
                        className="text-s2 font-display text-black hover:text-black/70 transition-colors"
                        onClick={onClose}
                        tabIndex={isOpen ? 0 : -1}
                      >
                        {item.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
}
