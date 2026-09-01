import { err, ok, type Result } from '../lib/result';

import type { DomainError } from './errors';
import type { PlayerId } from './ids';
import type { Player, Reward, TurnusSettings } from './types';

export interface PurchaseTarget {
  readonly id: PlayerId;
  readonly name: string;
}

export interface PurchaseInput {
  readonly buyer: Player;
  readonly reward: Reward;
  readonly turnus: TurnusSettings;
  /** The buyer's active purchases this round — all forms count (spec 8, C). */
  readonly buyerActivePurchases: number;
  /** How many active `punish_someone` already target each player (spec 8, C). */
  readonly punishTargetCounts: ReadonlyMap<PlayerId, number>;
  /** Name of the player holding an `exclusivePerDay` reward today, else null. */
  readonly exclusiveTakenBy: string | null;
  /** Chosen targets — only read for `punish_someone`. */
  readonly targets: readonly PurchaseTarget[];
}

export interface PurchaseDecision {
  readonly price: number;
  readonly buyerCoinsAfter: number;
  readonly targetIds: readonly PlayerId[];
  readonly targetNames: readonly string[];
}

/** Instant, non-overdrawable purchase (spec 8). Returns the coin delta to apply. */
export function validatePurchase(input: PurchaseInput): Result<PurchaseDecision, DomainError> {
  const { buyer, reward, turnus } = input;

  if (!reward.active) return err({ code: 'REWARD_INACTIVE' });
  if (turnus.dayLocked) return err({ code: 'DAY_LOCKED' });
  if (buyer.coins < reward.price) {
    return err({ code: 'INSUFFICIENT_COINS', needed: reward.price, available: buyer.coins });
  }
  if (input.buyerActivePurchases >= turnus.maxActiveRewardsPerPlayer) {
    return err({ code: 'TOO_MANY_ACTIVE_REWARDS', max: turnus.maxActiveRewardsPerPlayer });
  }
  if (reward.exclusivePerDay && input.exclusiveTakenBy !== null) {
    return err({ code: 'REWARD_EXCLUSIVE_TAKEN', byPlayerName: input.exclusiveTakenBy });
  }

  let targetIds: readonly PlayerId[] = [];
  let targetNames: readonly string[] = [];
  if (reward.form === 'punish_someone') {
    const count = input.targets.length;
    if (count < reward.minTargets || count > reward.maxTargets) {
      return err({
        code: 'TARGET_COUNT_OUT_OF_RANGE',
        min: reward.minTargets,
        max: reward.maxTargets,
      });
    }
    if (input.targets.some((target) => target.id === buyer.id)) {
      return err({ code: 'CANNOT_TARGET_SELF' });
    }
    for (const target of input.targets) {
      const active = input.punishTargetCounts.get(target.id) ?? 0;
      if (active >= turnus.maxActivePunishesPerPlayer) {
        return err({
          code: 'TARGET_AT_PUNISH_LIMIT',
          playerName: target.name,
          max: turnus.maxActivePunishesPerPlayer,
        });
      }
    }
    targetIds = input.targets.map((target) => target.id);
    targetNames = input.targets.map((target) => target.name);
  }

  return ok({
    price: reward.price,
    buyerCoinsAfter: buyer.coins - reward.price,
    targetIds,
    targetNames,
  });
}
