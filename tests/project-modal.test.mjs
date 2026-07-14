import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/style.css', import.meta.url), 'utf8');
const js = readFileSync(new URL('../js/script.js', import.meta.url), 'utf8');

test('project details use an accessible modal shell', () => {
  assert.match(html, /id="projectModal"/);
  assert.match(html, /role="dialog"/);
  assert.match(html, /aria-modal="true"/);
  assert.match(html, /class="project-modal-close"[^>]*aria-label="Close project details"/);
});

test('every project card receives a keyboard-accessible modal trigger', () => {
  assert.match(js, /querySelectorAll\('\.project-card'\)/);
  assert.match(js, /trigger\.type = 'button'/);
  assert.match(js, /trigger\.setAttribute\('aria-haspopup', 'dialog'\)/);
  assert.match(js, /event\.key === 'Escape'/);
  assert.match(js, /event\.key === 'Tab'/);
});

test('modal supports animated open and close with reduced-motion fallback', () => {
  assert.match(css, /\.project-modal-panel\s*{[\s\S]*cubic-bezier\(0\.16, 1, 0\.3, 1\)/);
  assert.match(css, /\.project-modal\.is-open \.project-modal-panel/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(js, /setProjectModalOrigin\(card\)/);
  assert.match(js, /projectModal\.classList\.remove\('is-open'\)/);
});

test('EMS Unit Out of Service Scheduler project card references a real image asset', () => {
  const imagePath = 'pics/power-apps/ems-unit-out-of-service-power-app.png';

  assert.match(html, /EMS Unit Out of Service Scheduler/);
  assert.match(html, new RegExp(imagePath.replaceAll('/', '\\/')));
  assert.ok(existsSync(new URL(`../${imagePath}`, import.meta.url)));
});
