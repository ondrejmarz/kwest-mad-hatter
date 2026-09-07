import { lazy, Suspense, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { db } from '../../data/firebase';
import { subscribePlayerLedger } from '../../data/repositories/ledger';
import type { LedgerEntryDoc } from '../../data/schemas/ledger';
import type { Subscription } from '../../data/subscriptions';
import { useTranslation } from '../../i18n/LocaleProvider';
import { Button } from '../../ui/Button';
import { CardLayout } from '../../ui/CardLayout';
import { CoinAmount } from '../../ui/CoinAmount';
import { Spinner } from '../../ui/Spinner';
import { PlayerChips, selectPlayerFacts } from '../players';
import { useMyPlayer, usePurchases, useReservationCounts, useSession, useTurnus } from '../session';

import { ComingSoonDialog } from './ComingSoonDialog';
import { LedgerHistoryDialog } from './LedgerHistoryDialog';
import { LedgerHistory, LedgerStats } from './ledgerView';
import { ProfileCard } from './ProfileCard';
import { ProfilePlans } from './ProfilePlans';

// The admin block (`Profil+`) is lazily loaded so only admin devices pull the admin chunk. The
// dynamic import retries a few times — React caches a lazy rejection forever, so a transient
// network/service-worker blip would otherwise wedge the section until a full reload.
const ProfileAdminSection = lazy(async () => {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, 300 * attempt));
    try {
      return { default: (await import('../admin')).ProfileAdminSection };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
});

/**
 * The player's own profile (spec 9.1) — one player card (identity + the plan cards, same shape as a
 * roster row plus the secret reservation/bids), then stats and a coin-history preview that opens the
 * full log. Available even without a character (a nudge to pick one in Hráči, zeroed stats, empty
 * history). When an admin turns on public profiles a per-section "Zobrazit víc" appears (comparison
 * of everyone); admin actions fold in as `Profil+`.
 */
export function ProfileScreen() {
  const { t } = useTranslation();
  const { turnus, role } = useSession();
  const navigate = useNavigate();
  const myPlayer = useMyPlayer();
  const turnusState = useTurnus();
  const purchasesState = usePurchases();
  const countsState = useReservationCounts();
  const [ledger, setLedger] = useState<Subscription<readonly LedgerEntryDoc[]>>({
    status: 'loading',
  });
  const [historyOpen, setHistoryOpen] = useState(false);
  const [comingOpen, setComingOpen] = useState(false);

  const playerId = myPlayer?.id ?? null;
  const turnusId = turnus?.id ?? null;
  // The ledger is private to the owner (rules), so only subscribe when we hold a character.
  useEffect(() => {
    if (playerId === null || turnusId === null) {
      setLedger({ status: 'ready', data: [], fromCache: false });
      return;
    }
    return subscribePlayerLedger(db, turnusId, playerId, setLedger);
  }, [playerId, turnusId]);

  const entries = ledger.status === 'ready' ? ledger.data : [];
  const coins = myPlayer?.coins ?? 0;
  const publicProfiles =
    turnusState.status === 'ready' && turnusState.data !== null
      ? turnusState.data.publicProfiles
      : false;
  const { won, targetedBy } =
    myPlayer !== null && purchasesState.status === 'ready'
      ? selectPlayerFacts(purchasesState.data, myPlayer.id)
      : { won: [], targetedBy: [] };
  const hasReservation =
    myPlayer !== null && countsState.status === 'ready' && countsState.data !== null
      ? countsState.data.players[myPlayer.id] === true
      : false;

  // A plain text link (no `tap-target`, which is 44px tall) so a section doesn't grow when it appears.
  const showMore = (onClick: () => void) => (
    <button type="button" onClick={onClick} className="shrink-0 text-sm font-medium text-accent">
      {t('profile.showMore')}
    </button>
  );

  return (
    <section className="flex flex-col gap-3">
      <section className="rounded-2xl border border-border bg-surface-raised p-4">
        {myPlayer !== null ? (
          <>
            <CardLayout
              title={myPlayer.name}
              topRight={<CoinAmount amount={myPlayer.coins} />}
              chips={
                <PlayerChips
                  player={myPlayer}
                  mine
                  won={won}
                  targetedBy={targetedBy}
                  hasReservation={hasReservation}
                />
              }
            />
            <div className="mt-3 flex flex-col gap-2">
              <ProfilePlans player={myPlayer} />
            </div>
          </>
        ) : (
          <>
            <p className="font-semibold text-content">{t('profile.noCharacter')}</p>
            <p className="mt-1 text-sm text-content-muted">{t('profile.noCharacterHint')}</p>
            <Button variant="secondary" className="mt-3" onClick={() => navigate('/players')}>
              {t('profile.goToPlayers')}
            </Button>
          </>
        )}
      </section>

      <ProfileCard
        title={t('ledger.statsTitle')}
        action={publicProfiles ? showMore(() => setComingOpen(true)) : undefined}
      >
        <LedgerStats entries={entries} />
      </ProfileCard>

      <ProfileCard
        title={t('ledger.historyTitle')}
        action={entries.length > 0 ? showMore(() => setHistoryOpen(true)) : undefined}
      >
        <LedgerHistory entries={entries} coins={coins} limit={4} />
      </ProfileCard>

      {role === 'admin' && (
        <Suspense
          fallback={
            <div className="flex justify-center py-6">
              <Spinner />
            </div>
          }
        >
          <ProfileAdminSection />
        </Suspense>
      )}

      {historyOpen && (
        <LedgerHistoryDialog
          entries={entries}
          coins={coins}
          onClose={() => setHistoryOpen(false)}
        />
      )}
      {comingOpen && <ComingSoonDialog onClose={() => setComingOpen(false)} />}
    </section>
  );
}
