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
- **Coin formula:** one fixed rule, `coinReward = 80 + 20 * difficulty` (100 easiest … 200 hardest),
  in `deriveReward` — no per-turnus coefficient, overridable per task via `manualCoins`. Failing a
  task costs a flat, turnus-wide `failPenalty` — the same for everyone, independent of the task (no
  per-task penalty, no ratio); not picking one at all costs `noPickPenalty`. Both applied at
  settlement. Will be balanced later; keep it in one place.
- **Daily lock is admin-controlled**, not clock-driven (no backend, never trust the client
  clock). A boolean `dayLocked` on the turnus, flipped by an admin action and enforced by
  rules, freezes task selection AND reward purchases for the day; reservations stay editable
  until evaluation. (There is no clock-based lock — an earlier `lockTime` reminder was removed.)
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
- **Task types are synthetic categories.** The three types (solo/pair/group, derived from the size
  interval by `lib/group.taskType`) double as reserved category keys `@type:{solo,pair,group}`
  (`TYPE_KEYS`). The admin's open-day set (`currentDay`/`nextDayCategories`) and the list's one
  category filter carry these keys alongside real tags; eligibility (`isCategoryOpen`) matches a task
  if any real tag OR its type key is open (a UNION — opening "pairs" opens every pair). No new field,
  no rules change — the type keys just live in the existing category arrays.
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
   portrait, `theme_color`/`background_color` #f8fafc). Icons are a designed brand mark (blue→magenta
   "K" in a circle) exported from IconKitchen and committed directly under `public/` — `favicon.ico`
   - `favicon.png` (tab), `pwa-192x192`/`pwa-512x512` (transparent-corner `any`), `pwa-maskable-512x512`
     (white-filled safe zone), `apple-touch-icon` (glyph on white). No build-time rasterization step —
     re-export from IconKitchen and drop the files in to update. `index.html` carries the favicon links,
     apple-touch-icon + `apple-mobile-web-app-*` meta. (Note: a home-screen PWA icon can't get iOS 26's
     native Liquid Glass layered treatment — Safari just masks the flat `apple-touch-icon` into a squircle.) **iOS input-zoom fix:**
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
- **I-a owned rewards — done (RULES, redeploy `firestore:rules`).** Auction winners get a `Purchase`
  doc at evaluation (`resolveRollover` builds them, id `${day}_${rewardId}`, price = amount paid,
  `targetIds` empty for now; `runRollover` writes them with `serverTimestamp`, `undoRollover` deletes
  them via `rollbackSnapshot.purchaseIds`). Rules: `purchases` write is now `isAdmin` (the rollover is
  the only writer). `PurchasesProvider`/`usePurchases` (`subscribeAllPurchases`, member-readable);
  "má odměnu" chip on every player card (form `reward`, not refunded) + a "Získané odměny" list in
  `PlayerDetailDialog`.
