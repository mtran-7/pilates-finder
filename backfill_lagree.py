"""Backfill a "Lagree" criteria flag and discover Lagree providers.

For every (state, city) in the dataset, runs a Places Text Search for
"Lagree in {city}" and verifies each result actually offers Lagree (name
contains "lagree", or its own website mentions it):
  - results matching an existing record flip that record's "Lagree" to true
  - verified new places are appended (full criteria scan of their website)
Existing records whose name contains "lagree" are flagged without a lookup.

Stdlib-only, same pattern as the other scrapers:
    /Library/Developer/CommandLineTools/usr/bin/python3 -u backfill_lagree.py

Re-run safe: flags are additive and existing records are never duplicated.
After running: refresh_photos.py, backfill_districts.py, scrape_prices.py
(all incremental).
"""

import json
import time
import urllib.request

from scrape_studios_new import (
    DATA_FILES, USER_AGENT, load_api_key, normalize, opener, search_city,
    website_criteria,
)

STATE_ABBR = {
    "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR",
    "California": "CA", "Colorado": "CO", "Connecticut": "CT", "Delaware": "DE",
    "Florida": "FL", "Georgia": "GA", "Hawaii": "HI", "Idaho": "ID",
    "Illinois": "IL", "Indiana": "IN", "Iowa": "IA", "Kansas": "KS",
    "Kentucky": "KY", "Louisiana": "LA", "Maine": "ME", "Maryland": "MD",
    "Massachusetts": "MA", "Michigan": "MI", "Minnesota": "MN",
    "Mississippi": "MS", "Missouri": "MO", "Montana": "MT", "Nebraska": "NE",
    "Nevada": "NV", "New Hampshire": "NH", "New Jersey": "NJ",
    "New Mexico": "NM", "New York": "NY", "North Carolina": "NC",
    "North Dakota": "ND", "Ohio": "OH", "Oklahoma": "OK", "Oregon": "OR",
    "Pennsylvania": "PA", "Rhode Island": "RI", "South Carolina": "SC",
    "South Dakota": "SD", "Tennessee": "TN", "Texas": "TX", "Utah": "UT",
    "Vermont": "VT", "Virginia": "VA", "Washington": "WA",
    "West Virginia": "WV", "Wisconsin": "WI", "Wyoming": "WY",
}

def in_state(address, state):
    if state == "Bali":
        return "Bali" in address or "Indonesia" in address
    return f", {STATE_ABBR[state]}" in address


def site_mentions_lagree(url):
    if not url:
        return False
    try:
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "text/html"})
        with opener.open(req, timeout=10) as resp:
            raw = resp.read(800_000).decode("utf-8", errors="replace")
        return "lagree" in raw.lower()
    except Exception:
        return False


def main():
    api_key = load_api_key()
    with open(DATA_FILES[0]) as f:
        studios = json.load(f)

    # Pass 1: flag by name, default everyone else to False
    for s in studios:
        s["Lagree"] = s.get("Lagree") or "lagree" in s["Name"].lower()

    by_key = {(normalize(s["Name"]), s["City"].lower(), s["State"]): s for s in studios}
    cities = sorted({(s["State"], s["City"]) for s in studios})

    flagged, added = 0, 0
    for i, (state, city) in enumerate(cities, 1):
        try:
            places = search_city(api_key, city, state, query=f"Lagree in {city}, {state}", max_pages=1)
        except RuntimeError as e:
            print(f"  {city}, {state}: {e}")
            if "429" in str(e):
                break
            continue

        notes = []
        for p in places:
            name = (p.get("displayName") or {}).get("text", "")
            website = p.get("websiteUri") or ""
            existing = by_key.get((normalize(name), city.lower(), state))

            if existing:
                if not existing["Lagree"] and ("lagree" in name.lower() or site_mentions_lagree(website)):
                    existing["Lagree"] = True
                    flagged += 1
                    notes.append(f"flagged {name}")
                continue

            # New place: must verifiably offer Lagree and sit in this state
            address = p.get("formattedAddress") or ""
            if "lagree" in name.lower() or not in_state(address, state):
                continue  # name matches were covered by the earlier chain scrape
            criteria, _ = website_criteria(website, name)
            if not site_mentions_lagree(website):
                continue

            hours = (p.get("regularOpeningHours") or {}).get("weekdayDescriptions") or []
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
                "Address": address,
            }
            record.update(criteria)
            record["Lagree"] = True
            studios.append(record)
            by_key[(normalize(name), city.lower(), state)] = record
            added += 1
            notes.append(f"ADDED {name}")

        print(f"{i}/{len(cities)} {city}, {state}: {len(places)} results"
              + (f" | {'; '.join(notes)}" if notes else ""), flush=True)
        time.sleep(0.2)

    for path in DATA_FILES:
        with open(path, "w") as f:
            json.dump(studios, f, indent=4)

    total = sum(1 for s in studios if s["Lagree"])
    print(f"\nDone: {added} studios added, {flagged} existing flagged; {total} Lagree studios of {len(studios)}.")


if __name__ == "__main__":
    main()
