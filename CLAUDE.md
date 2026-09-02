# CLAUDE.md

Working notes for AI coding assistants. Humans: see `README.md`.

## What this is

A mobile-first PWA for a game played by a group of people spending a few days together (a
trip, a camp, a retreat). Players join a shared **turnus** (the code's word for one group /
session), pick a daily task, earn coins, and buy rewards — often small punishments for the
others. One admin action per evening ("day evaluation") settles the day and advances the round.

No backend, no Cloud Functions. Firestore (+ Anonymous Auth) is the single source of truth;
all authorization lives in Firestore Security Rules. Designed to fit the free tier.

The app is feature-complete and in real use — there is no active build phase. Remaining ideas
live in "Not yet built" below and as GitHub issues; the durable design lives in this file.

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

## Locked decisions (game rules & data model)

- **React 19 + Vite 8 + TS 6 + Tailwind 3.** Tailwind stays v3 for the typed
  `tailwind.config.ts` tokens.
- **Trilingual UI (cs/en/de)** via a small typed dictionary layer + `LocaleProvider` (no
  i18next). Names still sort with `Intl.Collator('cs')`.
- **Coin formula:** one fixed rule, `coinReward = 80 + 20 * difficulty` (100 easiest … 200
  hardest) in `deriveReward` — no per-turnus coefficient, overridable per task via
  `manualCoins`. Failing a task costs a flat, turnus-wide `failPenalty` (same for everyone,
  independent of the task); not picking one at all costs `noPickPenalty`. Both applied at
  settlement. Kept in one place so it can be rebalanced.
- **Daily lock is admin-controlled**, not clock-driven (no backend, never trust the client
  clock). A boolean `dayLocked` on the turnus, flipped by an admin action and enforced by
  rules, freezes task selection AND reward purchases for the day; reservations stay editable
  until evaluation.
- **Reservations and bids are secret.** During the day only the public interest count is
  visible; who won a contested task or reward is revealed at evaluation.
- **Group tasks (supersedes "pairs").** A task has `minPlayers`/`maxPlayers` (1/1 solo, 2/2
  pair, e.g. 2/4 range), counting the initiator. The initiator's reservation carries
  `invitees: PlayerId[]` + `responses: {playerId → accepted|declined}` (invitees toggle until
  evaluation, rules let them touch only their own key). At evaluation the members are the
  initiator + accepted invitees; the group competes only if it reaches `minPlayers` (else it
  expires), balance = poorest member.
- **Task types are synthetic categories.** The three types (solo/pair/group, derived from the
  size interval by `lib/group.taskType`) double as reserved category keys
  `@type:{solo,pair,group}` (`TYPE_KEYS`). The admin's open-day set
  (`currentDay`/`nextDayCategories`) and the list's one category filter carry these keys
  alongside real tags; eligibility (`isCategoryOpen`) matches a task if any real tag OR its
  type key is open (a UNION — opening "pairs" opens every pair). No new field, no rules change.
- **Same-day pick (`pickTaskNow`).** First-come via a create-only marker
  `taskClaims/{day}_{taskId}` (contention on that one doc picks the winner). Domain builds the
  solo `ActiveTask`; the transaction reads the marker → domain check → creates the marker +
  sets the player's `activeTask` + `needsPick=false`. The rule lets a player write ONLY their
  own `activeTask`+`needsPick` and validates the stored coins against the catalog task (no
  self-inflation); `taskClaims` is create-only for players. UI: "Vzít teď" in
  `TaskActionDialog` when the player `needsPick` and the task is open today.
- **Rewards are a sealed-bid auction.** Min price = starting bid, players may bid higher, only
  the interest _count_ is public. One sealed bid per player (`rewardBids/{playerId}`, secret
  like a reservation). Resolved at evaluation by pure `resolveAuctions` (folded into
  `resolveRollover`): rewards in catalog order, highest bid wins, ties → earlier bid; the
  winner must afford it on the post-settle balance (else it forfeits to the next, or goes
  unsold — **no escrow**). Winners get a `Purchase` doc (id `${day}_${rewardId}`).
- **Punishment targeting.** A `punish_someone` reward carries a `minTargets`/`maxTargets`
  range; targets are picked at BID time (`RewardBid.targetIds`). A live public per-day tally
  `punishTargetCounts/{day}` guards bidding — a target is locked only while
  `maxActivePunishesPerPlayer` current bids aim at it, freed the moment one changes (counts
  only, no bidder → secret-safe); `createBid` refuses a newly-added target already at the cap.
  The real, capped assignment happens at evaluation via pure `assignPunishTargets`
  (highest-bid-first; over-cap picks dropped and the shortfall auto-filled to `minTargets` from
  the least-targeted free players, tie-broken by a `seed`-shuffle of the day so it rotates
  fairly — still deterministic). Final targets land on `Purchase.targetIds`/`targetNames`.
  `punish_all` targets everyone except the buyer (no explicit `targetIds`), not subject to the
  punish cap. Effect is record-only (counsellors enact off-app).
- **Purchase limits:** `maxActiveRewardsPerPlayer` counts all of a buyer's active purchases
  (rewards and punishments). `maxActivePunishesPerPlayer` caps how many times a player is a
  target of others' `punish_someone`.
- **Character ownership is multi-device:** `ownerUids: string[]`. **Every claim needs the
  4-digit PIN** — even the first on an empty character — so nobody grabs the wrong one. **One
  device owns one character:** claiming a new one releases the old (removes this uid via
  `releasesOwnership`); a character may still have several devices. A character can be claimed
  only after admin approval. (5-try/15-min lockout still deferred.)
