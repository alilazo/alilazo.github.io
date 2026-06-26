import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (file) => readFileSync(join(root, file), "utf8");

const requiredFiles = ["index.html", "styles.css", "script.js"];
for (const file of requiredFiles) {
  assert.ok(existsSync(join(root, file)), `${file} should exist`);
}

const html = read("index.html");
const css = read("styles.css");
const js = read("script.js");
const combined = `${html}\n${css}\n${js}`;

const requiredCopy = [
  "The Main Squeeze",
  "Featured Sips",
  "Summer Specials",
  "Website by Amado Lazo",
  "I built this to keep selling after the first click.",
  "I used your real Facebook photos",
  "My local Kyle price",
  "$300 upfront",
  "$75/month",
  "Typical online freelancer",
  "$1,000-$5,000",
  "$50-$300/month",
  "108 S Front St",
  "Created by Amado Lazo",
];

for (const copy of requiredCopy) {
  assert.ok(combined.includes(copy), `Expected page content to include: ${copy}`);
}

const requiredAssets = [
  "logo-main-squeeze-facebook.jpg",
  "product-red-lemonade-closeup.jpg",
  "product-pool-unicorn-summer.jpg",
  "product-purple-lemonade-closeup.jpg",
  "product-pink-blue-slush.jpg",
  "product-wemby-lemonade-freeze.jpg",
  "promo-happy-hour-lemonade.jpg",
  "promo-dot-cake-drinks.jpg",
  "promo-today-lemonade-trio.jpg",
  "cover-lemons.jpg",
];

for (const asset of requiredAssets) {
  assert.ok(html.includes(`assets/${asset}`), `Expected HTML to reference ${asset}`);
  assert.ok(existsSync(join(root, "assets", asset)), `Expected asset file ${asset}`);
  assert.ok(statSync(join(root, "assets", asset)).size > 1000, `${asset} should not be empty`);
}

const imageAssets = readdirSync(join(root, "assets")).filter((file) =>
  /\.(jpe?g|png|webp)$/i.test(file),
);

for (const asset of imageAssets) {
  assert.ok(combined.includes(`assets/${asset}`), `Expected site files to use asset ${asset}`);
}

assert.ok(!combined.toLowerCase().includes("crop"), "Site files should not reference crop assets");
assert.ok(
  !combined.includes("This concept turns Facebook photos"),
  "Pitch copy should sound like Amado built it, not like a generic concept",
);
assert.match(css, /@media\s*\(/, "CSS should include responsive media queries");
assert.match(css, /--lemon|--aqua|--coral|--pink/, "CSS should define the bright theme colors");
assert.match(js, /addEventListener/, "JavaScript should attach interactions");

console.log("Smoke test passed.");
