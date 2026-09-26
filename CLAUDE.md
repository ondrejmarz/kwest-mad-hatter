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
- `npm run rules:wiki` — renders the English rules to `wiki/Rules.md` (clone the GitHub wiki into
  the gitignored `wiki/`, then commit and push there).

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
- **Manual E2E scenario:** `docs/testing/test-scenario.md` walks the whole game on three devices
  with exact expected balances (test catalog in `docs/testing/*.tsv`). New or changed user-facing
  behaviour extends it in the step where players meet it, keeping the balance table in sync.
- **Rules text:** the Pravidla tab reads `src/i18n/rules/` (shared structure + cs/en/de text). A
  change to game behaviour updates the rules in all three languages in the same commit and bumps
  `RULES_CHECKED_AT` (its doc comment has the `git log` that lists what changed since). Plain
  text only: no bold, no dashes as punctuation (a test enforces it). The wiki page is generated,
  never edited by hand.
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
- **The UI says "kolo" (round), the code says day.** An evaluation need not happen once a day, so
  every user-facing string speaks of the current / next round (cs `probíhající` / `příští kolo`,
  en current / next round, de laufende / nächste Runde) — never today / tomorrow. Identifiers
  (`currentDay`, `dayLocked`, `nextDayCategories`, `todayPick`, …) keep "day" to spare a data
  migration.
- **Daily lock is admin-controlled**, not clock-driven (no backend, never trust the client
  clock). A boolean `dayLocked` on the turnus, flipped by an admin action and enforced by
  rules, freezes every task and reward action for the day until evaluation: task selection,
  reward bids, and reservation changes alike — reserving, answering an invite, cancelling a
  reservation, and placing, changing or withdrawing a bid are all blocked. The UI hides the
  frozen actions rather than offering ones the rules would reject. The lock lives exactly as long as the evaluation dialog
  (`EvaluationDialog` locks on mount, unlocks on unmount), so if the evaluating device dies with
  it open the round would stay locked forever: Profil+ therefore offers an explicit
  "Odemknout kolo" whenever the round is locked and no evaluation dialog is open on this device.
- **Reservations and bids are secret.** During the day only the public interest count is
  visible; who won a contested task or reward is revealed at evaluation.
