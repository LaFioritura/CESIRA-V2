import { createInitialState, evolvePatterns } from '../engine/composition/generator';
import { defaultArrangement } from '../engine/song/sections';
import { GENRES, PERFORMANCE_PRESETS } from '../engine/presets/genrePresets';

export const STORAGE_KEY = 'cesira-session-v1';

function createMixer() {
  return {
    kick: { volume: 0.92, muted: false, solo: false },
    snare: { volume: 0.72, muted: false, solo: false },
    hat: { volume: 0.62, muted: false, solo: false },
    bass: { volume: 0.88, muted: false, solo: false },
    synth: { volume: 0.74, muted: false, solo: false },
  };
}

export function createDefaultSession() {
  const genreKey = 'techno';
  const performancePreset = 'clean';
  const generated = createInitialState(genreKey, performancePreset);
  return {
    version: 1,
    projectName: 'CESIRA Session',
    genreKey,
    bpm: GENRES[genreKey].bpm,
    currentView: 'perform',
    currentSection: 'groove',
    arrangement: defaultArrangement(),
    patterns: generated.patterns,
    performancePreset,
    performance: { ...PERFORMANCE_PRESETS[performancePreset] },
    mixer: createMixer(),
    sound: {
      bassPreset: GENRES[genreKey].bassPreset,
      synthPreset: GENRES[genreKey].synthPreset,
      kitPreset: GENRES[genreKey].kitPreset,
      fx: { ...GENRES[genreKey].fxProfile },
    },
    transport: { playing: false, recording: false, step: 0 },
    onboardingSeen: false,
    splashDismissed: false,
    lastSeed: generated.seed,
  };
}

export function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultSession();
    const parsed = JSON.parse(raw);
    return { ...createDefaultSession(), ...parsed, version: 1 };
  } catch {
    return createDefaultSession();
  }
}

export function saveSession(session) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function sessionReducer(state, action) {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, currentView: action.view };
    case 'SET_STEP':
      return { ...state, transport: { ...state.transport, step: action.step } };
    case 'SET_PLAYING':
      return { ...state, transport: { ...state.transport, playing: action.playing } };
    case 'SET_RECORDING':
      return { ...state, transport: { ...state.transport, recording: action.recording } };
    case 'SET_PROJECT_NAME':
      return { ...state, projectName: action.value };
    case 'SET_GENRE': {
      const generated = createInitialState(action.genreKey, state.performancePreset, Date.now());
      const genre = GENRES[action.genreKey];
      return {
        ...state,
        genreKey: action.genreKey,
        bpm: genre.bpm,
        sound: {
          ...state.sound,
          bassPreset: genre.bassPreset,
          synthPreset: genre.synthPreset,
          kitPreset: genre.kitPreset,
          fx: { ...genre.fxProfile },
        },
        patterns: generated.patterns,
        lastSeed: generated.seed,
      };
    }
    case 'SET_BPM':
      return { ...state, bpm: Math.max(70, Math.min(180, action.bpm)) };
    case 'TOGGLE_STEP': {
      const lane = state.patterns[action.lane].map((step, index) => (
        index === action.index ? { ...step, active: !step.active } : step
      ));
      return { ...state, patterns: { ...state.patterns, [action.lane]: lane } };
    }
    case 'SET_NOTE': {
      const lane = state.patterns[action.lane].map((step, index) => (
        index === action.index ? { ...step, note: action.note, active: action.note != null } : step
      ));
      return { ...state, patterns: { ...state.patterns, [action.lane]: lane } };
    }
    case 'SET_LENGTH': {
      const lane = state.patterns[action.lane].map((step, index) => (
        index === action.index ? { ...step, length: action.length } : step
      ));
      return { ...state, patterns: { ...state.patterns, [action.lane]: lane } };
    }
    case 'SET_VELOCITY': {
      const lane = state.patterns[action.lane].map((step, index) => (
        index === action.index ? { ...step, velocity: action.velocity } : step
      ));
      return { ...state, patterns: { ...state.patterns, [action.lane]: lane } };
    }
    case 'SET_SECTION':
      return { ...state, currentSection: action.sectionId };
    case 'EVOLVE': {
      const next = evolvePatterns({
        genreKey: state.genreKey,
        sectionId: state.currentSection,
        performance: state.performance,
        previousPatterns: state.patterns,
        seed: Date.now(),
      });
      return { ...state, patterns: next.patterns, lastSeed: Date.now() };
    }
    case 'APPLY_ACTION': {
      const patterns = structuredClone(state.patterns);
      if (action.kind === 'drop') {
        patterns.hat.forEach((step, i) => { step.active = i % 2 === 0 ? false : step.active; });
        patterns.synth.forEach((step, i) => { if (i < 8) step.active = false; });
      }
      if (action.kind === 'fill') {
        patterns.snare[14].active = true;
        patterns.snare[15].active = true;
        patterns.hat[13].active = true;
        patterns.hat[15].active = true;
      }
      if (action.kind === 'break') {
        patterns.kick.forEach((step, i) => { if (i !== 0 && i !== 8) step.active = false; });
        patterns.bass.forEach((step) => { step.active = false; });
      }
      if (action.kind === 'build') {
        patterns.hat.forEach((step, i) => { if (i > 8) step.active = true; });
        patterns.snare[12].active = true;
        patterns.snare[14].active = true;
      }
      if (action.kind === 'energy') {
        patterns.kick.forEach((step, i) => { if (i % 4 === 2) step.active = true; });
        patterns.bass.forEach((step) => { if (step.active) step.velocity = Math.min(1, step.velocity + 0.12); });
      }
      return { ...state, patterns };
    }
    case 'SET_PERFORMANCE_PRESET':
      return {
        ...state,
        performancePreset: action.key,
        performance: { ...PERFORMANCE_PRESETS[action.key] },
      };
    case 'SET_PERFORMANCE_VALUE':
      return {
        ...state,
        performance: { ...state.performance, [action.key]: action.value },
      };
    case 'SET_SOUND_PRESET':
      return {
        ...state,
        sound: { ...state.sound, [action.key]: action.value },
      };
    case 'SET_FX_VALUE':
      return {
        ...state,
        sound: { ...state.sound, fx: { ...state.sound.fx, [action.key]: action.value } },
      };
    case 'SET_MIXER_VALUE':
      return {
        ...state,
        mixer: {
          ...state.mixer,
          [action.lane]: { ...state.mixer[action.lane], [action.key]: action.value },
        },
      };
    case 'DISMISS_ONBOARDING':
      return { ...state, onboardingSeen: true };
    case 'DISMISS_SPLASH':
      return { ...state, splashDismissed: true };
    case 'LOAD_SESSION':
      return { ...createDefaultSession(), ...action.session, onboardingSeen: true, splashDismissed: true };
    default:
      return state;
  }
}
