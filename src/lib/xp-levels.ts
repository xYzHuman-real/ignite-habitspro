// XP Level thresholds and titles
export const XP_LEVELS = [
  { level: 1, minPoints: 0, title: "Beginner", icon: "🌱" },
  { level: 2, minPoints: 50, title: "Apprentice", icon: "📘" },
  { level: 3, minPoints: 150, title: "Learner", icon: "📖" },
  { level: 4, minPoints: 300, title: "Achiever", icon: "⭐" },
  { level: 5, minPoints: 500, title: "Scholar", icon: "📚" },
  { level: 6, minPoints: 800, title: "Expert", icon: "🎯" },
  { level: 7, minPoints: 1200, title: "Master", icon: "🏅" },
  { level: 8, minPoints: 1800, title: "Grandmaster", icon: "👑" },
  { level: 9, minPoints: 2500, title: "Legend", icon: "🌟" },
  { level: 10, minPoints: 3500, title: "Mythic", icon: "🔥" },
];

export function getLevelForPoints(points: number) {
  let current = XP_LEVELS[0];
  for (const lvl of XP_LEVELS) {
    if (points >= lvl.minPoints) current = lvl;
    else break;
  }
  return current;
}

export function getNextLevel(points: number) {
  const current = getLevelForPoints(points);
  const next = XP_LEVELS.find((l) => l.level === current.level + 1);
  return next || null;
}

export function getProgressToNext(points: number) {
  const current = getLevelForPoints(points);
  const next = getNextLevel(points);
  if (!next) return 100;
  const range = next.minPoints - current.minPoints;
  const progress = points - current.minPoints;
  return Math.min(100, Math.round((progress / range) * 100));
}

// Daily login bonus: streak-based
export function getDailyLoginBonus(streak: number): number {
  if (streak >= 30) return 25;
  if (streak >= 14) return 15;
  if (streak >= 7) return 10;
  return 5;
}
