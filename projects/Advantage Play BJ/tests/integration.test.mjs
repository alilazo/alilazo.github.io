import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const portfolio = join(root, '..', '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const app = readFileSync(join(root, 'js', 'app.js'), 'utf8');
const worker = readFileSync(join(root, 'js', 'simulation-worker.js'), 'utf8');

test('all seven requested tabs and key controls exist', () => {
  for (const id of ['play', 'drills', 'visual', 'simulation', 'session', 'history', 'settings']) assert.match(html, new RegExp(`data-tab="${id}"`));
  for (const id of ['simRun', 'simStop', 'simRestart', 'startVisual', 'startSession']) assert.match(html, new RegExp(`id="${id}"`));
});

test('shared rules include all requested rule switches', () => {
  for (const key of ['decks', 'penetration', 'soft17', 'blackjackPayout', 'holeCard', 'doubleRule', 'doubleAfterSplit', 'surrender', 'maxSplitHands', 'resplitAces', 'hitSplitAces', 'insurance']) assert.ok(app.includes(key));
});

test('simulation uses a module worker and reports confidence-aware EV', () => {
  assert.match(app, /new Worker\(new URL\('\.\/simulation-worker\.js'/);
  assert.match(worker, /evStatistics/);
  assert.match(html, /Estimated EV/);
  assert.match(html, /95% confidence interval|95% interval/);
});

test('portfolio integration and discovery files point at the real app', () => {
  const portfolioHtml = readFileSync(join(portfolio, 'index.html'), 'utf8');
  const sitemap = readFileSync(join(portfolio, 'sitemap.xml'), 'utf8');
  assert.match(portfolioHtml, /Advantage Play BJ/);
  assert.match(portfolioHtml, /href="projects\/Advantage%20Play%20BJ\/"/);
  assert.match(sitemap, /projects\/Advantage%20Play%20BJ\//);
  assert.ok(existsSync(join(portfolio, 'pics', 'projects', 'advantage-play-bj.svg')));
});

test('app includes reduced motion, local persistence and achievements', () => {
  const css = readFileSync(join(root, 'styles.css'), 'utf8');
  assert.match(css, /prefers-reduced-motion/);
  assert.match(app, /localStorage/);
  for (const name of ['Welcome to the Felt', 'Basic Instinct', 'Running True', 'Index Player', 'Flash Focus']) {
    assert.ok(readFileSync(join(root, 'js', 'config.js'), 'utf8').includes(name));
  }
});
