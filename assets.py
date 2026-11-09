"""Desempenho: junta o CSS fixo do site em poucos arquivos e gera `srcset` para imagens.

CSS: os arquivos de cada grupo continuam sendo editados separadamente, como sempre.
Na inicialização o app junta cada grupo (na mesma ordem) em static/css/_bundle-<grupo>.css,
o que troca 14 requisições que bloqueiam a página por 3. Nenhum passo de build é necessário.

Imagens: `srcset('img/x.webp')` lista as versões menores (img/x-480.webp, -800, -1200)
geradas por tools/responsive_images.py, para o celular baixar só o tamanho que precisa.
"""
import hashlib
from pathlib import Path

STATIC = Path(__file__).resolve().parent / "static"

CSS_GROUPS = {
    # Antes de {% block extra_head %}
    "base": ["style.css", "design-system.css", "mockup-integration.css", "brand-experience.css", "brand-whispers.css"],
    # Entre extra_head e final_head
    "middle": ["mobile-refinement.css", "product-studio.css", "product-cards.css"],
    # Depois de final_head
    "finish": ["experience-refinement.css", "header-modern.css", "typography-megui.css", "editorial-titles.css",
               "theme-mode.css", "mobile-layout-20261029.css", "site-refino-20261101.css"],
}

RESPONSIVE_WIDTHS = (480, 800, 1200)
_bundle_versions = {}


def build_css_bundles():
    css_dir = STATIC / "css"
    for group, files in CSS_GROUPS.items():
        parts = [f"/* ---- {name} ---- */\n" + (css_dir / name).read_text(encoding="utf-8") for name in files]
        content = "\n".join(parts)
        (css_dir / f"_bundle-{group}.css").write_text(content, encoding="utf-8")
        _bundle_versions[group] = hashlib.sha1(content.encode()).hexdigest()[:10]


def css_bundle_version(group):
    return _bundle_versions.get(group, "0")


def srcset(path):
    """'img/foto.webp' -> 'url-480 480w, url-800 800w, ...' (só as versões que existem)."""
    from flask import url_for
    entries = []
    for w in RESPONSIVE_WIDTHS:
        variant = f"{Path(path).with_suffix('')}-{w}.webp"
        if (STATIC / variant).exists():
            entries.append(f"{url_for('static', filename=variant)} {w}w")
    if not entries:
        return ""
    return ", ".join(entries)
