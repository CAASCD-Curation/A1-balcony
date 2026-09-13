# -*- coding: utf-8 -*-
"""Search Wikimedia Commons for candidate illustrations, print title/dims/url."""
import sys, requests, json

API = "https://commons.wikimedia.org/w/api.php"
HEADERS = {"User-Agent": "KimiWorkBot/1.0 (literature curation research)"}

def search(term, limit=6):
    params = {
        "action": "query", "format": "json",
        "generator": "search", "gsrsearch": f"filetype:bitmap {term}",
        "gsrnamespace": 6, "gsrlimit": limit,
        "prop": "imageinfo", "iiprop": "url|size|mime",
    }
    try:
        r = requests.get(API, params=params, headers=HEADERS, timeout=30)
        data = r.json()
    except Exception as e:
        print(f"  [ERROR] {e}")
        return
    pages = (data.get("query") or {}).get("pages") or {}
    items = []
    for p in pages.values():
        ii = (p.get("imageinfo") or [{}])[0]
        w, h = ii.get("width", 0), ii.get("height", 0)
        items.append((w * h, p.get("title"), w, h, ii.get("mime"), ii.get("url")))
    items.sort(reverse=True)
    for _, title, w, h, mime, url in items:
        print(f"  {title}\n    {w}x{h} {mime}\n    {url}")

queries = [
    "Rodin Fleurs du mal illustration",
    "Doré Bluebeard Barbe bleue",
    "Rapunzel illustration",
    "Rembrandt Bathsheba Louvre",
    "Schnorr von Carolsfeld Song of Solomon",
    "Dante's Dream Rossetti",
    "Dido building Carthage Turner",
    "Decameron 1492 woodcut",
    "Much Ado About Nothing illustration",
    "Eve of St. Agnes Arthur Hughes",
    "The Raven Gustave Doré",
    "Vrubel Demon seated",
    "War and Peace Tolstoy illustration",
    "Notre-Dame de Paris 1844 illustration",
    "Barber of Seville Beaumarchais",
    "Pelléas Mélisande Bernhardt",
    "Cyrano de Bergerac Coquelin",
    "Beardsley Salome climax",
    "Lady of Shalott Waterhouse",
    "Mariana Millais",
]

for q in queries:
    print(f"=== {q} ===")
    search(q)
