import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../src/auth/AuthContext';

export default function Auth() {
  const { signIn, signUp, resetPassword, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email.trim()) return Alert.alert('Email required', 'Enter your email address.');
    if (mode !== 'reset' && password.length < 6) return Alert.alert('Password too short', 'Use at least 6 characters.');
    if (mode === 'signup' && !name.trim()) return Alert.alert('Name required', 'Enter your full name.');
    setBusy(true);
    try {
      if (mode === 'login') {
        const { error } = await signIn(email.trim(), password);
        if (error) throw error;
        router.replace('/home');
      } else if (mode === 'signup') {
        const { error } = await signUp(email.trim(), password, name.trim());
        if (error) throw error;
        Alert.alert('Account created', 'Check your email if confirmation is required, then sign in.');
        setMode('login');
      } else {
        const { error } = await resetPassword(email.trim());
        if (error) throw error;
        Alert.alert('Email sent', 'If an account exists for that email, you will receive reset instructions.');
        setMode('login');
      }
    } catch (error: any) {
      Alert.alert('Authentication failed', error?.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const isBusy = busy || authLoading;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.brand}>Ignite HabitsPro</Text>
        <Text style={styles.title}>{mode === 'login' ? 'Welcome back' : mode === 'signup' ? 'Create your account' : 'Reset your password'}</Text>
        <Text style={styles.subtitle}>
          {mode === 'login' ? 'Sign in and keep your streak alive.' : mode === 'signup' ? 'Start building better habits today.' : 'Enter your email and we will send reset instructions.'}
        </Text>

        {mode === 'signup' && (
          <TextInput value={name} onChangeText={setName} placeholder="Full name" autoCapitalize="words" style={styles.input} />
        )}
        <TextInput value={email} onChangeText={setEmail} placeholder="Email" autoCapitalize="none" keyboardType="email-address" autoCorrect={false} style={styles.input} />
        {mode !== 'reset' && (
          <TextInput value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry style={styles.input} />
        )}

        <Pressable disabled={isBusy} style={[styles.button, isBusy && styles.disabled]} onPress={submit}>
          {isBusy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Email'}</Text>}
        </Pressable>

        {mode === 'login' && (
          <Pressable onPress={() => setMode('reset')}><Text style={styles.link}>Forgot password?</Text></Pressable>
        )}
        {mode !== 'reset' && (
          <Pressable onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}>
            <Text style={styles.link}>{mode === 'login' ? 'Create an account' : 'Already have an account? Sign in'}</Text>
          </Pressable>
        )}
        {mode === 'reset' && (
          <Pressable onPress={() => setMode('login')}><Text style={styles.link}>Back to sign in</Text></Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', justifyContent: 'center', padding: 20 },
  card: { borderWidth: 1, borderColor: '#e8e8e8', borderRadius: 24, padding: 22 },
  brand: { fontSize: 14, fontWeight: '800', opacity: 0.55, marginBottom: 18 },
  title: { fontSize: 28, fontWeight: '800' },
  subtitle: { marginTop: 8, marginBottom: 20, fontSize: 14, lineHeight: 20, opacity: 0.6 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, marginBottom: 12, fontSize: 15 },
  button: { minHeight: 48, borderRadius: 12, backgroundColor: '#1a1a2e', alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  disabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '800' },
  link: { textAlign: 'center', marginTop: 16, fontWeight: '700', color: '#1a1a2e' },
});
