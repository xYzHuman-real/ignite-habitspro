# Ignite Habit Pro — Premium Upgrade Plan

This is a large, multi-feature request. I'll ship it in 4 focused phases so each piece is reviewable and testable. Phases 1–2 are pure frontend; phase 3 touches the database (uniqueness); phase 4 is native/Capacitor work that requires a real Android build to fully validate.

---

## Phase 1 — Onboarding + Settings audit (frontend only)

**1. Three premium onboarding screens** (after splash, before auth)
- New `src/components/OnboardingCarousel.tsx` with framer-motion swipe/drag.
- Screens: "Build Better Habits", "Focus Without Distractions", "Become Your Best Self" — copy as specified.
- Skip + Next buttons, animated dot progress, Apple-style ease curves, light theme matching app tokens, custom illustrations using existing brand orange.
- Shown once per device (localStorage flag `onboarding_completed_v1`); gated in `App.tsx` between splash and `/auth`.

**5. Settings page audit**
- Read every section in `src/pages/Settings.tsx` and wire any dead toggle to a real action (persisted via `use-local-pref` or profile column) — or remove it.
- Confirm Logout + Delete Account flows still function end-to-end.
- Deliverable: short report in chat listing what was wired vs hidden.

---

## Phase 2 — Premium gestures + Focus protection UI

**6. Smoother habit/todo completion**
- Tune `HabitCard` and `TodoCard` drag: lower `dragElastic`, snappier spring (`stiffness: 500, damping: 35`), shorter completion animation (~150ms).
- Add Capacitor Haptics light-impact on swipe-threshold cross and on tap-complete (web no-op fallback).
- Optimistic UI: flip `completed_today` instantly, reconcile on server response.

**3. Focus Protection overlay (in-app portion)**
- New `src/components/FocusProtectionOverlay.tsx`: full-screen, rotating motivational message, "Return to Focus" (primary, orange gradient) + "End Session" (ghost).
- Triggered by an app-state listener when focus session is active and app returns from background (web: `visibilitychange`; native: Capacitor `App` `appStateChange`).
- Native blocked-app detection itself is part of phase 4.

---

## Phase 3 — Unique usernames (backend + UI)

**4. Globally unique usernames**
- Migration: add `username citext` column to `profiles` with `UNIQUE` index (case-insensitive). Backfill from existing `display_name` with numeric suffix on collision. Add `GRANT` and tighten RLS so anyone can `SELECT username` for availability check, but only owner can update.
- DB function `public.suggest_usernames(base text)` returning 5 available suggestions.
- Profile edit UI: debounced availability check, "Username already taken" inline error, "Suggestions" chips.
- Auth signup flow: require username before account creation completes.

---

## Phase 4 — Native Android (Capacitor) reliability

**2. Permission education screens**
- New `PermissionPrimer` component shown before each native request: Usage Access, Notifications, Battery Optimization, Background Activity.
- Each screen: icon, plain-language "why", "Allow" + "Not now". Tracks granted state in localStorage; re-prompts only when missing.

**3. Native blocked-app detection** (Android)
- Use existing usage-stats permission to poll foreground app every ~2s during an active focus session via a small custom Capacitor plugin or community `@capacitor-community/usage-stats`-style approach.
- When foreground package matches blocklist (Instagram, YouTube, TikTok, Facebook, X, Snapchat, Reddit), bring app to front and show the Phase 2 overlay.
- iOS: not supported by the OS — document limitation; rely on Screen Time instead.

**7. Background reliability**
- Move focus timer ticking to a Capacitor foreground service (`@capacitor-community/background-runner` or a thin custom service) so timers/notifications keep firing when screen is off.
- Schedule local notifications via `@capacitor/local-notifications` for reminders, so the OS fires them even if JS is suspended.
- Push notifications already wired via FCM — verify token refresh on resume.

**Validation**: produce a debug APK via the existing `build-android.yml` workflow and walk through a manual test checklist (timer survives 5 min screen-off, blocked-app overlay fires, permission primers appear once).

---

## Technical notes (for reference)

- New deps likely needed: `@capacitor/haptics`, `@capacitor/local-notifications`, `@capacitor/app` (already used by back-button hook), and one usage-stats plugin. I'll confirm exact packages before installing in Phase 2/4.
- DB changes confined to `profiles` table + one new SQL function; all other features are frontend/native.
- No changes to existing routes, brand color (#F97316), or navigation structure.

---

## Suggested order of execution

1. Phase 1 now (low risk, high visual impact).
2. Phase 2 next (gesture polish + overlay UI you can preview in web).
3. Phase 3 (requires migration + your approval).
4. Phase 4 (requires you to run an APK build to validate).

Approve this plan and I'll start with Phase 1. If you'd prefer a different order, or want to drop/condense any phase, tell me before I begin.
