# CLAUDE.md

Working notes for AI coding assistants. Humans: see `README.md`.

## What this is

A mobile-first PWA for a game camp counselors play with kids. Players pick a daily
task, earn coins, and buy rewards (often punishments for others). One admin action
per evening ("day evaluation") settles the day and advances the round.

No backend, no Cloud Functions. Firestore (+ Anonymous Auth) is the single source of
truth; all authorization lives in Firestore Security Rules. Designed to fit the free tier.

## Commands

- `npm run dev` — Vite + Firestore/Auth emulators + seed, all at once.
- `npm run dev:cloud` — Vite against a real Firebase project (needs `.env`).
- `npm run verify` — lint + typecheck + unit tests + build. Run before proposing a commit.
- `npm run test:unit` / `npm run test:watch` — Vitest unit + component tests.
- `npm run test:rules` — Firestore rules tests inside the emulator (needs a JRE).
- `npm run test:coverage` — coverage (domain must reach 100% branch).
- `npm run lint` / `npm run format`.

Requires Node >= 20 and, for the emulator, a JDK (21).

## Architecture (enforced, not suggested)

Layers, each may import only from the ones below it. Enforced by
`eslint-plugin-boundaries` — CI fails on violations.

```
app        -> features, ui, data, platform, domain, i18n, lib
features   -> ui, data, platform, domain, i18n, lib
data       -> domain, platform, lib
ui         -> i18n, lib
platform   -> lib
i18n       -> domain (types only; may use React for its provider)
domain     -> lib            (NEVER react or firebase)
lib        -> (nothing)
```

Hard rules:

- **`domain/` is pure.** No `firebase`, no `react`, no `Date.now()`, `Math.random()`,
  or `crypto.randomUUID()`. Time and randomness are inputs. Enforced by
  `no-restricted-imports` AND `tests/architecture/domainPurity.test.ts`.
- **All game rules live in `domain/` as pure functions returning `Result<T, DomainError>`.**
  Expected failure is a value, not an exception. Exceptions mean programmer error.
- **`runTransaction` only in `data/transactions/`.** Each transaction: read -> call a
  pure domain function -> write. No `if` over game rules inside a transaction.
- **No Czech text outside `i18n/`.** Domain returns error codes; `i18n/` renders them.
- **Firestore is the state store.** No Redux/Zustand/TanStack Query for server data —
  `onSnapshot` is already reactive and cached.
- **Timestamps are always `serverTimestamp()`.** Name sorting always `Intl.Collator('cs')`.

## Conventions

- Named exports only (no `export default`, except tool config files).
- Barrel `index.ts` only at a feature's boundary.
- Branded id types (`PlayerId`, `TaskId`, ...). `readonly` in domain types. No `any`.
- One component per file; ~200 lines is a split signal.
- No `useEffect` for derived data — compute in render / `useMemo`.
- Conventional commits. **Propose commits; the human runs them.**
- Keep the repo looking hand-written. `CLAUDE.md` is fine; avoid other "AI wrote this" traces.

## Locked decisions (some extend/adjust the original spec)

- **React 19 + Vite 8 + TS 6 + Tailwind 3.** Spec said React 18; we use the current
  create-vite default. Tailwind stays v3 for the typed `tailwind.config.ts` tokens.
- **Trilingual UI (cs/en/de)** via a small typed dictionary layer + `LocaleProvider`.
  No i18next. Names still sort with `Intl.Collator('cs')`.
- **Coin formula:** `coinReward = 100 + difficulty * coinsPerDifficulty`;
  `coinPenalty = round(coinReward * penaltyRatio)`. Will be balanced later; keep it in one place.
- **Daily lock is admin-controlled**, not clock-driven (no backend, never trust the client
  clock). A boolean `dayLocked` on the turnus, flipped by an admin action and enforced by
  rules, freezes task selection AND reward purchases for the day; reservations stay editable
  until evaluation. `lockTime` is only a reminder.
- **Undo = full restore.** The rollback snapshot captures everything the evaluation mutated
  (coins, activeTask, needsPick, tasks' usedByPlayerIds, reservations, counts, categories,
  dayLocked, currentDay), stored in an admin-only doc, not on the hot turnus doc.
- **Reservations are secret.** Reservation/pair-invite actions are not written to the public
  `events` log during the day; reservation events only appear at evaluation.
- **Character ownership is multi-device:** `ownerUids: string[]`. First claim on an empty set
  needs no PIN; adding another device to a non-empty set needs the 4-digit PIN
  (5 tries, then a 15-minute lockout enforced server-side via a guard doc + `request.time`).
  A character can be claimed only after admin approval.
- **Purchase coins deduct atomically** in one transaction (instant balance, no overdraft),
  with rules linking the coin decrease to a matching `purchase` (preferred over deferred deduction).
- **Purchase limits:** `maxActiveRewardsPerPlayer` counts all of a buyer's active purchases
  (rewards and punishments). `maxActivePunishesPerPlayer` caps how many times a player is a
  target of others' `punish_someone` (does not apply to `punish_all`).
- **`punish_all`** targets everyone except the buyer (no explicit `targetIds`).
- **Rules can't run queries** — a `uid -> playerId` index doc backs "my player" checks.
- **Events** store `type` + structured `payload` (+ `actorLabel`); the message is rendered in the UI.

## Implementation phases

One phase per session; finish it (incl. tests) green before the next. Domain (phase 1)
comes before data/rules (phase 2) on purpose.

0. Skeleton — **done.**
1. Domain — pure game logic incl. `resolveRollover`, full unit tests. **Next.**
2. Data + rules — zod schemas, converters, repositories, transactions, `firestore.rules`, rules tests, seed.
3. Auth & turnuses. 4. Players. 5. Catalog (TSV import). 6. Game loop. 7. Rewards. 8. PWA + polish. 9. Showcase (README, ADRs, deploy, previews).
