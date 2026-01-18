import {NavLink} from 'react-router-dom';
import {cn} from '../../lib/utils';

const navigation = [
  {
    name: 'SEO',
    items: [
      {name: 'Tracking', href: '/seo/tracking'},
      {name: 'Opportunities', href: '/seo/opportunities'},
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
          Wakey Growth
        </span>
      </div>
      <nav className="flex-1 overflow-y-auto p-4">
        {navigation.map((section) => (
          <div key={section.name} className="mb-6">
            <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