- **I-b punishment targeting — done (no rules change — the bid rule already lets a bidder write their
  own doc's fields, and purchase writes are admin from I-a).** Targets are picked at BID time: the
  `punish_someone` reward carries a `minTargets`/`maxTargets` range (editable in `RewardEditDialog`,
  shown only for that form; import still defaults 1/1). `RewardBid` gained `targetIds`; `createBid`
  validates them (de-dup, not self, count in range; other forms carry none). `RewardBidDialog` shows a
  target checklist for `punish_someone`. At evaluation, pure `assignPunishTargets` resolves them
  highest-bid-first: a person is targeted at most `maxActivePunishesPerPlayer` times/day (cap enforced
  among WINNERS only — losing bids' targets are ignored, so nobody can bid-to-lose to "protect" a
  friend); a buyer's over-capped picks are dropped and the shortfall auto-filled to `minTargets` from
  the least-targeted free players, tie-broken by a `seed`-shuffle (the day) so the auto-fill rotates
  fairly instead of always hitting the lowest ids — still pure/deterministic, no `Math.random`. Final
  targets land on the
  `Purchase.targetIds`/`targetNames`. Display: "Je terčem" chip on every player + a "Je terčem"
  (targetedBy) list in `PlayerDetailDialog`. Effect stays record-only (counsellors enact off-app).
  J. **Turnus settings & creation** — RULES for creation.
- **J-1 settings form — done (no rules change).** `TurnusSettingsDialog` (features/admin/settings) +
  `data/turnusAdmin.updateTurnusSettings` (plain `updateDoc`, rules already allow `isAdmin(t)` to
  update the turnus doc) edit `startingCoins`, `failPenalty`, `noPickPenalty`,
  `allowNegativeBalance`, `maxActiveRewardsPerPlayer`, `maxActivePunishesPerPlayer`. Opened
  from a "Nastavení turnusu" button on `AdminScreen`; new `turnusSettings.*` i18n block.
- **J-2 gated turnus CREATION — pending a gating decision** (not every user may create a group):
  needs a mechanism (global super-admin / creation code) + a rules change (`turnuses` create is
  currently `if false`). The user is rethinking invites/targets to avoid repeated rule rewrites, so
  hold J-2 (and its rules) until that lands, to batch the rule changes.
  K. **Showcase + README + player rules page (LAST).** Representative seed, README refresh (still says
  "Phase 0"), final visual pass, optional 5-try/15-min PIN lockout. Then a simple trilingual
  "how to play" page — only once every mechanic above is frozen.

## Post-I adjustments (feedback, 2026-09)

- **Punishment-target locking reworked to a live per-day tally.** Two earlier commits (`68e1c26`
  per-bidder once-per-turnus, then `88876ec` global first-come `punishTargets` markers) locked a
  target _permanently_ at bid time — so a player who kept re-bidding onto new targets used them all
  up. Replaced by `punishTargetCounts/{day}`: a public per-target count (no bidder, so secret-safe)
  that `bidReward` moves by the delta between a bid's old and new picks and `cancelBid` releases, so a
  target is locked only while `maxActivePunishesPerPlayer` current bids aim at it and frees the moment
  one of them changes. `createBid` refuses a newly-added target already at the cap
  (`TARGET_AT_PUNISH_LIMIT`), exempting the bidder's own current picks; the bid dialog greys locked
  targets (single-target as a disabled dropdown option). The count is only a live bidding guard — the
  real, capped assignment stays at evaluation (`assignPunishTargets`, so with cap 3 three buyers may
  share a target), and `runRollover` resets the tally alongside the bids each day. Removed with the old
  approach: the `punishTargets` collection + rule, `subscribeClaimedTargets`/`useClaimedTargets` and
  the per-bidder `usedTargets`/`TARGET_ALREADY_USED`. The old "both charged, neither got the reward"
  bug stays fixed at the eval layer (one bid per player → charged at most once; contested targets go
  to the higher bid, the loser is auto-filled), covered by `assignPunishTargets.test.ts`.
- **Single-target punishment uses a dropdown** (min 1 = max 1), like the pair-partner picker; ranges
  keep the checkbox list. **Reward chips:** interest is `Má zájemce`/`Má zájemce (N)` in warning
  orange (like tasks); the `punish_all` form chip is danger red. **Group chip** shows the size in
  parentheses: `Skupina (3–4)`. **Android dark status bar — final fix: let the system theme it.**
  An installed Android WebAPK freezes the manifest `theme_color` at install time and paints the
  status bar with it, ignoring runtime `<meta theme-color>` changes (so a JS "forcer" repaints only
  the icon tint, never the background). Neither per-scheme metas nor a runtime forcer could darken
  the bar. Fix: drop the fixed colour entirely so the WebAPK falls back to the system-themed status
  bar (follows the OS light/dark preference). `vite.config.ts` manifest sets `theme_color: ''`
  (empty, because vite-plugin-pwa injects its `#42b883` default when the key is omitted); the
  `<meta name="theme-color">` tags are removed from `index.html`. **Requires uninstalling +
  reinstalling the PWA** (or waiting for Chrome's periodic WebAPK re-fetch) — the old `theme_color`
  stays frozen in the installed app until the WebAPK regenerates. (`display: standalone` on Android
  can't do a transparent status bar — that's an iOS-only `apple-mobile-web-app-status-bar-style:
black-translucent` feature; confirmed still absent on Android in 2026.) **Admin first-load** hardened: the lazy admin chunk import
  retries a few times (a rejected `React.lazy` is cached forever, which wedged the tab after a
  transient blip), and the admin route now sits under a recoverable `AppErrorBoundary`. The exact
  first-load throw could not be reproduced statically (no emulator/console here); if it recurs, the
  browser console logs it via `ErrorBoundary`'s `console.error`.
- **Entry-screen top bar + app version + name-not-slug (status-bar seam follow-up).** Letting the
  system theme the status bar means it no longer matches the app; on the header-less entry screens
  the near-white system bar met the page background (`bg-surface`) with a faint seam. `EntryLayout`
  now has a raised top bar (`bg-surface-raised` filling the `safe-top` inset) that mirrors the in-app
  header, so the seam is gone the same way it is after login. That bar shows the credit `© Ondřej
März` (left) and the **app version** (centre). Versioning is a build timestamp: `vite.config.ts`
  computes `appVersion` from `new Date()` at config-eval time as `YYYY.MM.DD.HHmm` (local, e.g.
  `2026.09.01.1459`) and injects it via `define` as the `__APP_VERSION__` global (declared in
  `src/vite-env.d.ts`) — a quick "which build am I running" check. `CodeEntryScreen` now shows the
  turnus **name** instead of `turnus.slug` (slug is the URL token, not meant as a label); `name` was
  added to `RememberedTurnus` (persisted, back-compat falls back to slug) and set from `getTurnusBySlug`.

## Backlog (planned rework, confirmed with the user — not yet scheduled)

Discussed 2026-09; ordered roughly by the user's interest, not by dependency. The rules tab (item 3)
stays LAST, after every mechanic is frozen.

1. **Coin history + per-player stats.** Manual coin edits already force a note (`noteRequired`) but it
   is shown nowhere. Add a transaction ledger to the player's own card/detail: started at 0, +160 for
   _which_ task, −X for _which_ reward, manual edits with their note — the running story of a balance.
   Plus totals: tasks completed, rewards won, coins earned, coins spent. Source is likely the `events`
   log (structured payloads) folded per player; may need a dedicated per-player ledger if events are
   not enough.
2. **Gated turnus creation (= roadmap J-2).** Only the owner (this user) may create a group. Mechanism
   undecided: global super-admin flag, a creation code, or just editing the DB by hand (user is open
   to skipping an in-app form). Needs the `turnuses` create rule (currently `if false`). Decide the
   gate before building.
3. **Rules tab + full manuals (= roadmap K, LAST).** In-tab rules as short and clear as possible, each
   section with a `?` that opens a dialog with the full detail — e.g. "poorer player wins a contested
   task" → what the rule is, how the balance is computed, how it applies to pairs vs. groups, and the
   reservation-time tie-break when it can't decide. Cover every mechanic. Plus a complete **player**
   rules page and a complete **organizer** manual (all the details). Only once mechanics are frozen.
4. **"Add to home screen" prompt + how-to.** A notice that the PWA is installable on iOS and Android,
   with step-by-step instructions per platform.
5. **Secret achievements.** Hidden achievements — no mention anywhere in the UI — earned by in-app
   actions. A turnus setting **"Úspěchy jsou veřejné"** (default OFF): off = a player sees achievements
   only on the character they own; on = everyone sees everyone's. Each achievement has an obscure name
   (must not reveal its trigger) + an emoji, and awards coins configured per-achievement. The concrete
   list is to be designed together first — decide what is technically detectable before implementing.
