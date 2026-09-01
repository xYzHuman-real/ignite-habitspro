import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme";

export function MetricCard({ label, value, accent = colors.primary }: { label: string; value: string; accent?: string }) {
  return (
    <View style={[styles.card, { borderLeftColor: accent }]}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minWidth: "30%", padding: 14, borderRadius: 16, backgroundColor: colors.surface, borderLeftWidth: 3 },
  value: { color: colors.text, fontSize: 22, fontWeight: "800" },
  label: { color: colors.muted, fontSize: 12, marginTop: 4 },
});
