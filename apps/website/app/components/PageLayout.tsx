import {Await, NavLink, useLocation} from 'react-router';
import {Suspense} from 'react';
import type {
  CartApiQueryFragment,
  HeaderQuery,
} from 'storefrontapi.generated';
import {Aside, useAside} from '~/components/Aside';
import {Footer} from '~/components/Footer';
import {Header} from '~/components/Header';
import {CartMain} from '~/components/CartMain';
import {CrossIcon} from '@wakey/ui';

const PRIMARY_MENU = [
  {title: 'Shop', url: '/collections/all'},
  {title: 'About us', url: '/about'},
  {title: 'FAQ', url: '/faq'},
];

const SECONDARY_MENU = [
  {title: 'Home', url: '/'},
  {title: 'Blog', url: '/blog'},
  {title: 'FAQ', url: '/faq'},
];

const SOCIAL_LINKS = [
  {title: 'Instagram', url: 'https://instagram.com/wakeywakey'},
  {title: 'TikTok', url: 'https://tiktok.com/@wakeywakey'},
];

interface PageLayoutProps {
  cart: Promise<CartApiQueryFragment | null>;
  header: HeaderQuery;
  isLoggedIn: Promise<boolean>;
  children?: React.ReactNode;
}

export function PageLayout({
  cart,
  children = null,
  header,
  isLoggedIn,
}: PageLayoutProps) {
  const location = useLocation();
  const isHomepage = location.pathname === '/';
  const headerColor = isHomepage ? 'sand' : 'default';

  return (
    <Aside.Provider>
      <CartAside cart={cart} />
      <MobileMenuAside />
      {header && <Header cart={cart} color={headerColor} />}
      <main>{children}</main>
      <Footer />
    </Aside.Provider>
  );
}

function CartAside({cart}: {cart: PageLayoutProps['cart']}) {
  const {close} = useAside();

  return (
    <Aside type="cart">
      {/* Title block */}
      <div className="bg-sand rounded-card p-4 md:p-8 flex justify-between pb-16 md:pb-24">
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
    <div className="bg-sand rounded-card p-4 md:p-8 mt-[-1px] flex-1">
      <p className="text-paragraph font-display">Loading cart...</p>
    </div>
  );
}

function MobileMenuAside() {
  const {close} = useAside();

  return (
    <Aside type="mobile">
      {/* Block 1: Primary navigation - 50% height */}
      <div className="h-1/2 bg-sand rounded-card p-4 md:p-8 flex flex-col justify-end relative">
        {/* Close button */}
        <button
          onClick={close}
          className="absolute top-4 left-4 md:top-8 md:left-8"
          aria-label="Close menu"
        >
          <CrossIcon className="w-10 h-10 md:w-[3.125rem] md:h-[3.125rem] text-text" />
        </button>

        {/* Primary navigation */}
        <nav aria-label="Primary">
          <ul>
            {PRIMARY_MENU.map((item) => (
              <li
                key={item.title}
                className="text-h2 font-display transition-transform duration-300 md:hover:translate-x-1 md:hover:opacity-80"
              >
                <NavLink to={item.url} onClick={close} prefetch="intent">
                  {item.title}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Block 2: Secondary navigation - 50% height */}
      <div className="h-1/2 bg-sand rounded-card p-4 md:p-8 mt-[-1px] flex flex-col justify-end">
        {/* Secondary navigation */}
        <nav aria-label="Secondary">
          <ul>
            {SECONDARY_MENU.map((item) => (
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
            {SOCIAL_LINKS.map((link) => (
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
