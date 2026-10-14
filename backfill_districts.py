"""Backfill borough/district, address, and coordinates for studios in the big
four cities (New York City, Los Angeles, Miami, Chicago) via Places API (New).
(The legacy Places endpoints the old scrapers use are not enabled for this
Google project, so this calls https://places.googleapis.com/v1 Text Search,
which returns id, address components, and location in a single request.)

Stdlib-only (urllib) so it runs on the system python3 without a venv:
    /Library/Developer/CommandLineTools/usr/bin/python3 -u backfill_districts.py

Resume-safe: studios already looked up (they carry a "Place ID") are skipped,
and both JSON copies are saved every SAVE_EVERY lookups.
"""

import json
import os
import re
import sys
import time
import urllib.request
from collections import Counter

LIVE_JSON = "public/pilates_studios.json"   # copy Vite actually serves
MIRROR_JSON = "pilates_studios.json"
TARGET_CITIES = {"New York City", "Los Angeles", "Miami", "Chicago"}
SAVE_EVERY = 25
FIELD_MASK = "places.id,places.formattedAddress,places.addressComponents,places.location"

# NYC borough by ZIP prefix, used when Google returns no sublocality
NYC_ZIP_PREFIXES = {
    "100": "Manhattan", "101": "Manhattan", "102": "Manhattan",
    "103": "Staten Island",
    "104": "The Bronx",
    "111": "Queens", "113": "Queens", "114": "Queens", "116": "Queens",
    "112": "Brooklyn",
}
BOROUGHS = {"Manhattan", "Brooklyn", "Queens", "The Bronx", "Staten Island"}
BOROUGH_ALIASES = {"Bronx": "The Bronx", "New York": "Manhattan"}


def load_api_key():
    key = os.environ.get("GOOGLE_MAPS_API_KEY")
    if not key and os.path.exists(".env"):
        for line in open(".env"):
            if line.strip().startswith("GOOGLE_MAPS_API_KEY="):
                key = line.strip().split("=", 1)[1]
    if not key or key.startswith("your-"):
        sys.exit("Error: GOOGLE_MAPS_API_KEY is not set (env or .env).")
    return key


API_KEY = load_api_key()


def search_place(studio):
    """Text Search (New); returns the top place dict or None."""
    body = json.dumps({
        "textQuery": f"{studio['Name']}, {studio['City']}, {studio['State']}",
    }).encode()
    req = urllib.request.Request(
        "https://places.googleapis.com/v1/places:searchText",
        data=body,
        headers={
            "Content-Type": "application/json",
            "X-Goog-Api-Key": API_KEY,
            "X-Goog-FieldMask": FIELD_MASK,
        },
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        places = json.load(resp).get("places", [])
    return places[0] if places else None


def component(place, comp_type):
    for comp in place.get("addressComponents", []):
        if comp_type in comp.get("types", []):
            return comp.get("longText", "")
    return ""


def derive_district(studio, place):
    if studio["City"] == "New York City":
        borough = component(place, "sublocality_level_1")
        borough = BOROUGH_ALIASES.get(borough, borough)
        if borough in BOROUGHS:
            return borough
        zip_match = re.search(r"NY (\d{5})", place.get("formattedAddress", ""))
        if zip_match:
            return NYC_ZIP_PREFIXES.get(zip_match.group(1)[:3], "")
        return ""
    return component(place, "neighborhood")


def save(studios):
    for path in (LIVE_JSON, MIRROR_JSON):
        with open(path, "w") as f:
            json.dump(studios, f, indent=4)


def main():
    with open(LIVE_JSON) as f:
        studios = json.load(f)

    # "Place ID" marks a completed lookup; a bare empty "District" is a
    # leftover from a failed run and gets retried.
    todo = [s for s in studios if s["City"] in TARGET_CITIES and "Place ID" not in s]
    print(f"{len(todo)} studios to backfill")

    failures = 0
    for i, studio in enumerate(todo, 1):
        try:
            place = search_place(studio)
        except Exception as e:  # network/API hiccup: leave for a re-run
            print(f"  ! {studio['Name']} ({studio['City']}): {e}")
            failures += 1
            continue

        if not place:
            studio["District"] = ""
            print(f"[{i}/{len(todo)}] {studio['City']}: {studio['Name'][:48]} -> no match")
            continue

        studio["District"] = derive_district(studio, place)
        studio["Place ID"] = place.get("id", "")
        location = place.get("location", {})
        if location:
            studio["Latitude"] = location.get("latitude")
            studio["Longitude"] = location.get("longitude")
        address = place.get("formattedAddress")
        if address and studio.get("Address") in (None, "", "No Address Provided"):
            studio["Address"] = address

        print(f"[{i}/{len(todo)}] {studio['City']}: {studio['Name'][:48]} -> {studio['District'] or '(none)'}")
        if i % SAVE_EVERY == 0:
            save(studios)
        time.sleep(0.05)

    save(studios)

    print(f"\nDone. {failures} failures (re-run to retry those).")
    for city in sorted(TARGET_CITIES):
        counts = Counter(s.get("District") or "(none)" for s in studios if s["City"] == city)
        print(f"\n{city}:")
        for district, n in counts.most_common():
            print(f"  {district}: {n}")


if __name__ == "__main__":
    main()
