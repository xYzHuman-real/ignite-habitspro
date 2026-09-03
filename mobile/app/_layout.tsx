import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/auth/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="habits" />
        <Stack.Screen name="todos" />
        <Stack.Screen name="timer" />
        <Stack.Screen name="challenges" />
        <Stack.Screen name="community" />
      </Stack>
    </AuthProvider>
  );
}
