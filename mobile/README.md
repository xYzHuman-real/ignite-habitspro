# Ignite HabitsPro — React Native Migration

This directory is the native migration workspace. The existing web/Capacitor application remains unchanged on `main`.

## Migration rules
- Preserve existing product behavior and user-facing features.
- Preserve Supabase/backend data contracts wherever practical.
- Recreate the existing navigation, onboarding, authentication, habits, timer, todos, challenges, community, leaderboard, profile, settings, shop, reports, journal, goals, partners, focus rooms, daily planner, referrals and legal screens.
- Replace browser-only APIs and UI primitives with React Native equivalents.
- Keep native functionality for notifications, haptics and ads through React Native-compatible packages.
- Do not remove existing functionality merely because it is harder to port.

## Current milestone
Milestone 2 — native project foundation started.

The next implementation step is to establish the React Native/Expo application shell and shared design tokens before migrating individual screens.
