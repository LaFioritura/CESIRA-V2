export function createRng(seed = Date.now()) {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => (value = (value * 16807) % 2147483647) / 2147483647;
}

export function pickWeighted(entries, rng) {
  const total = entries.reduce((sum, [_, w]) => sum + w, 0);
  let roll = rng() * total;
  for (const [item, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return item;
  }
  return entries[entries.length - 1][0];
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
