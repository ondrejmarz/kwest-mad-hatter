import type { Player } from '../../domain/types';
import { useTranslation } from '../../i18n/LocaleProvider';
import { localize } from '../../i18n/localize';
import { CoinAmount } from '../../ui/CoinAmount';
import { FactCard, PlayerFactCards, selectPlayerFacts } from '../players';
import {
  useCatalogRewards,
  useMyBids,
  useMyInvites,
  useMyReservation,
  usePurchases,
  useTurnus,
} from '../session';

/**
 * The inner cards of the profile's own player card (spec 9.1): the public task/reward/target cards
 * (shared with the roster via `PlayerFactCards`), then the SECRET tomorrow's reservation and reward
 * bids — readable only on this device, so they live here and never in the roster or a public view.
 * Rendered as a fragment of `FactCard`s so they stack inside the player card like the roster's do.
 */
export function ProfilePlans({ player }: { player: Player }) {
  const { t, locale } = useTranslation();
  const reservationState = useMyReservation();
  const invitesState = useMyInvites();
  const bidsState = useMyBids();
  const rewardsState = useCatalogRewards();
  const purchasesState = usePurchases();
  const turnusState = useTurnus();
  const currentDay =
    turnusState.status === 'ready' && turnusState.data ? turnusState.data.currentDay : null;

  const { won, targetedBy } =
    purchasesState.status === 'ready'
      ? selectPlayerFacts(purchasesState.data, player.id, currentDay)
      : { won: [], targetedBy: [] };

  const ownReservation = reservationState.status === 'ready' ? reservationState.data : null;
  // A pair/group the player accepted counts as their reservation too, so both members see it.
  const acceptedInvite =
    invitesState.status === 'ready'
      ? (invitesState.data.find((invite) => invite.responses[player.id] === 'accepted') ?? null)
      : null;
  const myReservation = ownReservation ?? acceptedInvite;
  const myBids = bidsState.status === 'ready' ? bidsState.data : [];
  const rewardName = (rewardId: string): string | null => {
    if (rewardsState.status !== 'ready') return null;
    const reward = rewardsState.data.find((candidate) => candidate.id === rewardId);
    return reward !== undefined ? localize(reward.name, locale) : null;
  };

  return (
    <>
      <PlayerFactCards player={player} won={won} targetedBy={targetedBy} />

      <FactCard title={t('players.myReservation')}>
        <p className="text-content">
          {myReservation !== null
            ? localize(myReservation.taskName, locale)
            : t('players.noReservation')}
        </p>
      </FactCard>

      {myBids.length > 0 && (
        <FactCard title={t('players.myBid')}>
          <div className="flex flex-col gap-1">
            {myBids.map((bid) => {
              const name = rewardName(bid.rewardId);
              return (
                <p key={bid.rewardId} className="flex items-center gap-2 text-content">
                  {name !== null && <span>{name}</span>}
                  <CoinAmount amount={bid.amount} />
                </p>
              );
            })}
          </div>
        </FactCard>
      )}
    </>
  );
}
