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
import subprocess
import tempfile
import time
import urllib.parse

DATA_FILES = ["pilates_studios.json", "public/pilates_studios.json"]
USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36"
TIMEOUT = 10
MAX_PRICE_PAGES = 3

PRICING_LINK_RE = re.compile(r"pric|rate|member|package|class|intro|offer|book|reformer|\bmat\b", re.I)

# Prices are stored in USD; IDR amounts (Bali studios) are converted.
IDR_PER_USD = 16000

# "$45" | "Rp 150.000" / "IDR 250,000" / "Rp 1500000"
# | "225,000 IDR" / "200,000K IDR" (suffix currency, stray K included)
# | "Rp 150K" / bare "150K"
MONEY_PAT = (
    r"\$\s?(?P<usd>\d{1,3}(?:\.\d{2})?)"
    r"|(?:Rp\.?|IDR)\s?(?P<idr>\d{1,3}(?:[.,\s]\d{3})+|\d{4,7})"
    r"|(?P<idrsuf>\d{1,3}(?:[.,\s]\d{3})+)\s?0*K?\s?(?:IDR|Rp)\b"
    r"|(?:(?:Rp\.?|IDR)\s?|\b)(?P<idrk>\d{2,3})\s?[kK]\b"
)
MONEY_RE = re.compile(MONEY_PAT)


def money_to_usd(m):
    """(usd_amount, idr_amount_or_None) for one MONEY_RE match."""
    if m.group("usd"):
        return float(m.group("usd")), None
    if m.group("idr") or m.group("idrsuf"):
        idr = float((m.group("idr") or m.group("idrsuf")).replace(".", "").replace(",", "").replace(" ", ""))
    else:
        idr = float(m.group("idrk")) * 1000
    return round(idr / IDR_PER_USD), idr


def fmt_idr(idr):
    """Rp label the way Bali studios write it: 'Rp 550K', 'Rp 2.08M'."""
    if idr >= 1_000_000:
        mil = idr / 1_000_000
        return f"Rp {mil:g}M"
    return f"Rp {int(round(idr / 1000))}K"
# Tier 1: phrases that almost always label a drop-in/single class price
SINGLE_TIER1 = re.compile(
    r"drop[\s-]?ins?\b|single (?:class|session|visit)|class single|session single"
    r"|\bsingle\b(?=\s*[:\-–]?\s*\$)",  # bare 'Single $50' style labels
    re.I)
# Tier 2: weaker phrases, used only when tier 1 found nothing
# ("1 reformer credit" is how Bali credit-based studios label a single class)
SINGLE_TIER2 = re.compile(r"\b(?:one|1) class\b|per class|\b(?:one|1)\s+(?:[a-z]+\s+)?credit\b", re.I)
# Tier 3: privates-only studios price per private/semi-private session; take the
# cheapest such rate, and only when tiers 1-2 found nothing
SINGLE_TIER3 = re.compile(r"(?:semi[\s-]?)?private\s+(?:reformer\s+|pilates\s+)?(?:class|session|pilates)\b", re.I)
INTRO_KEYWORDS = re.compile(r"intro(?:ductory)?\b|first (?:class|session|visit)|trial\b|new (?:client|student|member)", re.I)
# Intro-offer shapes: "$49 for 2 weeks", "3 classes for Rp 450.000",
# "3-class intro pack for 550K", "50% off", "free intro class"
BUNDLE_RE = re.compile(rf"(?:{MONEY_PAT})\s*for\s*(?P<n>\d{{1,2}})\s*(?P<unit>classes|sessions|weeks|days|class|session|week|day)\b", re.I)
# No connector word required: "3 Classes. Just 450K", "3 Class Intro Offer 450,000K IDR";
# the intro-keyword context check in extract_intro_offer keeps this from
# swallowing ordinary package tables.
BUNDLE_REV_RE = re.compile(
    rf"(?P<n>\d{{1,2}})[\s-]*(?P<unit>classes|sessions|weeks|class|session|week)\b"
    rf"[^?!$]{{0,40}}?(?:{MONEY_PAT})", re.I)
