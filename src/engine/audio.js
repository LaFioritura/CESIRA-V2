// ─── CESIRA V3 — Audio Engine ─────────────────────────────────────────────────
import { clamp, rnd, NOTE_FREQ, NOTE_MIDI, GENRES } from './constants.js'
import { getVoiceNotes } from './music.js'

let _ctx = null
let _nodes = null
let _activeNodes = 0

export const getCtx      = () => _ctx
export const getAnalyser = () => _nodes?.an || null
export const nodeGuard   = () => _activeNodes < 90
export const trackNode   = ms => { _activeNodes++; setTimeout(()=>{ _activeNodes=Math.max(0,_activeNodes-1) }, ms+80) }

function driveCurve(node, amt) {
  const k=2+clamp(amt,0,1)*60; const s=512; const c=new Float32Array(s)
  for(let i=0;i<s;i++){const x=(i*2)/s-1;c[i]=((1+k)*x)/(1+k*Math.abs(x))}
  node.curve=c; node.oversample='2x'
}
function identityCurve(node) {
  const c=new Float32Array(512); for(let i=0;i<512;i++)c[i]=(i*2)/512-1; node.curve=c
}
function reverbIR(ctx,dur=1.2,dec=2.6) {
  const sr=ctx.sampleRate,l=Math.floor(sr*dur); const b=ctx.createBuffer(2,l,sr)
  for(let ch=0;ch<2;ch++){const d=b.getChannelData(ch);for(let i=0;i<l;i++)d[i]=(rnd()*2-1)*Math.pow(1-i/l,dec)}
  return b
}
function noiseBuffer(len=0.22,amt=1,color='white') {
  const sr=_ctx.sampleRate; const b=_ctx.createBuffer(1,Math.floor(sr*len),sr); const d=b.getChannelData(0)
  if(color==='white'){for(let i=0;i<d.length;i++)d[i]=(rnd()*2-1)*amt;return b}
  let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0
  for(let i=0;i<d.length;i++){
    const w=rnd()*2-1
    if(color==='pink'){b0=0.99886*b0+w*0.0555179;b1=0.99332*b1+w*0.0750759;b2=0.969*b2+w*0.153852;b3=0.8665*b3+w*0.310486;b4=0.55*b4+w*0.532952;b5=-0.7616*b5-w*0.016898;d[i]=(b0+b1+b2+b3+b4+b5+w*0.5362)*amt*0.11}
    else{b0=0.99*b0+w*0.01;d[i]=b0*amt*3}
  }
  return b
}
const ss=(n,t)=>{try{n.start(t)}catch{}}
const st=(n,t)=>{try{n.stop(t)}catch{}}
const gc=(src,nodes,ms)=>{const fn=()=>[src,...nodes].forEach(n=>{try{n.disconnect()}catch{}});src.onended=fn;setTimeout(fn,ms)}

const laneGains={}
function getLaneGain(lane) {
  if(!_nodes)return null
  if(!laneGains[lane]){const g=_ctx.createGain();g.gain.value=1;g.connect(_nodes.bus);laneGains[lane]=g}
  return laneGains[lane]
}

