import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Quote, Copy, Share2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const QUOTES = [
  { text: "Small progress every day leads to big results.", author: "Unknown", emoji: "🌱" },
  { text: "Focus on the process, not the outcome.", author: "Unknown", emoji: "🎯" },
  { text: "Discipline beats motivation.", author: "Unknown", emoji: "💪" },
  { text: "Your future is created by what you do today.", author: "Robert Kiyosaki", emoji: "🚀" },
  { text: "Stay consistent and success will follow.", author: "Unknown", emoji: "⭐" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain", emoji: "🔥" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson", emoji: "⏳" },
  { text: "It's not about having time. It's about making time.", author: "Unknown", emoji: "⚡" },
  { text: "Success is the sum of small efforts repeated daily.", author: "Robert Collier", emoji: "📈" },
  { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown", emoji: "🏆" },
];

export function MotivationalQuotes() {
  const [current, setCurrent] = useState(() => {
    const day = Math.floor(Date.now() / 86400000);
    return day % QUOTES.length;
  });
  const [direction, setDirection] = useState(0);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pauseRef = useRef(false);

  const goNext = useCallback(() => {
    setDirection(1);
    setCurrent((p) => (p + 1) % QUOTES.length);
  }, []);

  const goPrev = useCallback(() => {
    setDirection(-1);
    setCurrent((p) => (p - 1 + QUOTES.length) % QUOTES.length);
  }, []);

  useEffect(() => {
    autoRef.current = setInterval(() => {
      if (!pauseRef.current) goNext();
    }, 7000);
    return () => { if (autoRef.current) clearInterval(autoRef.current); };
  }, [goNext]);

  const handleTouch = () => {
    pauseRef.current = true;
    setTimeout(() => { pauseRef.current = false; }, 5000);
  };

  const quote = QUOTES[current];

  const copyQuote = () => {
    navigator.clipboard.writeText(`"${quote.text}" — ${quote.author}`);
    toast.success("Quote copied!");
  };

  const shareQuote = async () => {
    if (navigator.share) {
      await navigator.share({ text: `"${quote.text}" — ${quote.author}` });
    } else {
      copyQuote();
    }
  };

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 200 : -200, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -200 : 200, opacity: 0 }),
  };

  return (
    <div className="rounded-2xl bg-card border border-border/40 shadow-sm p-5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
          <Quote className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold font-display">Daily Motivation</p>
          <p className="text-[10px] text-muted-foreground">Stay focused and keep going</p>
        </div>
      </div>

      {/* Carousel */}
      <div
        className="relative min-h-[120px] flex items-center"
        onTouchStart={handleTouch}
        onMouseDown={handleTouch}
      >
        <button onClick={goPrev} className="absolute left-0 z-10 w-7 h-7 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="w-full overflow-hidden px-8">
          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={current}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="rounded-xl border border-primary/15 bg-gradient-to-br from-primary/5 to-accent/5 p-4 text-center"
            >
              <span className="text-2xl mb-2 block">{quote.emoji}</span>
              <p className="text-sm font-medium leading-relaxed italic text-foreground/90">
                "{quote.text}"
              </p>
              <p className="text-xs text-muted-foreground mt-2 font-medium">— {quote.author}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        <button onClick={goNext} className="absolute right-0 z-10 w-7 h-7 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Dots + Actions */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex gap-1.5">
          {QUOTES.map((_, i) => (
            <button
              key={i}
              onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); handleTouch(); }}
              className={`w-1.5 h-1.5 rounded-full transition-all ${i === current ? "w-4 bg-primary" : "bg-muted-foreground/30"}`}
            />
          ))}
        </div>
        <div className="flex gap-1">
          <button onClick={copyQuote} className="w-7 h-7 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button onClick={shareQuote} className="w-7 h-7 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