PCT_RE = re.compile(r"(\d{1,2})\s?%\s?off", re.I)
FREE_RE = re.compile(r"free\s+(?:intro(?:ductory)?|first|trial)\s*(?:class|session|week)?|first\s+(?:class|session)\s+(?:is\s+)?free", re.I)
TAG_RE = re.compile(r"<script[\s\S]*?</script>|<style[\s\S]*?</style>|<[^>]+>")

def fetch(url):
    """Fetch a page via curl: the system Python's LibreSSL fails TLS negotiation
    on many modern hosts and urllib does not follow 308 redirects; -k because
    many small-studio sites have broken cert chains."""
    with tempfile.NamedTemporaryFile(suffix=".html") as tmp:
        proc = subprocess.run(
            ["curl", "-sSLk", "--compressed", "--max-time", str(TIMEOUT),
             "-A", USER_AGENT, "-H", "Accept: text/html",
             "-o", tmp.name, "-w", "%{content_type}", url],
            capture_output=True, text=True, timeout=TIMEOUT * 3)
        if proc.returncode != 0:
            raise RuntimeError(proc.stderr.strip() or f"curl exit {proc.returncode}")
        if "html" not in proc.stdout:
            return None
        with open(tmp.name, "rb") as f:
            return f.read(1_500_000).decode("utf-8", errors="replace")


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
        absolute = urllib.parse.urljoin(base_url, href)
        parsed = urllib.parse.urlparse(absolute)
        # Match on the path, not the full URL: a domain like malupilates.com
        # would otherwise make every internal link look like a pricing page.
        if not (PRICING_LINK_RE.search(parsed.path) or PRICING_LINK_RE.search(label)):
            continue
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
    for m in MONEY_RE.finditer(window):
        amount, idr = money_to_usd(m)
        # Converted IDR prices get their own sanity range: a Bali single class
        # runs ~Rp 100-300K (~$6-19), below the USD floor used for $ sites.
        if not ((3 <= amount <= 125) if idr else (lo <= amount <= hi)):
            continue
        pos = window_start + m.start()
        dist = min(abs(pos - kw_end), abs(kw_start - pos))
        if dist < best_dist:
            best, best_dist = (amount, idr), dist
    return best


def anchored_price(text, keyword_re, lo=10, hi=120, take_min=False):
    """(usd_amount, idr_amount_or_None) for the price nearest a keyword, or None.

    take_min considers every keyword match and returns the cheapest hit
    (private vs semi-private rates); default is first match wins.
    """
    found = []
    for m in keyword_re.finditer(text):
        price = nearest_price(text, m.start(), m.end(), lo=lo, hi=hi)
        if price is not None:
            if not take_min:
                return price
            found.append(price)
    return min(found, key=lambda p: p[0]) if found else None


def fmt(amount):
    return int(amount) if float(amount).is_integer() else amount


def plural(n, unit):
    unit = unit.lower()
    if unit.endswith("es") and unit[:-2].endswith("s"):
        unit = unit[:-2]  # classes -> class
    elif unit.endswith("s") and not unit.endswith("ss"):
        unit = unit[:-1]  # sessions -> session
    suffix = "" if n == "1" else ("es" if unit.endswith("s") else "s")
    return f"{n} {unit}{suffix}"


def money_label(usd, idr):
    """IDR prices display in their own currency, matching the studio's site."""
    return fmt_idr(idr) if idr else f"${fmt(usd)}"


def extract_intro_offer(text):
    """A short human-readable intro-offer label, or None."""
    # "$49 for 2 weeks" / "2 classes for Rp 300.000" near intro wording
    for m in BUNDLE_RE.finditer(text):
        ctx = text[max(0, m.start() - 100): m.end() + 60]
        amount, idr = money_to_usd(m)
        if INTRO_KEYWORDS.search(ctx) and 0 < amount <= 200:
            return f"{money_label(amount, idr)} for {plural(m.group('n'), m.group('unit'))}"
    for m in BUNDLE_REV_RE.finditer(text):
        ctx = text[max(0, m.start() - 100): m.end() + 60]
        amount, idr = money_to_usd(m)
        if INTRO_KEYWORDS.search(ctx) and 0 < amount <= 200:
            return f"{plural(m.group('n'), m.group('unit'))} for {money_label(amount, idr)}"
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
    """Return (single, intro, offer_label) from HTML-stripped text, keyword-anchored.

    single and intro are (usd, idr_or_None) tuples or None.
    """
    single = anchored_price(text, SINGLE_TIER1)
    if single is None:
        single = anchored_price(text, SINGLE_TIER2)
    if single is None:
        single = anchored_price(text, SINGLE_TIER3, hi=150, take_min=True)
    intro = anchored_price(text, INTRO_KEYWORDS, lo=5)
    offer = extract_intro_offer(text)
    return single, intro, offer


