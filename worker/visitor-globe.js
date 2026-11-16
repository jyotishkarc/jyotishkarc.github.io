/* Cloudflare Worker for the homepage visitor globe (javascript/globe.js).
 *
 * Same approach as the visitor globe on Bo Dai's homepage (https://bo-dai.github.io/).
 *
 *   POST /hit    count the current visit, using Cloudflare's city-level geolocation
 *   GET  /stats  { points: [{ city, country, lat, lon, count }] }
 *
 * Privacy: stores only aggregated counts per city (city name, country code and
 * coordinates rounded to 0.1 degree). No IP addresses, no cookies, no user agents.
 *
 * Needs one KV namespace bound as VISITS (see worker/README.md).
 */

const ALLOWED_ORIGINS = [
  "https://jyotishkarc.github.io",
  "http://127.0.0.1:5500",   // VS Code Live Server
  "http://localhost:5500",
];

const KEY = "visits";        // one JSON object: { "US|Atlanta|33.7|-84.4": 12, ... }

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    const allowed = ALLOWED_ORIGINS.includes(origin);

    const headers = {
      "Access-Control-Allow-Origin": allowed ? origin : ALLOWED_ORIGINS[0],
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Max-Age": "86400",
      "Vary": "Origin",
      "Content-Type": "application/json",
    };
    const json = (body, status = 200, extra = {}) =>
      new Response(JSON.stringify(body), { status, headers: { ...headers, ...extra } });

    if (request.method === "OPTIONS") return new Response(null, { headers });

    if (url.pathname === "/hit" && request.method === "POST") {
      if (!allowed) return json({ ok: false, error: "origin not allowed" }, 403);
      const cf = request.cf || {};
      if (cf.latitude == null || cf.longitude == null) return json({ ok: false });
      const key = [
        cf.country || "",
        (cf.city || "").replace(/\|/g, " "),
        (+cf.latitude).toFixed(1),
        (+cf.longitude).toFixed(1),
      ].join("|");
      const visits = (await env.VISITS.get(KEY, "json")) || {};
      visits[key] = (visits[key] || 0) + 1;
      await env.VISITS.put(KEY, JSON.stringify(visits));
      return json({ ok: true });
    }

    if (url.pathname === "/stats" && request.method === "GET") {
      const visits = (await env.VISITS.get(KEY, "json")) || {};
      const points = Object.entries(visits).map(([k, count]) => {
        const [country, city, lat, lon] = k.split("|");
        return { city, country, lat: +lat, lon: +lon, count };
      });
      return json({ points }, 200, { "Cache-Control": "public, max-age=120" });
    }

    return json({ error: "not found" }, 404);
  },
};
