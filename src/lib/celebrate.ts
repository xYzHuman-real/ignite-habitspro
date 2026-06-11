import confetti from "canvas-confetti";

/** Big celebratory confetti burst — used when Premium unlocks. */
export function celebratePremium() {
  const colors = ["#FFD700", "#FF6B6B", "#4ECDC4", "#A78BFA", "#F472B6"];
  const end = Date.now() + 1400;

  // Initial big burst from center
  confetti({
    particleCount: 140,
    spread: 90,
    startVelocity: 55,
    origin: { y: 0.55 },
    colors,
    zIndex: 10000,
  });

  // Side cannons
  (function frame() {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 70,
      origin: { x: 0, y: 0.7 },
      colors,
      zIndex: 10000,
    });
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 70,
      origin: { x: 1, y: 0.7 },
      colors,
      zIndex: 10000,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}
