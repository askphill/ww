import type {
  CartApiQueryFragment,
  HeaderQuery,
} from 'storefrontapi.generated';
import {Aside} from '~/components/Aside';
import {Footer} from '~/components/Footer';
import {Header} from '~/components/Header';
import {AnnouncementBar} from '~/components/AnnouncementBar';

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
  return (
    <Aside.Provider>
      {header && <Header cart={cart} />}
      {/* Announcement bar - fixed below header, lower z-index than nav dropdown */}
      <div className="fixed z-40 w-full top-[76px] md:top-[84px] pointer-events-none">
        <div className="pointer-events-auto">
          <AnnouncementBar message="Free shipping on orders over €50" />
        </div>
      </div>
      <main>{children}</main>
      <Footer />
    </Aside.Provider>
  );
}
