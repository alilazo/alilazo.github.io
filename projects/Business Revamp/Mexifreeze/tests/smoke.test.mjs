import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const indexPath = join(root, "index.html");

assert.ok(existsSync(indexPath), "index.html should exist");

const html = readFileSync(indexPath, "utf8");
const normalizedHtml = html.replace(/\s+/g, " ");

const requiredCopy = [
  "MexiFreeze",
  "Mexican-inspired frozen treats",
  "mangonadas",
  "paletas",
  "Airstream",
  "Book MexiFreeze",
  "info@mexifreeze.com",
  "Central Texas",
  "Signature Treats",
  "Event-ready service",
  "Where Sweet Memories Begin",
  "Pause and savor the nectar of life",
  "From Airstream to Ice Cream",
  "handcrafted frozen treats that bring people together",
  "every scoop should feel like something worth remembering",
  "life’s sweetest memories are made over a scoop of ice cream",
  "craft joyful, delicious experiences one scoop at a time",
  "Order Online",
  "Skip the line at the Airstream",
  "Browse the live MexiFreeze menu through EasyEats",
  "Open EasyEats directly",
];

for (const copy of requiredCopy) {
  assert.ok(normalizedHtml.includes(copy), `Expected page content to include: ${copy}`);
}

const premiumMentions = normalizedHtml.match(/premium/gi)?.length ?? 0;
assert.ok(premiumMentions <= 1, `Expected limited use of "premium", found ${premiumMentions}`);

const requiredAssets = [
  "Logo-White-Background.jpg",
  "Trailer-Store-Outside-4th-of-July.avif",
  "Trailer-Inside-Clean.avif",
  "Magonada-Product-v2.avif",
  "Popsicles-Product.avif",
  "Corn-Cup-Dressed-Blurred-Background.avif",
  "Chocolate-Sundae-Icecream-Product.avif",
  "Oreo-Waffle-Cone.avif",
  "Dressed-Hot-Cheetos-Pickles-Chomoy-Product.avif",
  "Lime-Botanera-Product.avif",
  "Trailer-Main-Store-Outside.avif",
  "Trailer-Store-Outside.avif",
];

for (const asset of requiredAssets) {
  assert.ok(html.includes(`assets/${asset}`), `Expected HTML to reference ${asset}`);
  const assetPath = join(root, "assets", asset);
  assert.ok(existsSync(assetPath), `Expected asset file ${asset}`);
  assert.ok(statSync(assetPath).size > 1000, `${asset} should not be empty`);
}

assert.match(html, /<style>[\s\S]*@media\s*\(/, "Embedded CSS should include responsive media queries");
assert.match(html, /mailto:info@mexifreeze\.com/, "Email link should use the correct MexiFreeze address");
const easyEatsOrderUrl = "https://easyeats.com/menu/f/ind/fid/1383/";
assert.ok(html.includes(easyEatsOrderUrl), "Menu CTA should link to the EasyEats POS order page");
assert.match(html, /<iframe[\s\S]*https:\/\/easyeats\.com\/menu\/f\/ind\/fid\/1383\//, "Page should embed the EasyEats menu");
assert.match(html, /class="[^"]*order-frame/, "Embedded EasyEats menu should use the order-frame styles");
assert.ok(!/<iframe[\s\S]*class="order-frame"[\s\S]*loading="lazy"/.test(html), "Order iframe should load immediately");
assert.match(html, /\.order-layout\s*{[\s\S]*width:\s*min\(1560px/, "Order section should use a wider desktop container");
assert.match(html, /class="lead order-copy"/, "Order intro copy should have dedicated layout styling");
assert.ok(!normalizedHtml.includes("EasyEats POS"), "Order side card should be removed");
assert.ok(
  !normalizedHtml.includes("Live menu, direct ordering, one source of truth."),
  "Order side card headline should be removed",
);
assert.ok(!html.includes('class="order-aside"'), "Order side card markup should be removed");
assert.match(
  html,
  /\.order-grid\s*{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/,
  "Order iframe should expand to the full order grid width",
);
assert.match(
  html,
  /\.order-frame\s*{[\s\S]*height:\s*clamp\(540px,\s*65svh,\s*720px\)/,
  "Order iframe should use responsive height after expanding the embed",
);
assert.ok(!html.includes("https://easyeats.xyz/mexifreeze"), "Old EasyEats short URL should be replaced");
assert.match(html, /object-fit:\s*cover/, "Images should use stable crop handling");
assert.ok(!html.includes("© 2035"), "Page should not keep the Wix placeholder copyright");

console.log("MexiFreeze smoke test passed.");
