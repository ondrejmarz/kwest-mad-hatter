import type { DocumentData } from 'firebase/firestore';
import { z } from 'zod';

import type { TurnusSettings } from '../../domain/types';

import { parseDoc, zDay, zTurnusId } from './shared';

/**
 * The full turnus document (spec 4) — a superset of the pure-logic `TurnusSettings`.
 * Codes live in `private/config` (rules only); the day is frozen for evaluation by the
 * `dayLocked` boolean an admin flips (there is no clock-based lock).
 */
export const turnusSchema = z.object({
  id: zTurnusId,
  name: z.string(),
  slug: z.string(),
  currentDay: zDay,
  archived: z.boolean(),
  startingCoins: z.number(),
  failPenalty: z.number(),
  allowNegativeBalance: z.boolean(),
  maxActiveRewardsPerPlayer: z.number(),
  maxActivePunishesPerPlayer: z.number(),
  noPickPenalty: z.number(),
  dayLocked: z.boolean(),
  // When on, a turnus reveals every player's stats/history to the group (spec, "Not yet built" #1).
  // Defaulted so turnus docs written before this field still parse (they read as private).
  publicProfiles: z.boolean().default(false),
  // Whether a player holding a task this round may swap it (spec 7). Defaulted on, the behaviour
  // before the setting existed, so older turnus docs keep working.
  allowTaskSwitch: z.boolean().default(true),
  nextDayCategories: z.array(z.string()).readonly(),
  currentDayCategories: z.array(z.string()).readonly(),
});

export type Turnus = z.infer<typeof turnusSchema>;

/** The subset the pure game logic consumes (spec 6). */
export function toTurnusSettings(t: Turnus): TurnusSettings {
  return {
    currentDay: t.currentDay,
    startingCoins: t.startingCoins,
    failPenalty: t.failPenalty,
    allowNegativeBalance: t.allowNegativeBalance,
    maxActiveRewardsPerPlayer: t.maxActiveRewardsPerPlayer,
    maxActivePunishesPerPlayer: t.maxActivePunishesPerPlayer,
    noPickPenalty: t.noPickPenalty,
    nextDayCategories: t.nextDayCategories,
    currentDayCategories: t.currentDayCategories,
    dayLocked: t.dayLocked,
    allowTaskSwitch: t.allowTaskSwitch,
  };
}

export const parseTurnus = (id: string, data: DocumentData): Turnus | null =>
  parseDoc(turnusSchema, 'turnus', id, data);

/** The owner's own role doc — the only membership doc a client may read (spec 4). */
export const roleSchema = z.object({ role: z.enum(['player', 'admin']) });
export type Role = z.infer<typeof roleSchema>['role'];

export const parseRole = (id: string, data: DocumentData): Role | null =>
  parseDoc(roleSchema, 'role', id, data)?.role ?? null;
