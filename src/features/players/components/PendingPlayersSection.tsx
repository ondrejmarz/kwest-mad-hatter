import { useState } from 'react';

import { db } from '../../../data/firebase';
import { approvePlayer } from '../../../data/transactions/approvePlayer';
import { rejectPlayer } from '../../../data/transactions/rejectPlayer';
import type { Player } from '../../../domain/types';
import { useTranslation } from '../../../i18n/LocaleProvider';
import { Button } from '../../../ui/Button';

interface Meta {
  readonly actorUid: string;
  readonly actorLabel: string;
}

/** Pending characters, greyed out; admins approve or reject them (spec 9.1, 9.4). */
export function PendingPlayersSection({
  pending,
  isAdmin,
  turnusId,
  day,
  meta,
}: {
  pending: readonly Player[];
  isAdmin: boolean;
  turnusId: string;
  day: number;
  meta: Meta;
}) {
  const { t } = useTranslation();
  if (pending.length === 0) return null;
  return (
    <section className="mt-8">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-content-muted">
        {t('players.pending')}
      </h2>
      <ul className="flex flex-col gap-2">
        {pending.map((player) => (
          <li
            key={player.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-border bg-surface px-4 py-2"
          >
            <span className="truncate text-content-muted">{player.name}</span>
            {isAdmin && (
              <PendingActions playerId={player.id} turnusId={turnusId} day={day} meta={meta} />
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function PendingActions({
  playerId,
  turnusId,
  day,
  meta,
}: {
  playerId: string;
  turnusId: string;
  day: number;
  meta: Meta;
}) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const run = async (action: () => Promise<unknown>): Promise<void> => {
    setBusy(true);
    await action();
    setBusy(false);
  };
  return (
    <div className="flex shrink-0 gap-2">
      <Button
        variant="secondary"
        disabled={busy}
        onClick={() => void run(() => rejectPlayer(db, turnusId, playerId, day, meta))}
      >
        {t('players.reject')}
      </Button>
      <Button
        disabled={busy}
        onClick={() => void run(() => approvePlayer(db, turnusId, playerId, meta))}
      >
        {t('players.approve')}
      </Button>
    </div>
  );
}
