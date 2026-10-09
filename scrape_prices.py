"""Scrape class pricing from studio websites listed in pilates_studios.json.

For each studio with a Website, fetches the homepage plus up to 3 likely
pricing pages, extracts $-amounts with surrounding context, and classifies
them into:
  - "Price Single": drop-in / single class price (sanity range $10-$120)
  - "Price Intro":  intro / first-class / new-client offer price
  - "Price Source URL": the page the single-class price came from

Coverage is expected to be partial: sites behind Mindbody/booking widgets or
heavy JS will yield nothing, and those studios simply keep no price fields.

Usage:
    python3 scrape_prices.py [--limit N] [--force]

Resumable: studios that already have a "Price Scraped" marker are skipped
unless --force is passed. Progress is persisted to both JSON copies on exit.
"""

import argparse
import html as htmllib
import json
import re
import socket
import ssl
import time
import urllib.error
import urllib.parse
import urllib.request

DATA_FILES = ["pilates_studios.json", "public/pilates_studios.json"]
USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36"
TIMEOUT = 10
MAX_PRICE_PAGES = 3

PRICING_LINK_RE = re.compile(r"pric|rate|member|package|class|intro|offer|book", re.I)
PRICE_RE = re.compile(r"\$\s?(\d{1,3}(?:\.\d{2})?)")
# Tier 1: phrases that almost always label a drop-in/single class price
SINGLE_TIER1 = re.compile(
    r"drop[\s-]?ins?\b|single (?:class|session|visit)|class single|session single"
    r"|\bsingle\b(?=\s*[:\-–]?\s*\$)",  # bare 'Single $50' style labels
    re.I)
# Tier 2: weaker phrases, used only when tier 1 found nothing
SINGLE_TIER2 = re.compile(r"\b(?:one|1) class\b|per class", re.I)
INTRO_KEYWORDS = re.compile(r"intro(?:ductory)?\b|first (?:class|session|visit)|trial\b|new (?:client|student|member)", re.I)
# Intro-offer shapes: "$49 for 2 weeks", "3 classes for $30", "50% off", "free intro class"
BUNDLE_RE = re.compile(r"\$\s?(\d{1,3})\s*for\s*(\d{1,2})\s*(classes|sessions|weeks|days|class|session|week|day)\b", re.I)
BUNDLE_REV_RE = re.compile(r"(\d{1,2})\s*(classes|sessions|weeks|class|session|week)\s*for\s*\$\s?(\d{1,3})\b", re.I)
PCT_RE = re.compile(r"(\d{1,2})\s?%\s?off", re.I)
FREE_RE = re.compile(r"free\s+(?:intro(?:ductory)?|first|trial)\s*(?:class|session|week)?|first\s+(?:class|session)\s+(?:is\s+)?free", re.I)
TAG_RE = re.compile(r"<script[\s\S]*?</script>|<style[\s\S]*?</style>|<[^>]+>")

ssl_ctx = ssl.create_default_context()
ssl_ctx.check_hostname = False
ssl_ctx.verify_mode = ssl.CERT_NONE  # many small-studio sites have broken cert chains


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "text/html"})
    with urllib.request.urlopen(req, timeout=TIMEOUT, context=ssl_ctx) as resp:
        ctype = resp.headers.get("Content-Type", "")
        if "html" not in ctype:
            return None
        return resp.read(1_500_000).decode("utf-8", errors="replace")


def strip_tags(page_html):
    text = TAG_RE.sub(" ", page_html)
    text = htmllib.unescape(text)
    return re.sub(r"\s+", " ", text)


def pricing_page_urls(base_url, page_html):
    """Same-host links whose href or text smells like pricing."""
    base = urllib.parse.urlparse(base_url)
    found = []
    for m in re.finditer(r'<a[^>]+href=["\']([^"\'#]+)["\'][^>]*>(.{0,80}?)</a>', page_html, re.I | re.S):
        href, label = m.group(1), strip_tags(m.group(2))
        if not (PRICING_LINK_RE.search(href) or PRICING_LINK_RE.search(label)):
            continue
        absolute = urllib.parse.urljoin(base_url, href)
        parsed = urllib.parse.urlparse(absolute)
        if parsed.netloc != base.netloc or not parsed.scheme.startswith("http"):
            continue
        if absolute not in found and absolute != base_url:
            found.append(absolute)
        if len(found) >= MAX_PRICE_PAGES:
            break
    return found


def nearest_price(text, kw_start, kw_end, lo=10, hi=120, before=30, after=70):
    """The $-amount closest to a keyword match, searching a tight window around it.

    Labels usually precede prices ('Single Class ... $45'), so the window
    extends further after the keyword than before it.
    """
    window_start = max(0, kw_start - before)
    window = text[window_start: kw_end + after]
    best = None
    best_dist = 10 ** 9
    for m in PRICE_RE.finditer(window):
        amount = float(m.group(1))
        if not (lo <= amount <= hi):
            continue
        pos = window_start + m.start()
        dist = min(abs(pos - kw_end), abs(kw_start - pos))
        if dist < best_dist:
            best, best_dist = amount, dist
    return best


