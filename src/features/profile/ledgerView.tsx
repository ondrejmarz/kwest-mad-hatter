import { type ReactNode } from 'react';

import type { LedgerEntryDoc } from '../../data/schemas/ledger';
import { deriveOpeningBalance, derivePlayerStats } from '../../domain/ledger';
import { useTranslation } from '../../i18n/LocaleProvider';
import { localize } from '../../i18n/localize';
import { type Locale, type TranslationKey, type TranslationParams } from '../../i18n/translate';
import { CoinAmount } from '../../ui/CoinAmount';

/**
 * The stats + coin-history views for a player's own profile (spec 9.1). The 2×2 grid summarises the
 * turnus; the history reads chronologically from a derived opening balance (`coins − Σ delta`, never
 * stored) down to the live balance, so it always reconciles. Shared by the profile's inline preview
 * and its full-view dialog. With no character the entries are empty and the stats read zero.
 */
export function LedgerStats({ entries }: { entries: readonly LedgerEntryDoc[] }) {
  const { t } = useTranslation();
  const stats = derivePlayerStats(entries);
  return (
    <div className="grid grid-cols-2 gap-2">
      <StatTile label={t('ledger.tasksCompleted')}>{stats.tasksCompleted}</StatTile>
      <StatTile label={t('ledger.rewardsWon')}>{stats.rewardsWon}</StatTile>
      <StatTile label={t('ledger.coinsEarned')}>
        <CoinAmount amount={stats.coinsEarned} />
      </StatTile>
      <StatTile label={t('ledger.coinsSpent')}>
        <CoinAmount amount={stats.coinsSpent} />
      </StatTile>
    </div>
  );
}

/**
 * The coin history. `limit` shows only the most recent N entries (the profile-card preview);
 * omitting it shows every entry with the opening-balance row on top (the full-view dialog). Running
 * balances are always computed over the whole ledger, so a truncated preview still reads true.
 */
export function LedgerHistory({
  entries,
  coins,
  limit,
  showOpening = false,
}: {
  entries: readonly LedgerEntryDoc[];
  coins: number;
  limit?: number;
  showOpening?: boolean;
}) {
  const { t, locale } = useTranslation();
  const opening = deriveOpeningBalance(coins, entries);
  // Chronological: oldest first so the running balance builds up to the live coin count.
  const ordered = [...entries].sort((a, b) => a.createdAt - b.createdAt || a.seq - b.seq);
  let running = opening;
  const allRows = ordered.map((entry) => {
    running += entry.delta;
    return { entry, balance: running };
  });
  const rows = limit !== undefined ? allRows.slice(-limit) : allRows;
  const truncated = limit !== undefined && allRows.length > rows.length;

  if (allRows.length === 0) {
    return <p className="py-2 text-sm text-content-muted">{t('ledger.empty')}</p>;
  }

  return (
    <ul className="flex flex-col divide-y divide-border">
      {showOpening && (
        <li className="flex items-center justify-between gap-2 py-2">
          <span className="text-content-muted">{t('ledger.openingBalance')}</span>
          <CoinAmount amount={opening} />
        </li>
      )}
      {truncated && <li className="py-1 text-center text-xs text-content-muted">…</li>}
      {rows.map(({ entry, balance }) => {
        const { primary, secondary } = describeEntry(entry, t, locale);
        return (
          <li key={entry.id} className="flex items-center justify-between gap-3 py-2">
            <span className="min-w-0">
              <span className="block truncate text-content">{primary}</span>
              {secondary !== undefined && (
                <span className="block truncate text-xs text-content-muted">{secondary}</span>
              )}
            </span>
            <span className="flex shrink-0 flex-col items-end">
              <CoinAmount amount={entry.delta} signed />
              <span className="text-xs tabular-nums text-content-muted">{balance}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** One entry's primary label (what happened) and an optional secondary line (its day or note). */
function describeEntry(
  entry: LedgerEntryDoc,
  t: (key: TranslationKey, params?: TranslationParams) => string,
  locale: Locale,
): { primary: string; secondary?: string } {
  const day = t('ledger.day', { day: entry.day });
  switch (entry.kind) {
    case 'task': {
      const name = localize(entry.taskName, locale);
      if (entry.outcome === 'completed')
        return { primary: t('ledger.taskCompleted', { name }), secondary: day };
      if (entry.outcome === 'failed')
        return { primary: t('ledger.taskFailed', { name }), secondary: day };
      return { primary: t('ledger.taskNoPick'), secondary: day };
    }
    case 'reward': {
      const name = localize(entry.rewardName, locale);
      const primary =
        entry.form === 'reward'
          ? t('ledger.rewardBought', { name })
          : t('ledger.punishBought', { name });
      return { primary, secondary: day };
    }
    case 'adjust':
      return { primary: t('ledger.adjust'), secondary: entry.note.trim() || day };
  }
}

function StatTile({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <p className="text-xs font-medium text-content-muted">{label}</p>
      <div className="mt-1 text-lg font-semibold tabular-nums text-content">{children}</div>
    </div>
  );
}
