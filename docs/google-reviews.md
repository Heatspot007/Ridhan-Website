# Google reviews — how the live feed works

The reviews section reads from `/api/reviews`, a Vercel serverless function in
`api/reviews.js`. Until it is configured the page keeps the three reviews written
into `index.html`, so the section is never empty or broken.

## Setup (about five minutes)

1. **Get the place id.** Open the clinic's listing, or use the Place ID finder at
   https://developers.google.com/maps/documentation/places/web-service/place-id
   Search "Ridhan Skin Hair and Child Clinic, Old Pallavaram". It looks like
   `ChIJ....`.

2. **Create an API key.** Google Cloud console → APIs & Services → Credentials →
   Create credentials → API key. Then enable **Places API (New)** for the project.
   Restrict the key: *API restrictions* → Places API (New) only. An HTTP-referrer
   restriction is **not** appropriate here — the key is used server-side, so leave
   application restrictions as None, or use an IP restriction if you prefer.

3. **Add the variables** in Vercel → Project → Settings → Environment Variables:

   | Name | Value |
   |---|---|
   | `GOOGLE_MAPS_API_KEY` | the key from step 2 |
   | `GOOGLE_PLACE_ID` | the place id from step 1 |
   | `REVIEWS_MAX` | optional, default `10` |

   Never put the key in the repository. It only ever lives in Vercel.

4. **Redeploy.** Visit `https://<your-site>/api/reviews` — you should see JSON with
   `"ok": true` and a `reviews` array.

## How "once a day" is enforced

The function sends:

```
Cache-Control: public, s-maxage=86400, stale-while-revalidate=86400
```

Vercel's edge CDN then serves one cached copy for 24 hours, so Google is called at
most once a day no matter how many people visit. `stale-while-revalidate` means
nobody waits for the refresh — the previous day's copy is served while the new one
is fetched behind the scenes. Expect roughly 30 Places calls a month.

## The five-review cap — read this before expecting ten

**The Google Places API returns a maximum of 5 reviews per place.** This is a hard
limit on Google's side; no parameter, field mask or billing tier raises it. The
function asks for ten and will return however many Google gives, so with Places
configured the ring will hold **five cards, not ten**.

The carousel handles any number — it will show five in the ring and three in the
spotlight, and will pick up ten automatically the day a richer source is connected.

Two ways to actually reach ten or more:

**a) Google Business Profile API** — the official route, and free. Because the clinic
owns the listing, `accounts.locations.reviews.list` returns every review, 50 per
page. It needs a separate access request to Google with a stated business purpose,
and approval has historically taken two to four weeks. It also uses OAuth as the
business owner rather than a simple API key.

**b) A paid aggregator** — services such as Outscraper or SerpApi resell full review
sets. Faster to set up, costs a monthly fee, and you depend on them keeping their
integration working.

Either way, point `REVIEWS_FEED_URL` at a JSON endpoint and the function prefers it
over Places automatically. It accepts either a bare array or
`{ rating, userRatingCount, reviews: [...] }`, and each review may use
`authorName`/`author_name`/`authorAttribution.displayName` for the name and
`text`/`text.text`/`comment` for the body — `normalise()` in `api/reviews.js` covers
those shapes. No front-end change is needed.

**Do not scrape Google Maps directly.** It breaks Google's terms of service and the
clinic's listing is the thing at risk.

## Ordering

`rank()` sorts by rating, then recency, then length — so the strongest and most
recent reviews land in the three spotlight positions. Change that function if the
clinic wants a different order.

## If something goes wrong

The function never returns an error status. It answers `200` with `ok: false` and a
`reason` (`not_configured` or `upstream_error`) plus a short `detail`, and the page
silently keeps its built-in reviews. Check `/api/reviews` in a browser to see which.
