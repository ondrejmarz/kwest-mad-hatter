import { NavLink } from 'react-router-dom';

import { useTranslation } from '../i18n/LocaleProvider';
import type { TranslationKey } from '../i18n/translate';
import { cx } from '../lib/cx';

interface NavItem {
  to: string;
  labelKey: TranslationKey;
}

/** Rules is swapped for Admin on admin devices (spec 9). */
export function NavBar({ showAdmin }: { showAdmin: boolean }) {
  const { t } = useTranslation();
  const items: readonly NavItem[] = [
    { to: '/players', labelKey: 'nav.players' },
    { to: '/tasks', labelKey: 'nav.tasks' },
    { to: '/rewards', labelKey: 'nav.rewards' },
    showAdmin ? { to: '/admin', labelKey: 'nav.admin' } : { to: '/rules', labelKey: 'nav.rules' },
  ];
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
