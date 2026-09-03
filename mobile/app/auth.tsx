import { StyleSheet, Text, View, Pressable } from 'react-native';
import { router } from 'expo-router';

export default function Auth() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome back</Text>
      <Text style={styles.subtitle}>Your existing authentication flow will be migrated here without changing its intended behavior.</Text>
      <Pressable style={styles.button} onPress={() => router.back()}>
        <Text style={styles.buttonText}>Back</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: '800' },
  subtitle: { marginTop: 12, fontSize: 15, opacity: 0.7, textAlign: 'center', lineHeight: 22 },
  button: { marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10, backgroundColor: '#1a1a2e' },
  buttonText: { color: '#fff', fontWeight: '700' },
});
