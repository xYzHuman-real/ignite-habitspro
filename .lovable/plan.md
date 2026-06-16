# Ignite Habit Pro — Premium Redesign Plan

A pure UI/UX pass. **No features added or removed.** All existing logic (habit toggling, streaks, swipe gestures, focus timer, premium gates, points, etc.) stays exactly as is.

---

## Design Foundation (global)

Update `src/index.css` + `tailwind.config.ts` design tokens:

- `--background`: #FAFAFA (soft white) / dark stays
- `--card`: #FFFFFF
- `--foreground`: #111827 (graphite)
- `--muted-foreground`: #6B7280
- `--primary`: #F97316 (kept, but used sparingly)
- `--border`: very soft gray (#EDEDED), thinner usage
- Shadows: replace heavy `shadow-premium-*` with Apple-style soft shadows:
  - `shadow-sm`: `0 1px 2px rgba(17,24,39,0.04)`
  - `shadow-md`: `0 4px 16px rgba(17,24,39,0.06)`
- Radius: bump cards to `rounded-3xl` (more Apple-ish), buttons stay `rounded-full` / `rounded-2xl`
- Typography: keep Space Grotesk display / DM Sans body, but enforce hierarchy:
  - Page titles: `text-[28px] font-semibold tracking-tight`
  - Section labels: `text-[13px] uppercase tracking-wide text-muted-foreground`
  - Body: `text-[15px]`
- Remove most gradient backgrounds (orange-to-orange banners, glow cards) — replace with white cards + restrained accent (icon tint, single number, progress fill)

---

## Bottom Navigation (`src/components/BottomNav.tsx`)

Already floating — refine, don't rebuild:
- Increase blur + lower opacity background for glassier feel
- Replace pill with a smaller dot indicator under active icon
- Tighter icon weight when active, no scale bounce — opacity + color only
- Softer shadow (`0 8px 32px rgba(17,24,39,0.08)`)

---

## Home / Dashboard (`src/pages/Dashboard.tsx`)

Audit and collapse the card stack. New structure (top → bottom):

1. **Greeting block** — plain text, no card. "Good morning, {name}" + one-line status ("3 of 5 habits done").
2. **Today's progress** — single minimal card: large ring/number for today's completion %, streak count beside it. Replaces the multiple separate "streak / xp / today" cards.
3. **Up next** — one card listing the next 1–3 incomplete habits/tasks as plain rows (no nested cards).
4. **Active goals** — compact list, 1 line each with thin progress bar. No card-per-goal.
5. Everything else (quotes, ads, weekly report teaser, motivational, exam countdown) → either remove from home or move below a single "More" section with much less emphasis (no colored backgrounds).

Remove duplicate stats cards, gradient hero banners, emoji-heavy callouts.

---

## Habits Screen (`src/pages/Habits.tsx` + `HabitCard.tsx` + `HabitMomentumHeader.tsx`)

Restructure:
- Default tab becomes **Overview** (calendar-first), not the list.
- Tab switcher restyled as Apple-style segmented control (gray pill bg, white selected pill, no orange gradient).
- **Overview tab**: GitHub-style 5-week consistency grid using existing `completions` data + a compact stats row (current streak, longest, this-week %). Tap a day → small sheet showing which habits were completed (uses existing data, no new backend).
- **List tab**: keep gestures (swipe right complete, left delete, long-press reorder per memory). Redesign card:
  - Pure white, `rounded-2xl`, 1px hairline border, no gradient swipe bg (use subtle green tint only)
  - Single line: icon (small, no tinted gradient bubble — just the emoji), name, tiny streak chip on right, checkbox circle
  - Priority shown as a 3px left bar instead of dot+chip
  - Remove inline mini progress bar unless `target > 1` AND keep it 2px high
- Remove the orange "🎉 All habits completed" gradient banner — replace with subtle inline text under header.

`HabitMomentumHeader`: strip to a single line of three numbers (Today / Streak / Week) — no gradient card.

---

## Todos (`src/pages/Todos.tsx`, `TodoCard.tsx`, `ProductivitySummary.tsx`)

- ProductivitySummary: collapse from multi-card grid to one slim row of stats.
- TodoCard: white, hairline border, accent only on priority dot and checkbox when checked. Strikethrough on complete with 200ms fade.
- Filters bar: ghost buttons, no filled pills unless active.

---

## Timer (`src/pages/TimerPage.tsx`)

- Center the timer ring on a near-empty screen, large display number (`text-7xl font-light tracking-tight`)
- Controls as 3 round icon buttons, equal weight, only the primary action filled orange
- Move stats/tabs below the fold, no colored backgrounds

---

## Focus Rooms, Profile, Settings, Leaderboard, Goals, Journal, Pricing

Apply the same rules without rebuilding:
- Replace gradient/colored cards with white + hairline
- Reduce card count (merge stat rows)
- Section titles in new hierarchy
- Accent orange reserved for: active tab dot, primary CTA, streak flame, progress fill, premium badge

PremiumBadge / PremiumStatusBanner / UpgradeModal: keep orange accent (this is where it belongs). Tone down banner from filled gradient to white card with small orange icon + text + button.

---

## Animations

Standardize via existing `framer-motion` usage. Per project memory: easeOut, no bouncy spring physics.
- Page transitions: keep current 0.2s easeOut fade/slide (already good).
- Habit/todo complete: 180ms checkmark scale 0.8→1 + 150ms opacity 1→0.55 on row. No confetti on home (keep existing celebrate for streak milestones only).
- Card mount: 150ms fade-in, no y-translate stagger.
- Bottom nav: opacity/color crossfade 180ms, drop the spring scale.

---

## Cards Audit (delete or merge)

To remove from Dashboard (move/delete):
- Standalone XP card (merge into progress ring)
- Quote card (move to Journal or remove from home)
- Ad slot on home (keep for free users but smaller, single line, no border)
- Exam countdown (keep but as one-line text, not a card)
- Weekly report teaser card (link only in profile)

Merge across app:
- Multiple stat cards → one stat row
- "Today's habits" + "Today's tasks" preview → single "Up next" list

---

## Technical Notes

- All changes are presentation-layer only: edits in `src/index.css`, `tailwind.config.ts`, `src/components/ui/card.tsx`, `BottomNav.tsx`, page files listed above, and habit/todo card components.
- No changes to: hooks (`use-premium`, `useHabits`, `use-enhanced-todos`, etc.), Supabase schema, edge functions, auth, routing, premium logic, points formulas, streak logic, gesture handlers.
- No new dependencies.

---

## Scope check

Big surface area — I'd suggest landing it in 3 passes so you can review as we go:

1. **Pass 1 (foundation):** tokens, shadows, typography, BottomNav, Card primitive, Dashboard, Habits screen
2. **Pass 2:** Todos, Timer, Profile, Goals
3. **Pass 3:** Settings, Leaderboard, Journal, Focus Rooms, Pricing, polish sweep

Reply "go" to start Pass 1, or tell me to do all three in one shot (longer turn, no intermediate review).
