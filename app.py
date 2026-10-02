import os
import re
from decimal import Decimal, InvalidOperation
from urllib.parse import quote
from flask import Flask, render_template, request, redirect, url_for, session, abort, jsonify
from hub_catalog import HubCatalog, CatalogUnavailable
from content_data import HISTORICAL_BRANDS, PORTFOLIO, PRODUCTION_VIDEOS, RECENT_WORKS, DESIGN_PROJECTS

from mockup_3d import mockup_3d

app = Flask(__name__)
app.register_blueprint(mockup_3d)
hub_catalog = HubCatalog()

app.secret_key = os.environ.get("SECRET_KEY", "troque-esta-chave-no-render")

PRIMARY_WHATSAPP = "5531994888250"
ADMIN_PHONE = "5531993181939"
CONTACT_EMAIL = "contatomegui@gmail.com"
CONTACT_ADDRESS = "Avenida Seis, nº 31 — Água Branca, Contagem - MG"
COMPANY_CNPJ = "45.833.844/0001-51"

_raw_whatsapp = os.environ.get("WHATSAPP_NUMBER", PRIMARY_WHATSAPP)
WHATSAPP_NUMBER = re.sub(r"\D", "", _raw_whatsapp)

# Número antigo não pertence mais à Megui. Mesmo que ainda esteja salvo no Render,
# o site substitui pelo atendimento atual.
if WHATSAPP_NUMBER in {"31984912083", "5531984912083"}:
    WHATSAPP_NUMBER = PRIMARY_WHATSAPP

CATEGORIES = [
    {"slug": "brindes", "name": "Brindes", "description": "Copos, squeezes, canecas, kits e presentes corporativos.", "icon": "✦"},
    {"slug": "bolsas-acessorios", "name": "Bolsas & Acessórios", "description": "Mochilas, nécessaires, ecobags, sacolas e acessórios.", "icon": "◇"},
    {"slug": "vestuario", "name": "Vestuário", "description": "Camisetas, moletons, uniformes, bonés, aventais e jalecos.", "icon": "M"},
    {"slug": "corporativo", "name": "Corporativo", "description": "Soluções para eventos, equipes, campanhas e kits empresariais.", "icon": "▦"},
    {"slug": "grafica", "name": "Meg Gráfica", "description": "Materiais gráficos e comunicação visual para sua marca.", "icon": "▤"},
    {"slug": "eventos", "name": "Eventos", "description": "Camisetas, brindes e comunicação visual para feiras, festas e ações promocionais.", "icon": "✦"},
    {"slug": "destaques", "name": "Destaques", "description": "Produtos com alta procura e ótimo potencial de marca.", "icon": "★"},
]

CATEGORY_IMAGES = {
    "brindes": ["img/produtos/squeeze-megui.webp", "img/produtos/caneca-megui.webp"],
    "bolsas-acessorios": ["img/produtos/mochila-megui.webp"],
    "vestuario": ["img/produtos/camiseta-megui.webp"],
    "corporativo": ["img/produtos/kit-corporativo-megui.webp"],
    "grafica": ["img/produtos/wind-banner-megui.webp"],
    "eventos": ["img/inicio/eventos.webp"],
    "destaques": ["img/produtos/caneca-megui.webp", "img/produtos/camiseta-megui.webp"],
}
for category_item in CATEGORIES:
    category_item["images"] = CATEGORY_IMAGES[category_item["slug"]]

TRUSTED_BRANDS = [
    {"name": "Band Minas", "image": "band-minas.png"},
    {"name": "Sesc", "image": "sesc.png"},
    {"name": "Cemig", "image": "cemig.png"},
    {"name": "Balaia", "image": "balaia.png"},
    {"name": "We Basic", "image": "we-basic.png"},
    {"name": "Resultado Final", "image": "resultado-final.png"},
    {"name": "Senac Minas", "image": "senac.svg", "logo_style": "ink"},
    {"name": "Future Pro", "image": "future-pro-v2.png"},
    {"name": "Circuito das Indústrias", "image": "circuito-industrias-v2.png"},
    {"name": "Studio IS Concept", "image": "studio-is-concept-v2.png"},
    {"name": "PrintUp Estamparia", "image": "printup-v2.png"},
    {"name": "Brantchic", "image": "brantchic-v2.png", "logo_style": "paper"},
    {"name": "T-Shirteria Versátil"},
    {"name": "Vörr Brasil", "image": "vorr-oficial.png", "logo_style": "ink"},
    {"name": "Tailor’s Mind", "image": "tailors-mind-oficial.svg", "logo_style": "ink"},
    {"name": "Samba do Maestro", "image": "samba-do-maestro-acervo.png"},
    {"name": "Escola de Cura", "image": "escola-de-cura-acervo.png"},
    {"name": "Minions Run", "image": "minions-run-acervo.png", "logo_style": "ink"},
]

