"""Scrape Bali pilates studios via Places API (New) and append them to the
dataset as State "Bali" with the island's areas as cities.

Stdlib-only (urllib), same pattern as backfill_districts.py:
    /Library/Developer/CommandLineTools/usr/bin/python3 -u scrape_bali_studios.py

Re-run safe: studios whose Place ID is already in the dataset are skipped.
"""

import json
import os
import sys
import time
import urllib.request
from collections import Counter

LIVE_JSON = "public/pilates_studios.json"   # copy Vite actually serves
MIRROR_JSON = "pilates_studios.json"
STATE = "Bali"
AREAS = ["Canggu", "Seminyak", "Ubud", "Uluwatu", "Kuta", "Sanur", "Denpasar"]

FIELD_MASK = ",".join([
    "places.id", "places.displayName", "places.formattedAddress",
    "places.location", "places.rating", "places.userRatingCount",
    "places.internationalPhoneNumber", "places.regularOpeningHours.weekdayDescriptions",
    "places.websiteUri", "places.photos", "places.types",
    "places.editorialSummary", "places.reviews", "nextPageToken",
])

# Same inference rules as scrape_google_places.py, minus website scraping
CRITERIA_KEYWORDS = {
    "Reformer": ["reformer", "reformer pilates", "reformer class"],
    "Mat": ["mat", "mat pilates", "yoga mat"],
    "Barre": ["barre", "barre class", "barre workout"],
    "Online": ["online", "virtual", "live stream"],
    "Private": ["private", "one-on-one", "personal training"],
    "Group": ["group", "group class", "group training", "class"],
    "Tower": ["tower", "tower pilates", "cadillac"],
    "Free Trial": ["free trial", "free class", "complimentary session"],
}


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


def search_text(query, page_token=None):
    body = {"textQuery": query}
    if page_token:
        body["pageToken"] = page_token
    req = urllib.request.Request(
        "https://places.googleapis.com/v1/places:searchText",
        data=json.dumps(body).encode(),
        headers={
            "Content-Type": "application/json",
            "X-Goog-Api-Key": API_KEY,
            "X-Goog-FieldMask": FIELD_MASK,
        },
    )
    with urllib.request.urlopen(req, timeout=20) as resp:
        return json.load(resp)


def fetch_area_places(area):
    places, token = [], None
    while True:
        data = search_text(f"Pilates in {area}, {STATE}", token)
        places.extend(data.get("places", []))
        token = data.get("nextPageToken")
        if not token:
            return places
        time.sleep(1)  # page tokens need a moment to become valid


def infer_criteria(place):
    texts = [
        place.get("displayName", {}).get("text", ""),
        place.get("editorialSummary", {}).get("text", ""),
        *(r.get("text", {}).get("text", "") for r in place.get("reviews", [])),
    ]
    haystack = " ".join(texts).lower()
    return {
        criterion: any(keyword in haystack for keyword in keywords)
        for criterion, keywords in CRITERIA_KEYWORDS.items()
    }


def photo_url(place):
    photos = place.get("photos", [])
    if not photos:
        return None
    return f"https://places.googleapis.com/v1/{photos[0]['name']}/media?maxWidthPx=400&key={API_KEY}"


def to_record(place, area):
    name = place.get("displayName", {}).get("text", "")
    criteria = infer_criteria(place)
    location = place.get("location", {})
    return {
        "Name": name,
        "City": area,
        "State": STATE,
        "Rating": place.get("rating"),
        "Number of Reviews": place.get("userRatingCount", 0),
        "Phone": place.get("internationalPhoneNumber"),
        "Opening Hours": "\n".join(
            place.get("regularOpeningHours", {}).get("weekdayDescriptions", [])),
        "Website": place.get("websiteUri", ""),
        "Photo URL": photo_url(place),
        "Reformer": criteria["Reformer"],
        "Mat": criteria["Mat"],
        "Barre": criteria["Barre"],
        "Online": criteria["Online"],
        "Private": criteria["Private"],
        "Group": criteria["Group"],
        "Tower": criteria["Tower"],
        "Free Trial": criteria["Free Trial"],
        "Address": place.get("formattedAddress", "No Address Provided"),
        "Price Scraped": False,
        "Price Single": None,
        "Price Source URL": None,
        "Price Intro": None,
        "Intro Offer": None,
        "District": "",
        "Place ID": place.get("id", ""),
        "Latitude": location.get("latitude"),
        "Longitude": location.get("longitude"),
    }


def is_pilates(place):
    name = place.get("displayName", {}).get("text", "").lower()
    return "pilates_studio" in place.get("types", []) or "pilates" in name


def main():
    with open(LIVE_JSON) as f:
        studios = json.load(f)
    known_ids = {s.get("Place ID") for s in studios if s.get("Place ID")}

    added = []
    for area in AREAS:
        print(f"Searching {area}...")
        for place in fetch_area_places(area):
            place_id = place.get("id")
            if not place_id or place_id in known_ids or not is_pilates(place):
                continue
            known_ids.add(place_id)
            record = to_record(place, area)
            added.append(record)
            print(f"  + {record['Name'][:56]} ({record['Rating']}★, {record['Number of Reviews']} reviews)")

    studios.extend(added)
    for path in (LIVE_JSON, MIRROR_JSON):
        with open(path, "w") as f:
            json.dump(studios, f, indent=4)

    print(f"\nAdded {len(added)} Bali studios.")
    for area, n in Counter(s["City"] for s in added).most_common():
        print(f"  {area}: {n}")


if __name__ == "__main__":
    main()
