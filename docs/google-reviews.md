# Live Google reviews for the Ridhan site

The prototype cannot do this, for two separate reasons — both of which disappear
in the real Next.js build:

1. **The artifact preview blocks all outbound requests.** Its CSP allows scripts from a
   short CDN allowlist and nothing else. No `fetch` to Google, ever.
2. **A Places API key must never live in browser code.** Anyone can open devtools, lift
   it, and run up your bill. The key belongs on the server.

So the page ships with the rating and reviews as static markup, and these IDs already in
place as hydration targets:

| Element | ID |
|---|---|
| Average rating | `#gRating` |
| Review count | `#gCount` |
| Review cards container | `#gReviews` |

---

## 1. Get the credentials

- **Place ID** — find it with Google's Place ID Finder, or from the listing URL. The
  Ridhan listing's knowledge-graph id is `/g/11sv7dnh3v`; resolve it to a
  `ChIJ…` Place ID via Text Search on the clinic name and address.
- **API key** — Google Cloud console → enable **Places API (New)** → create a key →
  restrict it to that API and to your server's IP. Put it in `.env.local`:

```
GOOGLE_PLACES_API_KEY=xxxxxxxx
GOOGLE_PLACE_ID=ChIJxxxxxxxxxxxx
```

Never prefix it `NEXT_PUBLIC_` — that ships it to the browser.

---

## 2. The server route

`app/api/reviews/route.ts`

```ts
import { NextResponse } from "next/server";

// Cache for an hour. Places bills per call and reviews barely move.
export const revalidate = 3600;

type Review = { author: string; rating: number; text: string; relative: string };

export async function GET() {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  const id = process.env.GOOGLE_PLACE_ID;
  if (!key || !id) {
    return NextResponse.json({ error: "missing credentials" }, { status: 500 });
  }

  const res = await fetch(`https://places.googleapis.com/v1/places/${id}`, {
    headers: {
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": "rating,userRatingCount,reviews",
    },
    next: { revalidate },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "places request failed" }, { status: 502 });
  }

  const data = await res.json();

  const reviews: Review[] = (data.reviews ?? [])
    .filter((r: any) => r.rating >= 4 && r.originalText?.text)
    .slice(0, 3)
    .map((r: any) => ({
      author: r.authorAttribution?.displayName ?? "Google reviewer",
      rating: r.rating,
      text: r.originalText.text,
      relative: r.relativePublishTimeDescription ?? "",
    }));

  return NextResponse.json({
    rating: data.rating ?? null,
    count: data.userRatingCount ?? 0,
    reviews,
  });
}
```

**Note on the field mask.** Places API (New) bills by the fields you request. Asking only
for `rating,userRatingCount,reviews` keeps you on the cheapest SKU. Requesting everything
is the usual way people get a surprise invoice.

**Note on review count.** Places returns at most **five** reviews and you cannot choose
which. That is a Google limitation, not a bug in this code. If you want every review, you
need a third-party aggregator.

---

## 3. Hydrating the markup

`components/Reviews.tsx` — server component, so nothing extra reaches the client:

```tsx
export default async function Reviews() {
  const res = await fetch(`${process.env.SITE_URL}/api/reviews`, {
    next: { revalidate: 3600 },
  });
  const { rating, count, reviews } = await res.json();

  return (
    <>
      <div className="rev-top">
        <span className="rev-score" id="gRating">{rating?.toFixed(1) ?? "—"}</span>
        <div>
          <span className="stars" aria-hidden="true">★★★★★</span>
          <p className="rev-meta">
            Across <span id="gCount">{count}</span> Google reviews
          </p>
        </div>
      </div>

      <div className="rev-grid" id="gReviews">
        {reviews.map((r) => (
          <div className="rev" key={r.author + r.relative}>
            <span className="stars" aria-hidden="true">
              {"★".repeat(r.rating)}
            </span>
            <p className="body">{r.text}</p>
            <span className="who">{r.author} · Google</span>
          </div>
        ))}
      </div>
    </>
  );
}
```

The CSS classes are identical to the ones already in the prototype, so the section keeps
its exact appearance.

---

## 4. Two things to get right before launch

**Fall back, don't fail.** If Places is down or the quota is spent, render the last known
good values rather than an empty section. Keep a small JSON snapshot in the repo, updated
on each successful fetch, and render that when the API errors.

**Attribution is required.** Google's terms require reviews shown via Places to carry
attribution to Google and to link to the listing. The "· Google" suffix on each reviewer
and a link to the Google profile satisfies this.
