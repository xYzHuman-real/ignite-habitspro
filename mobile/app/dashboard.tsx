import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

const features = [
  ['Habits', '/habits'],
  ['Timer', '/timer'],
  ['Todos', '/todos'],
  ['Challenges', '/challenges'],
  ['Community', '/community'],
  ['Leaderboard', '/leaderboard'],
  ['Profile', '/profile'],
  ['Settings', '/settings'],
  ['Journal', '/journal'],
  ['Goals', '/goals'],
  ['Daily Planner', '/daily-planner'],
];

export default function Dashboard() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.kicker}>IGNITE HABITSPRO</Text>
      <Text style={styles.title}>Your day starts here.</Text>
      <Text style={styles.subtitle}>Native React Native foundation connected to your existing Supabase backend.</Text>
      <View style={styles.grid}>
        {features.map(([label, href]) => (
          <Link key={href} href={href as never} style={styles.card}>{label}</Link>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 64, gap: 10 },
  kicker: { fontSize: 12, fontWeight: '800', letterSpacing: 2, opacity: 0.55 },
  title: { fontSize: 34, fontWeight: '800', marginTop: 6 },
  subtitle: { fontSize: 16, lineHeight: 23, opacity: 0.7, marginBottom: 18 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { width: '47%', borderWidth: 1, borderColor: '#ddd', borderRadius: 16, padding: 18, fontSize: 16, fontWeight: '700' },
});
