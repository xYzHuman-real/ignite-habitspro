import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../src/auth/AuthContext';

export default function Index() {
  const { user, loading } = useAuth();
  useEffect(() => { if (!loading) router.replace(user ? '/dashboard' : '/auth'); }, [loading, user?.id]);
  return <View style={styles.container}><Text style={styles.title}>Ignite HabitsPro</Text><Text style={styles.subtitle}>Build better habits. One day at a time.</Text><ActivityIndicator style={styles.spinner} /></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#fff' }, title: { fontSize: 32, fontWeight: '800', textAlign: 'center' }, subtitle: { marginTop: 12, fontSize: 16, opacity: 0.7, textAlign: 'center' }, spinner: { marginTop: 28 },
});
