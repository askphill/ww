import {Link} from 'react-router';
import type {Notification} from '~/content/notifications';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose?: () => void;
  notifications: Notification[];
  readIds: Set<string>;
  onMarkAsRead: (id: string) => void;
}

/**
 * Dropdown panel that displays notifications
 * Uses CSS grid for smooth height animation (matching NavigationDropdown pattern)
 * Each notification links to the relevant page and marks itself as read on click
 */
export function NotificationDropdown({
  isOpen,
  onClose,
  notifications,
  readIds,
  onMarkAsRead,
}: NotificationDropdownProps) {
  const handleNotificationClick = (id: string) => {
    onMarkAsRead(id);
    onClose?.();
  };

  return (
    <div
      id="notification-dropdown"
      className="grid transition-[grid-template-rows] duration-300"
      style={{
        gridTemplateRows: isOpen ? '1fr' : '0fr',
        transitionTimingFunction: 'var(--ease-out-expo)',
      }}
    >
      <div className="overflow-hidden">
        <div
          className={`
            w-full flex justify-end md:px-6
            transition-all duration-300
            ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}
          `}
          style={{transitionTimingFunction: 'var(--ease-out-expo)'}}
          aria-label="Notifications"
          aria-hidden={!isOpen}
        >
          <div className="w-full mx-2 md:mx-0 md:max-w-[320px] bg-white md:rounded-card-s px-4 py-4 md:px-5 md:py-5">
            {notifications.length === 0 ? (
              <p className="text-body-small text-black/60 text-center py-4">
                No notifications
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {notifications.map((notification) => {
                  const isRead = readIds.has(notification.id);
                  return (
                    <li key={notification.id}>
                      <Link
                        to={notification.href}
                        onClick={() => handleNotificationClick(notification.id)}
                        tabIndex={isOpen ? 0 : -1}
                        className={`
                          block p-3 rounded-lg transition-colors
                          hover:bg-black/5
                          ${isRead ? 'opacity-60' : ''}
                        `}
                      >
                        <div className="flex items-start gap-3">
                          {/* Type indicator */}
                          <span
                            className={`
                              flex-shrink-0 mt-0.5 text-xs font-display uppercase tracking-wide px-2 py-0.5 rounded
                              ${notification.type === 'product' ? 'bg-softorange/20 text-black' : 'bg-skyblue/20 text-black'}
                            `}
                          >
                            {notification.type === 'product'
                              ? 'New Product'
                              : 'New Post'}
                          </span>
                          {/* Unread indicator dot */}
                          {!isRead && (
                            <span className="flex-shrink-0 w-2 h-2 mt-1.5 rounded-full bg-softorange" />
                          )}
                        </div>
                        <h3 className="text-label font-display mt-2 leading-tight">
                          {notification.title}
                        </h3>
                        <p className="text-body-small text-black/70 mt-1 leading-snug">
                          {notification.description}
                        </p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
