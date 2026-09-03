import { StyleSheet, Text, View, Pressable } from 'react-native';
import { router } from 'expo-router';

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ignite HabitsPro</Text>
      <Text style={styles.subtitle}>Build better habits. One day at a time.</Text>
      <Pressable style={styles.button} onPress={() => router.push('/auth')}>
        <Text style={styles.buttonText}>Get Started</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 32, fontWeight: '800', textAlign: 'center' },
  subtitle: { marginTop: 12, fontSize: 16, opacity: 0.7, textAlign: 'center' },
  button: { marginTop: 28, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12, backgroundColor: '#1a1a2e' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
