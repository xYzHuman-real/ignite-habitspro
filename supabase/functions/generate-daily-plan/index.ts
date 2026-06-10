import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse user preferences from request body (all optional)
    let prefs: {
      wakeTime?: string;
      sleepTime?: string;
      studyStart?: string;
      studyEnd?: string;
      workStart?: string;
      workEnd?: string;
      breakPreference?: string;
      goalFocus?: string;
    } = {};
    try {
      if (req.headers.get("content-length") !== "0") {
        prefs = await req.json();
      }
    } catch {}

    // Fetch user data in parallel
    const [habitsRes, todosRes, goalsRes, sessionsRes, profileRes] = await Promise.all([
      supabase.from("habits").select("name, icon, priority, streak, target, current, reminder_time, completed_today").eq("user_id", user.id),
      supabase.from("todos").select("text, priority, completed").eq("user_id", user.id).eq("completed", false),
      supabase.from("goals").select("title, description, target_value, current_value, unit, deadline, completed").eq("user_id", user.id).eq("completed", false),
      supabase.from("pomodoro_sessions").select("duration_minutes, session_type, linked_subject, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
      supabase.from("profiles").select("display_name, total_streak, leaderboard_points").eq("user_id", user.id).single(),
    ]);

    const habits = habitsRes.data || [];
    const todos = todosRes.data || [];
    const goals = goalsRes.data || [];
    const recentSessions = sessionsRes.data || [];
    const profile = profileRes.data;

    const now = new Date();
    const currentHour = now.getUTCHours();
    const dayOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][now.getUTCDay()];

    const systemPrompt = `You are an AI productivity coach for a student/deep-work productivity app called Ignite HabitPro. 
You create personalized daily schedules that are realistic, motivating, and balanced.

Rules:
- Return ONLY valid JSON, no markdown, no explanation
- Respect the user's wake/sleep window — do NOT schedule before wake or after sleep
- Honor declared study/work hours as the prime deep-focus blocks
- Match break style to the user's preference (short frequent vs long sparse)
- Prioritize the user's stated goal focus when choosing what to deep-work on
- Include breaks every 60-90 minutes (unless preference says otherwise)
- Mix habits, todos, and focus sessions naturally
- Include meal breaks and wind-down time
- Be encouraging but realistic
- Each block has: time (HH:MM format, 24h), duration (minutes), title, type (habit|todo|focus|break|meal|wind_down), icon (emoji), priority (high|medium|low), tip (short motivational/practical tip)

JSON structure:
{
  "greeting": "personalized greeting mentioning their name and streak",
  "summary": "brief overview of what today looks like",
  "schedule": [{ "time": "09:00", "duration": 30, "title": "...", "type": "...", "icon": "...", "priority": "...", "tip": "..." }],
  "motivation": "end-of-day motivational message"
}`;

    const prefsBlock = `
USER PREFERENCES:
- Wake time: ${prefs.wakeTime || "not specified"}
- Sleep time: ${prefs.sleepTime || "not specified"}
- Study hours: ${prefs.studyStart && prefs.studyEnd ? `${prefs.studyStart}–${prefs.studyEnd}` : "not specified"}
- Work hours: ${prefs.workStart && prefs.workEnd ? `${prefs.workStart}–${prefs.workEnd}` : "not specified"}
- Break style: ${prefs.breakPreference || "balanced (5 min every 25-30 min of focus)"}
- Primary goal focus today: ${prefs.goalFocus || "balanced across all goals"}
`;

    const userPrompt = `Generate a daily schedule for today (${dayOfWeek}).

User: ${profile?.display_name || "Student"} (${profile?.total_streak || 0}-day streak, ${profile?.leaderboard_points || 0} points)
Current time: approximately ${currentHour}:00
${prefsBlock}
HABITS (${habits.length}):
${habits.map((h) => `- ${h.icon} ${h.name} (${h.priority}, streak: ${h.streak}, ${h.completed_today ? "DONE TODAY" : "not done yet"}${h.reminder_time ? `, preferred time: ${h.reminder_time}` : ""})`).join("\n") || "No habits yet"}

PENDING TODOS (${todos.length}):
${todos.map((t) => `- ${t.text} (${t.priority} priority)`).join("\n") || "No pending todos"}

ACTIVE GOALS (${goals.length}):
${goals.map((g) => `- ${g.title}: ${g.current_value}/${g.target_value} ${g.unit}${g.deadline ? ` (deadline: ${g.deadline})` : ""}`).join("\n") || "No active goals"}

RECENT FOCUS PATTERNS:
${recentSessions.map((s) => `- ${s.duration_minutes}min ${s.session_type}${s.linked_subject ? ` on ${s.linked_subject}` : ""}`).join("\n") || "No recent sessions"}

Create a balanced, achievable schedule starting from around ${currentHour}:00 and ending by the user's sleep time. Skip habits already completed today.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "AI rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices?.[0]?.message?.content || "";

    // Strip markdown code fences if present
    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    let plan;
    try {
      plan = JSON.parse(content);
    } catch {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse AI schedule");
    }

    return new Response(JSON.stringify(plan), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-daily-plan error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
