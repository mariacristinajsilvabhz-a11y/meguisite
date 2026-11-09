"""Gera versões menores (480, 800, 1200 px de largura, WebP) das imagens indicadas.

Uso: python3 tools/responsive_images.py static/img/inicio/foto.jpeg [outras...]
Cria static/img/inicio/foto-480.webp etc. ao lado da original (só larguras menores que ela).
"""
import sys
from pathlib import Path
from PIL import Image

WIDTHS = (480, 800, 1200)

for arg in sys.argv[1:]:
    src = Path(arg)
    im = Image.open(src)
    has_alpha = im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info)
    im = im.convert("RGBA" if has_alpha else "RGB")
    for w in WIDTHS:
        if w >= im.width:
            continue
        out = src.with_name(f"{src.stem}-{w}.webp")
        h = round(im.height * w / im.width)
        im.resize((w, h), Image.LANCZOS).save(out, "WEBP", quality=78, method=6)
        print(f"{out} {out.stat().st_size // 1024} KB")
