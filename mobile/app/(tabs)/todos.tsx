import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Screen, card } from "@/components/Screen";
import { useCurrentUser, useTodos } from "@/hooks/useMobileData";
import { colors } from "@/theme";

export default function TodosScreen() {
  const { user } = useCurrentUser();
  const { todos, loading, add, toggle } = useTodos(user);
  const [draft, setDraft] = useState("");
  const completed = todos.filter((todo) => todo.completed).length;

  const addTodo = async () => {
    try { await add(draft); setDraft(""); }
    catch (error) { Alert.alert("Could not add task", error instanceof Error ? error.message : "Please try again."); }
  };

  return <Screen>
    <View><Text style={styles.title}>To-do list</Text><Text style={styles.subtitle}>{completed}/{todos.length} complete today</Text></View>
    <View style={styles.composer}><TextInput value={draft} onChangeText={setDraft} onSubmitEditing={addTodo} placeholder="Add a task…" placeholderTextColor={colors.muted} style={styles.input} /><Pressable onPress={addTodo} style={styles.add}><Text style={styles.addText}>Add</Text></Pressable></View>
    {loading ? <ActivityIndicator color={colors.primary} /> : todos.length === 0 ? <View style={[card.base, styles.empty]}><Text style={styles.emptyTitle}>Your day is clear</Text><Text style={styles.emptyCopy}>Add a task to turn intention into action.</Text></View> : todos.map((todo) => <Pressable key={todo.id} onPress={() => toggle(todo)} style={[card.base, styles.todo]}><View style={[styles.check, todo.completed && styles.checked]}>{todo.completed && <Text style={styles.tick}>✓</Text>}</View><Text style={[styles.todoText, todo.completed && styles.done]}>{todo.text}</Text><View style={[styles.priority, { backgroundColor: todo.priority === "high" ? "#7A3333" : colors.surfaceElevated }]} /></Pressable>)}
  </Screen>;
}
const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 30, fontWeight: "800" }, subtitle: { color: colors.muted, marginTop: 4 }, composer: { flexDirection: "row", gap: 8 }, input: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, color: colors.text, borderRadius: 14, paddingHorizontal: 14 }, add: { justifyContent: "center", paddingHorizontal: 18, borderRadius: 14, backgroundColor: colors.primary }, addText: { color: "#fff", fontWeight: "800" }, empty: { alignItems: "center", gap: 8, paddingVertical: 32 }, emptyTitle: { color: colors.text, fontWeight: "800", fontSize: 18 }, emptyCopy: { color: colors.muted, textAlign: "center" }, todo: { flexDirection: "row", alignItems: "center", gap: 12 }, check: { width: 24, height: 24, borderRadius: 8, borderWidth: 1, borderColor: colors.muted, alignItems: "center", justifyContent: "center" }, checked: { backgroundColor: colors.success, borderColor: colors.success }, tick: { color: "#fff", fontWeight: "900" }, todoText: { flex: 1, color: colors.text, fontSize: 16 }, done: { color: colors.muted, textDecorationLine: "line-through" }, priority: { width: 7, height: 28, borderRadius: 4 },
});