- **Task sizes: solo, pair, group.** A task has `minPlayers`/`maxPlayers`, counting everyone:
  1/1 is solo, 2/2 a pair, anything else (2–4, 3–4, …) a group (`lib/group.taskType`). A **pair**
  is reserved by its initiator with one invitee: `invitees: PlayerId[]` plus
  `responses: {playerId → accepted|declined}`. The invitee answers once in the UI (accepted leaves only "cancel for
  both", declined is final); rules let them touch only their own key. At evaluation the pair
  competes only if the partner accepted (else it expires), with the poorer member's balance and
  the initiator's reservation time. A **group** is reserved individually, with no invitees
  (`createReservation` drops them): `buildClaims` pools the reservers per task at evaluation;
  below `minPlayers` the pool expires for everyone, above `maxPlayers` the poorest fill the seats
  (ties: earlier reservation), and the survivors become one claim. Groups can't be taken for the
  current round.
- **A pair is done together or not at all.** Once the partner has accepted, either member
  cancelling the pair's reservation, reserving something else, or accepting another pair cancels
  it for BOTH (the reservation doc is deleted; the rules let the accepted partner delete the
  initiator's doc; `dropReservation` also clears both "has a reservation" flags). In the current
  round, a member switching away from a pair task (`pickTaskNow`, or joining another pair via
  `acceptPairPick`) clears the partner's `activeTask` too: `ActiveTask.partnerIds` (defaulted `[]`
  for old docs) names the partner, domain `partnerToRelease` decides, and the
  `releasesAbandonedPair` rule allows clearing a task only when its single partner no longer holds
  it after the write. Groups of 3+ are not cascaded.
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
  self-inflation); `taskClaims` is create-only for players. UI: "Vzít na probíhající kolo" in
  `TaskActionDialog` when the task is open in the current round. A pending same-round pair invite
  already locks its task, so the list's `takenBy` (`features/tasks/taskList.takenInRoundBy`) counts
  it as taken for everyone but its two members. Declining marks the claim `declined` instead of
  deleting it, so the initiator sees the answer too; a declined claim no longer holds the task
  (`schemas/taskClaim.holdsTask`), and the next claim simply overwrites it (a rules update branch
  that acts as a create). A claim whose holders have all moved on may be deleted by anyone
  (`claimAbandoned` rule; `acceptPairPick` releases the members' old claims), so a left task never
  stays blocked. Both invite kinds render through one `PairInviteCard`; an answered card stays
  until its ✕, and the dismissal is remembered per device (`features/tasks/useDismissedInvites`). Task-action failures map to their own message
  (`features/tasks/taskErrorKey`), never a blanket "offline".
- **Rewards are a sealed-bid auction.** Min price = starting bid, players may bid higher, only
  the interest _count_ is public. One sealed bid per (player, reward), keyed
  `rewardBids/{playerId}_{rewardId}` (secret like a reservation), so a player may bid on several
  rewards a day — up to `maxActiveRewardsPerPlayer`, enforced as a UI guard on placing a bid and
  authoritatively at evaluation as a per-player win cap. Resolved at evaluation by pure
  `resolveAuctions` (folded into `resolveRollover`): rewards in catalog order, highest bid wins,
  ties → earlier bid; the winner must afford it on the post-settle balance (else it forfeits to
  the next, or goes unsold — **no escrow**), and a player who already won `maxActiveRewardsPerPlayer`
  that evening is skipped so a further reward falls to the next bidder. Winners get a `Purchase` doc
  (id `${day}_${rewardId}`).
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
- **Purchase limits:** `maxActiveRewardsPerPlayer` caps how many rewards one player can bid on
  (UI guard) and win (evaluation) in a day — all forms count. `maxActivePunishesPerPlayer` caps
  how many times a player is a target of others' `punish_someone`. (An earlier instant-purchase
  path, `domain/purchase.validatePurchase`, still encodes the old per-round limit but is unused by
  the auction flow.)
- **Character ownership is multi-device:** `ownerUids: string[]`. **Every claim needs the
  4-digit PIN** — even the first on an empty character — so nobody grabs the wrong one. **One
  device owns one character:** claiming a new one releases the old (removes this uid via
  `releasesOwnership`); a character may still have several devices. A character can be claimed
  only after admin approval. (5-try/15-min lockout still deferred.)
- **Purchase coins deduct atomically** in one transaction (instant balance, no overdraft),
  with rules linking the coin decrease to a matching `purchase`.
