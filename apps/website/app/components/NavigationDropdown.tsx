import {Link} from 'react-router';

interface NavSection {
  label: string;
  items: {title: string; href: string}[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Shop',
    items: [
      {title: 'Wakey Deodorant', href: '/products/deodorant'},
      {title: 'Natural Deodorant', href: '/products/natural-deodorant'},
    ],
  },
  {
    label: 'Learn',
    items: [
      {title: 'About us', href: '/about'},
      {title: 'FAQ', href: '/faq'},
      {title: 'Blog', href: '/blog'},
    ],
  },
];

interface NavigationDropdownProps {
  isOpen: boolean;
  onClose?: () => void;
}

/**
 * Dropdown navigation panel that slides down from under the header
 * Contains Shop and Learn sections with navigation links
 * Uses CSS grid for smooth height animation (push effect)
 */
export function NavigationDropdown({isOpen, onClose}: NavigationDropdownProps) {
  return (
    <div
      className="grid transition-[grid-template-rows] duration-300"
      style={{
        gridTemplateRows: isOpen ? '1fr' : '0fr',
        transitionTimingFunction: 'var(--ease-out-expo)',
      }}
    >
      <div className="overflow-hidden">
        <nav
          className={`
            w-full flex justify-center px-4 md:px-6
            transition-all duration-300
            ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}
          `}
          style={{transitionTimingFunction: 'var(--ease-out-expo)'}}
          aria-label="Main navigation"
          aria-hidden={!isOpen}
        >
          <div className="w-full max-w-[600px] bg-sand rounded-card px-4 py-6 md:px-6 md:py-8">
            <div className="flex flex-col gap-6 md:gap-8">
              {NAV_SECTIONS.map((section) => (
                <div key={section.label}>
                  <h2 className="text-body-small font-display uppercase tracking-wide text-black/60 mb-3 md:mb-4">
                    {section.label}
                  </h2>
                  <ul className="flex flex-col gap-2 md:gap-3">
                    {section.items.map((item) => (
                      <li key={item.href}>
                        <Link
                          to={item.href}
                          className="text-h3 font-display text-black hover:text-black/70 transition-colors"
                          onClick={onClose}
                          tabIndex={isOpen ? 0 : -1}
                        >
                          {item.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
}
