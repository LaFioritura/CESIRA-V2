export const SECTION_LIBRARY = [
  { id: 'intro', label: 'Intro', densityBias: -0.2, tensionBias: -0.25, length: 4 },
  { id: 'groove', label: 'Groove', densityBias: 0.1, tensionBias: 0.0, length: 8 },
  { id: 'build', label: 'Build', densityBias: 0.16, tensionBias: 0.2, length: 4 },
  { id: 'break', label: 'Break', densityBias: -0.3, tensionBias: -0.05, length: 4 },
  { id: 'drop', label: 'Drop', densityBias: 0.24, tensionBias: 0.28, length: 8 },
  { id: 'outro', label: 'Outro', densityBias: -0.24, tensionBias: -0.15, length: 4 },
];

export function defaultArrangement() {
  return ['intro', 'groove', 'build', 'drop', 'groove', 'break', 'drop', 'outro'];
}
