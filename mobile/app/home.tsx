import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../src/auth/AuthContext';

export default function Home() {
  const { user, signOut } = useAuth();
  const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'there';

  const logout = async () => {
    await signOut();
    router.replace('/auth');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>IGNITE HABITSPRO</Text>
      <Text style={styles.title}>Hey, {name}! 🔥</Text>
      <Text style={styles.subtitle}>Your native app foundation is ready. Habits are the next screen being migrated.</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Today</Text>
        <Text style={styles.cardText}>Build your routine one habit at a time.</Text>
      </View>
      <Pressable style={styles.secondary} onPress={logout}>
        <Text style={styles.secondaryText}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 72, backgroundColor: '#fff' },
  eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 1.2, opacity: 0.5 },
  title: { marginTop: 12, fontSize: 30, fontWeight: '800' },
  subtitle: { marginTop: 8, fontSize: 15, lineHeight: 22, opacity: 0.65 },
  card: { marginTop: 28, padding: 20, borderRadius: 18, backgroundColor: '#f4f4f5' },
  cardTitle: { fontSize: 18, fontWeight: '800' },
  cardText: { marginTop: 6, fontSize: 14, opacity: 0.65 },
  secondary: { marginTop: 20, paddingVertical: 14, alignItems: 'center' },
  secondaryText: { fontWeight: '700' },
});
