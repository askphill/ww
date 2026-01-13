import {NavLink, useLocation, Link} from 'react-router';
import {
  LogoBig,
  VisaIcon,
  MastercardIcon,
  AmexIcon,
  PayPalIcon,
  IdealIcon,
  KlarnaIcon,
} from '@wakey/ui';

const FOOTER_MENU = [
  {title: 'Deodorant', url: '/products/deodorant'},
  {title: 'About', url: '/about'},
  {title: 'FAQ', url: '/faq'},
  {title: 'Blog', url: '/blog'},
  {title: 'Contact', url: '/pages/contact'},
];

const SOCIAL_LINKS = [
  {title: 'Instagram', url: 'https://instagram.com/wakeywakey'},
  {title: 'TikTok', url: 'https://tiktok.com/@wakeywakey'},
];

export function Footer() {
  const location = useLocation();
  const isAboutPage = location.pathname.includes('about');

  // Dynamic colors based on page
  const bgColor = isAboutPage ? 'bg-yellow' : 'bg-blue';
  const logoColor = isAboutPage ? 'text-blue' : 'text-yellow';

  return (
    <footer
      role="contentinfo"
      className={`${bgColor} overflow-hidden p-4 md:p-8 md:relative`}
    >
      {/* Logo */}
      <Link to="/" className="block pb-12 md:pb-0 ">
        <LogoBig className={`${logoColor} w-full`} />
      </Link>

      {/* Navigation - Grid on mobile, absolute on desktop */}
      <div className="grid md:absolute md:top-12 md:left-8">
        {/* Main nav links */}
        <nav
          aria-label="Footer navigation"
          className="text-s2 pb-16 md:pb-24 font-display"
        >
          {FOOTER_MENU.map((item) => (
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
        aria-label="Accepted payment methods: Visa, Mastercard, American Express, PayPal, iDEAL, Klarna"
        className="inline-flex gap-1 pb-4 md:absolute md:top-12 md:left-1/2 md:gap-3"
      >
        <VisaIcon className="h-6 md:h-8 w-auto" />
        <MastercardIcon className="h-6 md:h-8 w-auto" />
        <AmexIcon className="h-6 md:h-8 w-auto" />
        <PayPalIcon className="h-6 md:h-8 w-auto" />
        <IdealIcon className="h-6 md:h-8 w-auto" />
        <KlarnaIcon className="h-6 md:h-8 w-auto" />
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
  );
}
