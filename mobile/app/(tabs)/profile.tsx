import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Screen, card } from "@/components/Screen";
import { supabase } from "@/lib/supabase";
import { colors } from "@/theme";

export default function ProfileScreen() {
  const signOut = async () => {
    await supabase.auth.signOut();
    router.replace("/auth");
  };
  return <Screen>
    <View style={styles.identity}><View style={styles.avatar}><Text style={styles.initial}>I</Text></View><Text style={styles.name}>Your Ignite profile</Text><Text style={styles.level}>Level 1 · Building momentum</Text></View>
    <View style={[card.base, styles.menu]}>{["Weekly report", "Journal", "Goals", "Community", "Settings"].map((item) => <Pressable key={item} onPress={() => Alert.alert("Coming next", item + " is queued for the native migration.")}><Text style={styles.menuText}>{item}</Text></Pressable>)}</View>
    <Pressable onPress={signOut} style={styles.signOut}><Text style={styles.signOutText}>Sign out</Text></Pressable>
  </Screen>;
}
const styles = StyleSheet.create({
  identity: { alignItems: "center", paddingTop: 20, gap: 6 }, avatar: { width: 76, height: 76, borderRadius: 38, backgroundColor: colors.primary, justifyContent: "center", alignItems: "center" }, initial: { color: "#fff", fontSize: 30, fontWeight: "800" }, name: { color: colors.text, fontSize: 22, fontWeight: "800", marginTop: 6 }, level: { color: colors.muted }, menu: { paddingVertical: 0, overflow: "hidden" }, menuText: { color: colors.text, paddingVertical: 18, fontSize: 16, borderBottomWidth: 1, borderBottomColor: colors.border }, signOut: { borderWidth: 1, borderColor: "#7A3333", borderRadius: 16, alignItems: "center", paddingVertical: 15 }, signOutText: { color: "#F08484", fontWeight: "800" },
});
