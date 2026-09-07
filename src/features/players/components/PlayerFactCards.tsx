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
 * A player's public facts (spec 9.1) as separate cards — the active task, won rewards, and being a
 * punishment target — one card each, single column (they carry long descriptions). Shared by the
 * roster row and the profile so both read the same. Reservations and bids are secret, so they never
 * appear here — only on the owner's own profile (as its own `FactCard`s).
 */
export function PlayerFactCards({
  player,
  won,
  targetedBy,
}: {
  player: Player;
  won: readonly PurchaseDoc[];
  targetedBy: readonly PurchaseDoc[];
}) {
  const { t, locale } = useTranslation();
  const active = player.activeTask;
  if (active === null && won.length === 0 && targetedBy.length === 0) return null;

  return (
    <>
      {active !== null && (
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

      {won.length > 0 && (
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

      {targetedBy.length > 0 && (
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
