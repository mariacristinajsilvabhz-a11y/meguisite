"""SEO do site: títulos e descrições por página, URL canônica, robots.txt e sitemap.xml.

Para usar um domínio próprio (ex.: https://www.meguipersonalizados.com.br), configure
SITE_URL no Render. Sem ele, o site usa o endereço pelo qual foi acessado.
"""
import os
from xml.sax.saxutils import escape
from editorial import GUIDES, PUBLISHED
from flask import request, url_for

SITE_URL = os.environ.get("SITE_URL", "").rstrip("/")

DEFAULT_DESCRIPTION = (
    "Confecção própria em Contagem (MG): camisetas, uniformes, brindes e kits personalizados "
    "para empresas, times, igrejas e eventos. Peça seu orçamento pelo WhatsApp."
)

# Descrição que aparece no Google, por página (até ~155 caracteres).
DESCRIPTIONS = {
    "home": DEFAULT_DESCRIPTION,
    "products": "Catálogo Megui: camisetas, uniformes, copos, garrafas, bolsas, papelaria e brindes personalizados com a sua marca. Monte seu orçamento online.",
    "b2b": "Uniformes e brindes corporativos personalizados para empresas em Contagem, BH e região: kits de boas-vindas, uniformes por setor e produção em volume.",
    "events": "Camisetas, kits e brindes personalizados para eventos, corridas, encontros, formaturas e festivais. Produção própria da Megui em Contagem (MG).",
    "portfolio_view": "Trabalhos reais da Megui: uniformes, camisetas, brindes e kits personalizados para Senac, Sesc, Fecomércio MG, Band Minas e muitas outras marcas.",
    "about": "Conheça a história da Megui Personalizados, confecção em Contagem (MG) que transforma ideias em camisetas, uniformes e brindes com a sua marca.",
    "policies": "Política de trocas, devoluções, cancelamento, prazos e privacidade da Megui Personalizados. Saiba como funcionam pedidos de peças personalizadas.",
    "contact": "Fale com a Megui Personalizados: WhatsApp (31) 93305-9600, e-mail e endereço em Contagem (MG). Orçamentos de camisetas, uniformes e brindes.",
    "textiles": "Tecidoteca Megui: conheça as malhas e materiais das nossas camisetas e uniformes personalizados e escolha o tecido ideal para o seu projeto.",
    "outside_box": "Tem uma ideia diferente? A Megui cria produtos personalizados sob medida: brindes, kits, embalagens e peças fora do catálogo para a sua marca.",
}

# Páginas que não devem aparecer no Google.
NOINDEX = {"quote_view", "create_art", "explore_more"}

# Páginas fixas do sitemap: (endpoint, prioridade, frequência).
STATIC_PAGES = [
    ("home", "1.0", "weekly"),
    ("guides", "0.8", "monthly"),
    ("products", "0.9", "weekly"),
    ("b2b", "0.9", "monthly"),
    ("events", "0.8", "monthly"),
    ("portfolio_view", "0.8", "weekly"),
    ("outside_box", "0.6", "monthly"),
    ("textiles", "0.6", "monthly"),
    ("about", "0.5", "yearly"),
    ("contact", "0.6", "yearly"),
    ("policies", "0.4", "yearly"),
]


def site_base():
    if SITE_URL:
        return SITE_URL
    base = request.host_url.rstrip("/")
    # O Render atende em HTTPS, mas repassa a requisição ao app como HTTP.
    if request.headers.get("X-Forwarded-Proto", "").split(",")[0].strip() == "https":
        base = "https://" + base.split("://", 1)[1]
    return base


def absolute(path):
    return site_base() + path


def seo_context():
    endpoint = request.endpoint or ""
    return {
        "seo_description": DESCRIPTIONS.get(endpoint, DEFAULT_DESCRIPTION),
        "seo_canonical": absolute(request.path),
        "seo_noindex": endpoint in NOINDEX,
        "seo_image": absolute(url_for("static", filename="img/seo/compartilhar-megui.jpg")),
        "seo_site": site_base(),
    }


def robots_txt():
    lines = [
        "User-agent: *",
        "Disallow: /orcamento",
        "Disallow: /criar-arte",
        "Disallow: /api/",
        "Disallow: /produtos/mais",
        f"Sitemap: {absolute(url_for('sitemap_xml'))}",
        "",
    ]
    return "\n".join(lines)


def sitemap_xml(categories, products):
    urls = [(url_for(ep), prio, freq) for ep, prio, freq in STATIC_PAGES]
    urls += [(url_for("category", slug=c["slug"]), "0.7", "weekly") for c in categories]
    urls += [(url_for("product", slug=p["slug"]), "0.6", "weekly") for p in products]
    urls += [(url_for("guide_detail", slug=g["slug"]), "0.7", "monthly") for g in GUIDES]
    editorial_paths = {url_for("guide_detail", slug=g["slug"]) for g in GUIDES} | {url_for("guides")}
    out = ['<?xml version="1.0" encoding="UTF-8"?>',
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    seen = set()
    for path, prio, freq in urls:
        if path in seen:
            continue
        seen.add(path)
        lastmod = f"<lastmod>{PUBLISHED}</lastmod>" if path in editorial_paths else ""
        out.append(f"  <url><loc>{escape(absolute(path))}</loc>{lastmod}"
                   f"<changefreq>{freq}</changefreq><priority>{prio}</priority></url>")
    out.append("</urlset>")
    return "\n".join(out)
