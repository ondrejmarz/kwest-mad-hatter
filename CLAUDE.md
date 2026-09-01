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
- **Reservations are secret.** Reservation/group-invite actions are not written to the public
  `events` log during the day; reservation events only appear at evaluation.
- **Group tasks (supersedes "pairs").** A task has `minPlayers`/`maxPlayers` (1/1 solo, 2/2 pair,
  e.g. 2/4 range), counting the initiator. The initiator's reservation carries `invitees: PlayerId[]`
  - `responses: {playerId → accepted|declined}` (invitees toggle until evaluation, rules let them
    touch only their own key). At evaluation the members are the initiator + accepted invitees; the
    group competes only if it reaches `minPlayers` (else it expires), balance = poorest member.
- **Character ownership is multi-device:** `ownerUids: string[]`. **Every claim needs the 4-digit
  PIN** — even the first on an empty character — so nobody grabs the wrong one (updated from the
  original "first claim is free"). **One device owns one character:** claiming a new one releases
  the old (removes this uid via `releasesOwnership`); a character may still have several devices.
  A character can be claimed only after admin approval. (5-try/15-min lockout still deferred.)
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
1. Domain — pure game logic incl. `resolveRollover`, full unit tests. **Done** (100% domain coverage).
2. Data + rules — **done.** zod schemas + converters, repositories/subscriptions,
   `data/transactions/` (the only `runTransaction` sites), `firestore.rules` with adversarial
   rules + transaction-integration tests, seed. `pickTaskNow`/`purchaseReward`/`refundPurchase`
   and their rule extensions land with feature phases 6/7.
3. Auth & turnuses — **done.** anonymous auth + session (`features/session`: uid/turnus/role),
   turnus entry (picker, code entry via `joinTurnus`, `/t/{slug}`), remember/switch turnus,
   hidden admin long-press gesture, `RequireTurnus`/`RequireAdmin` guards. `npm run dev` runs
   Vite in `--mode emulator` (loads `.env.emulator`).
4. Players — **done.** main screen (own card, roster, pending), create player, admin approve/reject,
   claim character + PIN recovery, player detail. (The 5-try/15-min PIN lockout guard is deferred
   hardening — the PIN itself is rule-enforced.)
5. Catalog — **done.** TSV import (`data/importCatalog.ts`: parse + preview + apply, preserves
   usedByPlayerIds/active/manualCoins). Players/Tasks/Rewards share one `ui/ListCard` layout with
   a sort control + filters; admins edit any row in place via a pencil dialog and add tasks/rewards
   directly. Admin screen is just import + a task-category picker (`setCategories`).
6. Game loop — **done.** Task-click reservations + group invites (`ReservationProvider`,
   `TaskActionDialog`: reserve / invite others / cancel; app-wide `InviteBanner` with the tally),
   day evaluation (`EvaluationPanel`: mark completed → live `resolveRollover` preview → `runRollover`
   → full `undoRollover`), day-lock toggle. Post-phase feedback landed as Steps A–B: A = fixes/polish
   (reload route, persisted filters, unified padding, admin quick-coins, split day categories,
   PIN-first claim + one-character-per-device); B = group tasks (min/max players + invite counter).
   The group model/domain/rules are done + tested, but the live invite negotiation (banner counter,
   cross-device sync) is flaky in a PWA and is **parked until the native/installed phase**. Catalog
   editors put name/description/each tag in one `cs|en|de` field (keeps the create form usable on a
   phone); `Dialog` locks background scroll and scrolls internally. Still to do: same-day manual
   `pickTaskNow` (needs a player-writes-`activeTask` rule + rule tests).
7. Rewards — **done.** Hidden auction (min price = starting bid, players may bid higher, only the
   interest _count_ is public). Tap a reward → `RewardBidDialog` (bid ≥ price / raise / withdraw);
   one sealed bid per player (`rewardBids/{playerId}`, secret like a reservation, `useMyBid`).
   Resolved at day evaluation by pure `resolveAuctions` (folded into `resolveRollover`): rewards in
   catalog order, highest bid wins, ties → earlier bid; the winner must afford it on the post-settle
   balance (else it forfeits to the next, or goes unsold — **no escrow**). Winners pay via the coin
   updates + a `reward_won` event; the eval preview lists auctions; undo restores the bids from the
   snapshot. **Rule fix:** undo runs as admin over the client SDK, so `reservations`/`rewardBids`
   create+update now also allow `isAdmin` (the only admin writer is the snapshot restore) — this
   closes a latent reservation-undo gap too. Deferred: persistent "owned reward" (`Purchase` doc +
   "má odměnu" chip); punish-target selection/effects (handled off-app for now).
