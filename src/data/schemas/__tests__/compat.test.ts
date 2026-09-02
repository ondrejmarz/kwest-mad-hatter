import { expectTypeOf, it } from 'vitest';
import type { z } from 'zod';

import type { LedgerEntry } from '../../../domain/ledger';
import type {
  ActiveTask,
  Player,
  Purchase,
  Reservation,
  Reward,
  RewardBid,
  Task,
  TurnusSettings,
} from '../../../domain/types';
import { rewardSchema, taskSchema } from '../catalog';
import { ledgerEntrySchema } from '../ledger';
import { activeTaskSchema, playerSchema } from '../player';
import { purchaseSchema } from '../purchase';
import { reservationSchema } from '../reservation';
import { rewardBidSchema } from '../rewardBid';
import { turnusSchema } from '../turnus';

/**
 * The domain types are hand-written (they must not depend on zod), so these type-level
 * assertions keep each schema and its domain type in sync (spec 15.6) — a drift in either
 * shape fails `npm run typecheck`.
 *
 * `exactOptionalPropertyTypes` makes zod's `?: T | undefined` optionals non-identical to
 * the domain's `?: T`. For exact-shape schemas we therefore assert that every domain value
 * is a valid parse output (`toExtend`) plus exact key parity. For documents that are a
 * deliberate superset of the pure type (turnus, task, purchase carry extra storage-only
 * fields) we assert the parsed shape provides everything the domain type needs.
 */
it('schemas stay compatible with the domain types', () => {
  expectTypeOf<Player>().toExtend<z.infer<typeof playerSchema>>();
  expectTypeOf<keyof z.infer<typeof playerSchema>>().toEqualTypeOf<keyof Player>();

  expectTypeOf<ActiveTask>().toExtend<z.infer<typeof activeTaskSchema>>();
  expectTypeOf<keyof z.infer<typeof activeTaskSchema>>().toEqualTypeOf<keyof ActiveTask>();

  expectTypeOf<Reward>().toExtend<z.infer<typeof rewardSchema>>();
  expectTypeOf<keyof z.infer<typeof rewardSchema>>().toEqualTypeOf<keyof Reward>();

  expectTypeOf<Reservation>().toExtend<z.infer<typeof reservationSchema>>();
  expectTypeOf<keyof z.infer<typeof reservationSchema>>().toEqualTypeOf<keyof Reservation>();

  expectTypeOf<RewardBid>().toExtend<z.infer<typeof rewardBidSchema>>();
  expectTypeOf<keyof z.infer<typeof rewardBidSchema>>().toEqualTypeOf<keyof RewardBid>();

  expectTypeOf<z.infer<typeof taskSchema>>().toExtend<Task>();
  expectTypeOf<z.infer<typeof purchaseSchema>>().toExtend<Purchase>();
  expectTypeOf<z.infer<typeof turnusSchema>>().toExtend<TurnusSettings>();
  expectTypeOf<z.infer<typeof ledgerEntrySchema>>().toExtend<LedgerEntry>();
});