export async function initAudio() {
  if(_ctx){await _ctx.resume();return true}
  const Ctx=window.AudioContext||window.webkitAudioContext; if(!Ctx)return false
  _ctx=new Ctx({sampleRate:44100,latencyHint:'interactive'})
  const bus=_ctx.createGain();bus.gain.value=0.68
  const preD=_ctx.createWaveShaper();identityCurve(preD)
  const toneF=_ctx.createBiquadFilter();toneF.type='lowpass';toneF.frequency.value=16000;toneF.Q.value=0.35
  const comp=_ctx.createDynamicsCompressor();comp.threshold.value=-24;comp.knee.value=18;comp.ratio.value=3;comp.attack.value=0.008;comp.release.value=0.22
  const lim=_ctx.createDynamicsCompressor();lim.threshold.value=-3;lim.knee.value=0;lim.ratio.value=20;lim.attack.value=0.001;lim.release.value=0.04
  const dry=_ctx.createGain();dry.gain.value=1
  const wet=_ctx.createGain();wet.gain.value=0
  const spl=_ctx.createChannelSplitter(2); const mrg=_ctx.createChannelMerger(2)
  const lDly=_ctx.createDelay(0.5); const rDly=_ctx.createDelay(0.5)
  const fb=_ctx.createGain();fb.gain.value=0.15
  const dlyT=_ctx.createBiquadFilter();dlyT.type='lowpass';dlyT.frequency.value=4500
  const chorus=_ctx.createGain();chorus.gain.value=0
  const cD1=_ctx.createDelay(0.025); const cD2=_ctx.createDelay(0.031)
  const rev=_ctx.createConvolver();rev.buffer=reverbIR(_ctx)
  const revW=_ctx.createGain();revW.gain.value=0
  const out=_ctx.createGain();out.gain.value=0.88
  const an=_ctx.createAnalyser();an.fftSize=256;an.smoothingTimeConstant=0.8
  const dest=_ctx.createMediaStreamDestination()
  bus.connect(preD);preD.connect(toneF);toneF.connect(comp)
  comp.connect(dry);comp.connect(spl);comp.connect(cD1);comp.connect(cD2);comp.connect(rev)
  cD1.connect(chorus);cD2.connect(chorus);rev.connect(revW)
  spl.connect(lDly,0);spl.connect(rDly,1);rDly.connect(dlyT);dlyT.connect(fb);fb.connect(lDly)
  lDly.connect(mrg,0,0);rDly.connect(mrg,0,1);mrg.connect(wet)
  dry.connect(out);wet.connect(out);chorus.connect(out);revW.connect(out)
  out.connect(lim);lim.connect(an);lim.connect(_ctx.destination);lim.connect(dest)
  _nodes={bus,preD,toneF,comp,lim,dry,wet,lDly,rDly,fb,chorus,revW,out,an,dest}
  return true
}

export function applyFx({space=0.3,tone=0.7,drive=0.1,compress=0.3,master=0.85,genre='techno'}={}) {
  if(!_nodes||!_ctx)return
  const gd=GENRES[genre]||GENRES.techno; const fx=gd.fxProfile; const now=_ctx.currentTime
  driveCurve(_nodes.preD,clamp(fx.drive*0.4+drive*0.1,0,0.38))
  _nodes.toneF.frequency.linearRampToValueAtTime(clamp(1800+12000*fx.tone*tone,600,19000),now+0.08)
  _nodes.lDly.delayTime.linearRampToValueAtTime(clamp(0.02+space*0.08,0.01,0.45),now+0.08)
  _nodes.rDly.delayTime.linearRampToValueAtTime(clamp(0.03+space*0.1,0.01,0.45),now+0.08)
  _nodes.fb.gain.linearRampToValueAtTime(clamp(0.06+space*0.2,0.03,0.4),now+0.08)
  _nodes.wet.gain.linearRampToValueAtTime(clamp(space*0.18,0,0.25),now+0.08)
  _nodes.dry.gain.linearRampToValueAtTime(clamp(0.95-space*0.08,0.72,0.97),now+0.08)
  _nodes.chorus.gain.linearRampToValueAtTime(clamp(space*0.08,0,0.14),now+0.12)
  _nodes.revW.gain.linearRampToValueAtTime(clamp(fx.space*space*0.22,0,0.28),now+0.14)
  _nodes.out.gain.linearRampToValueAtTime(master,now+0.06)
  _nodes.comp.threshold.value=clamp(-20-compress*12,-32,-6)
  _nodes.comp.ratio.value=clamp(2+compress*5,1.5,8)
}

