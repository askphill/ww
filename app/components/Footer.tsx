import {Suspense} from 'react';
import {Await, NavLink, useLocation, Link} from 'react-router';
import type {FooterQuery, HeaderQuery} from 'storefrontapi.generated';
import {LogoBig, IdealIcon, KlarnaIcon, IcsIcon, VisaIcon} from './icons';

interface FooterProps {
  footer: Promise<FooterQuery | null>;
  header: HeaderQuery;
  publicStoreDomain: string;
}

const SOCIAL_LINKS = [
  {title: 'Instagram', url: 'https://instagram.com/wakeywakey'},
  {title: 'TikTok', url: 'https://tiktok.com/@wakeywakey'},
];

export function Footer({
  footer: footerPromise,
  header,
  publicStoreDomain,
}: FooterProps) {
  const location = useLocation();
  const isAboutPage = location.pathname.includes('about');

  // Dynamic colors based on page
  const bgColor = isAboutPage ? 'bg-yellow' : 'bg-blue';
  const logoColor = isAboutPage ? 'text-blue' : 'text-yellow';

  return (
    <Suspense>
      <Await resolve={footerPromise}>
        {(footer) => (
          <footer
            role="contentinfo"
            className={`${bgColor} rounded-card overflow-hidden p-4 md:p-8 md:relative`}
          >
            {/* Logo */}
            <Link to="/" className="block pb-12 md:pb-0 ">
              <LogoBig className={`${logoColor} w-full`} />
            </Link>

            {/* Navigation - Grid on mobile, absolute on desktop */}
            <div className="grid  md:absolute md:top-12 md:left-8">
              {/* Main nav links */}
              <nav
                aria-label="Footer navigation"
                className="text-s2 pb-16 md:pb-24 font-display"
              >
                {footer?.menu && header.shop.primaryDomain?.url ? (
                  <FooterMenu
                    menu={footer.menu}
                    primaryDomainUrl={header.shop.primaryDomain.url}
                    publicStoreDomain={publicStoreDomain}
                  />
                ) : (
                  <FallbackMenu />
                )}
              </nav>

              {/* Social links - mobile only */}
              <nav
                aria-label="Social media links"
                className="text-label underline md:hidden font-display"
              >
                {SOCIAL_LINKS.map((link) => (
                  <div key={link.title}>
                    <a
                      href={link.url}
                      rel="noopener noreferrer"
                      target="_blank"
                      className="inline-block transition-transform duration-300 hover:opacity-80 hover:translate-x-1"
                    >
                      {link.title}
                    </a>
                  </div>
                ))}
              </nav>
            </div>

            {/* Payment Icons */}
            <div
              role="img"
              aria-label="Accepted payment methods: iDEAL, Klarna, Credit Card, Visa"
              className="inline-flex gap-1 pb-4 md:absolute md:top-12 md:left-1/2 md:gap-3"
            >
              <IdealIcon className="h-3.5 md:h-4 w-auto text-black" />
              <KlarnaIcon className="h-3.5 md:h-4 w-auto text-black" />
              <IcsIcon className="h-3.5 md:h-4 w-auto text-black" />
              <VisaIcon className="h-3.5 md:h-4 w-auto text-black" />
            </div>

            {/* Bottom section */}
            <div className="pb-4 md:pb-0 md:flex md:justify-between text-small font-display">
              {/* Social links - desktop only */}
              <ul className="hidden md:inline-flex md:gap-3">
                {SOCIAL_LINKS.map((link) => (
                  <li key={link.title}>
                    <a
                      href={link.url}
                      rel="noopener noreferrer"
                      target="_blank"
                      className="hover:opacity-80 transition-opacity"
                    >
                      {link.title}
                    </a>
                  </li>
                ))}
              </ul>

              {/* Legal text */}
              <div>2025 Wakey. All rights reserved.</div>
            </div>
          </footer>
        )}
      </Await>
    </Suspense>
  );
}

// Map Shopify page URLs to custom routes
const PAGE_ROUTE_MAP: Record<string, string> = {
  '/pages/about': '/about',
  '/pages/faq': '/faq',
};

function FooterMenu({
  menu,
  primaryDomainUrl,
  publicStoreDomain,
}: {
  menu: FooterQuery['menu'];
  primaryDomainUrl: FooterProps['header']['shop']['primaryDomain']['url'];
  publicStoreDomain: string;
}) {
  return (
    <>
      {menu?.items.map((item) => {
        if (!item.url) return null;
        // if the url is internal, we strip the domain
        let url =
          item.url.includes('myshopify.com') ||
          item.url.includes(publicStoreDomain) ||
          item.url.includes(primaryDomainUrl)
            ? new URL(item.url).pathname
            : item.url;

        // Remap page URLs to custom routes
        if (PAGE_ROUTE_MAP[url]) {
          url = PAGE_ROUTE_MAP[url];
        }

        const isExternal = !url.startsWith('/');
        return (
          <div key={item.id}>
            {isExternal ? (
              <a
                href={url}
                rel="noopener noreferrer"
                target="_blank"
                className="inline-block transition-transform duration-300 hover:opacity-80 hover:translate-x-1"
              >
                {item.title}
              </a>
            ) : (
              <NavLink
                end
                prefetch="intent"
                to={url}
                className="inline-block transition-transform duration-300 hover:opacity-80 hover:translate-x-1"
              >
                {item.title}
              </NavLink>
            )}
          </div>
        );
      })}
    </>
  );
}

function FallbackMenu() {
  const items = [
    {title: 'Privacy Policy', url: '/policies/privacy-policy'},
    {title: 'Refund Policy', url: '/policies/refund-policy'},
    {title: 'Shipping Policy', url: '/policies/shipping-policy'},
    {title: 'Terms of Service', url: '/policies/terms-of-service'},
  ];

  return (
    <>
      {items.map((item) => (
        <div key={item.title}>
          <NavLink
            end
            prefetch="intent"
            to={item.url}
            className="inline-block transition-transform duration-300 hover:opacity-80 hover:translate-x-1"
          >
            {item.title}
          </NavLink>
        </div>
      ))}
    </>
  );
}
