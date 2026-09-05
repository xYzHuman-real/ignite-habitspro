type SoundHandle = { stop: () => void; setVolume: (v: number) => void };

const ctx = () => {
  const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
  return AudioContextCtor ? new AudioContextCtor() : null;
};

function noiseBuffer(audio: AudioContext, seconds = 2) {
  const buffer = audio.createBuffer(1, audio.sampleRate * seconds, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

export function createAmbientSound(kind: string, volume = 0.3): SoundHandle | null {
  const audio = ctx();
  if (!audio) return null;
  const master = audio.createGain(); master.gain.value = Math.max(0, Math.min(1, volume)); master.connect(audio.destination);
  const nodes: AudioNode[] = [master];
  const stop = () => { nodes.forEach(n => { try { (n as any).stop?.(); } catch {} try { n.disconnect(); } catch {} }); try { master.disconnect(); } catch {} };
  const setVolume = (v: number) => { master.gain.value = Math.max(0, Math.min(1, v)); };

  const source = audio.createBufferSource(); source.buffer = noiseBuffer(audio); source.loop = true; source.connect(master); nodes.push(source);
  const filter = audio.createBiquadFilter(); filter.type = kind === 'Rain' ? 'highpass' : 'lowpass'; filter.frequency.value = kind === 'Rain' ? 900 : kind === 'Forest' ? 700 : 1800; source.disconnect(); source.connect(filter); filter.connect(master); nodes.push(filter);

  if (kind === 'Lofi Chill' || kind === 'Lofi Study' || kind === 'Piano') {
    const freqs = kind === 'Lofi Chill' ? [220, 277.18, 329.63] : kind === 'Lofi Study' ? [261.63, 329.63, 392, 493.88] : [261.63, 329.63, 392, 523.25];
    freqs.forEach((f, i) => { const o=audio.createOscillator(), g=audio.createGain(); o.type=kind==='Piano'?'triangle':'sine'; o.frequency.value=f; g.gain.value=0.035/(i+1); o.connect(g); g.connect(master); o.start(); nodes.push(o,g); });
  }
  if (kind === 'Forest') {
    const o=audio.createOscillator(), g=audio.createGain(); o.frequency.value=2600; g.gain.value=0.018; o.connect(g); g.connect(master); o.start(); nodes.push(o,g);
  }
  source.start();
  return { stop, setVolume };
}

export function installAmbientSoundFallback() {
  const NativeAudio = window.Audio;
  const urls = ['Rain','Forest','Library','White Noise','Lofi Chill','Lofi Study','Piano'];
  (window as any).Audio = class AmbientAudio {
    loop = false; volume = 0.3; src = ''; private handle: SoundHandle | null = null; private kind = '';
    constructor(src = '') { this.src = src; this.kind = urls.find(k => src.toLowerCase().includes(k.toLowerCase().replaceAll(' ','-'))) || ''; if (!this.kind && src) { this.kind = src.includes('257112')?'Rain':src.includes('2dae')?'Forest':src.includes('a583')?'Library':src.includes('4ded')?'White Noise':src.includes('4956')?'Lofi Chill':src.includes('38cc')?'Lofi Study':src.includes('4ab1')?'Piano':''; } }
    play() { if (!this.kind) { const a=new NativeAudio(this.src); a.loop=this.loop; a.volume=this.volume; return a.play(); } this.handle?.stop(); this.handle=createAmbientSound(this.kind,this.volume); return Promise.resolve(); }
    pause() { this.handle?.stop(); this.handle=null; }
    set srcValue(v:string){this.src=v;} get srcValue(){return this.src;}
  };
}
