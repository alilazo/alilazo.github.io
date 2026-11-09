# Amado Lazo | Personal Portfolio

A premium, minimalist portfolio website blending Swiss and Scandinavian design principles. This site serves as a professional showcase for Amado Lazo, featuring elite software engineering projects, AI-driven development philosophies, and high-performance frontend architecture.

---

## 🎨 Design Philosophy
The redesign merges two iconic aesthetic movements:
- **Swiss Design (International Typographic Style):** Characterized by a rigid grid system, bold sans-serif typography, and high-contrast layouts.
- **Scandinavian Design:** Focused on minimalism, functionality, and a warm, organic neutral color palette.

## 🚀 Key Features
- **First-Visit Intro:** A brief animated name reveal opens into the portfolio once per browser session. Skip or press Escape at any time; reduced-motion preferences and direct section links bypass it. Add `?intro=preview` to replay it for review.
- **Dynamic Theming:** Seamless Light and Dark mode transition with CSS Variables.
- **Purposeful Motion:** A pointer-following color reveal and tilt on the portrait, contextual cursor labels, animated project filtering, and project-detail transitions built with native browser APIs. Touch users can tap the portrait to reveal its color. Reduced-motion preferences are respected, and content stays visible if scripts fail.
- **Gravity Playground:** An optional desktop interaction in the footer lets visitors drag and toss elements. The reset button or Escape restores the layout; physics stops while idle or the page is hidden. The original arrow-key Easter egg still works.
- **Responsive Navigation:** 
  - **Desktop:** Always-visible navigation with current-section feedback.
  - **Mobile and Tablet:** Touch-friendly menu with keyboard focus containment, Escape dismissal, and focus return.
- **Project Browsing:** Category filters with accessible result announcements; all projects remain available without JavaScript.
- **AIO (AI Optimization):** Specifically engineered with `ai.txt`, JSON-LD, and semantic summaries for high-accuracy extraction by LLMs like ChatGPT and Claude.
- **Real-time Analytics:** Privacy-focused tracking via **Umami Analytics**, including automated section-view events.
- **SEO Ready:** Comprehensive Open Graph, Twitter Card, and Schema.org metadata.

## 🛠️ Tech Stack
- **Structure:** HTML5 (Semantic & Accessible)
- **Styling:** CSS3 (Custom Variables + Responsive Grids)
- **Frameworks:** Bootstrap 5 (Base Grid)
- **Interactions:** Native JavaScript, CSS transitions, and IntersectionObserver; no animation library required.
- **Analytics:** [Umami Cloud](https://umami.is/)
- **Hosting:** [GitHub Pages](https://pages.github.com/)

---

## 🛠️ Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/alilazo/alilazo.github.io.git
   ```

2. **Serve the site:**
   Since this is a static project, you can use any local server:
   ```bash
   python -m http.server 8080
   ```

3. **Visit:** `http://localhost:8080`

4. **Run the existing checks:**
   ```bash
   node --test tests/*.test.mjs
   ```

The landing page remains a static GitHub Pages site. Keep `CNAME` when publishing to the custom domain. When changing the landing page CSS or JavaScript, update the asset version in `index.html` so returning visitors receive the new files.

## Search and sharing

`sitemap.xml` lists the seven canonical public pages on `https://amadolazo.com/`; `robots.txt` points to that sitemap. Each page has a unique title and description, one static main heading, structured data, and raster social previews. The homepage identifies Amado as a software engineer in Austin, Texas. Original photos and screenshots remain available; the landing page uses smaller WebP alternatives where they save bytes, explicit dimensions, and static lazy loading below the fold.

The MexiFreeze and Main Squeeze concepts, calculator cart, and 404 page use `noindex, follow` and are omitted from the sitemap. Crawlers can still fetch them to read the indexing directive. `ai.txt` is a factual public profile, not a ranking mechanism. Structured data follows the [Google Search Central content guidelines](https://developers.google.com/search/docs/appearance/structured-data/sd-policies): no unsupported review ratings or hidden FAQs.

Run `node --test tests/*.test.mjs` to check sitemap/canonical agreement, metadata, social image dimensions, JSON-LD, indexing exclusions, and image references alongside the existing interaction checks.

To rebuild image alternatives, run `python scripts/optimize-portfolio-images.py` with Pillow installed. Social preview artwork is maintained in `scripts/build-social-cards.cjs`; render it with Playwright CLI's `run-code --filename scripts/build-social-cards.cjs` against the running local server.

After deployment, verify the domain in [Google Search Console](https://search.google.com/search-console), submit `https://amadolazo.com/sitemap.xml`, and inspect the published homepage and tools. Use the [Rich Results Test](https://search.google.com/test/rich-results) for supported structured data and [PageSpeed Insights](https://pagespeed.web.dev/) for production performance and available field data. Update sitemap modification dates only after meaningful page changes.

---

## 📬 Contact
- **LinkedIn:** [Amado Lazo](https://www.linkedin.com/in/amado-lazo/)
- **GitHub:** [alilazo](https://github.com/alilazo)

© 2026 Amado Lazo. Built with ⚡ and AI.
