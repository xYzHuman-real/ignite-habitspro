import { useEffect, useState } from "react";

export function useLocalPref(key: string, defaultValue: boolean): [boolean, (v: boolean) => void] {
  const storageKey = `pref:${key}`;
  const [value, setValue] = useState<boolean>(() => {
    if (typeof window === "undefined") return defaultValue;
    const raw = localStorage.getItem(storageKey);
    return raw === null ? defaultValue : raw === "true";
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, String(value));
    } catch {}
  }, [storageKey, value]);

  return [value, setValue];
}
