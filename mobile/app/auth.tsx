import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "@/components/Screen";
import { supabase } from "@/lib/supabase";
import { colors } from "@/theme";

type Mode = "signin" | "signup" | "reset";

export default function AuthScreen() {
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    if (mode === "reset") {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      setLoading(false);
      return error ? Alert.alert("Could not send reset link", error.message) : Alert.alert("Check your inbox", "We sent a password reset link to your email.");
    }
    if (mode === "signup") {
      if (!name.trim()) { setLoading(false); return Alert.alert("Name required", "Enter your name to create an account."); }
      const { error } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { full_name: name.trim() } } });
      setLoading(false);
      return error ? Alert.alert("Could not create account", error.message) : Alert.alert("Check your inbox", "Confirm your email, then sign in.");
    }
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) return Alert.alert("Could not sign in", error.message);
    router.replace("/(tabs)");
  };

  const title = mode === "signin" ? "Welcome back." : mode === "signup" ? "Start your streak." : "Reset password.";
  return <Screen>
    <View style={styles.hero}><Text style={styles.eyebrow}>IGNITE HABITPRO</Text><Text style={styles.title}>{title}</Text><Text style={styles.subtitle}>Your habits, focus, and goals—one calm place.</Text></View>
    <View style={styles.form}>
      {mode === "signup" && <TextInput value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor={colors.muted} style={styles.input} />}
      <TextInput value={email} onChangeText={setEmail} placeholder="Email address" placeholderTextColor={colors.muted} autoCapitalize="none" keyboardType="email-address" style={styles.input} />
      {mode !== "reset" && <TextInput value={password} onChangeText={setPassword} placeholder="Password" placeholderTextColor={colors.muted} secureTextEntry style={styles.input} />}
      <Pressable style={[styles.button, loading && styles.disabled]} onPress={submit} disabled={loading}><Text style={styles.buttonText}>{loading ? "Please wait…" : mode === "signin" ? "Continue" : mode === "signup" ? "Create account" : "Send reset link"}</Text></Pressable>
      {mode === "signin" && <><Pressable onPress={() => setMode("reset")}><Text style={styles.link}>Forgot password?</Text></Pressable><Pressable onPress={() => setMode("signup")}><Text style={styles.link}>New here? Create an account</Text></Pressable></>}
      {mode !== "signin" && <Pressable onPress={() => setMode("signin")}><Text style={styles.link}>Back to sign in</Text></Pressable>}
    </View>
  </Screen>;
}
const styles = StyleSheet.create({
  hero: { paddingTop: 72, gap: 12 }, eyebrow: { color: colors.primarySoft, fontWeight: "800", fontSize: 12, letterSpacing: 1.5 }, title: { color: colors.text, fontSize: 38, fontWeight: "800", lineHeight: 44 }, subtitle: { color: colors.muted, fontSize: 16, lineHeight: 23 }, form: { marginTop: 36, gap: 14 }, input: { height: 54, borderRadius: 16, borderWidth: 1, borderColor: colors.border, color: colors.text, paddingHorizontal: 16, backgroundColor: colors.surface }, button: { backgroundColor: colors.primary, height: 54, borderRadius: 16, alignItems: "center", justifyContent: "center", marginTop: 4 }, disabled: { opacity: 0.6 }, buttonText: { color: "#fff", fontWeight: "800", fontSize: 16 }, link: { color: colors.primarySoft, textAlign: "center", fontSize: 13, fontWeight: "700", marginTop: 4 },
});
