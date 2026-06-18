import re
import sys
import urllib.parse
import urllib.request


BASE_HEADERS = {
    "User-Agent": "Mozilla/5.0",
    "Referer": "https://www.piaa.com/quad-series-led-light-bars.aspx",
}


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers=BASE_HEADERS)
    with urllib.request.urlopen(req, timeout=60) as response:
        return response.read().decode("utf-8", "ignore")


def main() -> int:
    url = sys.argv[1] if len(sys.argv) > 1 else "https://www.piaa.com/2000-led-cube-lp-flood-kit.aspx"
    html = fetch(url)

    title_match = re.search(r"<title>(.*?)</title>", html, flags=re.I | re.S)
    print("TITLE:", (title_match.group(1).strip() if title_match else ""))

    pn_match = re.search(r"Part\s*No\.?\s*</[^>]+>\s*<[^>]+>\s*([A-Z0-9-]+)", html, flags=re.I)
    if not pn_match:
        pn_match = re.search(r"Part\s*No\.?\s*[:#]?\s*([A-Z0-9-]{3,})", html, flags=re.I)
    print("PART:", pn_match.group(1).strip() if pn_match else "")

    links = set()
    for href in re.findall(r'href=["\']([^"\']+)["\']', html, flags=re.I):
        full = urllib.parse.urljoin(url, href)
        if full.lower().endswith(".aspx"):
            links.add(full)

    print("ASPX LINKS:", len(links))
    for item in sorted(links):
        if "piaa.com" in item:
            print(item)

    image_candidates = set()
    for src in re.findall(r'(?:src|href|data-zoom-image|data-image)=["\']([^"\']+\.(?:png|jpg|jpeg|webp))[^"\']*["\']', html, flags=re.I):
        image_candidates.add(urllib.parse.urljoin(url, src))

    print("IMAGES:", len(image_candidates))
    for item in sorted(image_candidates):
        print(item)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
