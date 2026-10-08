"""Fetch a photo for each studio in pilates_studios.json and self-host it.

For every studio, looks up its Google place via Find Place (name + address),
downloads one photo into public/studio-photos/, and sets "Photo URL" to the
local path. Ratings, hours, and criteria are never touched.

Usage:
    GOOGLE_MAPS_API_KEY=... python3 refresh_photos.py [--limit N]

The key is also read from a .env file in this directory. Re-runs are
incremental: studios whose photo file already exists are skipped.
"""

import argparse
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

PHOTO_DIR = os.path.join("public", "studio-photos")
PHOTO_MAX_WIDTH = 400
DATA_FILES = ["pilates_studios.json", os.path.join("public", "pilates_studios.json")]


def load_api_key():
    key = os.environ.get("GOOGLE_MAPS_API_KEY")
    if not key and os.path.exists(".env"):
        with open(".env") as f:
            for line in f:
                line = line.strip()
                if line.startswith("GOOGLE_MAPS_API_KEY="):
                    key = line.split("=", 1)[1].strip().strip("'\"")
    if not key or key == "your-google-maps-api-key-here":
        sys.exit("Error: set GOOGLE_MAPS_API_KEY in the environment or .env first.")
    return key


def slugify(*parts):
    text = "-".join(p for p in parts if p)
    text = text.lower().replace("&", "and")
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")[:120]


def find_photo_name(api_key, studio):
    """Look the studio up via Places API (New) Text Search; return its first photo resource name."""
    query = " ".join(
        p for p in [studio.get("Name"), studio.get("Address") or "", studio.get("City"), studio.get("State")] if p
    )
    body = json.dumps({"textQuery": query, "pageSize": 1}).encode()
    req = urllib.request.Request(
        "https://places.googleapis.com/v1/places:searchText",
        data=body,
        headers={
            "Content-Type": "application/json",
            "X-Goog-Api-Key": api_key,
            "X-Goog-FieldMask": "places.photos",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.load(resp)
    except urllib.error.HTTPError as e:
        detail = e.read().decode(errors="replace")[:300]
        if e.code in (401, 403):
            raise RuntimeError(f"Google rejected the request ({e.code}): {detail}")
        if e.code == 429:
            raise RuntimeError("Google reports rate/quota limit (429) - stopping so we don't burn quota.")
        raise
    places = data.get("places") or []
    if not places:
        return None
    photos = places[0].get("photos") or []
    if not photos:
        return None
    return photos[0].get("name")  # e.g. "places/ChIJ.../photos/AUac..."


def download_photo(api_key, photo_name, dest_path):
    params = urllib.parse.urlencode({"maxWidthPx": PHOTO_MAX_WIDTH, "key": api_key})
    url = f"https://places.googleapis.com/v1/{photo_name}/media?{params}"
    with urllib.request.urlopen(url, timeout=60) as resp:
        content_type = resp.headers.get("Content-Type", "")
        body = resp.read()
    # A real photo is an image and comfortably larger than Google's 100x100 error placeholder.
    if not content_type.startswith("image/") or len(body) < 4096:
        return False
    with open(dest_path, "wb") as f:
        f.write(body)
    return True


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=0, help="only process the first N studios (trial run)")
    args = parser.parse_args()

    api_key = load_api_key()
    os.makedirs(PHOTO_DIR, exist_ok=True)

    with open(DATA_FILES[0]) as f:
        studios = json.load(f)

    todo = studios[: args.limit] if args.limit else studios
    fetched = skipped = missing = 0
    used_slugs = {}

    try:
        for i, studio in enumerate(todo, 1):
            slug = slugify(studio.get("State"), studio.get("City"), studio.get("Name"))
            # Same-name studios in one city (e.g. two "Club Pilates") must not share a file.
            # Processing order is fixed, so suffixes stay stable across resumed runs.
            used_slugs[slug] = used_slugs.get(slug, 0) + 1
            if used_slugs[slug] > 1:
                slug = f"{slug}-{used_slugs[slug]}"
            filename = f"{slug}.jpg"
            dest = os.path.join(PHOTO_DIR, filename)
            local_url = f"/studio-photos/{filename}"

            if os.path.exists(dest):
                studio["Photo URL"] = local_url
                skipped += 1
                continue

            try:
                ref = find_photo_name(api_key, studio)
                if ref and download_photo(api_key, ref, dest):
                    studio["Photo URL"] = local_url
                    fetched += 1
                else:
                    studio["Photo URL"] = ""
                    missing += 1
            except RuntimeError:
                raise
            except Exception as e:  # noqa: BLE001 - keep going past one bad lookup
                print(f"  warn: {studio.get('Name')} ({studio.get('City')}): {e}")
                studio["Photo URL"] = ""
                missing += 1

            if i % 50 == 0:
                print(f"{i}/{len(todo)} processed ({fetched} fetched, {missing} without photo)")
            time.sleep(0.1)
    finally:
        # Always persist progress, even on interruption - re-runs resume from files on disk.
        for path in DATA_FILES:
            with open(path, "w") as f:
                json.dump(studios, f, indent=4)

    print(f"Done: {fetched} photos downloaded, {skipped} already present, {missing} studios without a photo.")


if __name__ == "__main__":
    main()
