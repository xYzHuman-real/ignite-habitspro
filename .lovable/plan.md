
# Ignite HabitPro — Master Fix & Feature Plan

This plan groups all 50 items into 10 execution phases. Each phase is shippable on its own. Items are kept in your original numbering for traceability.

---

## Phase 1 — Authentication & Onboarding (Items 1–4, 42)

- **#1 Google sign-in in installed app**: Native (Capacitor) flow already disabled — confirm fallback to email/password works, surface a clear "Use email login on mobile" notice on the Auth page when `Capacitor.isNativePlatform()` is true.
- **#2 Forgot Password (OTP-style)**: Replace magic-link reset with a 6-digit code flow.
  - New edge function `send-reset-code` → generates code, stores hash in new `password_reset_codes` table (TTL 15 min, single-use), emails via Lovable Emails.
  - New edge function `verify-reset-code` → validates code, returns short-lived recovery token.
  - Update `Auth.tsx` reset flow: email → code input → new password → auto-redirect to `/`.
- **#3 Delete Account**: Audit `supabase/functions/delete-account/index.ts` — add missing tables (`subtasks`, `push_tokens`, `focus_room_*`), verify cascading deletes, return clear errors.
- **#4 Guest-first onboarding**: Allow app entry without login (local-only data via existing zustand store). After 10 min or on Profile tap, show a `SignupBenefitsDialog` ("Save your progress, sync devices, join community"). On signup, migrate local data → Supabase.
- **#42 Sidebar discoverability**: Add a one-time pulsing tooltip on the `SidebarTrigger` for first-time users (stored in `localStorage.sidebar_tutorial_seen`).

## Phase 2 — Streaks, Habits & Reminders (Items 5–11)

- **#5 Streak double-increment**: In `useHabits` completion handler, guard streak bump with "already incremented today" check using `daily_logins.login_date` + a new `streak_last_increment_date` column on `profiles`.
- **#6 Streak freezes**: Wire `profiles.streak_freezes` into a nightly cron edge function `check-missed-habits` — auto-consume one freeze if a day was missed; otherwise reset streak.
- **#7 Habit completion delay**: Switch to optimistic mutation in `useHabits` (update cache immediately, rollback on error). Remove blocking awaits in toast/notification chain.
- **#8 Habit priority ordering**: Default sort = `priority` (important→medium→low), then `sort_order`. Long-press 4–5 s already enables drag (per memory) — confirm and persist `sort_order` correctly.
- **#9 Daily reminders**: Verify `usePushNotifications` registers FCM token, ensure `send-push` edge function reads `reminder_time` + `reminder_days` and is scheduled via pg_cron.
- **#10 Future habits not completable early**: Add `scheduled_for` check in `HabitCard` complete handler — disable button + tooltip "Available on {date}".
- **#11 Sorting irregularity**: Single source of truth in `useHabits` query — `.order('priority').order('sort_order').order('created_at')`.

## Phase 3 — Todos (Items 12–15)

- **#12 Future todos lockout**: In `TodoCard`, disable checkbox when `due_date > today`.
- **#13 Orange theme alignment**: Audit `Todos.tsx`, `TodoCard`, `TodoFilters`, `ProductivitySummary` — replace any blue/neutral accents with `--primary` / `--gradient-primary` tokens. Apply `PageHero` (already done in earlier work — verify consistency).
- **#14 Notes — PDF + Safari URLs**:
  - Extend `attachments` jsonb to accept `{type: 'pdf', url, name}`; add PDF upload via Supabase Storage `attachments` bucket.
  - Force-open URLs with `window.open(url, '_blank', 'noopener')` and add `target="_blank" rel="noopener"` for Safari compatibility.
- **#15 Future tasks in active focus**: Filter `linked_task` picker in TimerPage to `due_date <= today OR due_date IS NULL`.

## Phase 4 — Focus & Timer (Items 16–21)

- **#16 App blocking**: Document limitation — true blocking requires native Screen Time API. Add Capacitor plugin scaffold + iOS/Android permission prompts; show a "soft block" full-screen overlay with motivational message + grace-period unlock for web/PWA.
- **#17 Accurate focus tracking**: Replace minute-rounding with `Math.floor(seconds/60)`; only log session if `actualSeconds >= 30`.
- **#18 Ambient sounds**: Fix audio loading paths (use `import` not raw `/public` strings), add error logging, ensure `<audio loop>` plays on user interaction (autoplay policy).
- **#19 Break timer Stop button**: Add `<Button onClick={stopBreak}>` next to Reset in break overlay.
- **#20 Focus room realtime**: Enable Supabase realtime on `focus_rooms` table; subscribe in `useFocusRooms`, invalidate query on INSERT.
- **#21 AI Planner custom timer**: Add a "Custom session length (min)" input in `generate-daily-plan` request UI, pass to the edge function prompt.

## Phase 5 — Goals (Items 22–23)

