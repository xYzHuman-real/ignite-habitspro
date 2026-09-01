import { StyleSheet, Text, View } from "react-native";
import { Screen, card } from "@/components/Screen";
import { MetricCard } from "@/components/MetricCard";
import { colors } from "@/theme";

export default function Dashboard() {
  return (
    <Screen>
      <View><Text style={styles.greeting}>Good morning 👋</Text><Text style={styles.title}>Make today count.</Text></View>
      <View style={styles.metrics}><MetricCard value="7" label="Day streak" /><MetricCard value="3/5" label="Habits done" accent={colors.success} /><MetricCard value="42m" label="Focus today" accent={colors.warning} /></View>
      <View style={[card.base, styles.focus]}><Text style={styles.kicker}>UP NEXT</Text><Text style={styles.focusTitle}>Deep work session</Text><Text style={styles.detail}>25 minutes · Keep your momentum going.</Text></View>
      <View style={[card.base, styles.section]}><Text style={styles.sectionTitle}>Today’s habits</Text>{["Morning movement", "Read for 20 minutes", "Plan tomorrow"].map((habit, index) => <View key={habit} style={styles.row}><View style={[styles.check, index === 0 && styles.checked]} /><Text style={[styles.habit, index === 0 && styles.done]}>{habit}</Text></View>)}</View>
    </Screen>
  );
}
const styles = StyleSheet.create({
  greeting: { color: colors.muted, fontSize: 15 }, title: { color: colors.text, fontSize: 30, fontWeight: "800", marginTop: 4 }, metrics: { flexDirection: "row", gap: 10 }, focus: { backgroundColor: "#322117", borderColor: "#70402C", gap: 6 }, kicker: { color: colors.primarySoft, fontWeight: "800", fontSize: 11, letterSpacing: 1.1 }, focusTitle: { color: colors.text, fontSize: 20, fontWeight: "800" }, detail: { color: colors.muted, fontSize: 14 }, section: { gap: 14 }, sectionTitle: { color: colors.text, fontSize: 18, fontWeight: "800" }, row: { flexDirection: "row", alignItems: "center", gap: 12 }, check: { width: 22, height: 22, borderWidth: 1, borderColor: colors.muted, borderRadius: 8 }, checked: { backgroundColor: colors.success, borderColor: colors.success }, habit: { color: colors.text, fontSize: 15 }, done: { color: colors.muted, textDecorationLine: "line-through" },
});