REVIEWS = []

PRODUCTS = [
    {
        "id": 1,
        "slug": "camiseta-premium-algodao",
        "name": "Camiseta Premium 100% Algodão",
        "category": "vestuario",
        "line": "Meg Roupas",
        "sku": "MEG-ROUPAS-001",
        "short": "Malha encorpada, toque macio e personalização sob medida.",
        "description": "Camiseta pensada para uniformes, eventos, marcas e ações corporativas. Opções de personalização por silk, DTF ou bordado conforme o projeto.",
        "tags": ["Algodão", "Uniformes", "Silk / DTF"],
        "visual": "tshirt",
        "image": "img/produtos/camiseta-megui.webp",
        "image_reference": True,
    },
    {
        "id": 2,
        "slug": "squeeze-corporativo",
        "name": "Squeeze Corporativo",
        "category": "brindes",
        "line": "Meg Personalizados",
        "sku": "MEG-BRINDES-001",
        "short": "Brinde versátil para eventos, equipes e campanhas.",
        "description": "Squeeze personalizável com a identidade da sua empresa. Quantidade mínima e técnica de aplicação variam conforme o modelo escolhido.",
        "tags": ["Brindes", "Eventos", "Corporativo"],
        "visual": "bottle",
        "image": "img/produtos/squeeze-megui.webp",
        "image_reference": True,
    },
    {
        "id": 3,
        "slug": "mochila-corporativa",
        "name": "Mochila Corporativa",
        "category": "bolsas-acessorios",
        "line": "Meg Personalizados",
        "sku": "MEG-BOLSAS-001",
        "short": "Mochila para kits, ações internas e presentes corporativos.",
        "description": "Modelos com diferentes materiais, capacidades e formas de personalização. Ideal para onboarding, eventos e campanhas.",
        "tags": ["Mochilas", "Kits", "B2B"],
        "visual": "bag",
        "image": "img/produtos/mochila-megui.webp",
        "image_reference": True,
    },
    {
        "id": 4,
        "slug": "kit-boas-vindas",
        "name": "Kit Boas-vindas",
        "category": "corporativo",
        "line": "Meg Personalizados",
        "sku": "MEG-KIT-001",
        "short": "Monte um kit completo com produtos personalizados.",
        "description": "Combine vestuário, papelaria, copos, garrafas, bolsas e outros itens em uma entrega única e personalizada para sua empresa.",
        "tags": ["Onboarding", "Kits", "Empresas"],
        "visual": "kit",
        "image": "img/produtos/kit-corporativo-megui.webp",
        "image_reference": True,
    },
    {
        "id": 5,
        "slug": "wind-banner",
        "name": "Wind Banner Personalizado",
        "category": "grafica",
        "line": "Meg Gráfica",
        "sku": "MEG-GRAF-001",
        "short": "Comunicação visual de alto impacto para ponto de venda e eventos.",
        "description": "Wind banner personalizado para fachadas, eventos, ativações e pontos comerciais. Produção conforme arte, tamanho e quantidade.",
        "tags": ["Comunicação visual", "Eventos", "PDV"],
        "visual": "banner",
        "image": "img/produtos/wind-banner-megui.webp",
        "image_reference": True,
    },
    {
        "id": 6,
        "slug": "caneca-personalizada",
        "name": "Caneca Personalizada",
        "category": "destaques",
        "line": "Meg Personalizados",
        "sku": "MEG-BRINDES-002",
        "short": "Uma opção clássica para ações promocionais e presentes.",
        "description": "Canecas em diferentes materiais e formatos, personalizadas conforme sua identidade. Consulte disponibilidade e quantidade.",
        "tags": ["Canecas", "Brindes", "Presentes"],
        "visual": "mug",
        "image": "img/produtos/caneca-megui.webp",
        "image_reference": True,
    },
]


def get_product(product_id):
    if hub_catalog.enabled and product_id >= 1_000_000_000:
        return hub_catalog.get(product_id-1_000_000_000)
    return next((p for p in PRODUCTS if p["id"] == product_id), None)


