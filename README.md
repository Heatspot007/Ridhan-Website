# Ridhan Skin, Hair & Child Clinic

Static marketing site for a dermatology and paediatric clinic in Old Pallavaram, Chennai.
No build step, no framework, no dependencies to install — plain HTML, CSS and JavaScript.

```
index.html          the whole page
css/site.css        design system + layout
js/site.js          hover cards, flip gallery, calendar, WhatsApp handoff, WebGL hero
assets/img/         photography (watermarked) and doctor portraits
assets/media/       hero loop, section loop, clinic film
assets/icons/       procedure diagrams (SVG) and favicon
docs/               how to make the Google reviews live
vercel.json         caching and security headers
```

---

## Deploy

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Ridhan clinic website"
git branch -M main
git remote add origin https://github.com/<you>/ridhan-clinic.git
git push -u origin main
```

### 2. Import into Vercel

1. vercel.com → **Add New… → Project** → import the repo.
2. Framework preset: **Other**.
3. Build command: leave **empty**. Output directory: leave **empty** (repo root is the site).
4. Deploy.

It is a static site, so the first deploy takes well under a minute.

### 3. Point the domain

In Vercel → Project → **Settings → Domains**, add your domain and follow the DNS
instructions. Then do a find-and-replace across the repo for
`REPLACE-WITH-YOUR-DOMAIN` — it appears in `index.html` (canonical, Open Graph,
JSON-LD), `robots.txt` and `sitemap.xml`.

---

## Before you go live

**Replace the domain placeholder.** Five occurrences, listed above. Search the repo for
`REPLACE-WITH-YOUR-DOMAIN`.

**Add the website to the Google Business Profile.** The listing currently has no website
link. Given that most patients arrive by word of mouth and then look the clinic up, that
empty field is the single highest-value fix on this list.

**Correct the Justdial hours.** Justdial lists Monday as 5–8 pm. The site and Google both
say 10 am – 2 pm and 5.30 – 9 pm.

**Confirm patient consent.** The results gallery publishes clinical photographs. The page
states they are published with patient consent — make sure signed forms exist for each one.

**An email address.** There isn't one on the page. Add it to the contact list in
`index.html` when you have one.

---

## Things worth knowing

**The reviews are a snapshot.** Rating and review text were read from the Google listing on
13 September 2026 and are hard-coded. `docs/google-reviews.md` contains a working Places API
route that makes them refresh on their own — it needs a server, so it applies when you move
to Next.js.

**Schema deliberately omits `aggregateRating`.** Google does not grant rich-result
eligibility to review markup a business supplies about itself, and self-serving rating
markup risks a manual action. The 4.9 still appears on the page as text; it is just not
claimed in structured data.

**The videos are watermarked and muted.** Both loops pause when scrolled out of view and
stop entirely under `prefers-reduced-motion`. The clinic film is `preload="none"`, so its
846KB only downloads if a visitor presses play.

**Libraries load from CDN.** GSAP, ScrollTrigger, Three.js and Lenis come from cdnjs and
jsDelivr, all pinned to exact versions. Nothing is bundled and there is nothing to install.
If you would rather self-host them, drop the files into `js/vendor/` and update the four
script tags at the bottom of `index.html`.

**Booking goes to WhatsApp.** The form composes a message to +91 63744 96729 and opens
WhatsApp with it pre-written. Nothing is submitted to a server and no data is stored, so
there is no backend and no privacy surface. To change the number, search `916374496729`
in `js/site.js`.

---

## Local preview

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Opening `index.html` directly with `file://` will not work — the absolute asset paths need
a server root.
