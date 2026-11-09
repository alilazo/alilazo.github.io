import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const host = 'https://amadolazo.com';
const read = path => readFileSync(new URL(path, root), 'utf8');
const attrs = tag => Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/gs)].map(match => [match[1], match[3]]));
const metas = html => Object.fromEntries([...html.matchAll(/<meta\b[^>]*>/g)].map(match => { const a = attrs(match[0]); return [a.name || a.property, a.content]; }));
const tags = html => [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map(match => JSON.parse(match[1]));
const flatten = value => Array.isArray(value) ? value.flatMap(flatten) : value && typeof value === 'object' ? [value, ...Object.values(value).flatMap(flatten)] : [];
const sitemapUrls = [...read('sitemap.xml').matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);
const fileFor = url => { const path = decodeURIComponent(new URL(url).pathname).slice(1); return path.endsWith('/') || !path ? path + 'index.html' : path; };
const pages = sitemapUrls.map(url => ({url, file: fileFor(url), html: read(fileFor(url))}));

test('sitemap contains unique canonical URLs on the custom domain and crawl rules point to it', () => {
  assert.equal(new Set(sitemapUrls).size, sitemapUrls.length);
  assert.equal(sitemapUrls.length, 7);
  assert.ok(sitemapUrls.includes(host + '/'));
  assert.ok(!sitemapUrls.includes(host + '/index.html'));
  assert.match(read('robots.txt'), /^Sitemap: https:\/\/amadolazo\.com\/sitemap\.xml$/m);
  assert.doesNotMatch(read('robots.txt'), /^Disallow:\s*\/\s*$/m);
  for (const {url, html} of pages) {
    assert.equal(new URL(url).origin, host);
    const canonicals = [...html.matchAll(/<link\b[^>]*rel="canonical"[^>]*>/g)];
    assert.equal(canonicals.length, 1, url);
    assert.equal(attrs(canonicals[0][0]).href, url);
    assert.doesNotMatch(metas(html).robots, /noindex/);
  }
});

test('every indexable page has a unique title, description, language, and one static main heading', () => {
  const titles = new Set();
  for (const {url, html} of pages) {
    const title = html.match(/<title>(.*?)<\/title>/s)?.[1];
    assert.ok(title && !titles.has(title), url);
    titles.add(title);
    assert.ok(metas(html).description?.length >= 60, url);
    assert.match(html, /<html\b[^>]*lang="en"/);
    assert.equal([...html.matchAll(/<h1\b/g)].length, 1, url);
  }
});

test('social metadata uses existing raster images with accurate sizes and accessible descriptions', () => {
  for (const {url, html} of pages) {
    const meta = metas(html);
    assert.equal(meta['og:url'], url);
    assert.equal(meta['twitter:url'], url);
    assert.equal(meta['twitter:card'], 'summary_large_image');
    assert.ok(meta['og:image:alt']);
    assert.ok(meta['twitter:image:alt']);
    assert.equal(meta['twitter:image'], meta['og:image']);
    const imageUrl = new URL(meta['og:image']);
    assert.equal(imageUrl.origin, host);
    assert.match(imageUrl.pathname, /\.png$/);
    const image = readFileSync(new URL(imageUrl.pathname.slice(1), root));
    assert.equal(image.subarray(1, 4).toString(), 'PNG');
    assert.equal(Number(meta['og:image:width']), image.readUInt32BE(16));
    assert.equal(Number(meta['og:image:height']), image.readUInt32BE(20));
  }
});

test('structured data is valid, describes visible content, and contains no unsupported ratings', () => {
  for (const {url, html} of pages) {
    const data = tags(html);
    assert.ok(data.length, url);
    const nodes = flatten(data);
    assert.ok(!nodes.some(node => Object.hasOwn(node, 'aggregateRating')), url);
    const visibleText = html.replace(/<head>.*?<\/head>/s, '').replace(/<script\b.*?<\/script>/gs, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    for (const question of nodes.filter(node => node['@type'] === 'Question')) assert.ok(visibleText.includes(question.name), question.name);
  }
  const profile = flatten(tags(read('index.html')));
  const person = profile.find(node => node['@type'] === 'Person');
  assert.equal(profile.find(node => node['@type'] === 'ProfilePage').mainEntity['@id'], person['@id']);
  assert.doesNotMatch(read('index.html'), /id="ai-summary"/);
});

test('client concepts, carts, and the error page stay out of search without blocking crawler access', () => {
  for (const file of ['404.html', 'projects/Image-Per-Square-Inch/cart.html', 'projects/Business Revamp/Mexifreeze/index.html', 'projects/Business Revamp/The Main Squeeze/index.html']) {
    assert.match(metas(read(file)).robots, /noindex/);
    assert.ok(!pages.some(page => page.file === file));
  }
});

test('landing-page images reserve space, load below the fold lazily, and keep original fallbacks', () => {
  const html = read('index.html');
  for (const match of html.matchAll(/<img\b[^>]*>/g)) {
    const image = attrs(match[0]);
    assert.ok(Number(image.width) > 0 && Number(image.height) > 0, image.src);
    assert.ok(Object.hasOwn(image, 'alt'), image.src);
    assert.ok(existsSync(new URL(image.src, root)), image.src);
    if (match.index > html.indexOf('<main ')) assert.equal(image.loading, 'lazy', image.src);
  }
  for (const match of html.matchAll(/<source\b[^>]*>/g)) {
    const source = attrs(match[0]);
    for (const candidate of source.srcset.split(',')) assert.ok(existsSync(new URL(candidate.trim().split(/\s/)[0], root)), candidate);
  }
});
