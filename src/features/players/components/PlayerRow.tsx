import { memo } from 'react';

import type { Player } from '../../../domain/types';
import { useTranslation } from '../../../i18n/LocaleProvider';
import { cx } from '../../../lib/cx';
import { Chip } from '../../../ui/Chip';
import { CoinAmount } from '../../../ui/CoinAmount';

/** One player in the list (spec 9.1): name, coins, active task, and a needs-pick chip. */
export const PlayerRow = memo(function PlayerRow({
  player,
  mine,
  onClick,
}: {
  player: Player;
  mine: boolean;
  onClick: () => void;
}) {
  const { t } = useTranslation();
  const partner =
    player.activeTask?.isPair && player.activeTask.partnerName
      ? ` · ${player.activeTask.partnerName}`
      : '';
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'tap-target flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left',
        mine ? 'border-accent bg-accent/5' : 'border-border bg-surface-raised',
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium text-content">{player.name}</span>
          {mine && <Chip tone="accent">{t('players.you')}</Chip>}
        </div>
        {player.activeTask ? (
          <p className="mt-0.5 truncate text-sm text-content-muted">
            {player.activeTask.name}
            {partner}
          </p>
        ) : player.needsPick ? (
          <span className="mt-1 inline-block">
            <Chip tone="warning">{t('players.needsPick')}</Chip>
          </span>
        ) : null}
      </div>
      <CoinAmount amount={player.coins} />
    </button>
  );
});
