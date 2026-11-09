# The Main Squeeze Website Design

## Goal

Build a standalone static pitch site for The Main Squeeze inside `projects/Business Revamp/The Main Squeeze`. The page should look like a real customer-facing website first, then include a lower website-care pitch for Ali's rebuild and maintenance service.

## Stack

Use plain HTML, CSS, and JavaScript. Do not add a framework, bundler, or package dependency.

## Source Assets

Use only direct Facebook-downloaded images for the website assets. Do not use screenshot-derived cropped files. The research screenshot may stay in `source-assets` as documentation, but the page must not reference it.

Approved direct assets:
- `logo-main-squeeze-facebook.jpg`
- `product-red-lemonade-closeup.jpg`
- `product-pool-unicorn-summer.jpg`
- `product-purple-lemonade-closeup.jpg`
- `product-pink-blue-slush.jpg`
- `product-wemby-lemonade-freeze.jpg`
- `promo-happy-hour-lemonade.jpg`
- `promo-dot-cake-drinks.jpg`
- `promo-today-lemonade-trio.jpg`
- `cover-lemons.jpg`

## Page Structure

The site is a single page with:
- A bright beachy hero using the logo and red lemonade photo.
- Featured drink cards for colorful products.
- A specials section using playful promo graphics.
- A gallery section with direct Facebook product images.
- A visit section with location and summer hours pulled from visible Facebook posts.
- A lower pitch section describing a website refresh plus upkeep: `$300-$1,000` upfront and `$100/month` maintenance.

## Visual Direction

Use a summer drink-store theme: lemon yellow, aqua, pool blue, coral, pink, and white. Buttons should feel playful and energetic while still being readable. Text should not overlap on mobile or desktop.

## Interaction

JavaScript should support lightweight interactions only:
- Smooth scrolling for internal navigation buttons.
- A rotating featured sip in the hero.
- A simple "today's vibe" button that changes the displayed fun message.

## Verification

Add a Node smoke test that checks the required files, key content, direct asset references, pricing copy, and that no site file references a `crop` asset.
