# Ignite HabitPro Mobile

This is the React Native / Expo migration. The existing Vite web app remains unchanged at the repository root.

## Start locally

1. Copy `.env.example` to `.env` and supply the existing Supabase URL and anonymous key.
2. Run `npm install` from this directory.
3. Run `npx expo install --fix` to align native dependency versions.
4. Run `npm start`.

Use a development build—not Expo Go—once native app blocking, billing, and push integrations are added.

## Migration status

Implemented foundation:
- Expo Router native navigation
- Native dark/orange visual system
- Supabase email sign-in
- Dashboard, habits list, focus timer, planner, and profile shell

Still to migrate:
- Registration, Google sign-in, reset password, guest mode
- Habit editing/completions, todos, reports, journal, goals
- Community, challenges, leaderboard, referrals and shop
- Notifications, native focus protection, real Play Billing, purchases/restores
