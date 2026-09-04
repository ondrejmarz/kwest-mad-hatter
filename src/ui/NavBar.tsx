import { NavLink } from 'react-router-dom';

import { useTranslation } from '../i18n/LocaleProvider';
import type { TranslationKey } from '../i18n/translate';
import { cx } from '../lib/cx';

interface NavItem {
  to: string;
  labelKey: TranslationKey;
}

/**
 * The ordered tab set — Rules is swapped for Admin on admin devices (spec 9). Exported so the shell
 * can map a swipe to the visually adjacent tab without duplicating the order.
 */
export function navItems(showAdmin: boolean): readonly NavItem[] {
  return [
    { to: '/players', labelKey: 'nav.players' },
    { to: '/tasks', labelKey: 'nav.tasks' },
    { to: '/rewards', labelKey: 'nav.rewards' },
    showAdmin ? { to: '/admin', labelKey: 'nav.admin' } : { to: '/rules', labelKey: 'nav.rules' },
  ];
}

export function NavBar({ showAdmin }: { showAdmin: boolean }) {
  const { t } = useTranslation();
  const items = navItems(showAdmin);
  return (
    <nav className="flex items-stretch border-b border-border bg-surface-raised">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            cx(
              'tap-target flex flex-1 items-center justify-center px-2 py-3 text-sm font-medium transition-colors',
              isActive ? 'border-b-2 border-accent text-accent' : 'text-content-muted',
            )
          }
        >
          {t(item.labelKey)}
        </NavLink>
      ))}
    </nav>
  );
}
