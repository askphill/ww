import {NavLink} from 'react-router-dom';
import {cn} from '../../lib/utils';

function MailIcon({className}: {className?: string}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

const navigation = [
  {
    name: 'Email',
    icon: MailIcon,
    items: [
      {name: 'Subscribers', href: '/email/subscribers'},
      {name: 'Templates', href: '/email/templates'},
      {name: 'Campaigns', href: '/email/campaigns'},
    ],
  },
  {
    name: 'SEO',
    items: [
      {name: 'Keyword Ranking', href: '/seo/tracking'},
      {name: 'Google Search Console', href: '/seo/opportunities'},
    ],
  },
  {
    name: 'Marketing',
    items: [
      {name: 'Klaviyo', href: '/klaviyo'},
      {name: 'Meta Ads', href: '/meta'},
    ],
  },
];

export function Sidebar() {
  return (
    <aside className="flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex h-16 items-center border-b border-sidebar-border px-6">
        <span className="text-xl font-bold text-sidebar-foreground">
          Wakey Studio
        </span>
      </div>
      <nav className="flex-1 overflow-y-auto p-4">
        {navigation.map((section) => (
          <div key={section.name} className="mb-6">
            <h3 className="mb-2 flex items-center gap-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {section.icon && <section.icon className="h-4 w-4" />}
              {section.name}
            </h3>
            <ul className="space-y-1">
              {section.items.map((item) => (
                <li key={item.href}>
                  <NavLink
                    to={item.href}
                    className={({isActive}) =>
                      cn(
                        'block rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent/50',
                      )
                    }
                  >
                    {item.name}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
