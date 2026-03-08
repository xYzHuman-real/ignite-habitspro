import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Target, BookOpen, Users, ChevronRight, Sparkles, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface OnboardingProps {
  displayName: string;
  onComplete: () => void;
}

const steps = [
  {
    icon: Flame,
    title: "Track Your Habits",
    description: "Create daily habits and build streaks. The longer you stay consistent, the more XP and badges you earn!",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: Target,
    title: "Set Goals & Milestones",
    description: "Break big goals into milestones. Track progress with visual charts and celebrate every win along the way.",
    color: "text-accent",
    bg: "bg-accent/10",
  },
  {
    icon: BookOpen,
    title: "Reflect in Your Journal",
    description: "Write daily reflections, track your mood, and note your gratitude. Build self-awareness one entry at a time.",
    color: "text-success",
    bg: "bg-success/10",
  },
  {
    icon: Users,
    title: "Join the Community",
    description: "Compete on leaderboards, join challenges, find accountability partners, and grow together with like-minded people.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
];

export function Onboarding({ displayName, onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const isIntro = step === 0;
  const isEnd = step === steps.length + 1;
  const currentStep = steps[step - 1];

  const next = () => {
    if (isEnd) {
      onComplete();
    } else {
      setStep((s) => s + 1);
    }
  };

  const skip = () => onComplete();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm p-4">
      <AnimatePresence mode="wait">
        {isIntro && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md text-center space-y-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
              className="w-20 h-20 rounded-3xl bg-gradient-primary flex items-center justify-center mx-auto shadow-glow-primary"
            >
              <Sparkles className="h-10 w-10 text-primary-foreground" />
            </motion.div>
            <div>
              <h1 className="text-3xl font-display font-bold">
                Welcome, {displayName.split(" ")[0]}! 🎉
              </h1>
              <p className="text-muted-foreground mt-2">
                Let's take a quick tour of what you can do with Ignite HabitPro.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button onClick={next} className="w-full bg-gradient-primary text-primary-foreground shadow-glow-primary">
                Let's Go <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
              <Button variant="ghost" size="sm" onClick={skip} className="text-muted-foreground">
                Skip tour
              </Button>
            </div>
          </motion.div>
        )}

        {currentStep && !isEnd && (
          <motion.div
            key={`step-${step}`}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.35 }}
            className="w-full max-w-md space-y-6"
          >
            <Card className="p-8 text-center space-y-5">
              <div className={`w-16 h-16 rounded-2xl ${currentStep.bg} flex items-center justify-center mx-auto`}>
                <currentStep.icon className={`h-8 w-8 ${currentStep.color}`} />
              </div>
              <div>
                <h2 className="text-2xl font-display font-bold">{currentStep.title}</h2>
                <p className="text-muted-foreground mt-2 leading-relaxed">{currentStep.description}</p>
              </div>

              {/* Progress dots */}
              <div className="flex items-center justify-center gap-2">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === step - 1 ? "w-6 bg-primary" : "w-2 bg-muted"
                    }`}
                  />
                ))}
              </div>

              <div className="flex flex-col gap-2">
                <Button onClick={next} className="w-full bg-gradient-primary text-primary-foreground shadow-glow-primary">
                  {step === steps.length ? "Get Started" : "Next"} <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
                <Button variant="ghost" size="sm" onClick={skip} className="text-muted-foreground">
                  Skip
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {isEnd && (
          <motion.div
            key="end"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md text-center space-y-6"
          >
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
              className="w-20 h-20 rounded-3xl bg-gradient-primary flex items-center justify-center mx-auto shadow-glow-primary"
            >
              <Rocket className="h-10 w-10 text-primary-foreground" />
            </motion.div>
            <div>
              <h1 className="text-3xl font-display font-bold">You're All Set! 🚀</h1>
              <p className="text-muted-foreground mt-2">
                Start by creating your first habit. Consistency is the key — even one small step counts!
              </p>
            </div>
            <Button onClick={onComplete} className="w-full bg-gradient-primary text-primary-foreground shadow-glow-primary">
              Start Building Habits
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
