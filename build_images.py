# -*- coding: utf-8 -*-
"""
将 D:\\内容与策展\\资料收集\\阳台图片\\{A,F,L,S}\\ 下的原始图片
统一压缩、规范化为 assets/img/<编号>.jpg（网页友好尺寸）。
原始文件只读，不做任何修改。

运行: python scripts/build_images.py
"""
import os

from PIL import Image

SRC_ROOT = r"D:\内容与策展\资料收集\阳台图片"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "assets", "img")

MAX_SIDE = 1400      # 最长边
QUALITY = 82         # JPEG 质量
EXTS = {".jpg", ".jpeg", ".png", ".JPG", ".JPEG", ".PNG"}


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    done, failed = 0, []
    for cat in ("A", "F", "L", "S"):
        src_dir = os.path.join(SRC_ROOT, cat)
        for fn in sorted(os.listdir(src_dir)):
            name, ext = os.path.splitext(fn)
            if ext not in EXTS:
                continue
            src = os.path.join(src_dir, fn)
            dst = os.path.join(OUT_DIR, name + ".jpg")
            try:
                im = Image.open(src)
                im = im.convert("RGB")
                w, h = im.size
                if max(w, h) > MAX_SIDE:
                    r = MAX_SIDE / max(w, h)
                    im = im.resize((round(w * r), round(h * r)), Image.LANCZOS)
                im.save(dst, "JPEG", quality=QUALITY, progressive=True, optimize=True)
                done += 1
            except Exception as e:  # noqa: BLE001
                failed.append((fn, str(e)))
    print("converted:", done)
    if failed:
        print("FAILED:")
        for f in failed:
            print("  ", f)


if __name__ == "__main__":
    main()
