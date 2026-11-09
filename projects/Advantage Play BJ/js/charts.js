function safePoints(values, width, height, padding) {
  if (!values.length) return '';
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  const range = max - min || 1;
  return values.map((value, index) => {
    const x = padding + (index / Math.max(1, values.length - 1)) * (width - padding * 2);
    const y = height - padding - ((value - min) / range) * (height - padding * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
}

export function renderLineChart(container, values, label, unit = '') {
  if (!container) return;
  if (!values.length) {
    container.innerHTML = '<p class="empty-state">Complete a session to build this graph.</p>';
    return;
  }
  const width = 720;
  const height = 230;
  const padding = 28;
  const points = safePoints(values, width, height, padding);
  const latest = values.at(-1);
  container.innerHTML = `
    <svg class="line-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="${label}: latest value ${latest.toFixed(2)} ${unit}">
      <title>${label}</title><desc>Line chart with ${values.length} observations. Latest value ${latest.toFixed(2)} ${unit}.</desc>
      <line class="chart-zero" x1="${padding}" x2="${width - padding}" y1="${height / 2}" y2="${height / 2}"></line>
      <polyline class="chart-line" points="${points}"></polyline>
      <circle class="chart-dot" cx="${points.split(' ').at(-1).split(',')[0]}" cy="${points.split(' ').at(-1).split(',')[1]}" r="5"></circle>
    </svg>`;
}

export function renderBars(container, entries, label) {
  if (!container) return;
  if (!entries.length) {
    container.innerHTML = '<p class="empty-state">No data yet.</p>';
    return;
  }
  const max = Math.max(1, ...entries.map((entry) => Math.abs(entry.value)));
  container.innerHTML = `<div class="bar-chart" role="img" aria-label="${label}">${entries.map((entry) => `
    <div class="bar-row"><span>${entry.label}</span><div class="bar-track"><i style="--bar:${Math.max(2, Math.abs(entry.value) / max * 100)}%"></i></div><strong>${entry.value.toFixed(2)}</strong></div>`).join('')}</div>`;
}