- **#22 Popover z-index**: Add `z-[100]` (or use Radix Portal) to unit-selector and calendar Popovers so they render above PageHero/sticky header.
- **#23 Goal re-activation**: When `target_value` is edited and `current_value < new target`, set `completed = false`, `completed_at = null`. Recompute % in UI.

## Phase 6 — Community & Social (Items 24–25)

- **#24 Community chat full-height**: Make chat sheet `h-[100dvh]` with proper safe-area padding, fix the partial-render CSS.
- **#25 Streak share**: Add a "Share Freeze" button next to Nudge on partner cards → consumes 1 of caller's `streak_freezes`, increments partner's, creates notification. Limit: 1/week per partner.

## Phase 7 — Shop, XP & Rewards (Items 26–32)

- **#26 Shop item display**: Fix Shop.tsx rendering — show title, description, icon, category badge, and price for every `shop_items` row.
- **#27 Title symbols on profile**: After purchase of `item_type='title'`, write to `profiles.title`; render badge next to display name everywhere (Profile, Leaderboard, Community).
- **#28 XP no longer decreases**: Split `profiles.leaderboard_points` (spendable, weekly reset — already exists per memory) from new `profiles.lifetime_xp` (monotonic). Shop spends from `coins` only — never XP.
- **#29 Power-ups & boosts**: Implement effects (e.g., 2× points boost for 24h via `active_boosts` table; streak shield via streak_freezes++).
- **#30 Cooldowns**: Add `last_purchased_at` on `shop_purchases`; enforce 30-day cooldown on power-ups, 14-day on boosts in client + RLS check.
- **#31 Early repurchase via ads**: Add "Unlock early (watch ads)" button — placeholder ad SDK hook now, gated by Prime status (`profiles.is_prime`).
- **#32 Daily reward once/day**: Use `daily_logins.login_date = today` as the gate — disable claim button if row exists.

## Phase 8 — Profile, Settings & Notifications (Items 33–38)

- **#33 Heatmap**: Fix data query in Profile to aggregate `habit_completions` + `pomodoro_sessions` by date for last 365 days.
- **#34 Leaderboard visibility**: Wire `profiles.show_profile` / `show_stats` / `show_avatar` toggles into Leaderboard query filters.
- **#35 Replace "Coming Soon"**: Build out Privacy, Notifications, Account sections in `Settings.tsx` with working toggles (mute reminders, email digest opt-in, data export).
- **#36 Realtime notifications**: Verify the realtime subscription in `use-notifications.ts` reconnects on tab focus; add `supabase.channel().subscribe()` retry logic.
- **#37 Activity tracking audit**: Backfill `activity_log` inserts on habit complete, todo complete, focus session, journal entry. Show timeline on Profile.
- **#38 Update Privacy / ToS**: Refresh `PrivacyPolicy.tsx` & `TermsOfService.tsx` to mention push notifications, AI planner, community, shop, ads, Prime tier.

## Phase 9 — UI/UX polish (Items 39–43)

- **#39 Duplicate buttons on Time page**: Remove redundant theme/notification buttons (header already has them).
- **#40 Add (+) button shift**: Replace layout-shifting `scale` press with `transform: translateY(1px)` + fixed dimensions.
- **#41 Challenge flash**: Optimistic complete state — show "Done" instantly, then persist.
- **#42 Sidebar tutorial**: see Phase 1.
- **#43 Auto-close sidebar on nav**: Call `setOpenMobile(false)` in `AppSidebar` NavLink onClick.

## Phase 10 — Exams, GPA, Reports & Performance (Items 44–50)

- **#44 Exam countdown persistence**: Persist to new `exams` table (currently localStorage only).
- **#45 GPA calculator**: Fix grade-point mapping + credit weighting in `GpaCalculator.tsx`.
- **#46 Feedback delivery**: Wire `FocusFeedbackForm` to an edge function `send-feedback` that uses Lovable Emails to deliver to the configured admin address.
- **#47 Daily Activities explainer**: Add an info `<Tooltip>`/modal on WeeklyReport describing measurement (habits done, focus minutes, todos closed, journals written) and methodology.
- **#48–49 Performance**: Add React Query `staleTime`/`gcTime` defaults, lazy-load heavy routes with `React.lazy`, paginate long lists (community, leaderboard), debounce search.
- **#50 Finish remaining "Coming Soon"**: Sweep codebase for the literal string and implement or hide each occurrence.

---

## Technical / DB Changes Summary

New tables: `password_reset_codes`, `active_boosts`, `exams`.  
New columns: `profiles.lifetime_xp`, `profiles.is_prime`, `profiles.streak_last_increment_date`, `shop_purchases.last_purchased_at`.  
New edge functions: `send-reset-code`, `verify-reset-code`, `check-missed-habits` (cron), `send-feedback`.  
Realtime publications: `focus_rooms`, `notifications`.  
Storage bucket: `attachments` (private, RLS by user_id).

## Execution Order

Phases will be shipped sequentially (1 → 10). After each phase I'll pause briefly to let you sanity-check before moving on. Database migrations within a phase are batched into a single approval prompt.

Approve this plan to start with **Phase 1 (Auth & Onboarding)**.
