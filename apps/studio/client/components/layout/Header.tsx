import {NavLink} from 'react-router-dom';
import {useAuth} from '../../hooks/useAuth';
import {cn} from '../../lib/utils';
import {useState, useRef, useEffect} from 'react';

const directLinks = [
  {name: 'Email', href: '/email/templates'},
  {name: 'SEO', href: '/seo/opportunities'},
];

const dropdownNavigation: {
  name: string;
  items: {name: string; href: string}[];
}[] = [];

function NavDropdown({
  section,
}: {
  section: {name: string; items: {name: string; href: string}[]};
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive = section.items.some((item) =>
    window.location.pathname.startsWith(
      item.href.split('/').slice(0, 2).join('/'),
    ),
  );

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'text-foreground'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        {section.name}
        <svg
          className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-40 rounded-md border border-border bg-card py-1 shadow-lg">
          {section.items.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              onClick={() => setIsOpen(false)}
              className={({isActive}) =>
                cn(
                  'block px-4 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )
              }
            >
              {item.name}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

export function Header() {
  const {user, logout} = useAuth();

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6">
      <div className="flex items-center gap-6">
        <span className="text-base font-semibold text-foreground">
          Wakey Studio
        </span>
        <nav className="flex items-center">
          {directLinks.map((link) => (
            <NavLink
              key={link.href}
              to={link.href}
              className={({isActive}) =>
                cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )
              }
            >
              {link.name}
            </NavLink>
          ))}
          {dropdownNavigation.map((section) => (
            <NavDropdown key={section.name} section={section} />
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">{user?.email}</span>
        <button
          onClick={() => logout.mutate()}
          className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
