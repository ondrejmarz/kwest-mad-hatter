import type { PurchaseDoc } from '../../../data/schemas/purchase';
import type { Player } from '../../../domain/types';
import { useTranslation } from '../../../i18n/LocaleProvider';
import { Chip } from '../../../ui/Chip';

/**
 * The status chips above a player's card (spec 9.1), shared by the roster row and the detail dialog
 * so the two views can never drift apart again. They state, in one fixed order and with one fixed
 * set of tones: this is you (accent), whether the player has today's task (success) or still needs
 * to pick one (warning), whether they hold tomorrow's reservation (success) or not (warning), and —
 * only when true — that they won a reward (success) or are a punishment target (danger).
 */
export function PlayerChips({
  player,
  mine,
  won,
  targetedBy,
  hasReservation,
}: {
  player: Player;
  mine: boolean;
  won: readonly PurchaseDoc[];
  targetedBy: readonly PurchaseDoc[];
  hasReservation: boolean;
}) {
  const { t } = useTranslation();
  const hasTask = player.activeTask !== null;
  return (
    <>
      {mine && <Chip tone="accent">{t('players.you')}</Chip>}
      <Chip tone={hasTask ? 'success' : 'warning'}>
        {hasTask ? t('players.hasTask') : t('players.needsPick')}
      </Chip>
      <Chip tone={hasReservation ? 'success' : 'warning'}>
        {hasReservation ? t('players.hasReservation') : t('players.noReservationChip')}
      </Chip>
      {won.length > 0 && <Chip tone="success">{t('players.hasReward')}</Chip>}
      {targetedBy.length > 0 && <Chip tone="danger">{t('players.isTargeted')}</Chip>}
    </>
  );
}
