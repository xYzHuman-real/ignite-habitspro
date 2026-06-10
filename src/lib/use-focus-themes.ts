import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export interface FocusTheme {
  id: string;
  name: string;
  value: string;
  icon: string;
  owned: boolean;
  gradient: string;
  bgClass: string;
  textClass: string;
}

const THEME_STYLES: Record<string, { gradient: string; bgClass: string; textClass: string }> = {
  default_light_blue: {
    gradient: "linear-gradient(135deg, hsl(200 80% 60%), hsl(210 90% 45%))",
    bgClass: "from-sky-400/20 to-blue-600/20",
    textClass: "text-sky-100",
  },
  blue_minimal: {
    gradient: "linear-gradient(135deg, hsl(210 60% 20%), hsl(220 80% 30%))",
    bgClass: "from-blue-900/30 to-indigo-900/30",
    textClass: "text-blue-100",
  },
  yellow_energy: {
    gradient: "linear-gradient(135deg, hsl(40 90% 50%), hsl(30 85% 45%))",
    bgClass: "from-violet-500/20 to-purple-500/20",
    textClass: "text-violet-100",
  },
  study_room: {
    gradient: "linear-gradient(135deg, hsl(30 40% 25%), hsl(25 30% 18%))",
    bgClass: "from-purple-900/30 to-violet-950/30",
    textClass: "text-violet-100",
  },
  night_desk: {
    gradient: "linear-gradient(135deg, hsl(240 30% 12%), hsl(260 40% 18%))",
    bgClass: "from-slate-900/40 to-purple-950/40",
    textClass: "text-purple-100",
  },
  forest_zen: {
    gradient: "linear-gradient(135deg, hsl(140 40% 20%), hsl(160 50% 15%))",
    bgClass: "from-violet-900/30 to-purple-900/30",
    textClass: "text-violet-100",
  },
  sunset_glow: {
    gradient: "linear-gradient(135deg, hsl(20 85% 50%), hsl(340 70% 45%))",
    bgClass: "from-violet-500/20 to-purple-600/20",
    textClass: "text-purple-100",
  },
};

const DEFAULT_THEME: FocusTheme = {
  id: "default",
  name: "Light Blue",
  value: "default_light_blue",
  icon: "💎",
  owned: true,
  ...THEME_STYLES.default_light_blue,
};

export function useFocusThemes() {
  const { user } = useAuth();
  const [activeTheme, setActiveTheme] = useState<string>(() => {
    return localStorage.getItem("focus_theme") || "default_light_blue";
  });

  const { data: purchasedThemes = [] } = useQuery({
    queryKey: ["purchased_themes", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data: purchases } = await supabase
        .from("shop_purchases")
        .select("item_id, shop_items!inner(item_type, item_value, name, icon)")
        .eq("user_id", user.id);
      if (!purchases) return [];
      return purchases
        .filter((p: any) => p.shop_items?.item_type === "focus_theme")
        .map((p: any) => p.shop_items.item_value as string);
    },
    enabled: !!user,
  });

  const allThemes: FocusTheme[] = [
    DEFAULT_THEME,
    ...Object.entries(THEME_STYLES)
      .filter(([key]) => key !== "default_light_blue")
      .map(([value, styles]) => ({
        id: value,
        name: value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        value,
        icon: value === "blue_minimal" ? "🔵" : value === "yellow_energy" ? "🟡" : value === "study_room" ? "📚" : value === "night_desk" ? "🌙" : value === "forest_zen" ? "🌿" : "🌅",
        owned: purchasedThemes.includes(value),
        ...styles,
      })),
  ];

  // Sync across hook instances via custom storage event
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === "focus_theme" && e.newValue) {
        setActiveTheme(e.newValue);
      }
    };
    const customHandler = (e: Event) => {
      const val = localStorage.getItem("focus_theme");
      if (val) setActiveTheme(val);
    };
    window.addEventListener("storage", handler);
    window.addEventListener("focus_theme_changed", customHandler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener("focus_theme_changed", customHandler);
    };
  }, []);

  const selectTheme = (themeValue: string) => {
    setActiveTheme(themeValue);
    localStorage.setItem("focus_theme", themeValue);
    window.dispatchEvent(new Event("focus_theme_changed"));
  };

  const currentTheme = allThemes.find((t) => t.value === activeTheme) || DEFAULT_THEME;
  const ownedThemes = allThemes.filter((t) => t.owned);

  return { allThemes, ownedThemes, currentTheme, selectTheme, activeTheme };
}