- **Purchase coins deduct atomically** in one transaction (instant balance, no overdraft),
  with rules linking the coin decrease to a matching `purchase`.
- **Turnus settings** are admin-editable (`startingCoins`, `failPenalty`, `noPickPenalty`,
  `allowNegativeBalance`, `maxActiveRewardsPerPlayer`, `maxActivePunishesPerPlayer`) via
  `updateTurnusSettings` (plain `updateDoc`; rules already allow `isAdmin` to update the turnus
  doc). Turnus **creation** is still gated off (`turnuses` create is `if false`) pending a
  decision on who may create groups — see "Not yet built".
- **Admin self-downgrade (`leaveAdmin`).** An admin can drop back to player (a batch removes
  their `members`+`roles` admin→player), allowed by a dedicated self-downgrade rule.
- **Rules can't run queries** — a `uid -> playerId` index doc backs "my player" checks.
- **No audit-event log.** An earlier write-only `turnuses/{t}/events` collection (nothing read
  it, it flooded the DB) was removed entirely — paths, schema, repo, rules match, and the
  domain event generation. `adjustCoins`' note now has no store — `PlayerEditDialog` still
  requires it, but it is discarded until the per-player ledger lands (see "Not yet built").
  Coin history will be a fresh per-player structure built over `Settlement` data.

## Platform & build notes

- **PWA:** `vite-plugin-pwa` (generateSW/Workbox, `registerType: 'autoUpdate'`) precaches the
  app shell + serves an installable manifest (standalone, portrait). Icons are a designed brand
  mark committed directly under `public/` (no build-time rasterization) — re-export from
  IconKitchen and drop the files in to update. SW registration only runs on a real
  browser/HTTPS; the sandboxed in-app preview browser blocks it.
- **Install prompt / add to home screen:** a dismissible `InstallBanner` on the entry screen
  (`EntryLayout`), hidden once running standalone (`display-mode: standalone` + iOS
  `navigator.standalone`; iPadOS-as-Mac disambiguated by touch points). Chrome/Chromium's
  `beforeinstallprompt` is captured at module load by a React-free store
  (`platform/install/beforeInstallPrompt`), so it survives firing before React mounts; Chrome no
  longer auto-prompts, so the Install button replays that captured event to raise the real OS
  dialog. iOS has no such event — there the button opens `InstallInstructionsDialog`, a
  platform-aware how-to (Safari Share → Add to Home Screen, with a warning when opened outside
  Safari, and a browser-menu fallback for Android/desktop). The empty `theme_color` (below) makes
  vite-plugin-pwa warn the app "will not be able to be installed" — a false alarm: Chrome ignores
  an invalid `theme_color`, and the manifest still carries every field install actually needs
  (name, `start_url`, `standalone`, 192/512 + maskable icons, SW with a fetch handler).
- **Android status bar:** manifest `theme_color: ''` (empty) so an installed WebAPK falls back
  to the **system-themed** bar. A WebAPK freezes `theme_color` at install time and ignores
  runtime `<meta theme-color>` changes, so a fixed colour can't be darkened for dark mode;
  changing this needs a reinstall / WebAPK refetch. (`display: standalone` can't do a
  transparent status bar on Android — that's an iOS-only feature.)
- **iOS input-zoom fix:** a `@media (pointer: coarse)` rule pins form controls to 16px
  `!important` so focusing a `text-sm` field no longer zooms the page.
- **Dark mode** swaps the CSS token values under `@media (prefers-color-scheme: dark)` in
  `index.css` (everything reads tokens, so it just works); palette is a cool grey. A themed
  `.select-caret` replaces the native `<select>` arrow (which stayed invisible on iOS dark).
- **App version** is a build timestamp: `vite.config.ts` computes `YYYY.MM.DD.HHmm` at
  config-eval and injects it as the `__APP_VERSION__` global (declared in
  `src/vite-env.d.ts`), shown on the entry screen's top bar — a quick "which build am I
  running" check.
- **Layout:** the shell is one viewport tall (`h-full`) with a static header/nav flex row and
  only `main` scrolling (`overflow-y-auto`) — avoids the iOS rubber-band on a sticky header.
- **Admin route** is hardened: the lazy admin chunk import retries a few times (a rejected
  `React.lazy` is cached forever) and sits under a recoverable `AppErrorBoundary`.
- **Subscription race:** per-turnus listeners can attach before the just-joined `members/{uid}`
  is visible to rules → permission-denied, which Firestore never retries. Subscriptions are
  gated on confirmed membership and wrapped in `withRetry` for transient denials.

## Not yet built (backlog)

Planned rework, confirmed with the user, not yet scheduled. The rules/manual page (item 3)
stays LAST, after every mechanic is frozen.

1. **Coin history + per-player ledger.** A per-player ledger written next to each player
   (start 0, +coins for which task, −coins for which reward, manual edits with their note) plus
   totals (tasks completed, rewards won, earned/spent). The rollover already computes the
   per-player deltas (`Settlement`/preview); the settlement/purchase/adjust transactions would
   each append an entry, and `adjustCoins` regains a stored `note` (with a matching rule).
2. **Gated turnus creation.** Only the owner may create a group; mechanism undecided
   (super-admin flag, creation code, or hand-editing the DB). Needs the `turnuses` create rule
   (currently `if false`). Decide the gate before building.
3. **Rules tab + full manuals (LAST).** Short in-app rules with a `?` per section opening the
   full detail; a complete player rules page and organizer manual. Only once mechanics freeze.
4. **Secret achievements.** Hidden achievements earned by in-app actions, with a turnus setting
   "achievements are public" (default OFF). Obscure name + emoji + configurable coin award.
   Design the concrete list (what is technically detectable) before implementing.
