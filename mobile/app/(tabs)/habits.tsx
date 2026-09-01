import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Screen, card } from "@/components/Screen";
import { useCurrentUser, useHabits } from "@/hooks/useMobileData";
import { colors } from "@/theme";

export default function HabitsScreen() {
  const { user } = useCurrentUser();
  const { habits, loading, add, toggle } = useHabits(user);
  const [draft, setDraft] = useState("");
  const [showComposer, setShowComposer] = useState(false);

  const addHabit = async () => {
    try { await add(draft); setDraft(""); setShowComposer(false); }
    catch (error) { Alert.alert("Could not add habit", error instanceof Error ? error.message : "Please try again."); }
  };

  return <Screen>
    <View style={styles.header}><View><Text style={styles.title}>Your habits</Text><Text style={styles.subtitle}>Small actions, repeated daily.</Text></View><Pressable style={styles.add} onPress={() => setShowComposer(!showComposer)}><Text style={styles.addText}>+ Add</Text></Pressable></View>
    {showComposer && <View style={[card.base, styles.composer]}><TextInput autoFocus value={draft} onChangeText={setDraft} placeholder="e.g. Read for 20 minutes" placeholderTextColor={colors.muted} style={styles.input} onSubmitEditing={addHabit} /><Pressable onPress={addHabit} style={styles.save}><Text style={styles.saveText}>Save habit</Text></Pressable></View>}
    {loading ? <ActivityIndicator color={colors.primary} /> : habits.length === 0 ? <View style={[card.base, styles.empty]}><Text style={styles.emptyTitle}>Start your first streak</Text><Text style={styles.emptyCopy}>Add the first action you want to repeat daily.</Text></View> : habits.map((habit) => <Pressable key={habit.id} onPress={() => toggle(habit)} style={[card.base, styles.habit]}><Text style={styles.icon}>{habit.icon || "✨"}</Text><View style={{ flex: 1 }}><Text style={styles.name}>{habit.name}</Text><Text style={styles.streak}>{habit.streak || 0} day streak · {habit.current}/{habit.target} today</Text></View><View style={[styles.circle, habit.completed_today && styles.completed]}>{habit.completed_today && <Text style={styles.tick}>✓</Text>}</View></Pressable>)}
  </Screen>;
}
const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, title: { color: colors.text, fontSize: 30, fontWeight: "800" }, subtitle: { color: colors.muted, marginTop: 4 }, add: { backgroundColor: colors.primary, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 }, addText: { color: "#fff", fontWeight: "800" }, composer: { gap: 10 }, input: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, color: colors.text, height: 48, paddingHorizontal: 12 }, save: { alignItems: "center", borderRadius: 12, padding: 13, backgroundColor: colors.primary }, saveText: { color: "#fff", fontWeight: "800" }, empty: { alignItems: "center", gap: 8, paddingVertical: 32 }, emptyTitle: { color: colors.text, fontWeight: "800", fontSize: 18 }, emptyCopy: { color: colors.muted, textAlign: "center", lineHeight: 20 }, habit: { flexDirection: "row", alignItems: "center", gap: 12 }, icon: { fontSize: 24 }, name: { color: colors.text, fontWeight: "700", fontSize: 16 }, streak: { color: colors.muted, marginTop: 3, fontSize: 12 }, circle: { height: 30, width: 30, borderRadius: 15, borderWidth: 2, borderColor: colors.primary, alignItems: "center", justifyContent: "center" }, completed: { backgroundColor: colors.success, borderColor: colors.success }, tick: { color: "#fff", fontWeight: "900" },
});
