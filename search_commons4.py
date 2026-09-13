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

def describe(title):
    params = {
        "action": "query", "format": "json", "titles": title,
        "prop": "imageinfo", "iiprop": "url|size|mime|extmetadata",
    }
    for attempt in range(4):
        try:
            r = requests.get(API, params=params, headers=HEADERS, timeout=30)
            data = r.json()
            break
        except Exception:
            time.sleep(10)
    else:
        return
    for p in (data.get("query") or {}).get("pages", {}).values():
        ii = (p.get("imageinfo") or [{}])[0]
        em = ii.get("extmetadata", {})
        desc = (em.get("ImageDescription", {}) or {}).get("value", "")[:400]
        print(f"### {title}\n  {ii.get('width')}x{ii.get('height')} {ii.get('mime')}\n  {(ii.get('url') or '').split('?')[0]}\n  DESC: {desc}\n")

print(">>> SEARCHES <<<")
for q in [
    "Odilon Redon Fleurs du mal",
    "Cyrano de Bergerac Rostand",
    "barbier de Séville Rosine fenêtre",
    "Queen of Spades Pushkin illustration",
    "Evgeny Onegin Samokish-Sudkovskaya",
    "Gustave Doré Don Quixote serenade",
    "Frankenstein 1831 frontispiece Holst",
    "Nibelungenlied Kriemhild illustration",
    "Don Juan Tenorio Zorrilla",
    "Madame Bovary illustration",
    "La Celestina woodcut",
]:
    print(f"=== {q} ===")
    search(q)
    time.sleep(4)

print(">>> DESCRIPTIONS <<<")
for t in [
    "File:Barbebleue.jpg",
    "File:Schnorr von Carolsfeld Bibel in Bildern 1860 138.png",
    "File:Jin Ping Mei-4.jpg",
    "File:Jin Ping Mei-2.jpg",
    "File:桃花扇传奇四卷首一卷.jpg",
    "File:Romance of the Three Kingdoms with Li Zhuowu’s Critical Comments WDL11400.jpg",
    "File:Turner - Dido.jpg",
    "File:Decameron - University of Cambridge - Cinquième journée, nouvelle 6.png",
    "File:Ростова пастернак.jpeg",
    "File:Notre Dame de Paris (1888) illustr vol.1 p.113.jpg",
    "File:HOWARD(1828-33) Shakspeare, Much Ado About Nothing vol1, p227.jpg",
]:
    describe(t)
    time.sleep(3)