export function playKick(accent,t,{kickFreq=90,kickEnd=40,kickDecay=0.2,noiseMix=0.2,bassSubAmt=0.5}={}) {
  if(!_ctx||!nodeGuard())return
  const kf=kickFreq,ke=kickEnd,et=0.08+kickDecay*0.12,dt=0.16+kickDecay*0.22
  const body=_ctx.createOscillator(),bG=_ctx.createGain()
  const sub=_ctx.createOscillator(),sG=_ctx.createGain()
  const click=_ctx.createBufferSource(),cG=_ctx.createGain()
  const mG=_ctx.createGain(),sh=_ctx.createWaveShaper()
  body.type='sine';body.frequency.setValueAtTime(kf,t);body.frequency.exponentialRampToValueAtTime(Math.max(20,ke),t+et)
  sub.type='sine';sub.frequency.setValueAtTime(kf*0.5,t);sub.frequency.exponentialRampToValueAtTime(Math.max(18,ke*0.5),t+et)
  const cb=_ctx.createBuffer(1,Math.floor(_ctx.sampleRate*0.004),_ctx.sampleRate)
  const cd=cb.getChannelData(0);for(let i=0;i<cd.length;i++)cd[i]=rnd()*2-1
  click.buffer=cb;driveCurve(sh,0.05+noiseMix*0.08)
  bG.gain.setValueAtTime(0,t);bG.gain.linearRampToValueAtTime(0.82*accent,t+0.001);bG.gain.exponentialRampToValueAtTime(0.001,t+dt)
  sG.gain.setValueAtTime(0,t);sG.gain.linearRampToValueAtTime(0.5*accent*bassSubAmt,t+0.001);sG.gain.exponentialRampToValueAtTime(0.001,t+dt*1.2)
  cG.gain.setValueAtTime(0,t);cG.gain.linearRampToValueAtTime(0.3*accent,t+0.0005);cG.gain.exponentialRampToValueAtTime(0.001,t+0.006)
  body.connect(sh);sh.connect(bG);sub.connect(sG);click.connect(cG)
  bG.connect(mG);sG.connect(mG);cG.connect(mG);mG.connect(getLaneGain('kick')||_nodes.bus)
  const dur=(dt+0.1)*1000+200;trackNode(dur);gc(body,[sub,click,bG,sG,cG,mG,sh],dur)
  ss(body,t);ss(sub,t);ss(click,t);st(body,t+dt+0.05);st(sub,t+dt+0.08);st(click,t+0.008)
}

export function playSnare(accent,t,{noiseMix=0.2,drumDecay=0.5,compress=0.3,noiseColor='white'}={}) {
  if(!_ctx||!nodeGuard())return
  const nb=noiseBuffer(0.18,0.24+noiseMix*0.5,noiseColor)
  const src=_ctx.createBufferSource(),fil=_ctx.createBiquadFilter(),g=_ctx.createGain()
  src.buffer=nb;fil.type='bandpass';fil.frequency.value=1600+noiseMix*400;fil.Q.value=1.0+compress*0.4
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(0.55*accent,t+0.002);g.gain.exponentialRampToValueAtTime(0.001,t+0.055+drumDecay*0.12)
  src.connect(fil);fil.connect(g);g.connect(getLaneGain('snare')||_nodes.bus)
  gc(src,[fil,g],400);ss(src,t);st(src,t+0.2)
}

export function playHat(accent,t,open=false,{noiseMix=0.2,drumDecay=0.5,noiseColor='white'}={}) {
  if(!_ctx||!nodeGuard())return
  const nb=noiseBuffer(open?0.3:0.12,0.18+noiseMix*0.35,noiseColor)
  const src=_ctx.createBufferSource(),fil=_ctx.createBiquadFilter(),g=_ctx.createGain()
  src.buffer=nb;fil.type='highpass';fil.frequency.value=open?7000:8500
  const decay=open?0.08+drumDecay*0.25:0.008+drumDecay*0.04
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(0.3*accent,t+0.001);g.gain.exponentialRampToValueAtTime(0.001,t+decay)
  src.connect(fil);fil.connect(g);g.connect(getLaneGain('hat')||_nodes.bus)
  gc(src,[fil,g],600);ss(src,t);st(src,t+(open?0.35:0.15))
}

