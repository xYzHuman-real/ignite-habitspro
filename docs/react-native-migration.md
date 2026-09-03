# Ignite HabitsPro — React Native Migration

## Goal
Migrate the existing React/Vite/Capacitor application to a proper React Native Android application while preserving the existing product functionality, backend, branding, and user-facing behavior. The current web/Capacitor implementation remains untouched on `main`.

## Safety
- Migration work happens on `react-native-migration`.
- `main` remains the stable source of the existing app.
- Do not remove existing features merely because their web implementation does not map directly to React Native.
- Prefer replacing implementation, not product behavior.
- Create stable commits after meaningful milestones.

## Confirmed application areas from the current source
The app currently routes through these major areas:
- Authentication and password reset
- Dashboard
- Habits
- Timer
- Todos
- Challenges
- Community
- Leaderboard
- Shop / premium / pricing
- Weekly reports
- Journal
- Goals
- Partners
- Focus Rooms
- User profiles and follow lists
- Profile
- Settings
- Daily planner
- Referral flow
- Install/help flow
- Privacy policy and terms
- Onboarding carousel
- Permission primer
- Splash screen
- Guest/signup benefits flow
- Not-found handling

## Existing integrations to preserve
- Supabase authentication/data
- AdMob
- Push notifications
- Local notifications
- Haptic feedback
- Splash screen
- App/back-button handling
- Referral handling
- React Query data/caching behavior where applicable

## Migration principles
1. Preserve database schema and Supabase behavior unless a native-specific change is required.
2. Preserve navigation structure and deep-link destinations.
3. Recreate web UI components with native equivalents rather than embedding the web app.
4. Preserve loading, error, empty, success, and permission states.
5. Preserve animations and visual hierarchy as closely as practical with React Native primitives.
6. Test authentication, persistence, notifications, ads, navigation, and Android lifecycle behavior before calling the migration complete.

## Milestones
- [x] Create isolated `react-native-migration` branch from the latest stable commit.
- [x] Record migration scope and feature inventory.
- [ ] Add React Native project/build configuration.
- [ ] Migrate shared theme, assets, icons, and foundational UI primitives.
- [ ] Migrate authentication/onboarding/splash/permissions.
- [ ] Migrate primary habit/dashboard experience.
- [ ] Migrate timer, todos, goals, journal, planner, reports, and challenges.
- [ ] Migrate community, profiles, follows, leaderboard, partners, and focus rooms.
- [ ] Migrate shop/premium/pricing/referrals/settings/legal/install.
- [ ] Reconnect native notifications, haptics, AdMob, Supabase, and Android lifecycle.
- [ ] Add Android build workflow.
- [ ] Run lint/type/build checks and fix failures.
- [ ] Produce a testable APK/AAB.
- [ ] Final feature parity audit.

## Checkpoint protocol
If tool/usage limits approach during the migration, stop after the current stable milestone, commit the work, and report:
- current branch
- latest commit
- completed milestones
- files/components added or migrated
- remaining work
- exact next step

The next session can continue from this branch and commit without restarting the migration.
