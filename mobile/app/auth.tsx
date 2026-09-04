import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../src/lib/supabase';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function signIn() {
    if (!email || !password) return Alert.alert('Missing details', 'Enter your email and password.');
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return Alert.alert('Sign in failed', error.message);
    router.replace('/dashboard');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ignite HabitsPro</Text>
      <Text style={styles.subtitle}>Build habits. Stay consistent.</Text>
      <TextInput autoCapitalize="none" keyboardType="email-address" placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} />
      <TextInput secureTextEntry placeholder="Password" value={password} onChangeText={setPassword} style={styles.input} />
      <Pressable disabled={busy} onPress={signIn} style={styles.button}>
        <Text style={styles.buttonText}>{busy ? 'Signing in…' : 'Sign in'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, gap: 14 },
  title: { fontSize: 32, fontWeight: '800' },
  subtitle: { fontSize: 16, opacity: 0.65, marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 12, padding: 14, fontSize: 16 },
  button: { backgroundColor: '#111827', borderRadius: 12, padding: 15, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: '700', fontSize: 16 },
});
