import { useEffect, useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

type Status = "idle" | "checking" | "available" | "taken" | "invalid";

interface Props {
  value: string;
  onChange: (v: string) => void;
  currentUsername?: string | null;
  onValidityChange?: (valid: boolean) => void;
}

const FORMAT_RE = /^[a-z0-9._]{3,20}$/;

export function UsernameField({ value, onChange, currentUsername, onValidityChange }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Normalize as user types
  const handleChange = (raw: string) => {
    const normalized = raw.toLowerCase().replace(/[^a-z0-9._]/g, "").slice(0, 20);
    onChange(normalized);
  };

  useEffect(() => {
    setSuggestions([]);
    if (!value) {
      setStatus("idle");
      onValidityChange?.(true); // empty allowed (optional)
      return;
    }
    if (!FORMAT_RE.test(value)) {
      setStatus("invalid");
      onValidityChange?.(false);
      return;
    }
    if (currentUsername && value === currentUsername) {
      setStatus("available");
      onValidityChange?.(true);
      return;
    }

    let cancelled = false;
    setStatus("checking");
    onValidityChange?.(false);
    const t = window.setTimeout(async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .ilike("username", value)
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        setStatus("idle");
        return;
      }
      if (data) {
        setStatus("taken");
        onValidityChange?.(false);
        // Fetch suggestions
        const { data: sugg } = await supabase.rpc("suggest_usernames", { base: value });
        if (!cancelled && Array.isArray(sugg)) setSuggestions(sugg as string[]);
      } else {
        setStatus("available");
        onValidityChange?.(true);
      }
    }, 350);

    return () => { cancelled = true; window.clearTimeout(t); };
  }, [value, currentUsername]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">@</span>
        <Input
          placeholder="username"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          className="pl-7 pr-10 lowercase"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {status === "checking" && <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />}
          {status === "available" && <Check className="h-4 w-4 text-success" />}
          {(status === "taken" || status === "invalid") && <X className="h-4 w-4 text-destructive" />}
        </div>
      </div>

      {status === "invalid" && (
        <p className="text-xs text-destructive">
          3–20 characters, lowercase letters, numbers, dot, or underscore.
        </p>
      )}
      {status === "taken" && (
        <div className="space-y-1.5">
          <p className="text-xs text-destructive font-medium">Username already taken.</p>
          {suggestions.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <span className="text-xs text-muted-foreground mr-1 self-center">Try:</span>
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onChange(s)}
                  className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium"
                >
                  @{s}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {status === "available" && value !== currentUsername && (
        <p className="text-xs text-success">Available</p>
      )}
    </div>
  );
}
