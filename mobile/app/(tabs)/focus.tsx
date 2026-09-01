import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Screen, card } from "@/components/Screen";
import { useCurrentUser, useFocusSessions } from "@/hooks/useMobileData";
import { colors } from "@/theme";

const DURATION = 25 * 60;

export default function FocusScreen() {
  const [seconds, setSeconds] = useState(DURATION);
  const [running, setRunning] = useState(false);
  const finished = useRef(false);
  const { user } = useCurrentUser();
  const { addSession } = useFocusSessions(user);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (seconds !== 0 || finished.current) return;
    finished.current = true;
    setRunning(false);
    addSession(25).then(() => Alert.alert("Focus session complete", "Great work—25 focused minutes saved to your history.")).catch(() => Alert.alert("Session finished", "Your timer finished, but we could not save the session."));
  }, [addSession, seconds]);

  const reset = () => { finished.current = false; setRunning(false); setSeconds(DURATION); };
  const time = useMemo(() => String(Math.floor(seconds / 60)).padStart(2, "0") + ":" + String(seconds % 60).padStart(2, "0"), [seconds]);
  return <Screen>
    <View style={styles.center}><Text style={styles.kicker}>FOCUS SESSION</Text><Text style={styles.time}>{time}</Text><Text style={styles.copy}>Stay with one meaningful task.</Text><Pressable style={styles.start} onPress={() => setRunning(!running)}><Text style={styles.startText}>{running ? "Pause" : "Start focus"}</Text></Pressable><Pressable onPress={reset}><Text style={styles.reset}>Reset timer</Text></Pressable></View>
    <View style={[card.base, styles.notice]}><Text style={styles.noticeTitle}>Native focus protection is next</Text><Text style={styles.noticeCopy}>Blocking selected distraction apps requires Android-native code and an approved permissions flow.</Text></View>
  </Screen>;
}
const styles = StyleSheet.create({
  center: { alignItems: "center", paddingVertical: 48, gap: 12 }, kicker: { color: colors.primarySoft, fontSize: 12, fontWeight: "800", letterSpacing: 1.4 }, time: { color: colors.text, fontSize: 68, fontWeight: "800", fontVariant: ["tabular-nums"] }, copy: { color: colors.muted }, start: { marginTop: 20, width: "100%", paddingVertical: 16, borderRadius: 16, backgroundColor: colors.primary, alignItems: "center" }, startText: { color: "#fff", fontSize: 16, fontWeight: "800" }, reset: { color: colors.muted, marginTop: 4 }, notice: { gap: 6 }, noticeTitle: { color: colors.text, fontWeight: "800" }, noticeCopy: { color: colors.muted, lineHeight: 20 },
});
