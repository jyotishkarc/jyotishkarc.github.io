# Visitor globe backend (Cloudflare Worker, free tier)

The globe on the homepage (`javascript/globe.js`) shows where visitors open the
site from. GitHub Pages can't store anything, so the counts live in a tiny
Cloudflare Worker. Cloudflare already knows each request's approximate city,
so no third-party geolocation service is involved. Only per-city totals are
stored: no IP addresses, no cookies.

## One-time setup (about 5 minutes, all in the browser)

Menu names on Cloudflare's dashboard shift a little over time; look for the
closest match.

1. **Create a free account** at <https://dash.cloudflare.com/sign-up>.
2. **Create the Worker:** *Workers & Pages* → *Create* → *Create Worker*.
   Name it e.g. `jrc-visitors`, click *Deploy*, then *Edit code*.
   Replace everything with the contents of `worker/visitor-globe.js` and click *Deploy*.
3. **Create storage:** *Storage & Databases* → *KV* → *Create namespace*, name it `VISITS`.
4. **Connect them:** open the Worker → *Settings* → *Bindings* → *Add* → *KV namespace*.
   Variable name **`VISITS`**, namespace `VISITS`. Save / deploy.
5. **Copy the Worker's URL** (looks like `https://jrc-visitors.<your-subdomain>.workers.dev`)
   and put it in `index.html`:

   ```html
   <figure class="visitor-globe" id="visitor-globe" data-stats="https://jrc-visitors.<your-subdomain>.workers.dev">
   ```

That's it. Visits from your own Live Server previews (127.0.0.1 / localhost) are
never counted, and each visitor is counted once per browser session.

## Checking it

Open `https://jrc-visitors.<your-subdomain>.workers.dev/stats` in a browser: you
should see `{"points":[...]}`. It starts empty and fills as people visit.

## Limits

The free plan allows 100,000 requests and 1,000 KV writes per day, far more
than a personal homepage needs.
