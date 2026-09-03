import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../src/auth/AuthContext';
import { supabase } from '../src/lib/supabase';
import { getLocalDateKey } from '../src/lib/date';

type Habit = {
  id: string; name: string; icon: string | null; target: number; current: number;
  streak: number; longest_streak: number; completed_today: boolean;
  priority?: string; difficulty?: string; sort_order?: number; updated_at?: string;
};

const priorityWeight: Record<string, number> = { very_important: 0, important: 1, less_important: 2 };
const pointsMap: Record<string, number> = { very_important: 10, important: 5, less_important: 2 };

const sortHabits = (items: Habit[]) => [...items].sort((a, b) => {
  const p = (priorityWeight[a.priority || 'important'] ?? 1) - (priorityWeight[b.priority || 'important'] ?? 1);
  return p || ((a.sort_order ?? 0) - (b.sort_order ?? 0));
});

export default function Habits() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [newHabit, setNewHabit] = useState('');

  const loadHabits = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.from('habits').select('*').eq('user_id', user.id).order('sort_order').order('created_at');
    if (error) { Alert.alert('Could not load habits', error.message); setLoading(false); return; }
    const today = getLocalDateKey();
    const list = (data || []) as Habit[];
    const stale = list.filter(h => h.completed_today && h.updated_at && getLocalDateKey(new Date(h.updated_at)) !== today);
    if (stale.length) await Promise.all(stale.map(h => supabase.from('habits').update({ completed_today: false, current: 0 }).eq('id', h.id)));
    setHabits(sortHabits(list.map(h => stale.some(s => s.id === h.id) ? { ...h, completed_today: false, current: 0 } : h)));
    setLoading(false);
  };

  useEffect(() => { loadHabits(); }, [user?.id]);

  const completed = habits.filter(h => h.completed_today).length;
  const progress = useMemo(() => habits.length ? Math.round(completed / habits.length * 100) : 0, [completed, habits.length]);

  const toggleHabit = async (habit: Habit) => {
    if (!user) return;
    const today = getLocalDateKey();
    if (habit.completed_today) {
      setHabits(items => items.map(h => h.id === habit.id ? { ...h, completed_today: false, current: 0 } : h));
      const { error } = await supabase.from('habits').update({ completed_today: false, current: 0 }).eq('id', habit.id);
      if (error) { setHabits(items => items.map(h => h.id === habit.id ? habit : h)); Alert.alert('Could not update habit', error.message); }
      return;
    }

    const newCurrent = habit.current + 1;
    const nowComplete = newCurrent >= habit.target;
    setHabits(items => items.map(h => h.id === habit.id ? { ...h, current: newCurrent, completed_today: nowComplete } : h));
    const { error } = await supabase.from('habits').update({ completed_today: nowComplete, current: newCurrent }).eq('id', habit.id);
    if (error) { setHabits(items => items.map(h => h.id === habit.id ? habit : h)); Alert.alert('Could not complete habit', error.message); return; }
    if (!nowComplete) return;

    const { data: existing } = await supabase.from('habit_completions').select('id').eq('habit_id', habit.id).eq('completed_date', today).maybeSingle();
    if (existing) return;
    await supabase.from('habit_completions').insert({ user_id: user.id, habit_id: habit.id, completed_date: today });
    await supabase.from('activity_log').upsert({ user_id: user.id, activity_type: 'habit_completion', activity_date: today, count: 1 }, { onConflict: 'user_id,activity_type,activity_date' });

    const { data: allHabits } = await supabase.from('habits').select('id, completed_today, streak, longest_streak').eq('user_id', user.id);
    if (allHabits?.length && allHabits.every(h => h.completed_today)) {
      await Promise.all(allHabits.map(h => {
        const nextStreak = h.id === habit.id ? habit.streak + 1 : h.streak + 1;
        return supabase.from('habits').update({ streak: nextStreak, longest_streak: Math.max(h.longest_streak || 0, nextStreak) }).eq('id', h.id);
      }));
    }

    const earned = pointsMap[habit.priority || 'important'] || 5;
    const { data: profile } = await supabase.from('profiles').select('total_streak, habits_completed, leaderboard_points, coins, lifetime_xp').eq('user_id', user.id).single();
    if (profile) {
      await supabase.from('profiles').update({
        total_streak: Math.max(profile.total_streak || 0, habit.streak + 1),
        habits_completed: (profile.habits_completed || 0) + 1,
        leaderboard_points: (profile.leaderboard_points || 0) + earned,
        coins: (profile.coins || 0) + earned,
        lifetime_xp: (profile.lifetime_xp || 0) + earned,
      } as any).eq('user_id', user.id);
    }
    await loadHabits();
  };

  const addHabit = async () => {
    if (!user || !newHabit.trim()) return;
    const { data, error } = await supabase.from('habits').insert({ user_id: user.id, name: newHabit.trim(), icon: '🌱', target: 1, current: 0, streak: 0, longest_streak: 0, priority: 'important', difficulty: 'medium', completed_today: false }).select('*').single();
    if (error) Alert.alert('Could not add habit', error.message);
    else { setHabits(items => sortHabits([...items, data as Habit])); setNewHabit(''); }
  };

  const deleteHabit = async (id: string) => {
    Alert.alert('Delete habit?', 'This will remove the habit from your list.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const { error } = await supabase.from('habits').delete().eq('id', id);
        if (error) Alert.alert('Could not delete habit', error.message);
        else setHabits(items => items.filter(h => h.id !== id));
      } },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}><Text style={styles.eyebrow}>TODAY</Text><Text style={styles.title}>My Habits</Text><Text style={styles.subtitle}>{completed}/{habits.length} completed · {progress}%</Text></View>
        <Pressable onPress={() => router.replace('/home')}><Text style={styles.back}>Home</Text></Pressable>
      </View>
      <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progress}%` }]} /></View>
      {loading ? <Text style={styles.empty}>Loading habits...</Text> : habits.length === 0 ? (
        <View style={styles.emptyBox}><Text style={styles.emoji}>🌱</Text><Text style={styles.empty}>No habits yet. Add your first one below.</Text></View>
      ) : habits.map(habit => (
        <View key={habit.id} style={styles.card}>
          <Pressable style={styles.habitMain} onPress={() => toggleHabit(habit)}>
            <Text style={styles.icon}>{habit.icon || '🌱'}</Text>
            <View style={styles.habitInfo}>
              <Text style={[styles.habitName, habit.completed_today && styles.done]}>{habit.name}</Text>
              <Text style={styles.meta}>{habit.current}/{habit.target} today · 🔥 {habit.streak} day streak</Text>
              <Text style={styles.priority}>{habit.priority === 'very_important' ? 'Very important' : habit.priority === 'less_important' ? 'Less important' : 'Important'}</Text>
            </View>
            <View style={[styles.check, habit.completed_today && styles.checked]}><Text style={styles.checkText}>{habit.completed_today ? '✓' : ''}</Text></View>
          </Pressable>
          <Pressable onPress={() => deleteHabit(habit.id)}><Text style={styles.delete}>Delete</Text></Pressable>
        </View>
      ))}
      <View style={styles.addBox}>
        <Text style={styles.addTitle}>Add a habit</Text>
        <TextInput value={newHabit} onChangeText={setNewHabit} placeholder="e.g. Read NCERT" placeholderTextColor="#999" style={styles.input} returnKeyType="done" onSubmitEditing={addHabit} />
        <Pressable style={styles.addButton} onPress={addHabit}><Text style={styles.addButtonText}>+ Add Habit</Text></Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 60, paddingBottom: 40, backgroundColor: '#fff', minHeight: '100%' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }, headerCopy: { flex: 1 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, opacity: 0.45 }, title: { fontSize: 30, fontWeight: '800', marginTop: 3 }, subtitle: { marginTop: 5, opacity: 0.6 }, back: { fontWeight: '700', paddingTop: 4 },
  progressTrack: { height: 8, borderRadius: 8, backgroundColor: '#eee', marginTop: 20, marginBottom: 18, overflow: 'hidden' }, progressFill: { height: '100%', backgroundColor: '#F97316', borderRadius: 8 },
  card: { padding: 15, borderRadius: 16, backgroundColor: '#f7f7f8', marginBottom: 10 }, habitMain: { flexDirection: 'row', alignItems: 'center' }, icon: { fontSize: 26, marginRight: 12 }, habitInfo: { flex: 1 }, habitName: { fontSize: 16, fontWeight: '700' }, done: { textDecorationLine: 'line-through', opacity: 0.5 }, meta: { marginTop: 4, fontSize: 12, opacity: 0.6 }, priority: { marginTop: 5, fontSize: 11, opacity: 0.45 },
  check: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#bbb', alignItems: 'center', justifyContent: 'center' }, checked: { backgroundColor: '#F97316', borderColor: '#F97316' }, checkText: { color: '#fff', fontWeight: '800' }, delete: { marginTop: 10, alignSelf: 'flex-end', fontSize: 12, opacity: 0.55 },
  addBox: { marginTop: 18, padding: 18, borderRadius: 18, borderWidth: 1, borderColor: '#e5e5e5' }, addTitle: { fontSize: 17, fontWeight: '800', marginBottom: 10 }, input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 13, fontSize: 15, color: '#111' }, addButton: { marginTop: 10, padding: 13, borderRadius: 12, backgroundColor: '#1a1a2e', alignItems: 'center' }, addButtonText: { color: '#fff', fontWeight: '700' }, emptyBox: { alignItems: 'center', padding: 40 }, emoji: { fontSize: 40, marginBottom: 10 }, empty: { textAlign: 'center', opacity: 0.6, padding: 20 },
});
