import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Screen, card } from "@/components/Screen";
import { colors } from "@/theme";

export default function FocusScreen() {
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(id);
  }, [running]);
  const time = useMemo(() => String(Math.floor(seconds / 60)).padStart(2, "0") + ":" + String(seconds % 60).padStart(2, "0"), [seconds]);
  return <Screen>
    <View style={styles.center}><Text style={styles.kicker}>FOCUS SESSION</Text><Text style={styles.time}>{time}</Text><Text style={styles.copy}>Stay with one meaningful task.</Text><Pressable style={styles.start} onPress={() => setRunning(!running)}><Text style={styles.startText}>{running ? "Pause" : "Start focus"}</Text></Pressable><Pressable onPress={() => { setRunning(false); setSeconds(25 * 60); }}><Text style={styles.reset}>Reset timer</Text></Pressable></View>
    <View style={[card.base, styles.notice]}><Text style={styles.noticeTitle}>Native focus protection is next</Text><Text style={styles.noticeCopy}>Blocking selected distraction apps requires Android-native code and an approved permissions flow.</Text></View>
  </Screen>;
}
const styles = StyleSheet.create({
  center: { alignItems: "center", paddingVertical: 48, gap: 12 }, kicker: { color: colors.primarySoft, fontSize: 12, fontWeight: "800", letterSpacing: 1.4 }, time: { color: colors.text, fontSize: 68, fontWeight: "800", fontVariant: ["tabular-nums"] }, copy: { color: colors.muted }, start: { marginTop: 20, width: "100%", paddingVertical: 16, borderRadius: 16, backgroundColor: colors.primary, alignItems: "center" }, startText: { color: "#fff", fontSize: 16, fontWeight: "800" }, reset: { color: colors.muted, marginTop: 4 }, notice: { gap: 6 }, noticeTitle: { color: colors.text, fontWeight: "800" }, noticeCopy: { color: colors.muted, lineHeight: 20 },
});
