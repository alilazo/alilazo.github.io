const featuredSips = [
  "Red lemonade with a candy straw pop",
  "Purple sunset lemonade with an icy citrus fade",
  "Pool party lemonade made for the first photo",
  "Pink-blue slush with boardwalk energy",
];

const vibeLines = [
  "Lemon bright, pool cold, and ready for a long afternoon.",
  "Grab the tallest cup, find the shade, and let the flavor do the talking.",
  "A little sweet, a little loud, and completely summer.",
  "Colorful enough for the feed, cold enough for the Texas heat.",
];

let sipIndex = 0;
let vibeIndex = 0;

const featuredSip = document.querySelector("#featured-sip");
const vibeButton = document.querySelector("#vibe-button");
const vibeOutput = document.querySelector("#vibe-output");

function rotateFeaturedSip() {
  if (!featuredSip) return;
  sipIndex = (sipIndex + 1) % featuredSips.length;
  featuredSip.textContent = featuredSips[sipIndex];
}

function spinVibe() {
  if (!vibeOutput) return;
  vibeIndex = (vibeIndex + 1) % vibeLines.length;
  vibeOutput.textContent = vibeLines[vibeIndex];
}

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

if (vibeButton) {
  vibeButton.addEventListener("click", spinVibe);
}

window.setInterval(rotateFeaturedSip, 3200);
