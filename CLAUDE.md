# Gillani Group Of Companies — Website Rules

This repository is the live website for **gillanigroupofcompanies.com**.
Every push to the `main` branch is deployed automatically to Hostinger (`public_html`). There is no build step: the files in this repo are exactly what the server serves. Treat every push as going live.

## Workflow
- Preview locally with `npx serve .` before every commit.
- Commit small, clear changes with descriptive messages. Push only when the preview is checked.
- Never commit passwords, API keys, `.env` files, design source zips, or private documents.
- Keep the site as plain static HTML, CSS and minimal vanilla JavaScript. No frameworks, page builders, jQuery or heavy libraries unless the owner approves.
- Structure: one folder per page with an `index.html` inside, for clean URLs (`/about/`, `/services/`, `/contact/`). Shared files go in `/assets/css`, `/assets/js`, `/assets/img`, `/assets/fonts`.

## Brand (confirmed — do not change)
- Name: always **Gillani Group Of Companies** (capital "Of"). Never shorten it to "Gillani Group".
- Colours: Pine `#0F3A2E`, Gold `#D2A64B`, Chalk `#F5F4EF`, Ink `#121A16`, Deep Pine `#0B2E24` (dark backgrounds).
- Fonts: Sora for headings, Inter for body text.
- Logo: the serif "G" in a gold globe with an orbit swoosh. Full colour on light backgrounds, all-white on dark backgrounds. Group companies use their own logos.
- Group companies: Gillani Enterprises, Gillani Trading, King Bridge Regal Trading L.L.C., Kingsbridge Metals (spelling still to be confirmed), ASM Buildings, Touheed Enterprises.

## Content rules
- Never invent company history, figures, certifications, clients, projects or testimonials. Use only facts the owner supplied.
- Never publish bank account numbers, CNIC or Emirates ID numbers.
- Unconfirmed items must not go live without owner approval: "50+ countries", client logos (permission needed), chairman's name, Kingsbridge spelling.
- Do not use stock photos labelled as real completed projects.
- Head office contact: Building 113, First Floor, Raya Fairways Commercial, DHA Phase 6, Lahore · +92 300 1114901 (phone & WhatsApp) · gillanienterprises@gmail.com.

## Performance (target: Lighthouse 95+ on mobile)
- Images: WebP or AVIF, resized to the size actually displayed, with `width` and `height` attributes set. Use `loading="lazy"` and `decoding="async"` on everything below the fold. The main hero image gets `fetchpriority="high"` and no lazy loading.
- Fonts: self-host Sora and Inter as `woff2` in `/assets/fonts`, with only the weights actually used and `font-display: swap`. Preload the one or two most important font files.
- Caching: CSS, JS, images and fonts are cached by browsers for 1 year. Whenever one of these files changes, bump its version in every HTML link to it (e.g. `style.css?v=2` → `?v=3`), or visitors will keep seeing the old file.
- CSS: a single stylesheet with no unused rules. Inline only the small critical CSS if it clearly helps.
- JavaScript: as little as possible, loaded with `defer`. No third-party scripts (chat widgets, trackers, sliders) without approval.
- Use SVG for logos and icons. Embed maps and videos only on a click (facade), never on page load.
- Keep total page weight under about 1 MB on mobile.

## Security
- `.htaccess` handles HTTPS redirects, security headers, caching and blocking of private files. Do not weaken it. Test any change to it carefully, because a mistake there can take the whole site down.
- If a Content-Security-Policy is enabled, keep it in step with any new external resource.
- External links get `rel="noopener noreferrer"`.
- Any contact form must validate input on the server, use a honeypot field against spam, and never expose an email password in the code. Prefer the WhatsApp link and email until a secure form handler is approved.
- Do not leave test pages, backups or old files in the repo; everything here is public.

## On-page SEO (every page)
- `<html lang="en">`, `<meta charset="utf-8">` and a responsive viewport meta tag.
- A unique `<title>` (about 50–60 characters) and a unique meta description (about 140–155 characters).
- Exactly one `<h1>`, followed by a logical H2/H3 order.
- `<link rel="canonical">` using the full `https://gillanigroupofcompanies.com/...` URL with a trailing slash.
- Open Graph and Twitter card tags, with a 1200×630 share image.
- Descriptive `alt` text on every meaningful image; `alt=""` on purely decorative images.
- Semantic HTML: `header`, `nav`, `main`, `section`, `footer`. Meaningful link text, not "click here".
- JSON-LD structured data: `Organization` on the home page (name, logo, url, contact point), `BreadcrumbList` on inner pages. Use only confirmed facts.
- Keep `sitemap.xml` and `robots.txt` at the root up to date whenever pages change. Include a `404.html` page.
- Include a favicon set and a `site.webmanifest`.
- Good contrast and keyboard-accessible navigation (accessibility also helps SEO).

## Before every push — checklist
1. The page looks right on mobile and desktop in the local preview.
2. No broken links or missing images.
3. Title, description, canonical and H1 are set and unique.
4. Images are compressed and have alt text.
5. No unconfirmed facts or private data have been added.
