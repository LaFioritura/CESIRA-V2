import { GENRES, PERFORMANCE_PRESETS } from '../presets/genrePresets';
import { SECTION_LIBRARY } from '../song/sections';
import { STEPS, NOTE_LANES } from '../sequencer/constants';
import { clamp, createRng, pickWeighted } from '../../utils/random';

const OFFSETS = [0, 2, 3, 5, 7, 8, 10, 12];

function makeStep(active = false, velocity = 0.8, probability = 1, length = 1, note = null) {
  return { active, velocity, probability, length, note };
}

function generateDrumLane(weight, emphasis, rng, sectionBias, groove, sparseEvery = []) {
  return Array.from({ length: STEPS }, (_, step) => {
    const beatStrong = step % 4 === 0 ? emphasis : 0;
    const offbeat = step % 2 === 1 ? groove * 0.08 : 0;
    const forbidden = sparseEvery.includes(step);
    const threshold = clamp(weight + beatStrong + sectionBias + offbeat - (forbidden ? 0.35 : 0), 0.02, 0.98);
    const active = rng() < threshold;
    const velocity = clamp(0.55 + (beatStrong * 0.9) + rng() * 0.22, 0.25, 1);
    return makeStep(active, velocity, clamp(0.82 + rng() * 0.18, 0.7, 1));
  });
}

function generateBass(scale, root, movement, density, tension, rng) {
  let motif = pickWeighted([[0, 4], [2, 2], [4, 2], [5, 1], [7, 1]], rng);
  return Array.from({ length: STEPS }, (_, step) => {
    const strong = step % 4 === 0;
    const active = rng() < clamp(density * (strong ? 1.2 : 0.54) + tension * 0.1, 0.08, 0.92);
    if (!active) return makeStep(false, 0.5, 1, 1, null);
    if (rng() < movement) motif = pickWeighted([[0, 4], [2, 2], [3, 1], [4, 3], [5, 1], [7, 1]], rng);
    const scaleDegree = OFFSETS[(motif + Math.floor(rng() * 2)) % OFFSETS.length] % scale.length;
    const note = root + scale[scaleDegree] + (strong ? -12 : 0);
    return makeStep(true, clamp(0.62 + rng() * 0.3, 0.3, 1), 1, strong ? 2 : 1, note);
  });
}

function generateSynth(scale, root, movement, density, tension, rng) {
  let phraseAnchor = 0;
  return Array.from({ length: STEPS }, (_, step) => {
    const region = Math.floor(step / 4);
    const shouldTrigger = rng() < clamp(density * 0.55 + tension * 0.1 + (step % 4 === 0 ? 0.18 : 0), 0.06, 0.82);
    if (!shouldTrigger) return makeStep(false, 0.55, 1, 1, null);
    if (step % 4 === 0 || rng() < movement) phraseAnchor = pickWeighted([[0, 3], [2, 1], [4, 2], [5, 1], [7, 2]], rng);
    const degree = (phraseAnchor + region + Math.floor(rng() * 2)) % scale.length;
    const note = root + 12 + scale[degree] + (region % 2 === 0 ? 0 : 12);
    return makeStep(true, clamp(0.45 + rng() * 0.35, 0.25, 1), 1, step % 4 === 0 ? 2 : 1, note);
  });
}

export function createInitialState(genreKey = 'techno', performanceKey = 'clean', seed = Date.now()) {
  const genre = GENRES[genreKey];
  const performance = PERFORMANCE_PRESETS[performanceKey];
  const rng = createRng(seed);
  const section = SECTION_LIBRARY.find((s) => s.id === 'groove');
  const density = clamp(genre.density * 0.7 + performance.density * 0.3 + section.densityBias, 0.12, 0.95);
  const tension = clamp(performance.tension + section.tensionBias, 0, 1);

  const patterns = {
    kick: generateDrumLane(genre.kickWeight * density, 0.2, rng, section.densityBias, genre.grooveBias),
    snare: generateDrumLane(genre.snareWeight * density, 0.1, rng, section.densityBias, genre.grooveBias, [0, 4, 8, 12]),
    hat: generateDrumLane(genre.hatWeight * density, 0.05, rng, section.densityBias, genre.grooveBias),
    bass: generateBass(genre.scale, genre.root, genre.bassMovement, density, tension, rng),
    synth: generateSynth(genre.scale, genre.root, genre.synthMovement, density, tension, rng),
  };

  return { patterns, density, tension, seed };
}

export function evolvePatterns({ genreKey, sectionId, performance, previousPatterns, seed }) {
  const genre = GENRES[genreKey];
  const section = SECTION_LIBRARY.find((s) => s.id === sectionId) ?? SECTION_LIBRARY[1];
  const rng = createRng(seed);
  const density = clamp(genre.density * 0.65 + performance.density * 0.35 + section.densityBias, 0.08, 1);
  const tension = clamp(performance.tension + section.tensionBias, 0, 1);

  const fresh = createInitialState(genreKey, 'clean', seed + 9).patterns;
  const next = {};
  for (const lane of Object.keys(previousPatterns)) {
    next[lane] = previousPatterns[lane].map((step, index) => {
      const incoming = fresh[lane][index];
      const keepChance = NOTE_LANES.includes(lane) ? 0.7 : 0.76;
      if (rng() < keepChance) {
        const active = step.active ? rng() > 0.12 : rng() < density * 0.24;
        return {
          ...step,
          active,
          velocity: clamp(step.velocity + (rng() - 0.5) * 0.18, 0.2, 1),
          note: step.note ?? incoming.note,
        };
      }
      return incoming;
    });
  }
  return { patterns: next, density, tension };
}
