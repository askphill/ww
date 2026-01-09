import {Await, NavLink, useLocation} from 'react-router';
import {Suspense} from 'react';
import type {
  CartApiQueryFragment,
  FooterQuery,
  HeaderQuery,
} from 'storefrontapi.generated';
import {Aside, useAside} from '~/components/Aside';
import {Footer} from '~/components/Footer';
import {Header} from '~/components/Header';
import {CartMain} from '~/components/CartMain';
import {CrossIcon} from '~/components/icons';

interface PageLayoutProps {
  cart: Promise<CartApiQueryFragment | null>;
  footer: Promise<FooterQuery | null>;
  header: HeaderQuery;
  isLoggedIn: Promise<boolean>;
  publicStoreDomain: string;
  children?: React.ReactNode;
}

export function PageLayout({
  cart,
  children = null,
  footer,
  header,
  isLoggedIn,
  publicStoreDomain,
}: PageLayoutProps) {
  const location = useLocation();
  const isHomepage = location.pathname === '/';
  const headerColor = isHomepage ? 'sand' : 'default';

  return (
    <Aside.Provider>
      <CartAside cart={cart} />
      <MobileMenuAside header={header} publicStoreDomain={publicStoreDomain} />
      {header && <Header cart={cart} color={headerColor} />}
      <main>{children}</main>
      <Footer
        footer={footer}
        header={header}
        publicStoreDomain={publicStoreDomain}
      />
    </Aside.Provider>
  );
}

function CartAside({cart}: {cart: PageLayoutProps['cart']}) {
  const {close} = useAside();

  return (
    <Aside type="cart">
      {/* Title block */}
      <div className="bg-sand rounded-card p-4 md:p-6 flex justify-between pb-16 md:pb-24">
        <h2 className="text-h2 font-display" id="CartDrawerTitle">
          Cart
        </h2>
        <button
          onClick={close}
          className="hover-scale h-fit"
          aria-label="Close cart"
        >
          <CrossIcon className="w-10 h-10 md:w-[3.125rem] md:h-[3.125rem] text-text" />
        </button>
      </div>

      {/* Cart content */}
      <Suspense fallback={<CartLoading />}>
        <Await resolve={cart}>
          {(cart) => <CartMain cart={cart} layout="aside" />}
        </Await>
      </Suspense>
    </Aside>
  );
}

function CartLoading() {
  return (
    <div className="bg-sand rounded-card p-4 md:p-6 mt-[-1px] flex-1">
      <p className="text-paragraph font-display">Loading cart...</p>
    </div>
  );
}

function MobileMenuAside({
  header,
  publicStoreDomain,
}: {
  header: PageLayoutProps['header'];
  publicStoreDomain: PageLayoutProps['publicStoreDomain'];
}) {
  const {close} = useAside();
  const primaryMenu = header.menu?.items || FALLBACK_MENU.items;
  const primaryDomainUrl = header.shop.primaryDomain?.url || '';

  // Secondary nav items (hardcoded for now, could be fetched from another menu)
  const secondaryMenu = [
    {title: 'Home', url: '/'},
    {title: 'Account', url: '/account'},
    {title: 'Contact', url: '/pages/contact'},
    {title: 'Blogs', url: '/blogs'},
  ];

  // Social links
  const socialLinks = [
    {title: 'Facebook', url: 'https://facebook.com/wakeywakey'},
    {title: 'Instagram', url: 'https://instagram.com/wakeywakey'},
    {title: 'TikTok', url: 'https://tiktok.com/@wakeywakey'},
  ];

  return (
    <Aside type="mobile">
      {/* Block 1: Primary navigation - 50% height */}
      <div className="h-1/2 bg-sand rounded-card p-4 md:p-6 flex flex-col justify-end relative">
        {/* Close button */}
        <button
          onClick={close}
          className="absolute top-4 left-4 md:top-6 md:left-6 hover-scale"
          aria-label="Close menu"
        >
          <CrossIcon className="w-10 h-10 md:w-[3.125rem] md:h-[3.125rem] text-text" />
        </button>

        {/* Primary navigation */}
        <nav aria-label="Primary">
          <ul>
            {primaryMenu.map((item) => {
              if (!item.url) return null;
              const url = getMenuUrl(
                item.url,
                publicStoreDomain,
                primaryDomainUrl,
              );
              return (
                <li
                  key={item.id}
                  className="text-h2 font-display transition-transform duration-300 md:hover:translate-x-1 md:hover:opacity-80"
                >
                  <NavLink to={url} onClick={close} prefetch="intent">
                    {item.title}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Block 2: Secondary navigation - 50% height */}
      <div className="h-1/2 bg-sand rounded-card p-4 md:p-6 mt-[-1px] flex flex-col justify-end">
        {/* Secondary navigation */}
        <nav aria-label="Secondary">
          <ul>
            {secondaryMenu.map((item) => (
              <li
                key={item.title}
                className="text-h3 italic transition-transform duration-300 md:hover:translate-x-1 md:hover:opacity-80"
              >
                <NavLink to={item.url} onClick={close} prefetch="intent">
                  {item.title}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="pt-4 md:pt-6 flex justify-between text-small opacity-40">
          <div className="flex gap-2">
            {socialLinks.map((link) => (
              <a
                key={link.title}
                href={link.url}
                className="underline transition-opacity md:hover:opacity-80"
                rel="noopener noreferrer"
                target="_blank"
              >
                {link.title}
              </a>
            ))}
          </div>
          <p>Wakey All rights reserved.</p>
        </div>
      </div>
    </Aside>
  );
}

/**
 * Normalize menu URLs - strip domain for internal links
 */
function getMenuUrl(
  url: string,
  publicStoreDomain: string,
  primaryDomainUrl: string,
): string {
  if (
    url.includes('myshopify.com') ||
    url.includes(publicStoreDomain) ||
    url.includes(primaryDomainUrl)
  ) {
    return new URL(url).pathname;
  }
  return url;
}

const FALLBACK_MENU = {
  id: 'fallback-menu',
  items: [
    {id: 'shop', title: 'Shop', url: '/collections/all'},
    {id: 'about', title: 'About', url: '/pages/about'},
  ],
};