export function playBassVoice(note,accent,t,lenSteps=1,{bassFilter=0.55,bassSubAmt=0.5,fmIdx=0.6,tone=0.7,compress=0.3,bassMode='sub',bpmRef=128}={}) {
  if(!_ctx||!nodeGuard())return
  const f=NOTE_FREQ[note]||110
  const dur=clamp((60/bpmRef)/4*lenSteps*0.92,0.04,6)
  const atk=Math.min(0.008,dur*0.05); const rel=Math.max(0.04,dur*0.88)
  const g=_ctx.createGain(),fil=_ctx.createBiquadFilter()
  fil.type='lowpass';fil.frequency.setValueAtTime(60+bassFilter*3500+tone*600,t);fil.Q.value=0.5+compress*3
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(0.58*accent,t+atk);g.gain.setValueAtTime(0.58*accent,t+rel*0.3);g.gain.exponentialRampToValueAtTime(0.0001,t+rel)
  const cleanMs=(rel+0.3)*1000; const dest=getLaneGain('bass')||_nodes.bus

  if(bassMode==='fm'||bassMode==='bit') {
    const idx=fmIdx*(bassMode==='bit'?3:1.5)
    const car=_ctx.createOscillator(),mod=_ctx.createOscillator(),mg=_ctx.createGain()
    car.type='sine';car.frequency.value=f;mod.type='sine';mod.frequency.value=f*(bassMode==='fm'?2:3);mg.gain.value=f*idx
    const sub=_ctx.createOscillator(),sg=_ctx.createGain()
    sub.type='sine';sub.frequency.value=f*0.5;sg.gain.value=bassSubAmt*0.4
    mod.connect(mg);mg.connect(car.frequency);car.connect(fil);sub.connect(sg);sg.connect(fil);fil.connect(g);g.connect(dest)
    trackNode(cleanMs);gc(car,[mod,mg,sub,sg,fil,g],cleanMs)
    ss(car,t);ss(mod,t);ss(sub,t);st(car,t+rel+0.05);st(mod,t+rel+0.05);st(sub,t+rel+0.05)
  } else if(bassMode==='fold'||bassMode==='wet') {
    const car=_ctx.createOscillator(),ring=_ctx.createOscillator(),rm=_ctx.createGain()
    car.type='sawtooth';car.frequency.value=f;ring.type='sine';ring.frequency.value=f*(bassMode==='fold'?1.5:0.75)
    rm.gain.value=0.5;const rg=_ctx.createGain();rg.gain.value=0;ring.connect(rg);rg.connect(rm.gain)
    car.connect(rm);rm.connect(fil)
    const sub=_ctx.createOscillator(),sg=_ctx.createGain()
    sub.type='sine';sub.frequency.value=f*0.5;sg.gain.value=bassSubAmt*0.5
    sub.connect(sg);sg.connect(fil);fil.connect(g);g.connect(dest)
    trackNode(cleanMs);gc(car,[ring,rm,rg,sub,sg,fil,g],cleanMs)
    ss(car,t);ss(ring,t);ss(sub,t);st(car,t+rel+0.05);st(ring,t+rel+0.05);st(sub,t+rel+0.05)
  } else {
    const types={sub:'sine',grit:'sawtooth',drone:'sawtooth',saw:'sawtooth',pulse:'square'}
    const o1=_ctx.createOscillator(),o2=_ctx.createOscillator()
    o1.type=types[bassMode]||'sawtooth';o2.type='sine'
    o1.frequency.value=f;o2.frequency.value=f*1.005
    const sg=_ctx.createGain();sg.gain.value=bassSubAmt*(bassMode==='sub'?0.85:0.3)
    const lfo=_ctx.createOscillator(),lg=_ctx.createGain()
    lfo.frequency.value=0.5;lg.gain.value=bassMode==='drone'?30:5
    lfo.connect(lg);lg.connect(fil.frequency)
    o1.connect(fil);o2.connect(sg);sg.connect(fil);fil.connect(g);g.connect(dest)
    trackNode(cleanMs);gc(o1,[o2,lfo,sg,fil,g,lg],cleanMs)
    ss(o1,t);ss(o2,t);ss(lfo,t);st(o1,t+rel+0.05);st(o2,t+rel+0.05);st(lfo,t+rel+0.05)
  }
  if(window._midiOut){const v=Math.round(clamp(accent,0,1)*127);window._midiOut.send([0x93,NOTE_MIDI[note]||48,v]);setTimeout(()=>window._midiOut.send([0x83,NOTE_MIDI[note]||48,0]),rel*1000)}
}

export function playBass(note,accent,t,lenSteps=1,params={}) {
  const notes=Array.isArray(note)?note:getVoiceNotes(note,'bass',params.modeName||'minor',true,params.bassStack!==false)
  const va=accent/Math.sqrt(Math.max(1,notes.length))
  notes.forEach((v,i)=>playBassVoice(v,va,t+i*0.002,lenSteps,params))
  return notes.join(' · ')
}

