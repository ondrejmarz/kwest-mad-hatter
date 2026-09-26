import { type ReactNode } from 'react';

import type { PurchaseDoc } from '../../../data/schemas/purchase';
import type { Player } from '../../../domain/types';
import { useTranslation } from '../../../i18n/LocaleProvider';
import { localize } from '../../../i18n/localize';
import { SectionLabel } from '../../../ui/SectionLabel';

/**
 * One nested "fact" card — a labelled box (task, reward, reservation…) that sits inside a player's
 * card. Shared so the roster and the profile use the same shape; its `rounded-lg` matches the chips
 * above it, and `bg-surface` sits one shade below the card it nests in (which is `bg-surface-raised`).
 */
export function FactCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <SectionLabel>{title}</SectionLabel>
      <div className="mt-1 text-sm">{children}</div>
    </div>
  );
}

/**
 * Which inner cards a player's card shows (spec 9.1). The roster can narrow the too-tall list to one
 * concern: `tasks` shows only the active task, `rewards` shows only reward-derived cards (won rewards
 * and incoming punishments — a target is the effect of someone's reward), `all` shows everything. The
 * profile always passes `all`.
 */
export type FactFilter = 'all' | 'tasks' | 'rewards';

/** Whether any fact card would render for this player under the given filter — the roster row uses
 * it to decide whether to open the nested block at all (so an empty block adds no stray margin). */
export function hasVisibleFacts(
  player: Player,
  won: readonly PurchaseDoc[],
  targetedBy: readonly PurchaseDoc[],
  filter: FactFilter,
): boolean {
  const showTask = filter !== 'rewards' && player.activeTask !== null;
  const showRewards = filter !== 'tasks' && (won.length > 0 || targetedBy.length > 0);
  return showTask || showRewards;
}

/**
 * A player's public facts (spec 9.1) as separate cards — the active task, won rewards, and being a
 * punishment target — one card each, single column (they carry long descriptions). Shared by the
 * roster row and the profile so both read the same. Reservations and bids are secret, so they never
 * appear here — only on the owner's own profile (as its own `FactCard`s). `filter` narrows which
 * cards show (the roster's per-tab filter); the profile leaves it at `all`.
 */
export function PlayerFactCards({
  player,
  won,
  targetedBy,
  filter = 'all',
}: {
  player: Player;
  won: readonly PurchaseDoc[];
  targetedBy: readonly PurchaseDoc[];
  filter?: FactFilter;
}) {
  const { t, locale } = useTranslation();
  const active = player.activeTask;
  const showTask = filter !== 'rewards';
  const showRewards = filter !== 'tasks';
  if (!hasVisibleFacts(player, won, targetedBy, filter)) return null;

  return (
    <>
      {showTask && active !== null && (
        <FactCard title={t('players.activeTaskLabel')}>
          <p className="text-content">{localize(active.name, locale)}</p>
          {localize(active.description, locale) !== '' && (
            <p className="text-content-muted">{localize(active.description, locale)}</p>
          )}
          {active.partnerNames.length > 0 && (
            <p className="text-content-muted">
              {active.partnerNames.length === 1
                ? t('players.partnerWith', { name: active.partnerNames.join(', ') })
                : t('players.groupWith', { names: active.partnerNames.join(', ') })}
            </p>
          )}
        </FactCard>
      )}

      {showRewards && won.length > 0 && (
        <FactCard title={t('players.rewardLabel')}>
          <ul className="flex flex-col gap-1.5">
            {won.map((purchase) => (
              <li key={purchase.id}>
                <p className="text-content">{localize(purchase.rewardName, locale)}</p>
                {localize(purchase.description, locale) !== '' && (
                  <p className="text-content-muted">{localize(purchase.description, locale)}</p>
                )}
                {purchase.form === 'punish_someone' && purchase.targetNames.length > 0 && (
                  <p className="text-content-muted">
                    {t('players.targetIs', { names: purchase.targetNames.join(', ') })}
                  </p>
                )}
                {purchase.form === 'punish_all' && (
                  <p className="text-content-muted">{t('players.targetAll')}</p>
                )}
              </li>
            ))}
          </ul>
        </FactCard>
      )}

      {showRewards && targetedBy.length > 0 && (
        <FactCard title={t('players.targetedByLabel')}>
          <ul className="flex flex-col gap-0.5">
            {targetedBy.map((purchase) => (
              <li key={purchase.id} className="text-content">
                {localize(purchase.rewardName, locale)}
              </li>
            ))}
          </ul>
        </FactCard>
      )}
    </>
  );
}
