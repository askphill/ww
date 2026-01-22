import {NavLink, useLocation, Link, useFetcher} from 'react-router';
import {
  LogoBig,
  VisaIcon,
  MastercardIcon,
  AmexIcon,
  PayPalIcon,
  IdealIcon,
  KlarnaIcon,
  Button,
  Input,
  CheckCircleIcon,
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

interface NewsletterResponse {
  success: boolean;
  error?: string;
}

export function Footer() {
  const location = useLocation();
  const isAboutPage = location.pathname.includes('about');
  const fetcher = useFetcher<NewsletterResponse>();

  const isSubmitting = fetcher.state === 'submitting';
  const isSuccess = fetcher.data?.success === true;
  const error = fetcher.data?.error;

  // Dynamic colors based on page
  const bgColor = isAboutPage ? 'bg-yellow' : 'bg-blue';
  const logoColor = isAboutPage ? 'text-blue' : 'text-yellow';

  return (
    <footer role="contentinfo" className={`${bgColor} overflow-hidden`}>
      {/* Newsletter Section */}
      <section className={bgColor}>
        <div className="px-4 md:px-8 pt-4 pb-8 md:py-8 md:grid md:grid-cols-12">
          {/* Heading - top left */}
          <h2 className="text-h2 md:text-h3 font-display md:col-span-6">
            Join the good morning
            <br />
            <em className="font-body">movement</em>
          </h2>

          {/* Form - bottom right */}
          <fetcher.Form
            method="post"
            action="/api/newsletter"
            className="flex flex-col gap-2 pt-12 md:pt-32 md:pl-0 md:col-span-6 w-full"
          >
            <Input
              type="email"
              name="email"
              placeholder="Email"
              required
              aria-label="Email address"
              disabled={isSuccess}
              icon={
                isSuccess ? <CheckCircleIcon className="w-4 h-4" /> : undefined
              }
            />
            {error && (
              <p className="text-small text-red" role="alert">
                {error}
              </p>
            )}
            <Button
              type="submit"
              variant="outline"
              disabled={isSubmitting || isSuccess}
            >
              {isSubmitting
                ? 'Subscribing...'
                : isSuccess
                  ? 'Thank you'
                  : 'Subscribe'}
            </Button>
          </fetcher.Form>
        </div>
        <div className="border-b border-text/20 mx-4 md:mx-8" />
      </section>

      {/* Footer Content */}
      <div className="p-4 md:p-8 md:relative">
        {/* Logo - desktop only at top */}
        <Link to="/" className="hidden md:block pb-12 md:pb-0">
          <LogoBig className={`${logoColor} w-full`} />
        </Link>

        {/* Navigation - Grid on mobile, absolute on desktop */}
        <div className="grid md:absolute md:top-8 md:left-8">
          {/* Main nav links */}
          <nav
            aria-label="Footer navigation"
            className="text-s2 pb-4 md:pb-24 font-display"
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
            className="text-label md:hidden font-display"
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
          className="hidden md:inline-flex gap-1 md:absolute md:top-8 md:left-1/2 md:gap-3"
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

          {/* Legal text - desktop only */}
          <div className="hidden md:block">
            {new Date().getFullYear()} Wakey. All rights reserved.
          </div>
        </div>

        {/* Logo - mobile only at bottom */}
        <Link to="/" className="block md:hidden -mt-4">
          <LogoBig className={`${logoColor} w-full`} />
        </Link>

        {/* Payment Icons - mobile only */}
        <div
          role="img"
          aria-label="Accepted payment methods: Visa, Mastercard, American Express, PayPal, iDEAL, Klarna"
          className="inline-flex gap-1 pt-8 md:hidden"
        >
          <VisaIcon className="h-6 w-auto" />
          <MastercardIcon className="h-6 w-auto" />
          <AmexIcon className="h-6 w-auto" />
          <PayPalIcon className="h-6 w-auto" />
          <IdealIcon className="h-6 w-auto" />
          <KlarnaIcon className="h-6 w-auto" />
        </div>

        {/* Legal text - mobile only */}
        <div className="block md:hidden pt-4 text-small font-display">
          {new Date().getFullYear()} Wakey. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