export function playSynthVoice(note,accent,t,lenSteps=1,{synthFilter=0.65,space=0.3,tone=0.7,compress=0.3,fmIdx=0.6,synthMode='lead',bpmRef=128}={}) {
  if(!_ctx||!nodeGuard())return
  const f=NOTE_FREQ[note]||440
  const dur=clamp((60/bpmRef)/4*lenSteps*0.92,0.04,6)
  const cleanMs=(dur+1.5)*1000; const dest=getLaneGain('synth')||_nodes.bus

  if(synthMode==='glass'||synthMode==='bell'){
    const atk=0.001,rel=Math.max(0.3,dur*1.2+synthFilter*2)
    const nb=noiseBuffer(0.04,1,'white'); const src=_ctx.createBufferSource();src.buffer=nb
    const dly=_ctx.createDelay(0.05);dly.delayTime.value=1/f
    const fbk=_ctx.createGain();fbk.gain.value=0.97-synthFilter*0.15
    const lpf=_ctx.createBiquadFilter();lpf.type='lowpass';lpf.frequency.value=2000+synthFilter*6000
    const amp=_ctx.createGain()
    amp.gain.setValueAtTime(0,t);amp.gain.linearRampToValueAtTime(0.55*accent,t+atk);amp.gain.exponentialRampToValueAtTime(0.001,t+rel)
    src.connect(dly);dly.connect(lpf);lpf.connect(fbk);fbk.connect(dly);lpf.connect(amp);amp.connect(dest)
    trackNode(cleanMs);gc(src,[dly,lpf,fbk,amp],cleanMs);ss(src,t);st(src,t+0.04); return
  }
  if(synthMode==='pad'||synthMode==='choir'||synthMode==='mist'){
    const atk=0.06+dur*0.08,rel=Math.max(atk+0.1,dur*0.9+space*0.5)
    const o1=_ctx.createOscillator(),o2=_ctx.createOscillator(),o3=_ctx.createOscillator()
    o1.type='sawtooth';o2.type='sawtooth';o3.type='sine'
    o1.frequency.value=f;o2.frequency.value=f*1.012;o3.frequency.value=f*0.995
    const mix=_ctx.createGain();mix.gain.value=0.33
    const fil=_ctx.createBiquadFilter();fil.type='lowpass'
    fil.frequency.setValueAtTime(300+synthFilter*2000,t);fil.frequency.linearRampToValueAtTime(800+synthFilter*5000,t+atk*2);fil.Q.value=0.4+compress*1.5
    const amp=_ctx.createGain()
    amp.gain.setValueAtTime(0,t);amp.gain.linearRampToValueAtTime(0.38*accent,t+atk);amp.gain.setValueAtTime(0.38*accent,t+Math.max(atk+0.01,dur*0.6));amp.gain.exponentialRampToValueAtTime(0.001,t+rel)
    o1.connect(mix);o2.connect(mix);o3.connect(mix);mix.connect(fil);fil.connect(amp);amp.connect(dest)
    trackNode(cleanMs);gc(o1,[o2,o3,mix,fil,amp],cleanMs)
    ss(o1,t);ss(o2,t);ss(o3,t);st(o1,t+rel+0.1);st(o2,t+rel+0.1);st(o3,t+rel+0.1); return
  }
  if(synthMode==='organ'||synthMode==='air'){
    const atk=0.005,rel=Math.max(0.05,dur*0.95)
    const c1=_ctx.createOscillator(),c2=_ctx.createOscillator(),m1=_ctx.createOscillator(),m2=_ctx.createOscillator()
    const mg1=_ctx.createGain(),mg2=_ctx.createGain()
    c1.type='sine';c2.type='sine';m1.type='sine';m2.type='sine'
    c1.frequency.value=f;c2.frequency.value=f*2;m1.frequency.value=f;m2.frequency.value=f*3
    mg1.gain.value=f*fmIdx*0.8;mg2.gain.value=f*fmIdx*0.4
    m1.connect(mg1);mg1.connect(c1.frequency);m2.connect(mg2);mg2.connect(c2.frequency)
    const mix=_ctx.createGain();mix.gain.value=0.5; const amp=_ctx.createGain()
    amp.gain.setValueAtTime(0,t);amp.gain.linearRampToValueAtTime(0.4*accent,t+atk);amp.gain.setValueAtTime(0.4*accent,t+Math.max(atk+0.01,dur*0.85));amp.gain.exponentialRampToValueAtTime(0.001,t+rel)
    c1.connect(mix);c2.connect(mix);mix.connect(amp);amp.connect(dest)
    trackNode(cleanMs);gc(c1,[c2,m1,m2,mg1,mg2,mix,amp],cleanMs)
    ss(c1,t);ss(c2,t);ss(m1,t);ss(m2,t);st(c1,t+rel+0.1);st(c2,t+rel+0.1);st(m1,t+rel+0.1);st(m2,t+rel+0.1); return
  }
  if(synthMode==='strings'||synthMode==='star'){
    const atk=0.08+dur*0.06,rel=Math.max(atk+0.1,dur*0.92+space*0.4)
    const o1=_ctx.createOscillator(),o2=_ctx.createOscillator()
    const vib=_ctx.createOscillator(),vg=_ctx.createGain()
    o1.type='sawtooth';o2.type='sawtooth';o1.frequency.value=f;o2.frequency.value=f*1.006
    vib.frequency.value=5.2+rnd()*0.6;vg.gain.value=2+synthFilter*6
    vib.connect(vg);vg.connect(o1.frequency);vg.connect(o2.frequency)
    const fil=_ctx.createBiquadFilter();fil.type='lowpass';fil.frequency.value=400+synthFilter*5000;fil.Q.value=0.3
    const amp=_ctx.createGain()
    amp.gain.setValueAtTime(0,t);amp.gain.linearRampToValueAtTime(0.36*accent,t+atk);amp.gain.setValueAtTime(0.36*accent,t+Math.max(atk+0.01,dur*0.7));amp.gain.exponentialRampToValueAtTime(0.001,t+rel)
    o1.connect(fil);o2.connect(fil);fil.connect(amp);amp.connect(dest)
    trackNode(cleanMs);gc(o1,[o2,vib,vg,fil,amp],cleanMs)
    ss(o1,t);ss(o2,t);ss(vib,t);st(o1,t+rel+0.1);st(o2,t+rel+0.1);st(vib,t+rel+0.1); return
  }
  // Default lead/mist/generic
  const atk=0.005,rel=Math.max(0.05,dur*0.9)
  const o1=_ctx.createOscillator(),o2=_ctx.createOscillator()
  const tmap={lead:'square',mist:'sawtooth',choir:'sine',star:'sine',glass:'sine',organ:'sine'}
  o1.type=tmap[synthMode]||'sawtooth';o2.type='triangle'
  o1.frequency.value=f;o2.frequency.value=f*1.008
  const vib=_ctx.createOscillator(),vg=_ctx.createGain()
  vib.frequency.value=5.5;vg.gain.value=clamp(synthMode==='lead'?8:3,0,15)
  vib.connect(vg);vg.connect(o1.frequency)
  const fil=_ctx.createBiquadFilter();fil.type='lowpass';fil.frequency.value=200+synthFilter*7000+tone*1200;fil.Q.value=0.5+compress*3
  const amp=_ctx.createGain()
  amp.gain.setValueAtTime(0,t);amp.gain.linearRampToValueAtTime(0.38*accent,t+atk);amp.gain.setValueAtTime(0.38*accent,t+Math.max(atk+0.01,dur*0.65));amp.gain.exponentialRampToValueAtTime(0.001,t+rel)
  const mix=_ctx.createGain();mix.gain.value=0.5
  o1.connect(mix);o2.connect(mix);mix.connect(fil);fil.connect(amp);amp.connect(dest)
  trackNode(cleanMs);gc(o1,[o2,vib,vg,mix,fil,amp],cleanMs)
  ss(o1,t);ss(o2,t);ss(vib,t);st(o1,t+rel+0.1);st(o2,t+rel+0.1);st(vib,t+rel+0.1)
  if(window._midiOut){const v=Math.round(clamp(accent,0,1)*127);window._midiOut.send([0x94,NOTE_MIDI[note]||60,v]);setTimeout(()=>window._midiOut.send([0x84,NOTE_MIDI[note]||60,0]),rel*1000)}
}

export function playSynth(note,accent,t,lenSteps=1,params={}) {
  const notes=Array.isArray(note)?note:getVoiceNotes(note,'synth',params.modeName||'minor',params.polySynth!==false,true)
  const va=accent/Math.sqrt(Math.max(1,notes.length))
  notes.forEach((v,i)=>playSynthVoice(v,va,t+i*0.003,lenSteps,params))
  return notes.join(' · ')
}

export function startRecording(onDone) {
  if(!_nodes)return null
  const mimes=['audio/webm;codecs=opus','audio/webm','audio/mp4']
  const mime=mimes.find(m=>MediaRecorder.isTypeSupported?.(m))||''
  const chunks=[]
  const rec=mime?new MediaRecorder(_nodes.dest.stream,{mimeType:mime}):new MediaRecorder(_nodes.dest.stream)
  rec.ondataavailable=e=>{if(e.data?.size>0)chunks.push(e.data)}
  rec.onstop=()=>{const ft=mime||rec.mimeType||'audio/webm';const blob=new Blob(chunks,{type:ft});onDone(URL.createObjectURL(blob),ft.includes('mp4')?'m4a':'webm')}
  rec.start(); return rec
}
