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


def api_get(url):
    with urllib.request.urlopen(url, timeout=30) as resp:
        return json.load(resp)


def find_photo_reference(api_key, studio):
    query = " ".join(
        p for p in [studio.get("Name"), studio.get("Address") or "", studio.get("City"), studio.get("State")] if p
    )
    params = urllib.parse.urlencode(
        {
            "input": query,
            "inputtype": "textquery",
            "fields": "photos,place_id",
            "key": api_key,
        }
    )
    data = api_get(f"https://maps.googleapis.com/maps/api/place/findplacefromtext/json?{params}")
    status = data.get("status")
    if status == "OVER_QUERY_LIMIT":
        raise RuntimeError("Google reports OVER_QUERY_LIMIT - stopping so we don't burn quota.")
    if status == "REQUEST_DENIED":
        raise RuntimeError(f"REQUEST_DENIED from Google: {data.get('error_message', '')}")
    candidates = data.get("candidates") or []
    if not candidates:
        return None
    photos = candidates[0].get("photos") or []
    if not photos:
        return None
    return photos[0].get("photo_reference")


def download_photo(api_key, photo_reference, dest_path):
    params = urllib.parse.urlencode(
        {"maxwidth": PHOTO_MAX_WIDTH, "photo_reference": photo_reference, "key": api_key}
    )
    url = f"https://maps.googleapis.com/maps/api/place/photo?{params}"
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

    try:
        for i, studio in enumerate(todo, 1):
            slug = slugify(studio.get("State"), studio.get("City"), studio.get("Name"))
            filename = f"{slug}.jpg"
            dest = os.path.join(PHOTO_DIR, filename)
            local_url = f"/studio-photos/{filename}"

            if os.path.exists(dest):
                studio["Photo URL"] = local_url
                skipped += 1
                continue

            try:
                ref = find_photo_reference(api_key, studio)
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
