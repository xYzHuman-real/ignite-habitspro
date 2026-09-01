import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Screen, card } from "@/components/Screen";
import { supabase } from "@/lib/supabase";
import { colors } from "@/theme";

type Habit = { id: string; name?: string; title?: string; streak?: number; color?: string };

export default function HabitsScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.from("habits").select("*").order("created_at", { ascending: false }).then(({ data }) => { setHabits((data ?? []) as Habit[]); setLoading(false); });
  }, []);
  return (
    <Screen>
      <View style={styles.header}><View><Text style={styles.title}>Your habits</Text><Text style={styles.subtitle}>Small actions, repeated daily.</Text></View><Pressable style={styles.add}><Text style={styles.addText}>+ Add</Text></Pressable></View>
      {loading ? <ActivityIndicator color={colors.primary} /> : habits.length === 0 ? <View style={[card.base, styles.empty]}><Text style={styles.emptyTitle}>Start your first streak</Text><Text style={styles.emptyCopy}>Your existing web habits will appear here once the shared Supabase query is finalized.</Text></View> : habits.map((habit) => <View key={habit.id} style={[card.base, styles.habit]}><View style={[styles.dot, { backgroundColor: habit.color ?? colors.primary }]} /><View style={{ flex: 1 }}><Text style={styles.name}>{habit.name ?? habit.title ?? "Untitled habit"}</Text><Text style={styles.streak}>{habit.streak ?? 0} day streak</Text></View><View style={styles.circle} /></View>)}
    </Screen>
  );
}
const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, title: { color: colors.text, fontSize: 30, fontWeight: "800" }, subtitle: { color: colors.muted, marginTop: 4 }, add: { backgroundColor: colors.primary, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 }, addText: { color: "#fff", fontWeight: "800" }, empty: { alignItems: "center", gap: 8, paddingVertical: 32 }, emptyTitle: { color: colors.text, fontWeight: "800", fontSize: 18 }, emptyCopy: { color: colors.muted, textAlign: "center", lineHeight: 20 }, habit: { flexDirection: "row", alignItems: "center", gap: 12 }, dot: { width: 12, height: 12, borderRadius: 6 }, name: { color: colors.text, fontWeight: "700", fontSize: 16 }, streak: { color: colors.muted, marginTop: 3, fontSize: 12 }, circle: { height: 28, width: 28, borderRadius: 14, borderWidth: 2, borderColor: colors.primary },
});
