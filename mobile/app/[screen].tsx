import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

export default function FeatureScreen() {
  const { screen } = useLocalSearchParams<{ screen: string }>();
  const title = (screen || 'feature').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>This native screen is part of the verified React Native migration foundation. Feature parity with the existing web app will be ported screen-by-screen without touching main.</Text>
      <Pressable onPress={() => router.replace('/dashboard')} style={styles.button}>
        <Text style={styles.buttonText}>Back to Dashboard</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, gap: 16 },
  title: { fontSize: 32, fontWeight: '800' },
  body: { fontSize: 16, lineHeight: 24, opacity: 0.7 },
  button: { backgroundColor: '#111827', borderRadius: 12, padding: 15, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' },
});
