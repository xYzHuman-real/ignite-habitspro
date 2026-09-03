import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../src/auth/AuthContext';
import { supabase } from '../src/lib/supabase';
import { getLocalDateKey } from '../src/lib/date';

type Habit = { id: string; name: string; icon: string | null; current: number; target: number; streak: number; completed_today: boolean };
type Todo = { id: string; text: string; priority: string; completed: boolean; created_at: string };
type Profile = { display_name: string | null; xp_level: number | null; leaderboard_points: number | null; habits_completed: number | null; total_streak: number | null };

export default function Dashboard() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      const today = getLocalDateKey();
      const [habitResult, todoResult, profileResult] = await Promise.all([
        supabase.from('habits').select('id,name,icon,current,target,streak,completed_today').eq('user_id', user.id).order('sort_order').order('created_at'),
        supabase.from('todos').select('id,text,priority,completed,created_at').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('profiles').select('display_name,xp_level,leaderboard_points,habits_completed,total_streak').eq('user_id', user.id).single(),
      ]);
      if (!active) return;
      if (habitResult.data) setHabits(habitResult.data as Habit[]);
      if (todoResult.data) setTodos(todoResult.data as Todo[]);
      if (profileResult.data) setProfile(profileResult.data as Profile);
      setLoading(false);
    };
    load();
    return () => { active = false; };
  }, [user?.id]);

  const today = getLocalDateKey();
  const todayTodos = useMemo(() => todos.filter(todo => getLocalDateKey(new Date(todo.created_at)) === today), [todos, today]);
  const completedHabits = habits.filter(h => h.completed_today).length;
  const completedTodos = todayTodos.filter(t => t.completed).length;
  const maxStreak = habits.reduce((max, h) => Math.max(max, h.streak || 0), 0);
  const score = habits.length ? Math.round(completedHabits / habits.length * 100) : 0;
  const name = profile?.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'there';

  if (loading) return <View style={styles.loading}><ActivityIndicator size="large" /><Text style={styles.loadingText}>Loading your dashboard...</Text></View>;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerCopy}><Text style={styles.eyebrow}>IGNITE HABITSPRO</Text><Text style={styles.title}>Hey, {name}! 🔥</Text><Text style={styles.subtitle}>{maxStreak > 0 ? `Keep your momentum going. Best streak: ${maxStreak} days!` : 'Start building your streaks today!'}</Text></View>
        <Pressable onPress={() => router.push('/profile')}><Text style={styles.profileButton}>Profile</Text></Pressable>
      </View>

      <View style={styles.statsGrid}>
        <Stat label="Best Streak" value={String(maxStreak)} emoji="🔥" />
        <Stat label="Habits Today" value={`${completedHabits}/${habits.length}`} emoji="🎯" />
        <Stat label="Tasks Done" value={`${completedTodos}/${todayTodos.length}`} emoji="✅" />
        <Stat label="Daily Score" value={`${score}%`} emoji="📈" />
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Today's Habits</Text><Pressable onPress={() => router.push('/habits')}><Text style={styles.link}>View all</Text></Pressable></View>
        {habits.length === 0 ? <Text style={styles.empty}>No habits yet. Create one to get started!</Text> : habits.map(habit => (
          <View key={habit.id} style={styles.row}>
            <Text style={styles.habitIcon}>{habit.icon || '🌱'}</Text>
            <View style={styles.rowBody}><Text style={[styles.rowTitle, habit.completed_today && styles.done]}>{habit.name}</Text><Text style={styles.rowMeta}>{habit.streak} day streak</Text><View style={styles.miniTrack}><View style={[styles.miniFill, { width: `${Math.min(100, habit.target ? habit.current / habit.target * 100 : 0)}%` }]} /></View></View>
            {habit.completed_today && <Text style={styles.check}>✓</Text>}
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>To-Do List</Text><Pressable onPress={() => router.push('/todos')}><Text style={styles.link}>View all</Text></Pressable></View>
        {todayTodos.length === 0 ? <Text style={styles.empty}>No tasks for today. Add one to stay productive!</Text> : todayTodos.slice(0, 5).map(todo => (
          <View key={todo.id} style={styles.todoRow}><View style={[styles.todoDot, todo.completed && styles.todoDone]}><Text style={styles.todoCheck}>{todo.completed ? '✓' : ''}</Text></View><Text style={[styles.todoText, todo.completed && styles.done]}>{todo.text}</Text><Text style={styles.priority}>{todo.priority}</Text></View>
        ))}
      </View>

      <View style={styles.toolsGrid}>
        <View style={styles.tool}><Text style={styles.toolEmoji}>🎓</Text><Text style={styles.toolTitle}>GPA Calculator</Text><Text style={styles.toolText}>Track your academic score.</Text></View>
        <View style={styles.tool}><Text style={styles.toolEmoji}>⏳</Text><Text style={styles.toolTitle}>Exam Countdown</Text><Text style={styles.toolText}>Stay focused on your next exam.</Text></View>
      </View>

      <View style={styles.footerCard}><Text style={styles.footerTitle}>Level {profile?.xp_level || 1}</Text><Text style={styles.footerText}>{profile?.leaderboard_points || 0} leaderboard points · {profile?.habits_completed || 0} habits completed</Text></View>
    </ScrollView>
  );
}

function Stat({ label, value, emoji }: { label: string; value: string; emoji: string }) {
  return <View style={styles.stat}><Text style={styles.statEmoji}>{emoji}</Text><Text style={styles.statLabel}>{label}</Text><Text style={styles.statValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 58, paddingBottom: 44, backgroundColor: '#fff' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }, loadingText: { marginTop: 12, opacity: 0.6 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }, headerCopy: { flex: 1 }, eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, opacity: 0.45 }, title: { marginTop: 6, fontSize: 30, fontWeight: '800' }, subtitle: { marginTop: 7, fontSize: 14, lineHeight: 20, opacity: 0.6 }, profileButton: { fontWeight: '800', paddingTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 22 }, stat: { width: '48%', padding: 15, borderRadius: 16, backgroundColor: '#f5f5f6' }, statEmoji: { fontSize: 18 }, statLabel: { marginTop: 8, fontSize: 12, opacity: 0.55 }, statValue: { marginTop: 3, fontSize: 23, fontWeight: '800' },
  card: { marginTop: 18, padding: 18, borderRadius: 18, borderWidth: 1, borderColor: '#e8e8e8' }, sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }, sectionTitle: { fontSize: 18, fontWeight: '800' }, link: { fontWeight: '700', fontSize: 13 }, empty: { textAlign: 'center', paddingVertical: 18, opacity: 0.55, fontSize: 14 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9 }, habitIcon: { fontSize: 22, marginRight: 11 }, rowBody: { flex: 1 }, rowTitle: { fontSize: 14, fontWeight: '700' }, rowMeta: { fontSize: 11, opacity: 0.55, marginTop: 2 }, miniTrack: { height: 4, backgroundColor: '#eee', borderRadius: 4, marginTop: 6, overflow: 'hidden' }, miniFill: { height: '100%', backgroundColor: '#F97316' }, done: { textDecorationLine: 'line-through', opacity: 0.5 }, check: { fontSize: 18, fontWeight: '800', marginLeft: 10 },
  todoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }, todoDot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#aaa', alignItems: 'center', justifyContent: 'center', marginRight: 10 }, todoDone: { backgroundColor: '#22c55e', borderColor: '#22c55e' }, todoCheck: { color: '#fff', fontSize: 11, fontWeight: '800' }, todoText: { flex: 1, fontSize: 14 }, priority: { fontSize: 10, opacity: 0.5, marginLeft: 8, textTransform: 'capitalize' },
  toolsGrid: { flexDirection: 'row', gap: 10, marginTop: 18 }, tool: { flex: 1, padding: 16, borderRadius: 16, backgroundColor: '#f7f7f8' }, toolEmoji: { fontSize: 22 }, toolTitle: { marginTop: 8, fontWeight: '800' }, toolText: { marginTop: 4, fontSize: 11, lineHeight: 16, opacity: 0.55 }, footerCard: { marginTop: 18, padding: 18, borderRadius: 18, backgroundColor: '#1a1a2e' }, footerTitle: { color: '#fff', fontSize: 17, fontWeight: '800' }, footerText: { color: '#fff', opacity: 0.65, marginTop: 5, fontSize: 12 },
});
