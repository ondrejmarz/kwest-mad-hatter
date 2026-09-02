import type { Day } from './ids';
import type { LocalizedText, RewardForm } from './types';

/**
 * A player's coin history (spec 9.1). Every coin-moving event is one signed ledger entry — a task
 * settlement, a won reward, or an admin's manual adjustment. The opening balance is deliberately
 * NOT stored: it is derived as `coins − Σ delta` (`deriveOpeningBalance`), so the history always
 * reconciles to the live balance and a player who predates the ledger needs no migration (their
 * earlier activity folds into that single opening figure). Entries are pure data; the store adds an
 * `id`, a server `createdAt` and an intra-transaction `seq` for ordering.
 */

/** The outcome of a settled task, carried on a task entry so the row can label it. */
export type LedgerTaskOutcome = 'completed' | 'failed' | 'no_task';

interface LedgerEntryShared {
  readonly day: Day;
  /** Signed: earned is positive, spent or penalised is negative. */
  readonly delta: number;
}

/** Day settlement: completing a task pays out, failing or not picking one costs. */
export interface TaskLedgerEntry extends LedgerEntryShared {
  readonly kind: 'task';
  readonly taskName: LocalizedText;
  readonly outcome: LedgerTaskOutcome;
}

/** A reward won in the evening auction — the buyer pays the winning bid. */
export interface RewardLedgerEntry extends LedgerEntryShared {
  readonly kind: 'reward';
  readonly rewardName: LocalizedText;
  readonly form: RewardForm;
}

/** A manual coin change by an organizer, with the note they gave as its reason. */
export interface AdjustLedgerEntry extends LedgerEntryShared {
  readonly kind: 'adjust';
  readonly note: string;
}

export type LedgerEntry = TaskLedgerEntry | RewardLedgerEntry | AdjustLedgerEntry;

/** The 2×2 summary shown above the history on a player's own card (spec 9.1). */
export interface PlayerStats {
  readonly tasksCompleted: number;
  readonly rewardsWon: number;
  readonly coinsEarned: number;
  readonly coinsSpent: number;
}

/**
 * The balance the history opens from: the live balance minus every recorded delta. For a player
 * approved after the ledger shipped this equals their starting coins; for one who predates it,
 * their pre-ledger activity is absorbed into this opening figure so the column still reconciles.
 */
export function deriveOpeningBalance(coins: number, entries: readonly LedgerEntry[]): number {
  return coins - entries.reduce((sum, entry) => sum + entry.delta, 0);
}

/**
 * The four headline stats, derived from the ledger so they never drift from the history. "Earned"
 * counts coins paid out by completed tasks; "spent" counts coins paid for won rewards. Penalties and
 * manual adjustments stay visible in the history but are not folded into these two totals.
 */
export function derivePlayerStats(entries: readonly LedgerEntry[]): PlayerStats {
  let tasksCompleted = 0;
  let rewardsWon = 0;
  let coinsEarned = 0;
  let coinsSpent = 0;
  for (const entry of entries) {
    if (entry.kind === 'task' && entry.outcome === 'completed') {
      tasksCompleted += 1;
      coinsEarned += entry.delta;
    } else if (entry.kind === 'reward') {
      rewardsWon += 1;
      coinsSpent += -entry.delta;
    }
  }
  return { tasksCompleted, rewardsWon, coinsEarned, coinsSpent };
}
