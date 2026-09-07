import { useTranslation } from '../i18n/LocaleProvider';
import type { TranslationKey } from '../i18n/translate';

import { TabBar } from './TabBar';

interface NavItem {
  to: string;
  labelKey: TranslationKey;
}

/**
 * The ordered tab set — the fourth tab is the profile, labelled `Profil+` on admin devices (spec 9;
 * admin actions fold into that profile). Exported so the shell can map a swipe to the visually
 * adjacent tab without duplicating the order.
 */
export function navItems(showAdmin: boolean): readonly NavItem[] {
  return [
    { to: '/players', labelKey: 'nav.players' },
    { to: '/tasks', labelKey: 'nav.tasks' },
    { to: '/rewards', labelKey: 'nav.rewards' },
    { to: '/profile', labelKey: showAdmin ? 'nav.profilePlus' : 'nav.profile' },
  ];
}

export function NavBar({ showAdmin }: { showAdmin: boolean }) {
  const { t } = useTranslation();
  const items = navItems(showAdmin).map((item) => ({ to: item.to, label: t(item.labelKey) }));
  return <TabBar items={items} />;
}
