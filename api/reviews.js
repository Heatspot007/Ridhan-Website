/**
 * GET /api/reviews  —  Google reviews for the clinic, refreshed once a day.
 *
 * Runs as a Vercel serverless function (Node 18+, global fetch, CommonJS so no
 * package.json is required).
 *
 * HOW THE DAILY REFRESH WORKS
 *   The response carries `s-maxage=86400`, so Vercel's edge CDN serves one cached
 *   copy for 24 hours and Google is called at most once a day no matter how much
 *   traffic the page gets. `stale-while-revalidate` means visitors never wait for
 *   that refresh — they get the previous day's copy while it happens in the
 *   background. Cost is ~30 Places calls a month.
 *
 * HOW MANY REVIEWS YOU ACTUALLY GET
 *   The Google Places API returns a MAXIMUM OF 5 reviews per place. That is a hard
 *   cap on Google's side; no parameter raises it. To serve 10, set REVIEWS_FEED_URL
 *   to a JSON endpoint that returns more (Google Business Profile API export, or a
 *   paid aggregator) — this function prefers it when present and falls back to
 *   Places otherwise. See docs/google-reviews.md.
 *
 * ENVIRONMENT (set in Vercel → Project → Settings → Environment Variables)
 *   GOOGLE_MAPS_API_KEY   required   Places API (New) key, restricted to this API
 *   GOOGLE_PLACE_ID       required   the clinic's place id
 *   REVIEWS_FEED_URL      optional   richer feed, used in preference to Places
 *   REVIEWS_MAX           optional   how many to return, default 10
 */

const MAX_DEFAULT = 10;

function clean(text) {
  return String(text == null ? '' : text).replace(/\s+/g, ' ').trim();
}

/** Normalise whatever the source gave us into the shape the page expects. */
function normalise(r) {
  const author =
    clean(r.authorName || r.author_name || (r.authorAttribution && r.authorAttribution.displayName) || '');
  const body =
    clean(r.text && typeof r.text === 'object' ? r.text.text : (r.text || r.comment || ''));
  const rating = Number(r.rating || (r.starRating === 'FIVE' ? 5 : 0)) || 0;
  const when =
    r.publishTime || r.updateTime || r.time || r.createTime || null;
  if (!body || !author) return null;
  return { author, body, rating, when: when ? String(when) : null };
}

/** Best first: rating, then most recent, then longest (more useful to a reader). */
function rank(a, b) {
  if (b.rating !== a.rating) return b.rating - a.rating;
  const ta = Date.parse(a.when || '') || 0;
  const tb = Date.parse(b.when || '') || 0;
  if (tb !== ta) return tb - ta;
  return b.body.length - a.body.length;
}

async function fromFeed(url) {
  const res = await fetch(url, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error('feed responded ' + res.status);
  const data = await res.json();
  const list = Array.isArray(data) ? data : (data.reviews || data.result || []);
  return {
    rating: Number(data.rating) || null,
    total: Number(data.userRatingCount || data.total || data.user_ratings_total) || null,
    reviews: list.map(normalise).filter(Boolean)
  };
}

async function fromPlaces(placeId, key) {
  const res = await fetch(
    'https://places.googleapis.com/v1/places/' + encodeURIComponent(placeId),
    {
      headers: {
        'X-Goog-Api-Key': key,
        // ask only for what we render — field masks are what Places bills on
        'X-Goog-FieldMask': 'rating,userRatingCount,reviews'
      }
    }
  );
  if (!res.ok) {
    const detail = await res.text().catch(function () { return ''; });
    throw new Error('Places responded ' + res.status + ' ' + detail.slice(0, 200));
  }
  const data = await res.json();
  return {
    rating: typeof data.rating === 'number' ? data.rating : null,
    total: typeof data.userRatingCount === 'number' ? data.userRatingCount : null,
    reviews: (data.reviews || []).map(normalise).filter(Boolean)
  };
}

module.exports = async function handler(req, res) {
  const max = Math.max(1, Math.min(20, Number(process.env.REVIEWS_MAX) || MAX_DEFAULT));
  const feed = process.env.REVIEWS_FEED_URL;
  const key = process.env.GOOGLE_MAPS_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;

  try {
    let out;
    let source;
    if (feed) {
      out = await fromFeed(feed);
      source = 'feed';
    } else if (key && placeId) {
      out = await fromPlaces(placeId, key);
      source = 'places';
    } else {
      // Not configured yet. Say so plainly and let the page keep its built-in copy.
      res.setHeader('Cache-Control', 'public, s-maxage=300');
      return res.status(200).json({
        ok: false,
        reason: 'not_configured',
        detail: 'Set GOOGLE_MAPS_API_KEY and GOOGLE_PLACE_ID (or REVIEWS_FEED_URL).',
        reviews: []
      });
    }

    const reviews = out.reviews.slice().sort(rank).slice(0, max);

    // one upstream call a day; everyone else is served from the edge cache
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=86400');
    return res.status(200).json({
      ok: true,
      source: source,
      fetchedAt: new Date().toISOString(),
      rating: out.rating,
      total: out.total,
      returned: reviews.length,
      // Places caps at 5; say so in the payload so the cap is visible, not a mystery
      cap: source === 'places' ? 5 : null,
      reviews: reviews
    });
  } catch (err) {
    // Never fail the section — the page falls back to its built-in reviews.
    res.setHeader('Cache-Control', 'public, s-maxage=120');
    return res.status(200).json({
      ok: false,
      reason: 'upstream_error',
      detail: String((err && err.message) || err).slice(0, 300),
      reviews: []
    });
  }
};
