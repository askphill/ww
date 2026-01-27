import type {CartApiQueryFragment, HeaderQuery} from 'storefrontapi.generated';
import {useMatches} from 'react-router';
import {Aside} from '~/components/Aside';
import {Footer} from '~/components/Footer';
import {Header} from '~/components/Header';

interface PageLayoutProps {
  cart: Promise<CartApiQueryFragment | null>;
  header: HeaderQuery;
  isLoggedIn: Promise<boolean>;
  children?: React.ReactNode;
}

interface RouteHandle {
  hideFooter?: boolean;
  hideHeader?: boolean;
}

export function PageLayout({
  cart,
  children = null,
  header,
  isLoggedIn,
}: PageLayoutProps) {
  const matches = useMatches();
  const handle = matches.find(
    (m) =>
      (m.handle as RouteHandle)?.hideFooter ||
      (m.handle as RouteHandle)?.hideHeader,
  )?.handle as RouteHandle | undefined;

  const hideFooter = handle?.hideFooter ?? false;
  const hideHeader = handle?.hideHeader ?? false;

  return (
    <Aside.Provider>
      {header && !hideHeader && <Header cart={cart} />}
      <main id="main-content">{children}</main>
      {!hideFooter && <Footer />}
    </Aside.Provider>
  );
}