def anchored_price(text, keyword_re, lo=10, hi=120):
    for m in keyword_re.finditer(text):
        price = nearest_price(text, m.start(), m.end(), lo=lo, hi=hi)
        if price is not None:
            return price
    return None


def fmt(amount):
    return int(amount) if float(amount).is_integer() else amount


def plural(n, unit):
    unit = unit.lower().rstrip("s")
    return f"{n} {unit}{'' if n == '1' else 's'}"


def extract_intro_offer(text):
    """A short human-readable intro-offer label, or None."""
    # "$49 for 2 weeks" / "2 classes for $30" near intro wording
    for m in BUNDLE_RE.finditer(text):
        ctx = text[max(0, m.start() - 100): m.end() + 60]
        if INTRO_KEYWORDS.search(ctx) and 0 < float(m.group(1)) <= 200:
            return f"${fmt(float(m.group(1)))} for {plural(m.group(2), m.group(3))}"
    for m in BUNDLE_REV_RE.finditer(text):
        ctx = text[max(0, m.start() - 100): m.end() + 60]
        if INTRO_KEYWORDS.search(ctx) and 0 < float(m.group(3)) <= 200:
            return f"{plural(m.group(1), m.group(2))} for ${fmt(float(m.group(3)))}"
    # "50% off" near intro wording
    for m in PCT_RE.finditer(text):
        ctx = text[max(0, m.start() - 100): m.end() + 60]
        if INTRO_KEYWORDS.search(ctx):
            return f"{m.group(1)}% off first visit"
    # "free intro class" / "first class free"
    if FREE_RE.search(text):
        return "Free intro class"
    return None


def extract_prices(text):
    """Return (single, intro, offer_label) from HTML-stripped text, keyword-anchored."""
    single = anchored_price(text, SINGLE_TIER1)
    if single is None:
        single = anchored_price(text, SINGLE_TIER2)
    intro = anchored_price(text, INTRO_KEYWORDS, lo=5)
    offer = extract_intro_offer(text)
    return single, intro, offer


def scrape_studio(website):
    """Return dict of price fields found for one studio website.

    Returns None when the homepage itself could not be fetched, so the
    caller can leave the studio unmarked and retry on a later run.
    """
    pages = [website]
    try:
        home_html = fetch(website)
    except Exception:
        return None
    if not home_html:
        return {}
    pages += pricing_page_urls(website, home_html)

    best = {}
    for url in pages:
        try:
            page_html = home_html if url == website else fetch(url)
        except Exception:
            continue
        if not page_html:
            continue
        single, intro, offer = extract_prices(strip_tags(page_html))
        if single and "Price Single" not in best:
            best["Price Single"] = fmt(single)
            best["Price Source URL"] = url
        if intro and "Price Intro" not in best:
            best["Price Intro"] = fmt(intro)
        if offer and "Intro Offer" not in best:
            best["Intro Offer"] = offer
        if "Price Single" in best and "Intro Offer" in best:
            break
    return best


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=0, help="only process the first N studios with websites")
    parser.add_argument("--force", action="store_true", help="re-scrape studios already marked as scraped")
    parser.add_argument("--retry-empty", action="store_true",
                        help="also re-scrape studios marked scraped that yielded no price fields (recovers transient fetch failures)")
    args = parser.parse_args()

    socket.setdefaulttimeout(TIMEOUT)

    with open(DATA_FILES[0]) as f:
        studios = json.load(f)

    def is_empty(s):
        return not (s.get("Price Single") or s.get("Price Intro") or s.get("Intro Offer"))

    todo = [s for s in studios if s.get("Website")]
    if not args.force:
        if args.retry_empty:
            todo = [s for s in todo if not s.get("Price Scraped") or is_empty(s)]
        else:
            todo = [s for s in todo if not s.get("Price Scraped")]
    if args.limit:
        todo = todo[: args.limit]

    found_single = found_intro = processed = 0
    try:
        for studio in todo:
            processed += 1
            result = scrape_studio(studio["Website"].strip())
            if result is None:
                # Homepage fetch failed: leave unmarked so a later run retries it
                studio.pop("Price Scraped", None)
                continue
            studio["Price Scraped"] = True
            if result.get("Price Single"):
                studio["Price Single"] = result["Price Single"]
                studio["Price Source URL"] = result.get("Price Source URL")
                found_single += 1
            if result.get("Price Intro"):
                studio["Price Intro"] = result["Price Intro"]
                found_intro += 1
            if result.get("Intro Offer"):
                studio["Intro Offer"] = result["Intro Offer"]
            if processed % 25 == 0:
                print(f"{processed}/{len(todo)} sites ({found_single} single prices, {found_intro} intro prices)", flush=True)
            time.sleep(0.3)
    finally:
        for path in DATA_FILES:
            with open(path, "w") as f:
                json.dump(studios, f, indent=4)

    total_single = sum(1 for s in studios if s.get("Price Single"))
    total_intro = sum(1 for s in studios if s.get("Price Intro"))
    print(f"Done: {processed} sites this run; dataset now has {total_single} single-class prices, {total_intro} intro prices.")


if __name__ == "__main__":
    main()
