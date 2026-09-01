import { Pressable, StyleSheet, Text, View } from "react-native";
import { Screen, card } from "@/components/Screen";
import { colors } from "@/theme";

const blocks = [["08:00", "Morning routine"], ["10:00", "Deep work"], ["14:00", "Study session"], ["19:00", "Reflect & plan"]];

export default function PlannerScreen() {
  return <Screen>
    <View><Text style={styles.title}>Daily planner</Text><Text style={styles.subtitle}>A gentle plan for your best day.</Text></View>
    <Pressable style={styles.primary}><Text style={styles.primaryText}>Generate today’s plan</Text></Pressable>
    <View style={[card.base, styles.plan]}>{blocks.map(([time, title]) => <View key={time} style={styles.item}><Text style={styles.time}>{time}</Text><View style={styles.line} /><Text style={styles.itemText}>{title}</Text></View>)}</View>
    <Text style={styles.note}>AI plan generation will use the existing Supabase function after it is migrated and tested on mobile.</Text>
  </Screen>;
}
const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 30, fontWeight: "800" }, subtitle: { color: colors.muted, marginTop: 4 }, primary: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 16, alignItems: "center" }, primaryText: { color: "#fff", fontWeight: "800" }, plan: { gap: 18 }, item: { flexDirection: "row", alignItems: "center", gap: 12 }, time: { color: colors.primarySoft, width: 42, fontWeight: "800", fontSize: 12 }, line: { height: 1, width: 12, backgroundColor: colors.border }, itemText: { color: colors.text, fontSize: 16, fontWeight: "700" }, note: { color: colors.muted, fontSize: 13, lineHeight: 20 },
});
