"""Discover pilates studios missing from pilates_studios.json.

Re-runs a Places API (New) Text Search for every (state, city) already in the
dataset, paginating to up to 60 results per city (the original scrape kept
only the first page, so chains like BODYROK NYC were missed). New studios are
appended in the existing record schema; existing records are never modified.

Criteria booleans (Reformer/Mat/...) for new studios are derived from a
keyword scan of the studio's website homepage (same idea as the original
scraper); everything stays False when the site can't be fetched.

Usage:
    python3 scrape_studios_new.py [--limit-cities N]

Requires GOOGLE_MAPS_API_KEY (env or .env). After running, run
refresh_photos.py and scrape_prices.py - both skip already-processed studios.
"""

import argparse
import json
import os
import re
import ssl
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

DATA_FILES = ["pilates_studios.json", "public/pilates_studios.json"]
USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36"

FIELD_MASK = ",".join([
    "places.id",
    "places.displayName",
    "places.formattedAddress",
    "places.rating",
    "places.userRatingCount",
    "places.nationalPhoneNumber",
    "places.websiteUri",
    "places.regularOpeningHours",
    "places.types",
    "nextPageToken",
])

# Pilates / pilates-inspired chains that don't say "pilates" in their name and
# that Google often omits from generic "pilates studios in CITY" queries.
# Searched explicitly per city with --chains.
KNOWN_CHAINS = ["solidcore", "SLT pilates", "BODYROK", "Lagree"]

CRITERIA_KEYWORDS = {
    "Reformer": ["reformer"],
    "Mat": ["mat pilates", "mat class", "mat work"],
    "Barre": ["barre"],
    "Tower": ["tower"],
    "Online": ["online class", "virtual class", "on-demand", "livestream", "zoom class"],
    "Private": ["private session", "private class", "privates", "1-on-1", "one-on-one"],
    "Group": ["group class", "group session", "group reformer", "classes"],
    "Free Trial": ["free trial", "free intro", "free first class", "first class free", "first class is free"],
}

ssl_ctx = ssl.create_default_context()
ssl_ctx.check_hostname = False
ssl_ctx.verify_mode = ssl.CERT_NONE


def load_api_key():
    key = os.environ.get("GOOGLE_MAPS_API_KEY")
    if not key and os.path.exists(".env"):
        with open(".env") as f:
            for line in f:
                if line.strip().startswith("GOOGLE_MAPS_API_KEY="):
                    key = line.strip().split("=", 1)[1].strip().strip("'\"")
    if not key:
        sys.exit("Error: set GOOGLE_MAPS_API_KEY in the environment or .env first.")
    return key


def search_city(api_key, city, state, query=None, max_pages=3):
    """All Text Search results for a query (default: pilates studios in city)."""
    places, token = [], None
    for _ in range(max_pages):
        body = {"textQuery": query or f"pilates studios in {city}, {state}", "pageSize": 20}
        if token:
            body["pageToken"] = token
        req = urllib.request.Request(
            "https://places.googleapis.com/v1/places:searchText",
            data=json.dumps(body).encode(),
            headers={
                "Content-Type": "application/json",
                "X-Goog-Api-Key": api_key,
                "X-Goog-FieldMask": FIELD_MASK,
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = json.load(resp)
        except urllib.error.HTTPError as e:
            detail = e.read().decode(errors="replace")[:300]
            if e.code == 429:
                raise RuntimeError("Rate/quota limit (429) from Google - stopping.")
            raise RuntimeError(f"Google error {e.code}: {detail}")
        places += data.get("places") or []
        token = data.get("nextPageToken")
        if not token:
            break
        time.sleep(2)  # pageToken needs a moment to become valid
    return places


def normalize(name):
    return re.sub(r"[^a-z0-9]+", "", (name or "").lower())


def website_criteria(url, name):
    """Keyword-scan the studio homepage (plus its name) for class-type criteria.

    Also returns whether the combined text mentions pilates at all, so callers
    can keep studios whose name/types don't say 'pilates' (e.g. BODYROK) but
    whose own website confirms it.
    """
    text = (name or "").lower()
    if url:
        try:
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "text/html"})
            with urllib.request.urlopen(req, timeout=10, context=ssl_ctx) as resp:
                raw = resp.read(800_000).decode("utf-8", errors="replace")
            text += " " + re.sub(r"<[^>]+>", " ", raw).lower()
        except Exception:
            pass
    criteria = {field: any(kw in text for kw in kws) for field, kws in CRITERIA_KEYWORDS.items()}
    return criteria, "pilates" in text


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit-cities", type=int, default=0)
    parser.add_argument("--chains", action="store_true",
                        help="search KNOWN_CHAINS by name per city instead of the generic pilates query")
    args = parser.parse_args()

    api_key = load_api_key()

    with open(DATA_FILES[0]) as f:
        studios = json.load(f)

    existing = {(normalize(s["Name"]), s["City"].lower(), s["State"]) for s in studios}
    cities = sorted({(s["State"], s["City"]) for s in studios})
    if args.limit_cities:
        cities = cities[: args.limit_cities]

    added = 0
    seen_ids = set()
    try:
        for i, (state, city) in enumerate(cities, 1):
            try:
                if args.chains:
                    places = []
                    for chain in KNOWN_CHAINS:
                        chain_token = normalize(chain.split()[0])
                        for p in search_city(api_key, city, state,
                                             query=f"{chain} in {city}, {state}", max_pages=1):
                            name = (p.get("displayName") or {}).get("text", "")
                            # Only results that actually belong to the chain
                            if chain_token in normalize(name):
                                places.append(p)
                else:
                    places = search_city(api_key, city, state)
            except RuntimeError as e:
                print(f"  {city}, {state}: {e}")
                if "429" in str(e):
                    break
                continue

            new_here = 0
            for p in places:
                pid = p.get("id")
                if not pid or pid in seen_ids:
                    continue
                seen_ids.add(pid)
                name = (p.get("displayName") or {}).get("text", "")
                types = p.get("types") or []
                key = (normalize(name), city.lower(), state)
                if key in existing:
                    continue

                hours = (p.get("regularOpeningHours") or {}).get("weekdayDescriptions") or []
                website = p.get("websiteUri") or ""
                # Chain mode already matched the curated chain name - no further proof needed
                obviously_pilates = args.chains or "pilates_studio" in types or "pilates" in name.lower()
                criteria, site_mentions_pilates = website_criteria(website, name)
                # Keep non-obvious names (BODYROK, etc.) only when their own site confirms pilates
                if not obviously_pilates and not site_mentions_pilates:
                    continue
                existing.add(key)

                record = {
                    "Name": name,
                    "City": city,
                    "State": state,
                    "Rating": p.get("rating"),
                    "Number of Reviews": p.get("userRatingCount"),
                    "Phone": p.get("nationalPhoneNumber") or "",
                    "Opening Hours": "\n".join(hours),
                    "Website": website,
                    "Photo URL": "",
                    "Address": p.get("formattedAddress") or "",
                }
                record.update(criteria)
                studios.append(record)
                added += 1
                new_here += 1

            print(f"{i}/{len(cities)} {city}, {state}: {len(places)} results, {new_here} new", flush=True)
            time.sleep(0.2)
    finally:
        for path in DATA_FILES:
            with open(path, "w") as f:
                json.dump(studios, f, indent=4)

    print(f"Done: {added} new studios added; dataset now has {len(studios)}.")


if __name__ == "__main__":
    main()