def scrape_studio(website):
    """Return dict of price fields found for one studio website.

    Returns None when the homepage itself could not be fetched, so the
    caller can leave the studio unmarked and retry on a later run.
    """
    try:
        home_html = fetch(website)
    except Exception:
        return None
    if not home_html:
        return {}
    pages = [website] + pricing_page_urls(website, home_html)

    # Google often lists a deep page (location subpage + UTM params) that is a
    # JS shell; prices usually live on the site root or its pricing pages.
    # Never climb to the root of multi-tenant platforms: linktr.ee/'s root is
    # Linktree's own marketing page, not the studio's.
    parsed = urllib.parse.urlparse(website)
    host = parsed.netloc.lower().removeprefix("www.")
    is_platform = host in {
        "linktr.ee", "instagram.com", "facebook.com", "momence.com",
        "linkin.bio", "taplink.cc", "bio.site", "calendly.com", "wa.me",
    } or any(host.endswith("." + p) for p in ("glofox.com", "mindbodyonline.com", "bookee.co"))
    if not is_platform and (parsed.path.strip("/") or parsed.query):
        root = f"{parsed.scheme}://{parsed.netloc}/"
        try:
            root_html = fetch(root)
        except Exception:
            root_html = None
        if root_html:
            fetched_root = {root: root_html}
            for url in [root] + pricing_page_urls(root, root_html):
                if url not in pages:
                    pages.append(url)
        else:
            fetched_root = {}
    else:
        fetched_root = {}

    best = {}
    for url in pages[: 2 * MAX_PRICE_PAGES]:
        try:
            page_html = home_html if url == website else fetched_root.get(url) or fetch(url)
        except Exception:
            continue
        if not page_html:
            continue
        single, intro, offer = extract_prices(strip_tags(page_html))
        # "From" price: the cheapest single-class rate anywhere on the site
        # (e.g. mat 200K vs reformer 225K), not the first page's
        if single and single[0] < best.get("_single_usd", 10 ** 9):
            usd, idr = single
            best["_single_usd"] = usd
            best["Price Single"] = fmt(usd)
            best["Price Source URL"] = url
            best["Price Single Local"] = fmt_idr(idr) if idr else None
        if intro and "Price Intro" not in best:
            usd, idr = intro
            best["Price Intro"] = fmt(usd)
            if idr:
                best["Price Intro Local"] = fmt_idr(idr)
        if offer and "Intro Offer" not in best:
            best["Intro Offer"] = offer
    best.pop("_single_usd", None)
    return best


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=0, help="only process the first N studios with websites")
    parser.add_argument("--force", action="store_true", help="re-scrape studios already marked as scraped")
    parser.add_argument("--retry-empty", action="store_true",
                        help="also re-scrape studios marked scraped that yielded no price fields (recovers transient fetch failures)")
    parser.add_argument("--state", help="only process studios in this state/region (e.g. Bali)")
    args = parser.parse_args()

    with open(DATA_FILES[0]) as f:
        studios = json.load(f)

    def is_empty(s):
        return not (s.get("Price Single") or s.get("Price Intro") or s.get("Intro Offer"))

    todo = [s for s in studios if s.get("Website")]
    if args.state:
        todo = [s for s in todo if s.get("State") == args.state]
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
                studio["Price Single Local"] = result.get("Price Single Local")
                found_single += 1
            if result.get("Price Intro"):
                studio["Price Intro"] = result["Price Intro"]
                studio["Price Intro Local"] = result.get("Price Intro Local")
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
