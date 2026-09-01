import { NavLink } from 'react-router-dom';

import { useTranslation } from '../i18n/LocaleProvider';
import type { TranslationKey } from '../i18n/translate';
import { cx } from '../lib/cx';

interface NavItem {
  to: string;
  labelKey: TranslationKey;
}

const ITEMS: readonly NavItem[] = [
  { to: '/players', labelKey: 'nav.players' },
  { to: '/tasks', labelKey: 'nav.tasks' },
  { to: '/rewards', labelKey: 'nav.rewards' },
  { to: '/rules', labelKey: 'nav.rules' },
];

export function NavBar() {
  const { t } = useTranslation();
  return (
    <nav className="flex items-stretch border-b border-border bg-surface-raised">
      {ITEMS.map((item) => (
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
