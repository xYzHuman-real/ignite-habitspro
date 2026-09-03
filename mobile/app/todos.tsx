import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../src/auth/AuthContext';
import { supabase } from '../src/lib/supabase';

type Todo = { id: string; text: string; priority: string; completed: boolean; created_at: string; due_date?: string | null; tags?: string[] | null };

const points: Record<string, number> = { high: 15, medium: 10, low: 5 };

export default function Todos() {
  const { user } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [text, setText] = useState('');
  const [priority, setPriority] = useState('medium');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from('todos').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setTodos((data || []) as Todo[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, [user?.id]);

  const addTodo = async () => {
    if (!user || !text.trim()) return;
    const { data, error } = await supabase.from('todos').insert({ user_id: user.id, text: text.trim(), priority, completed: false }).select().single();
    if (error) return Alert.alert('Could not add task', error.message);
    if (data) setTodos(prev => [data as Todo, ...prev]);
    setText('');
  };

  const toggle = async (todo: Todo) => {
    const completed = !todo.completed;
    setTodos(prev => prev.map(t => t.id === todo.id ? { ...t, completed } : t));
    const { error } = await supabase.from('todos').update({ completed }).eq('id', todo.id).eq('user_id', user!.id);
    if (error) setTodos(prev => prev.map(t => t.id === todo.id ? { ...t, completed: todo.completed } : t));
    else if (completed) Alert.alert(`+${points[todo.priority] || 10} XP 🎉`, 'Task completed!');
  };

  const remove = (todo: Todo) => Alert.alert('Delete task?', todo.text, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => { await supabase.from('todos').delete().eq('id', todo.id).eq('user_id', user!.id); setTodos(prev => prev.filter(t => t.id !== todo.id)); } },
  ]);

  const filtered = useMemo(() => todos.filter(t => t.text.toLowerCase().includes(search.toLowerCase())), [todos, search]);
  const completed = todos.filter(t => t.completed).length;
  const pct = todos.length ? Math.round(completed / todos.length * 100) : 0;

  if (loading) return <View style={styles.loading}><ActivityIndicator size="large" /><Text>Loading tasks...</Text></View>;

  return <ScrollView contentContainerStyle={styles.container}>
    <View style={styles.header}><Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Back</Text></Pressable><Text style={styles.count}>{completed}/{todos.length} done</Text></View>
    <Text style={styles.title}>To-Do List</Text><Text style={styles.subtitle}>Stay productive, one task at a time. {pct}% complete.</Text>
    <View style={styles.progress}><View style={[styles.fill, { width: `${pct}%` }]} /></View>
    <View style={styles.addCard}><TextInput value={text} onChangeText={setText} placeholder="Add a task..." style={styles.input} returnKeyType="done" onSubmitEditing={addTodo} /><View style={styles.priorityRow}>{(['high','medium','low']).map(p => <Pressable key={p} onPress={() => setPriority(p)} style={[styles.priority, priority === p && styles.priorityActive]}><Text style={[styles.priorityText, priority === p && styles.priorityTextActive]}>{p}</Text></Pressable>)}</View><Pressable style={styles.addButton} onPress={addTodo}><Text style={styles.addText}>＋ Add Task</Text></Pressable></View>
    <TextInput value={search} onChangeText={setSearch} placeholder="Search tasks..." style={styles.search} />
    {filtered.length === 0 ? <Text style={styles.empty}>No tasks yet. Add one to get started! ✨</Text> : filtered.map(todo => <Pressable key={todo.id} style={styles.todo} onPress={() => toggle(todo)} onLongPress={() => remove(todo)}><View style={[styles.check, todo.completed && styles.checked]}><Text style={styles.checkText}>{todo.completed ? '✓' : ''}</Text></View><View style={styles.todoBody}><Text style={[styles.todoText, todo.completed && styles.done]}>{todo.text}</Text><Text style={styles.meta}>{todo.priority} · {todo.completed ? 'Completed' : 'Tap to complete'}</Text></View><Text style={styles.points}>+{points[todo.priority] || 10}</Text></Pressable>)}
    <Text style={styles.hint}>Tip: long-press a task to delete it.</Text>
  </ScrollView>;
}

const styles = StyleSheet.create({ container:{padding:20,paddingTop:58,paddingBottom:50,backgroundColor:'#fff'},loading:{flex:1,alignItems:'center',justifyContent:'center',gap:10},header:{flexDirection:'row',justifyContent:'space-between'},back:{fontWeight:'800',fontSize:16},count:{opacity:.55,fontWeight:'700'},title:{fontSize:30,fontWeight:'800',marginTop:18},subtitle:{marginTop:6,opacity:.6,lineHeight:20},progress:{height:7,backgroundColor:'#eee',borderRadius:8,marginTop:15,overflow:'hidden'},fill:{height:'100%',backgroundColor:'#F97316'},addCard:{marginTop:18,padding:14,borderRadius:18,borderWidth:1,borderColor:'#e7e7e7'},input:{borderWidth:1,borderColor:'#ddd',borderRadius:12,padding:12,fontSize:15},priorityRow:{flexDirection:'row',gap:8,marginTop:10},priority:{paddingVertical:7,paddingHorizontal:12,borderRadius:10,backgroundColor:'#f2f2f3'},priorityActive:{backgroundColor:'#1a1a2e'},priorityText:{fontSize:12,fontWeight:'700',textTransform:'capitalize'},priorityTextActive:{color:'#fff'},addButton:{marginTop:10,minHeight:44,borderRadius:11,alignItems:'center',justifyContent:'center',backgroundColor:'#1a1a2e'},addText:{color:'#fff',fontWeight:'800'},search:{marginTop:14,borderWidth:1,borderColor:'#e5e5e5',borderRadius:12,padding:12},todo:{marginTop:10,padding:14,borderRadius:16,borderWidth:1,borderColor:'#e9e9e9',flexDirection:'row',alignItems:'center'},check:{width:24,height:24,borderRadius:12,borderWidth:2,borderColor:'#aaa',alignItems:'center',justifyContent:'center',marginRight:12},checked:{backgroundColor:'#22c55e',borderColor:'#22c55e'},checkText:{color:'#fff',fontWeight:'900'},todoBody:{flex:1},todoText:{fontSize:15,fontWeight:'700'},done:{textDecorationLine:'line-through',opacity:.45},meta:{fontSize:11,opacity:.5,marginTop:4,textTransform:'capitalize'},points:{fontSize:11,fontWeight:'800',opacity:.55},empty:{textAlign:'center',padding:35,opacity:.55},hint:{textAlign:'center',marginTop:18,fontSize:11,opacity:.45}}
);