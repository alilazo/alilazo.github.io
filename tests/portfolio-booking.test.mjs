import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/style.css', import.meta.url), 'utf8');

test('portfolio exposes a Cal.com booking section without leaking API secrets', () => {
  assert.match(html, /href="#Booking"[^>]*>\s*Book Now\s*<\/a>/);
  assert.match(html, /<section id="Booking"/);
  assert.match(html, /https:\/\/cal\.com\/amado-lazo\?embed=true/);
  assert.match(html, /title="Book a call with Amado Lazo"/);
  assert.doesNotMatch(html, /cal_live_[a-z0-9]+/i);
});

test('booking section includes extended intro copy and responsive styling', () => {
  assert.doesNotMatch(html, /Screening questions/i);
  assert.doesNotMatch(html, /No exposed API keys/i);
  assert.doesNotMatch(html, /Calendar boundaries/i);
  assert.doesNotMatch(html, /booking-security-list/);
  assert.match(html, /Choose a time that works for you on the calendar below/i);
  assert.match(css, /\.booking-grid/);
  assert.match(css, /\.booking-grid\s*{[\s\S]*grid-template-columns:\s*1fr;/);
  assert.match(css, /\.booking-copy\s*{[\s\S]*max-width:\s*900px;/);
  assert.doesNotMatch(css, /booking-security-list/);
  assert.match(css, /#Booking\s*{[\s\S]*padding-top:\s*3rem;/);
  assert.match(css, /\.booking-container\s*{[\s\S]*padding:\s*2rem;/);
  assert.match(css, /\.booking-embed-card\s*{[\s\S]*min-height:\s*640px;/);
  assert.doesNotMatch(css, /\.booking-embed-card\s*{[^}]*max-width:\s*980px;/);
  assert.match(css, /\.booking-embed-card\s*{[\s\S]*border-radius:\s*8px;/);
  assert.match(css, /\.booking-embed-card\s*{[\s\S]*box-shadow:\s*0 18px 40px rgba\(0,\s*0,\s*0,\s*0\.18\);/);
  assert.match(css, /\.booking-iframe\s*{[\s\S]*width:\s*100%;[\s\S]*min-height:\s*640px;/);
  assert.match(css, /@media \(max-width: 768px\)[\s\S]*\.booking-grid/);
});