- **Turnus settings** are admin-editable (`startingCoins`, `failPenalty`, `noPickPenalty`,
  `allowNegativeBalance`, `maxActiveRewardsPerPlayer`, `maxActivePunishesPerPlayer`,
  `publicProfiles`, `allowTaskSwitch`) via `updateTurnusSettings` (plain `updateDoc`; rules
  already allow `isAdmin` to update the turnus doc). `allowTaskSwitch` ("Lze měnit probíhající
  úkoly", schema default ON = the old behaviour): when off, a player who already holds a task this
  round can't swap it — no switch, no same-round pair to initiate or accept. Players without a task
  still take one. Enforced by domain (`TASK_SWITCH_DISABLED`, checked last in `canTakeToday` so the
  UI can say "free, but switching is off"; `canJoinPairPick`) and rules (`switchAllowed`). Turnus **creation** is still gated off (`turnuses` create is `if false`) pending a
  decision on who may create groups — see "Not yet built".
- **Admin self-downgrade (`leaveAdmin`).** An admin can drop back to player (a batch removes
  their `members`+`roles` admin→player), allowed by a dedicated self-downgrade rule.
- **Rules can't run queries** — a `uid -> playerId` index doc backs "my player" checks.
- **No audit-event log.** An earlier write-only `turnuses/{t}/events` collection (nothing read
  it, it flooded the DB) was removed entirely — paths, schema, repo, rules match, and the
  domain event generation. The per-player coin ledger (below) is now the one place coin history
  lives; `adjustCoins`' note is stored there.
- **Coin history = a per-player ledger (spec 9.1, Phase 1).** Every coin-moving event is one
  signed entry in `players/{pid}/ledger` (append log, auto-id): a `task` settlement (delta +
  outcome + task name), a won `reward` (−paid bid + reward name + form), or an admin `adjust`
  (± the applied post-floor change + the note). Written only by admin-run transactions
  (`runRollover` builds them in `resolveRollover`'s `ledger`; `adjustCoins` appends its own).
  **The opening balance is never stored** — it is derived as `coins − Σ delta`
  (`domain/ledger.deriveOpeningBalance`), so the history always reconciles to the live balance and
  a player who predates the ledger needs no migration. `seq` (append index) breaks `createdAt`
  ties so a settlement sorts before the reward it paid for. The own-card detail shows a 2×2 stats
  grid (`derivePlayerStats`: tasks completed, rewards won, coins earned, coins spent) then the
  history. Rules let only the character's owner (and admins) read the ledger — Phase 2 widens it.
- **Rules tab on the entry shell only.** The Pravidla tab (`features/rules`, `/enter/rules`) sits
  on the pre-group entry screen; a player in a group reaches it by leaving, and re-entering needs
  no code. The text is generic and never shows a group's own settings. Each rule is one line; a
  rule with more to say opens a dialog, and a detail links to related rules (`RULE_LINKS`).
- **Inactive catalog items stay visible to admins.** Players see only active tasks and rewards; an
  admin also sees the inactive ones, greyed out (`ListCard muted`) with a "Neaktivní" chip and
  sorted last, so the pencil can switch them back on. The TSV re-import never touches `active`.

## Platform & build notes

- **PWA:** `vite-plugin-pwa` (generateSW/Workbox, `registerType: 'autoUpdate'`) precaches the
  app shell + serves an installable manifest (standalone, portrait). Icons are a designed brand
  mark committed directly under `public/` (no build-time rasterization) — re-export from
  IconKitchen and drop the files in to update. SW registration only runs on a real
  browser/HTTPS; the sandboxed in-app preview browser blocks it.
- **Install prompt / add to home screen:** a dismissible `InstallBanner` on the entry screen
  (`EntryTabsLayout`), hidden once running standalone (`display-mode: standalone` + iOS
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

Planned rework, confirmed with the user, not yet scheduled.

1. **Shared stats / public profiles (ledger Phase 2).** Phase 1 (the per-player ledger + the
   own-card stats grid and history) shipped — see the locked decision above. Phase 2 adds a
   turnus setting `publicProfiles` (default OFF) that, when on, reveals every player's stats and
   history to the group — surfaced as a standings/leaderboard entry point (top earners, most
   rewards, most-targeted…), each row drilling into the same read-only ledger view. The ledger
   read rule then widens with `|| publicProfiles(t)`. Achievements (item 4) slot into that surface.
2. **Gated turnus creation.** Only the owner may create a group; mechanism undecided
   (super-admin flag, creation code, or hand-editing the DB). Needs the `turnuses` create rule
   (currently `if false`). Decide the gate before building.
3. **Organizer manual.** The player rules shipped (the Pravidla tab and the generated wiki page).
   A manual for organizers (creating a group in the console, categories, evaluation, settings,
   the hidden admin unlock) is still to write.
4. **Secret achievements.** Hidden achievements earned by in-app actions, with a turnus setting
   "achievements are public" (default OFF). Obscure name + emoji + configurable coin award.
   Design the concrete list (what is technically detectable) before implementing.
