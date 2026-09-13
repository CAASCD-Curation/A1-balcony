# -*- coding: utf-8 -*-
import requests, time, re

API = "https://commons.wikimedia.org/w/api.php"
S = requests.Session(); S.headers.update({"User-Agent": "KimiWorkBot/1.0"})

def get(params, tries=5):
    r = None
    for attempt in range(tries):
        try:
            r = S.get(API, params=params, timeout=30)
            return r.json()
        except Exception as e:
            print(f"  [retry {attempt+1}] {type(e).__name__}")
            time.sleep(10)
    return None

def describe(title):
    data = get({"action": "query", "format": "json", "titles": title,
                "prop": "imageinfo", "iiprop": "url|size|mime|extmetadata"})
    if not data: return
    for p in (data.get("query") or {}).get("pages", {}).values():
        if "missing" in p:
            print(f"### {title}\n  MISSING"); return
        ii = (p.get("imageinfo") or [{}])[0]
        em = ii.get("extmetadata", {})
        desc = re.sub(r"<[^>]+>", " ", (em.get("ImageDescription", {}) or {}).get("value", ""))[:300]
        print(f"### {title}\n  {ii.get('width')}x{ii.get('height')} {ii.get('mime')}\n  {(ii.get('url') or '').split('?')[0]}\n  DESC: {desc}\n")

for t in [
    "File:Decameron - University of Cambridge - Cinquième journée, nouvelle 4.png",
    "File:Li sao illustré 3 10.png",
    "File:Arthur Rackham Rapunzel.jpg",
    "File:Aubrey Beardsley's Illustrations to Salome by Oscar Wilde MET DP863676.jpg",
    "File:Alfred de Richemont - Madame Bovary - Emma Bovary et Rodolphe.jpg",
    "File:William Holden-Martha Scott in Our Town.jpg",
    "File:Qingfeng.png",
    "File:Sun Wen Red Chamber Daguanyuan.jpg",
]:
    describe(t); time.sleep(3)
