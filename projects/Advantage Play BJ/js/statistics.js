export function evStatistics(hands, sum, sumSquares) {
  if (!hands) return { mean: 0, variance: 0, standardDeviation: 0, ev100: 0, margin95: 0 };
  const mean = sum / hands;
  const variance = hands > 1 ? Math.max(0, (sumSquares - sum * sum / hands) / (hands - 1)) : 0;
  const standardDeviation = Math.sqrt(variance);
  return { mean, variance, standardDeviation, ev100: mean * 100, margin95: 1.96 * standardDeviation / Math.sqrt(hands) * 100 };
}

export function dollarsPerHour(ev100, unit, handsPerHour) {
  return ev100 / 100 * unit * handsPerHour;
}