def get_category(slug):
    return next((c for c in CATEGORIES if c["slug"] == slug), None)


def cart():
    return session.setdefault("quote_cart", {})


def cart_count():
    return len(cart())


@app.context_processor
def inject_global():
    quote_cart = cart()
    return {
        "categories": CATEGORIES,
        "cart_count": cart_count(),
        "cart_ids": [int(key) for key in quote_cart.keys()],
        "trusted_brands": TRUSTED_BRANDS,
        "reviews": REVIEWS,
        "whatsapp_configured": bool(WHATSAPP_NUMBER),
        "whatsapp_number": WHATSAPP_NUMBER,
        "admin_phone": ADMIN_PHONE,
        "contact_email": CONTACT_EMAIL,
        "contact_address": CONTACT_ADDRESS,
        "company_cnpj": COMPANY_CNPJ,
        "historical_brands": HISTORICAL_BRANDS,
        "portfolio": PORTFOLIO,
        "recent_works": RECENT_WORKS,
        "design_projects": DESIGN_PROJECTS,
        "production_videos": PRODUCTION_VIDEOS,
        "hub_catalog_enabled": hub_catalog.enabled,
        "search_products": [] if hub_catalog.enabled else [{"name": p["name"], "sku": p["sku"], "category": p["category"], "line": p["line"], "short": p["short"], "stock_priority": stock_priority(p), "url": url_for("product", slug=p["slug"])} for p in PRODUCTS],
    }


def stock_priority(product):
    """Estoque positivo primeiro; saldo desconhecido preservado; zerados no fim."""
    try:
        stock = Decimal(str(product.get("stock")))
        if not stock.is_finite():
            return 1
        return 0 if stock > 0 else 2
    except (InvalidOperation, ValueError, TypeError):
        return 1


def matches_category(product, slug):
    if slug == "eventos":
        return product["category"] in {"vestuario", "brindes", "grafica", "corporativo"}
    return product["category"] == slug


def order_by_stock(products):
    # sorted é estável: mantém a ordem editorial dentro de cada faixa de saldo.
    return sorted(products, key=stock_priority)


@app.get("/")
def home():
    homepage_images = {
        "brindes": "copo-termico", "bolsas-acessorios": "ecobag",
        "vestuario": "moletom", "corporativo": "caderno",
        "grafica": "papelaria", "destaques": "bone", "eventos": "eventos",
    }
    home_categories = [dict(category, images=[f"img/inicio/{homepage_images[category['slug']]}.webp"]) for category in CATEGORIES]
    items = hub_catalog.list(limit=6,vitrine=True)[0] if hub_catalog.enabled else order_by_stock(PRODUCTS)[:6]
    return render_template("index.html", products=items, home_categories=home_categories)


def render_catalog(category_slug=""):
    active_category = get_category(category_slug)
    if category_slug and not active_category:
        abort(404)
    query = request.args.get("q", "").strip()[:160]
    page = max(1, request.args.get("pagina", 1, type=int) or 1)
    if hub_catalog.enabled:
        items, pagination = hub_catalog.list(category_slug, query, page)
    else:
        items = [p for p in PRODUCTS if not category_slug or matches_category(p, category_slug)]
        if query:
            items = [p for p in items if all(t.lower() in (p['name']+' '+p['sku']).lower() for t in query.split())]
        items = order_by_stock(items)
        pagination = {"total": len(items), "pagina": 1, "paginas": 1}
    return render_template("products.html", products=items, active_category=active_category, pagination=pagination, query=query)


@app.get("/produtos")
def products():
    return render_catalog(request.args.get("categoria", ""))


@app.get("/categoria/<slug>")
def category(slug):
    return render_catalog(slug)


@app.get("/api/busca-produtos")
def search_products_api():
    query=request.args.get("q", "").strip()[:160]
    if not query:return jsonify(produtos=[])
    if hub_catalog.enabled:
        items=hub_catalog.list(query=query,limit=8)[0]
    else:
        items=[p for p in order_by_stock(PRODUCTS) if all(t.lower() in (p['name']+' '+p['sku']).lower() for t in query.split())][:8]
    return jsonify(produtos=[{"name":p["name"],"sku":p["sku"],"line":p["line"],"category":p["category"],"url":url_for("product",slug=p["slug"])} for p in items])


@app.errorhandler(CatalogUnavailable)
def catalog_unavailable(error):
    if request.path.startswith('/api/'):
        return jsonify(error="O catálogo está atualizando. Tente novamente em instantes."),503
    return render_template("catalog_unavailable.html"),503


