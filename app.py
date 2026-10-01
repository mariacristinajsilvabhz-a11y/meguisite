import os
import re
from decimal import Decimal, InvalidOperation
from urllib.parse import quote
from flask import Flask, render_template, request, redirect, url_for, session, abort, jsonify
from content_data import HISTORICAL_BRANDS, PORTFOLIO, PRODUCTION_VIDEOS

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "troque-esta-chave-no-render")

PRIMARY_WHATSAPP = "5531994888250"
ADMIN_PHONE = "5531993181939"
CONTACT_EMAIL = "contatomegui@gmail.com"
CONTACT_ADDRESS = "Rua Seis, nº 31 — Água Branca, Contagem - MG"
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
    {"slug": "destaques", "name": "Destaques", "description": "Produtos com alta procura e ótimo potencial de marca.", "icon": "★"},
]

CATEGORY_IMAGES = {
    "brindes": ["img/produtos/squeeze-megui.webp", "img/produtos/caneca-megui.webp"],
    "bolsas-acessorios": ["img/produtos/mochila-megui.webp"],
    "vestuario": ["img/produtos/camiseta-megui.webp"],
    "corporativo": ["img/produtos/kit-corporativo-megui.webp"],
    "grafica": ["img/produtos/wind-banner-megui.webp"],
    "destaques": ["img/produtos/caneca-megui.webp", "img/produtos/camiseta-megui.webp"],
}
for category_item in CATEGORIES:
    category_item["images"] = CATEGORY_IMAGES[category_item["slug"]]

TRUSTED_BRANDS = ["Band Minas", "Sesc", "Cemig", "Resultado Final"]

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
        "image": "img/produtos/mochila-megui.webp",
        "images": ["img/produtos/mochila-megui.webp", "img/produtos/squeeze-megui.webp", "img/produtos/caneca-megui.webp"],
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
        "production_videos": PRODUCTION_VIDEOS,
        "search_products": [{"name": p["name"], "sku": p["sku"], "category": p["category"], "line": p["line"], "short": p["short"], "stock_priority": stock_priority(p), "url": url_for("product", slug=p["slug"])} for p in PRODUCTS],
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


def order_by_stock(products):
    # sorted é estável: mantém a ordem editorial dentro de cada faixa de saldo.
    return sorted(products, key=stock_priority)


@app.get("/")
def home():
    return render_template("index.html", products=order_by_stock(PRODUCTS)[:6])


@app.get("/produtos")
def products():
    category_slug = request.args.get("categoria")
    items = PRODUCTS
    active_category = None

    if category_slug:
        active_category = get_category(category_slug)
        if active_category:
            items = [p for p in PRODUCTS if p["category"] == category_slug]

    return render_template("products.html", products=order_by_stock(items), active_category=active_category)


@app.get("/categoria/<slug>")
def category(slug):
    category_obj = get_category(slug)
    if not category_obj:
        abort(404)

    items = [p for p in PRODUCTS if p["category"] == slug]
    return render_template("products.html", products=order_by_stock(items), active_category=category_obj)


@app.get("/produto/<slug>")
def product(slug):
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


@app.get("/empresas-licitacoes")
def b2b():
    return render_template("b2b.html")


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
