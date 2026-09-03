import { type ReactNode } from 'react';

import type { PurchaseDoc } from '../../../data/schemas/purchase';
import type { PlayerId } from '../../../domain/ids';
import type { Player } from '../../../domain/types';
import { useTranslation } from '../../../i18n/LocaleProvider';
import { localize } from '../../../i18n/localize';
import { SectionLabel } from '../../../ui/SectionLabel';

/**
 * The rewards a player has won and the punishments they are a target of, split out of the public
 * purchases (not refunded). Both a roster row and the detail dialog read the same split, so the
 * two views always agree. A won reward is any purchase the player made — a plain reward or a
 * punishment they bought; being a target only comes from someone else's `punish_someone`.
 */
export function selectPlayerFacts(
  purchases: readonly PurchaseDoc[],
  playerId: PlayerId,
): { won: PurchaseDoc[]; targetedBy: PurchaseDoc[] } {
  const won: PurchaseDoc[] = [];
  const targetedBy: PurchaseDoc[] = [];
  for (const purchase of purchases) {
    if (purchase.refunded) continue;
    if (purchase.buyerId === playerId) won.push(purchase);
    if (purchase.form === 'punish_someone' && purchase.targetIds.includes(playerId)) {
      targetedBy.push(purchase);
    }
  }
  return { won, targetedBy };
}

/**
 * The fact sections below a player's card bands (spec 9.1), shared by the roster row and the
 * detail dialog so a row and its opened detail line up. The current task, the won rewards and the
 * punishments aimed at the player each read like a task: a name and its description. A punishment
 * also spells out its target ("Terč je hráč X"); being a target only ever shows the reward's name.
 */
export function PlayerFacts({
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
    <div className="mt-3 flex flex-col gap-3 border-t border-border pt-3 text-sm">
      {active !== null && (
        <Section label={t('players.activeTaskLabel')}>
          <p className="text-content">{localize(active.name, locale)}</p>
          {localize(active.description, locale) !== '' && (
            <p className="text-content-muted">{localize(active.description, locale)}</p>
          )}
          {active.partnerNames.length > 0 && (
            <p className="text-content-muted">{active.partnerNames.join(', ')}</p>
          )}
        </Section>
      )}

      {won.length > 0 && (
        <Section label={t('players.rewardLabel')}>
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
        </Section>
      )}

      {targetedBy.length > 0 && (
        <Section label={t('players.targetedByLabel')}>
          <ul className="flex flex-col gap-0.5">
            {targetedBy.map((purchase) => (
              <li key={purchase.id} className="text-content">
                {localize(purchase.rewardName, locale)}
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <SectionLabel>{label}</SectionLabel>
      <div className="mt-1">{children}</div>
    </div>
  );
}