@app.get("/produto/<slug>")
def product(slug):
    if hub_catalog.enabled and re.fullmatch(r"hub-\d+", slug):
        item = hub_catalog.get(int(slug[4:]))
    else:
        item = next((p for p in PRODUCTS if p["slug"] == slug), None)
    if not item:
        abort(404)

    return render_template("product.html", product=item)


@app.post("/orcamento/adicionar/<int:product_id>")
def add_to_quote(product_id):
    product = get_product(product_id)
    if not product:
        abort(404)

    qty_raw = request.form.get("qty", "1")
    try:
        qty = max(1, min(int(qty_raw), 99999))
    except ValueError:
        qty = 1

    notes = request.form.get("notes", "").strip()[:500]
    key = str(product_id)
    quote_cart = cart()

    quote_cart[key] = {
        "product_id": product_id,
        "name": product["name"],
        "sku": product["sku"],
        "qty": qty,
        "notes": notes,
    }

    session["quote_cart"] = quote_cart
    session.modified = True

    if request.accept_mimetypes.best == "application/json":
        return jsonify(count=cart_count(), name=product["name"], quote_url=url_for("quote_view"))

    next_url = request.form.get("next")
    return redirect(next_url or url_for("quote_view"))


@app.get("/orcamento")
def quote_view():
    items = list(cart().values())
    return render_template("quote.html", items=items)


@app.post("/orcamento/atualizar/<int:product_id>")
def update_quote(product_id):
    quote_cart = cart()
    key = str(product_id)

    if key in quote_cart:
        try:
            qty = max(1, min(int(request.form.get("qty", 1)), 99999))
        except ValueError:
            qty = 1

        quote_cart[key]["qty"] = qty
        quote_cart[key]["notes"] = request.form.get("notes", "").strip()[:500]
        session["quote_cart"] = quote_cart
        session.modified = True

    return redirect(url_for("quote_view"))


@app.post("/orcamento/remover/<int:product_id>")
def remove_from_quote(product_id):
    quote_cart = cart()
    quote_cart.pop(str(product_id), None)
    session["quote_cart"] = quote_cart
    session.modified = True
    return redirect(url_for("quote_view"))


@app.post("/orcamento/limpar")
def clear_quote():
    session["quote_cart"] = {}
    session.modified = True
    return redirect(url_for("quote_view"))


@app.post("/orcamento/whatsapp")
def send_whatsapp():
    if not WHATSAPP_NUMBER:
        return render_template(
            "quote.html",
            items=list(cart().values()),
            config_error="Configure a variável WHATSAPP_NUMBER no Render para ativar o envio.",
        )

    name = request.form.get("name", "").strip()
    company = request.form.get("company", "").strip()
    deadline = request.form.get("deadline", "").strip()
    general_notes = request.form.get("general_notes", "").strip()

    lines = ["Olá! Quero solicitar um orçamento na Megui.", ""]

    if name:
        lines.append(f"Nome: {name}")
    if company:
        lines.append(f"Empresa: {company}")
    if deadline:
        lines.append(f"Prazo desejado: {deadline}")
    if name or company or deadline:
        lines.append("")

    lines.append("Itens:")
    for item in cart().values():
        lines.append(f"• {item['qty']}x {item['name']} — SKU {item['sku']}")
        if item.get("notes"):
            lines.append(f"  Observação: {item['notes']}")

    if general_notes:
        lines.extend(["", f"Observações gerais: {general_notes}"])

    lines.extend(["", "Pode me ajudar com valores, personalização e prazo?"])

    message = "\n".join(lines)
    whatsapp_url = f"https://wa.me/{WHATSAPP_NUMBER}?text={quote(message)}"
    return redirect(whatsapp_url)


@app.get("/criar-arte")
def create_art():
    return render_template("mockups.html")


@app.get("/empresas-licitacoes")
def b2b():
    return render_template("b2b.html")


@app.get("/eventos")
def events():
    return render_template("eventos.html")


@app.get("/videos")
def videos():
    return render_template("videos.html")


@app.get("/trabalhos")
def portfolio_view():
    return render_template("portfolio.html")


@app.get("/sobre")
def about():
    return render_template("sobre.html")


@app.get("/contato")
def contact():
    return render_template("contact.html")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=True)


# deploy-sync: versão visual e comercial completa 2026-09-30
