import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '../src/auth/AuthContext';
import { supabase } from '../src/lib/supabase';
import { router } from 'expo-router';

type Habit = {
  id: string;
  name: string;
  icon: string;
  target: number;
  current: number;
  streak: number;
  completed_today: boolean;
};

export default function Habits() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [newHabit, setNewHabit] = useState('');

  const loadHabits = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: true });
    if (error) Alert.alert('Could not load habits', error.message);
    else setHabits((data || []) as Habit[]);
    setLoading(false);
  };

  useEffect(() => { loadHabits(); }, [user?.id]);

  const completed = habits.filter(h => h.completed_today).length;
  const progress = useMemo(() => habits.length ? Math.round((completed / habits.length) * 100) : 0, [completed, habits.length]);

  const toggleHabit = async (habit: Habit) => {
    if (!user) return;
    const next = !habit.completed_today;
    setHabits(items => items.map(h => h.id === habit.id ? { ...h, completed_today: next } : h));
    const today = new Date().toISOString().slice(0, 10);
    if (next) {
      const { error } = await supabase.from('habit_completions').upsert({ user_id: user.id, habit_id: habit.id, completed_date: today });
      if (error) { setHabits(items => items.map(h => h.id === habit.id ? { ...h, completed_today: !next } : h)); Alert.alert('Could not complete habit', error.message); }
    } else {
      const { error } = await supabase.from('habit_completions').delete().eq('user_id', user.id).eq('habit_id', habit.id).eq('completed_date', today);
      if (error) { setHabits(items => items.map(h => h.id === habit.id ? { ...h, completed_today: !next } : h)); Alert.alert('Could not update habit', error.message); }
    }
  };

  const addHabit = async () => {
    if (!user || !newHabit.trim()) return;
    const { data, error } = await supabase.from('habits').insert({ user_id: user.id, name: newHabit.trim(), icon: '🌱', target: 1, current: 0, streak: 0 }).select('*').single();
    if (error) Alert.alert('Could not add habit', error.message);
    else { setHabits(items => [...items, data as Habit]); setNewHabit(''); }
  };

  const deleteHabit = async (id: string) => {
    const { error } = await supabase.from('habits').delete().eq('id', id);
    if (error) Alert.alert('Could not delete habit', error.message);
    else setHabits(items => items.filter(h => h.id !== id));
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>My Habits</Text>
          <Text style={styles.subtitle}>{completed}/{habits.length} completed today · {progress}%</Text>
        </View>
        <Pressable onPress={() => router.replace('/home')}><Text style={styles.back}>Home</Text></Pressable>
      </View>

      <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progress}%` }]} /></View>

      {loading ? <Text style={styles.empty}>Loading habits...</Text> : habits.length === 0 ? (
        <View style={styles.emptyBox}><Text style={styles.emoji}>🌱</Text><Text style={styles.empty}>No habits yet. Add your first one below.</Text></View>
      ) : habits.map(habit => (
        <View key={habit.id} style={styles.card}>
          <Pressable style={styles.habitMain} onPress={() => toggleHabit(habit)}>
            <Text style={styles.icon}>{habit.icon || '🌱'}</Text>
            <View style={styles.habitInfo}><Text style={[styles.habitName, habit.completed_today && styles.done]}>{habit.name}</Text><Text style={styles.streak}>{habit.streak} day streak</Text></View>
            <View style={[styles.check, habit.completed_today && styles.checked]}><Text>{habit.completed_today ? '✓' : ''}</Text></View>
          </Pressable>
          <Pressable onPress={() => deleteHabit(habit.id)}><Text style={styles.delete}>Delete</Text></Pressable>
        </View>
      ))}

      <View style={styles.addBox}>
        <Text style={styles.addTitle}>Add a habit</Text>
        <TextInput value={newHabit} onChangeText={setNewHabit} placeholder="e.g. Read NCERT" style={styles.input} returnKeyType="done" />
        <Pressable style={styles.addButton} onPress={addHabit}><Text style={styles.addButtonText}>+ Add Habit</Text></Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 60, paddingBottom: 40, backgroundColor: '#fff', minHeight: '100%' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 30, fontWeight: '800' },
  subtitle: { marginTop: 5, opacity: 0.6 },
  back: { fontWeight: '700' },
  progressTrack: { height: 8, borderRadius: 8, backgroundColor: '#eee', marginTop: 20, marginBottom: 18, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#F97316', borderRadius: 8 },
  card: { padding: 15, borderRadius: 16, backgroundColor: '#f7f7f8', marginBottom: 10 },
  habitMain: { flexDirection: 'row', alignItems: 'center' },
  icon: { fontSize: 26, marginRight: 12 },
  habitInfo: { flex: 1 },
  habitName: { fontSize: 16, fontWeight: '700' },
  done: { textDecorationLine: 'line-through', opacity: 0.5 },
  streak: { marginTop: 4, fontSize: 12, opacity: 0.55 },
  check: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: '#bbb', alignItems: 'center', justifyContent: 'center' },
  checked: { backgroundColor: '#F97316', borderColor: '#F97316' },
  delete: { marginTop: 10, alignSelf: 'flex-end', fontSize: 12, opacity: 0.55 },
  addBox: { marginTop: 18, padding: 18, borderRadius: 18, borderWidth: 1, borderColor: '#e5e5e5' },
  addTitle: { fontSize: 17, fontWeight: '800', marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 13, fontSize: 15 },
  addButton: { marginTop: 10, padding: 13, borderRadius: 12, backgroundColor: '#1a1a2e', alignItems: 'center' },
  addButtonText: { color: '#fff', fontWeight: '700' },
  emptyBox: { alignItems: 'center', padding: 40 },
  emoji: { fontSize: 40, marginBottom: 10 },
  empty: { textAlign: 'center', opacity: 0.6, padding: 20 },
});
