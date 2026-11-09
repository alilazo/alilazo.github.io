// Run with Playwright CLI against the local server: run-code --filename scripts/build-social-cards.cjs
async (page) => {
  const origin = new URL(page.url()).origin;
  const cards = [
    {file: 'amado-lazo', title: 'AMADO<br>LAZO<span>.</span>', description: 'Software engineer in Austin, Texas.<br>Operational software. AI-powered tools.', image: 'pics/amado-lazo-tamucc-portrait.jpg', portrait: true},
    {file: 'color-converter', title: 'COLOR<br>CONVERTER', description: 'HEX to RGB and HSL.<br>A free tool by Amado Lazo.', image: 'pics/projects/color-converter-api.svg'},
    {file: 'color-picker', title: 'COLOR<br>PICKER', description: 'Pick a color. Copy HEX, RGB, and HSL.<br>A free tool by Amado Lazo.', image: 'pics/projects/color-picker-tool.svg'},
    {file: 'advantage-play-bj', title: 'ADVANTAGE<br>PLAY BJ', description: 'Hi-Lo counting, strategy drills, and EV simulation.<br>A free tool by Amado Lazo.', image: 'pics/projects/advantage-play-bj.svg'},
    {file: 'print-cost-calculator', title: 'PRINT COST<br>CALCULATOR', description: 'Estimate image printing costs by size.<br>Built by Amado Lazo.'}
  ];
  await page.setViewportSize({width: 1200, height: 630});
  for (const card of cards) {
    await page.setContent(`<!doctype html><html lang="en"><head><meta charset="utf-8"><style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Space+Grotesk:wght@700&display=swap');
      *{box-sizing:border-box}body{margin:0;background:#f7f5f0;color:#1a1a1a}
      #card{width:1200px;height:630px;display:grid;grid-template-columns:${card.image ? '58% 42%' : '1fr'};grid-template-rows:minmax(0,1fr);overflow:hidden;border-top:12px solid #c9323f}
      .copy{min-width:0;min-height:0;padding:64px 56px;display:flex;flex-direction:column;align-items:flex-start}
      h1{margin:0 0 28px;font:700 76px/.98 'Space Grotesk',sans-serif;letter-spacing:-.035em}h1 span{color:#c9323f}
      p{font:400 21px/1.7 'Inter',sans-serif;margin:0}footer{font:600 19px/1 'Inter',sans-serif;margin-top:auto;color:#c9323f}
      .image{min-width:0;min-height:0;display:grid;place-items:center;background:#ede9e1;padding:28px}.image img{width:100%;height:100%;object-fit:contain;min-height:0}
      .portrait{padding:0}.portrait img{object-fit:cover;object-position:center 38%;filter:grayscale(1)}
      </style></head><body><div id="card"><div class="copy"><h1>${card.title}</h1><p>${card.description}</p><footer>amadolazo.com</footer></div>${card.image ? `<div class="image ${card.portrait ? 'portrait' : ''}"><img src="${origin}/${card.image}" alt=""></div>` : ''}</div></body></html>`, {waitUntil: 'load'});
    await page.evaluate(() => document.fonts.ready);
    await page.locator('#card').screenshot({path: `pics/social/${card.file}.png`});
  }
  return {created: cards.map(card => `pics/social/${card.file}.png`)};
}
