import { NavLink } from 'react-router-dom';

import { cx } from '../lib/cx';

export interface TabItem {
  readonly to: string;
  readonly label: string;
}

/**
 * The tab strip shared by the in-app shell (NavBar) and the pre-turnus entry shell
 * (EntryTabsLayout). Presentational only — it takes already-resolved `{ to, label }` items so it
 * stays free of feature specifics. Every link is `end` (exact match) so an index tab like `/enter`
 * isn't left highlighted while a sibling like `/enter/rules` is active.
 */
export function TabBar({ items }: { items: readonly TabItem[] }) {
  return (
    <nav className="flex items-stretch border-b border-border bg-surface-raised">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end
          className={({ isActive }) =>
            cx(
              'tap-target flex flex-1 items-center justify-center px-2 py-3 text-sm font-medium transition-colors',
              isActive ? 'border-b-2 border-accent text-accent' : 'text-content-muted',
            )
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