8. PWA + polish — **done.** `vite-plugin-pwa` (generateSW/Workbox, `registerType: 'autoUpdate'`,
   `injectRegister: 'auto'`) precaches the app shell + serves an installable manifest (standalone,
   portrait, `theme_color`/`background_color` #f8fafc). Icons rasterized from `public/favicon.svg`
   by `scripts/generate-icons.mjs` (uses `sharp`, a build-time devDep) → `public/pwa-192`, `pwa-512`,
   `pwa-maskable-512`, `apple-touch-icon` (glyph on white; maskable gets a bigger safe zone).
   `index.html` carries the apple-touch-icon + `apple-mobile-web-app-*` meta. **iOS input-zoom fix:**
   an unlayered `@media (pointer: coarse)` rule pins form controls to 16px `!important` so focusing a
   `text-sm` field no longer zooms the page. SW registration only runs on a real browser/HTTPS (the
   sandboxed in-app preview browser blocks it — build artifacts verified by curl instead).

## Remaining roadmap (steps E–K, confirmed with the user)

Ordered by risk/dependency. "RULES" marks a step that touches `firestore.rules`; per the
token-saving agreement those are validated on the deployed app (not the emulator) — I can't run
`test:rules` here, so rules steps carry more risk and the human tests them. No browser/emulator runs.

E. **Stability & quick UI fixes** — no rules.

- Fix: per-turnus listeners (`CatalogProvider`, players, reservations) can attach before the
  just-joined `members/{uid}` is visible to rules → permission-denied → Firestore never retries →
  tasks stay blank until you leave+return. Gate the subscriptions on confirmed membership
  (`role != null`) and/or retry a transient denial.
- Admin coin steps → `-50 / -10 / +10 / +50`.
- Shrink `LanguageSwitcher` ~20%, list toolbar (sort/filter/"+") ~10%; add vertical breathing room
  around the "Jen dostupné" checkbox.
- Redesign `PlayerDetailDialog` to actually show useful info (coins, active task, needsPick; for
  self also my reservation/bid). Player card + detail get a slot for the WON reward — layout now,
  data in step I.
  F. **Dark mode — done.** Dark palette swaps the CSS token values under
  `@media (prefers-color-scheme: dark)` in `index.css` (everything reads tokens, so it just works);
  per-scheme `theme-color` metas in `index.html`. Palette is a cool grey (not slate) per feedback.
  A themed `.select-caret` (custom chevron, coloured per theme) replaces the native `<select>` arrow,
  which stayed black/invisible on iOS in dark mode.
  G. **Same-day task pick `pickTaskNow` — done (RULES, deploy `firestore:rules`).** First-come via a
  create-only marker `taskClaims/{day}_{taskId}` (id encodes both; contention on that one doc picks
  the winner). Domain `pickTaskNow` (builds the solo `ActiveTask`, reuses `canPickTaskNow`); the
  transaction reads the marker → domain check → creates the marker + sets the player's activeTask +
  needsPick=false. Rule `picksTaskNow` lets a player write ONLY their own activeTask+needsPick and
  validates the stored coins against the catalog task (no self-inflation); `taskClaims` is
  create-only for players. UI: "Vzít teď" in `TaskActionDialog` when the player `needsPick` and the
  task is open today; `TasksScreen` derives `takenBy` from live players (no extra listener). Rules
  NOT emulator-verified this session (no-emulator agreement) — rules tests written for later.
  H. **Group tasks, reliable (#6b) — done (client-only; needs real-device testing).** No rules/model
  change — the parked bugs (invite not arriving, counter stuck, decline-after-accept) were the same
  subscription race fixed in step E's `withRetry`, so this was a UI rebuild on the now-reliable data.
  `InviteBanner` is now card-styled (matches `ListCard`) and moved into the scroll area; it shows an
  **initiator card** for the player's own group (confirmed tally + Cancel-for-everyone via
  `cancelReservation`) and an **invite card** per invite with a Confirm/Decline **toggle** (current
  answer highlighted, flip freely until evaluation, via `respondToInvite`). Real-device multi-user
  testing is the human's part. **Also fixed here (a J item):** iOS sticky-header bounce — the shell is
  now one viewport tall (`h-full`) with the header/nav as a static flex row and only `main`
  scrolling (`overflow-y-auto`), instead of a document-scroll + `position: sticky` header that rode
  the iOS rubber-band. **Post-feedback tweaks:** the banner cards now hide as soon as every invitee
  has answered (`tally.pending === 0`) — the negotiation is settled, and the accepted members compete
  at evaluation; the already-chosen Confirm/Decline button shows disabled. `theme-color` was moved to
  the surface-raised colour (`#ffffff` / `#24272c`) so the status bar blends into the header on
  Android + Safari (iOS _standalone_ can't take an arbitrary status-bar colour — platform limit).
  **New: "Odhlásit z admina"** at the bottom of the admin screen (`leaveAdmin` batch drops
  members+roles from admin→player; a new rule allows that self-downgrade with no code — RULES,
  redeploy `firestore:rules`).
  I. **Owned rewards + punishment targeting** — RULES.
- Auction winner gets a `Purchase` doc (member-readable) → "má odměnu" chip on every player's
  card/detail (fills the slot from E).
- `punish_someone` carries a target COUNT (reuse `Reward.minTargets`/`maxTargets`, already in the
  type) like a group size; when the buyer wins, they pick that many targets (targets do NOT
  confirm). Enforce `maxActivePunishesPerPlayer` (default 1): a character can be targeted by at
  most N `punish_someone` per day.
  J. **Turnus settings & creation** — RULES for creation.
- Admin settings form to edit their turnus params (`startingCoins`, `coinsPerDifficulty`,
  `penaltyRatio`, `noPickPenalty`, `allowNegativeBalance`, `maxActiveRewardsPerPlayer`,
  `maxActivePunishesPerPlayer`, `lockTime`). Rules already allow `isAdmin(t)` to update the turnus
  doc — this is just the UI.
- Gated turnus CREATION (not every user may create a group): needs a gating decision
  (global super-admin / creation code) + a rules change (`turnuses` create is currently `if false`).
  K. **Showcase + README + player rules page (LAST).** Representative seed, README refresh (still says
  "Phase 0"), final visual pass, optional 5-try/15-min PIN lockout. Then a simple trilingual
  "how to play" page — only once every mechanic above is frozen.
