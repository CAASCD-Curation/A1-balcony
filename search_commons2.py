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
    for attempt in range(4):
        try:
            r = requests.get(API, params=params, headers=HEADERS, timeout=30)
            data = r.json()
            break
        except Exception as e:
            print(f"  [retry {attempt+1}] {r.status_code if 'r' in dir() else ''} {e}")
            time.sleep(8)
    else:
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
    "Much Ado About Nothing illustration",
    "Eve of St. Agnes Hughes",
    "Raven Gustave Doré",
    "Vrubel Demon",
    "War and Peace Tolstoy illustration",
    "Notre-Dame de Paris book illustration",
    "Barbier de Séville Beaumarchais",
    "Pelléas Mélisande Bernhardt",
    "Cyrano de Bergerac balcony",
    "Beardsley Salome",
    "Lady of Shalott Waterhouse 1888",
    "Mariana Millais",
]

for q in queries:
    print(f"=== {q} ===")
    search(q)
    time.sleep(3)
