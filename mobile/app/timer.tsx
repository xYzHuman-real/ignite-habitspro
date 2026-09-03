import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

const PRESETS = [25, 5, 15, 30, 45, 60];

export default function Timer() {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const lastPreset = useRef(25);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSeconds(current => {
        if (current <= 1) {
          setRunning(false);
          setSessions(s => s + 1);
          Alert.alert('Focus complete! 🎉', 'Great work. Take a short break before your next session.');
          return lastPreset.current * 60;
        }
        return current - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  const choosePreset = (value: number) => {
    lastPreset.current = value;
    setMinutes(value);
    setSeconds(value * 60);
    setRunning(false);
  };

  const toggle = () => setRunning(value => !value);
  const reset = () => { setRunning(false); setSeconds(lastPreset.current * 60); };
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  const progress = Math.max(0, Math.min(1, seconds / (minutes * 60)));

  return (
    <View style={styles.container}>
      <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Back</Text></Pressable>
      <Text style={styles.eyebrow}>FOCUS TIMER</Text>
      <Text style={styles.title}>Deep Work</Text>
      <Text style={styles.subtitle}>One focused session at a time. 🔥</Text>
      <View style={styles.timerCard}>
        <View style={styles.ring}><Text style={styles.time}>{mm}:{ss}</Text><Text style={styles.status}>{running ? 'FOCUSING' : 'READY'}</Text></View>
        <View style={styles.track}><View style={[styles.fill, { width: `${progress * 100}%` }]} /></View>
        <View style={styles.controls}>
          <Pressable style={styles.secondary} onPress={reset}><Text style={styles.secondaryText}>Reset</Text></Pressable>
          <Pressable style={styles.primary} onPress={toggle}><Text style={styles.primaryText}>{running ? 'Pause' : 'Start'}</Text></Pressable>
        </View>
      </View>
      <Text style={styles.section}>Session length</Text>
      <View style={styles.presets}>{PRESETS.map(value => <Pressable key={value} onPress={() => choosePreset(value)} style={[styles.preset, value === lastPreset.current && styles.activePreset]}><Text style={[styles.presetText, value === lastPreset.current && styles.activeText]}>{value}m</Text></Pressable>)}</View>
      <View style={styles.stats}><Text style={styles.statsTitle}>Sessions completed</Text><Text style={styles.statsValue}>{sessions}</Text></View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{flex:1,padding:20,paddingTop:58,backgroundColor:'#fff'},back:{fontSize:16,fontWeight:'800'},eyebrow:{marginTop:30,fontSize:11,fontWeight:'800',letterSpacing:1.2,opacity:.45},title:{fontSize:30,fontWeight:'800',marginTop:5},subtitle:{marginTop:6,opacity:.6},timerCard:{marginTop:24,padding:22,borderRadius:24,borderWidth:1,borderColor:'#e7e7e7',alignItems:'center'},ring:{width:230,height:230,borderRadius:115,borderWidth:8,borderColor:'#f97316',alignItems:'center',justifyContent:'center'},time:{fontSize:46,fontWeight:'800',fontVariant:['tabular-nums']},status:{fontSize:10,fontWeight:'800',letterSpacing:1.5,opacity:.5,marginTop:4},track:{height:6,width:'100%',backgroundColor:'#eee',borderRadius:8,marginTop:22,overflow:'hidden'},fill:{height:'100%',backgroundColor:'#f97316'},controls:{flexDirection:'row',gap:10,width:'100%',marginTop:18},primary:{flex:1,minHeight:48,borderRadius:12,backgroundColor:'#1a1a2e',alignItems:'center',justifyContent:'center'},primaryText:{color:'#fff',fontWeight:'800'},secondary:{flex:1,minHeight:48,borderRadius:12,borderWidth:1,borderColor:'#ddd',alignItems:'center',justifyContent:'center'},secondaryText:{fontWeight:'800'},section:{fontSize:17,fontWeight:'800',marginTop:24},presets:{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:10},preset:{paddingVertical:10,paddingHorizontal:15,borderRadius:12,backgroundColor:'#f3f3f4'},activePreset:{backgroundColor:'#1a1a2e'},presetText:{fontWeight:'700'},activeText:{color:'#fff'},stats:{marginTop:20,padding:18,borderRadius:16,backgroundColor:'#f6f6f7',flexDirection:'row',justifyContent:'space-between',alignItems:'center'},statsTitle:{fontWeight:'700',opacity:.65},statsValue:{fontSize:24,fontWeight:'800'}
});
