# -*- coding: utf-8 -*-
import requests, time

API = "https://commons.wikimedia.org/w/api.php"
HEADERS = {"User-Agent": "KimiWorkBot/1.0 (literature curation; contact: local)"}

def search(term, limit=6):
    params = {
        "action": "query", "format": "json",
        "generator": "search", "gsrsearch": f"filetype:bitmap {term}",
        "gsrnamespace": 6, "gsrlimit": limit,
        "prop": "imageinfo", "iiprop": "url|size|mime",
    }
    data = None
    for attempt in range(5):
        try:
            r = requests.get(API, params=params, headers=HEADERS, timeout=30)
            data = r.json()
            break
        except Exception as e:
            print(f"  [retry {attempt+1}] {getattr(r,'status_code','')} {e}")
            time.sleep(10)
    if data is None:
        return
    pages = (data.get("query") or {}).get("pages") or {}
    items = []
    for p in pages.values():
        ii = (p.get("imageinfo") or [{}])[0]
        w, h = ii.get("width", 0), ii.get("height", 0)
        url = (ii.get("url") or "").split("?")[0]
        items.append((w * h, p.get("title"), w, h, ii.get("mime"), url))
    items.sort(reverse=True)
    for _, title, w, h, mime, url in items:
        print(f"  {title}\n    {w}x{h} {mime}\n    {url}")

queries = [
    "Jin Ping Mei illustration",
    "Sun Wen Dream of the Red Chamber",
    "Chen Hongshou Water Margin",
    "Strange Stories from a Chinese Studio illustration",
    "Liaozhai illustration",
    "Romance of the Three Kingdoms illustration",
    "Shan Hai Jing illustration",
    "Peach Blossom Fan Kong Shangren",
    "Changsheng dian Hong Sheng",
    "Xiao Yuncong Li Sao",
]
for q in queries:
    print(f"=== {q} ===")
    search(q)
    time.sleep(4)
