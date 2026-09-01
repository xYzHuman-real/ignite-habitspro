import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Screen, card } from "@/components/Screen";
import { useCurrentUser } from "@/hooks/useMobileData";
import { supabase } from "@/lib/supabase";
import { colors } from "@/theme";

const routes = [{ label: "To-do list", path: "/todos" }, { label: "Weekly report", path: null }, { label: "Journal", path: null }, { label: "Goals", path: null }, { label: "Community", path: null }, { label: "Settings", path: null }];

export default function ProfileScreen() {
  const { user } = useCurrentUser();
  const signOut = async () => { await supabase.auth.signOut(); router.replace("/auth"); };
  const name = (user?.user_metadata.full_name as string | undefined) || user?.email?.split("@")[0] || "Your Ignite profile";
  return <Screen>
    <View style={styles.identity}><View style={styles.avatar}><Text style={styles.initial}>{name.slice(0, 1).toUpperCase()}</Text></View><Text style={styles.name}>{name}</Text><Text style={styles.level}>Building momentum</Text></View>
    <View style={[card.base, styles.menu]}>{routes.map(({ label, path }) => <Pressable key={label} onPress={() => path && router.push(path as never)} disabled={!path}><Text style={[styles.menuText, !path && styles.muted]}>{label}</Text></Pressable>)}</View>
    <Pressable onPress={signOut} style={styles.signOut}><Text style={styles.signOutText}>Sign out</Text></Pressable>
  </Screen>;
}
const styles = StyleSheet.create({
  identity: { alignItems: "center", paddingTop: 20, gap: 6 }, avatar: { width: 76, height: 76, borderRadius: 38, backgroundColor: colors.primary, justifyContent: "center", alignItems: "center" }, initial: { color: "#fff", fontSize: 30, fontWeight: "800" }, name: { color: colors.text, fontSize: 22, fontWeight: "800", marginTop: 6 }, level: { color: colors.muted }, menu: { paddingVertical: 0, overflow: "hidden" }, menuText: { color: colors.text, paddingVertical: 18, fontSize: 16, borderBottomWidth: 1, borderBottomColor: colors.border }, muted: { color: colors.muted }, signOut: { borderWidth: 1, borderColor: "#7A3333", borderRadius: 16, alignItems: "center", paddingVertical: 15 }, signOutText: { color: "#F08484", fontWeight: "800" },
});
