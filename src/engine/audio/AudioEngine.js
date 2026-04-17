import { BASS_PRESETS, GENRES, KIT_PRESETS, SYNTH_PRESETS } from '../presets/genrePresets';
import { STEPS } from '../sequencer/constants';
import { midiToFrequency } from './note';

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.compressor = null;
    this.filter = null;
    this.delay = null;
    this.delayFeedback = null;
    this.delayMix = null;
    this.lanes = {};
    this.recordDestination = null;
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.interval = null;
    this.lookahead = 0.12;
    this.scheduleAheadTime = 0.22;
    this.nextStepTime = 0;
    this.currentStep = 0;
    this.playing = false;
    this.onStep = () => {};
    this.activeNodes = new Set();
  }

  async ensure() {
    if (this.ctx) return this.ctx;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContextClass();

    this.master = this.ctx.createGain();
    this.master.gain.value = 0.82;
    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 16000;

    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -10;
    this.compressor.knee.value = 24;
    this.compressor.ratio.value = 8;
    this.compressor.attack.value = 0.004;
    this.compressor.release.value = 0.18;

    this.delay = this.ctx.createDelay(1);
    this.delayFeedback = this.ctx.createGain();
    this.delayMix = this.ctx.createGain();
    this.delay.delayTime.value = 0.22;
    this.delayFeedback.gain.value = 0.2;
    this.delayMix.gain.value = 0.18;
    this.delay.connect(this.delayFeedback);
    this.delayFeedback.connect(this.delay);

    this.recordDestination = this.ctx.createMediaStreamDestination();

    this.filter.connect(this.compressor);
    this.compressor.connect(this.master);
    this.master.connect(this.ctx.destination);
    this.master.connect(this.recordDestination);
    this.delay.connect(this.delayMix);
    this.delayMix.connect(this.master);

    ['kick', 'snare', 'hat', 'bass', 'synth'].forEach((lane) => {
      const gain = this.ctx.createGain();
      gain.gain.value = 0.8;
      gain.connect(this.filter);
      gain.connect(this.delay);
      this.lanes[lane] = { gain };
    });

    return this.ctx;
  }

  setOnStep(callback) {
    this.onStep = callback;
  }

  setMixer(mixer) {
    Object.entries(mixer).forEach(([lane, state]) => {
      if (!this.lanes[lane]) return;
      this.lanes[lane].gain.gain.setTargetAtTime(state.muted ? 0 : state.volume, this.ctx.currentTime, 0.01);
    });
  }

  setFx({ drive, space, tone }) {
    if (!this.ctx) return;
    this.delayMix.gain.setTargetAtTime(space * 0.55, this.ctx.currentTime, 0.03);
    this.delay.delayTime.setTargetAtTime(0.12 + space * 0.35, this.ctx.currentTime, 0.03);
    this.delayFeedback.gain.setTargetAtTime(0.12 + space * 0.4, this.ctx.currentTime, 0.03);
    this.filter.frequency.setTargetAtTime(500 + tone * 15000, this.ctx.currentTime, 0.03);
    this.master.gain.setTargetAtTime(0.72 + drive * 0.16, this.ctx.currentTime, 0.03);
  }

  startRecording() {
    if (!this.recordDestination || this.mediaRecorder) return;
    this.recordedChunks = [];
    this.mediaRecorder = new MediaRecorder(this.recordDestination.stream, { mimeType: 'audio/webm' });
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) this.recordedChunks.push(event.data);
    };
    this.mediaRecorder.start();
  }

  stopRecording() {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        resolve(null);
        return;
      }
      const recorder = this.mediaRecorder;
      recorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
        this.mediaRecorder = null;
        resolve(blob);
      };
      recorder.stop();
    });
  }

  stopAllSound() {
    for (const node of this.activeNodes) {
      try { node.stop?.(); } catch {}
      try { node.disconnect?.(); } catch {}
    }
    this.activeNodes.clear();
  }

  panic() {
    if (!this.ctx) return;
    this.stopAllSound();
    this.stop();
  }

  play(session) {
    if (this.playing) return;
    this.playing = true;
    this.currentStep = 0;
    this.nextStepTime = this.ctx.currentTime + 0.05;
    const tick = () => {
      while (this.nextStepTime < this.ctx.currentTime + this.scheduleAheadTime) {
        this.scheduleStep(session, this.currentStep, this.nextStepTime);
        this.nextStep();
      }
    };
    tick();
    this.interval = window.setInterval(tick, 25);
  }

  stop() {
    this.playing = false;
    if (this.interval) window.clearInterval(this.interval);
    this.interval = null;
    this.currentStep = 0;
  }

  nextStep() {
    this.currentStep = (this.currentStep + 1) % STEPS;
    this.nextStepTime += (60 / this.sessionBpm) / 4;
  }

  scheduleStep(session, stepIndex, time) {
    this.sessionBpm = session.bpm;
    this.onStep(stepIndex);
    const genre = GENRES[session.genreKey];
    const bassPreset = BASS_PRESETS[session.sound.bassPreset];
    const synthPreset = SYNTH_PRESETS[session.sound.synthPreset];
    const kit = KIT_PRESETS[session.sound.kitPreset];

    const swingOffset = stepIndex % 2 === 1 ? genre.swing * session.performance.groove * 0.06 : 0;
    const when = time + swingOffset;

    this.triggerDrum('kick', session.patterns.kick[stepIndex], when, kit.kickDecay, kit.kickPunch);
    this.triggerNoise('snare', session.patterns.snare[stepIndex], when, 0.18, kit.snareNoise * 1.2);
    this.triggerNoise('hat', session.patterns.hat[stepIndex], when, kit.hatDecay, 28);
    this.triggerBass(session.patterns.bass[stepIndex], when, bassPreset);
    this.triggerSynth(session.patterns.synth[stepIndex], when, synthPreset);
  }

  trackNode(node) {
    this.activeNodes.add(node);
    node.onended = () => this.activeNodes.delete(node);
  }

  triggerDrum(lane, step, when, decay, punch) {
    if (!step?.active || Math.random() > step.probability) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120 * punch, when);
    osc.frequency.exponentialRampToValueAtTime(40, when + decay * 0.7);
    gain.gain.setValueAtTime(step.velocity * 0.9, when);
    gain.gain.exponentialRampToValueAtTime(0.001, when + decay);
    osc.connect(gain);
    gain.connect(this.lanes[lane].gain);
    osc.start(when);
    osc.stop(when + decay);
    this.trackNode(osc);
  }

  triggerNoise(lane, step, when, decay, brightness) {
    if (!step?.active || Math.random() > step.probability) return;
    const bufferSize = this.ctx.sampleRate * decay;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize / brightness));
    const source = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = lane === 'hat' ? 5000 : 1600;
    gain.gain.setValueAtTime(step.velocity * 0.45, when);
    gain.gain.exponentialRampToValueAtTime(0.001, when + decay);
    source.buffer = buffer;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.lanes[lane].gain);
    source.start(when);
    source.stop(when + decay);
    this.trackNode(source);
  }

  triggerBass(step, when, preset) {
    if (!step?.active || step.note == null) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    osc.type = preset.waveform;
    osc.frequency.setValueAtTime(midiToFrequency(step.note), when);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(preset.filter, when);
    filter.Q.value = preset.resonance;
    gain.gain.setValueAtTime(step.velocity * 0.34, when);
    gain.gain.exponentialRampToValueAtTime(0.001, when + 0.2 + step.length * preset.envelope * 0.22);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.lanes.bass.gain);
    osc.start(when);
    osc.stop(when + 0.4 + step.length * 0.12);
    this.trackNode(osc);
  }

  triggerSynth(step, when, preset) {
    if (!step?.active || step.note == null) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    osc.type = preset.waveform;
    osc.detune.value = preset.detune;
    osc.frequency.setValueAtTime(midiToFrequency(step.note), when);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(preset.filter, when);
    filter.Q.value = preset.resonance;
    gain.gain.setValueAtTime(0.001, when);
    gain.gain.linearRampToValueAtTime(step.velocity * 0.18, when + preset.attack);
    gain.gain.exponentialRampToValueAtTime(0.001, when + preset.attack + preset.release + step.length * 0.1);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.lanes.synth.gain);
    osc.start(when);
    osc.stop(when + preset.attack + preset.release + 0.5);
    this.trackNode(osc);
  }
}
