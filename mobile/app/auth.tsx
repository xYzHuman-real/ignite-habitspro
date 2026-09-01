import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "@/components/Screen";
import { supabase } from "@/lib/supabase";
import { colors } from "@/theme";

export default function AuthScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const signIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) return Alert.alert("Could not sign in", error.message);
    router.replace("/(tabs)");
  };

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>IGNITE HABITPRO</Text>
        <Text style={styles.title}>Build a life{"\n"}you’re proud of.</Text>
        <Text style={styles.subtitle}>Your habits, focus, and goals—one calm place.</Text>
      </View>
      <View style={styles.form}>
        <TextInput value={email} onChangeText={setEmail} placeholder="Email address" placeholderTextColor={colors.muted} autoCapitalize="none" keyboardType="email-address" style={styles.input} />
        <TextInput value={password} onChangeText={setPassword} placeholder="Password" placeholderTextColor={colors.muted} secureTextEntry style={styles.input} />
        <Pressable style={[styles.button, loading && styles.disabled]} onPress={signIn} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? "Signing in…" : "Continue"}</Text>
        </Pressable>
        <Text style={styles.note}>Account registration and password reset will be migrated next.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { paddingTop: 72, gap: 12 },
  eyebrow: { color: colors.primarySoft, fontWeight: "800", fontSize: 12, letterSpacing: 1.5 },
  title: { color: colors.text, fontSize: 38, fontWeight: "800", lineHeight: 44 },
  subtitle: { color: colors.muted, fontSize: 16, lineHeight: 23 },
  form: { marginTop: 36, gap: 14 },
  input: { height: 54, borderRadius: 16, borderWidth: 1, borderColor: colors.border, color: colors.text, paddingHorizontal: 16, backgroundColor: colors.surface },
  button: { backgroundColor: colors.primary, height: 54, borderRadius: 16, alignItems: "center", justifyContent: "center", marginTop: 4 },
  disabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  note: { color: colors.muted, textAlign: "center", fontSize: 12, marginTop: 6 },
});
