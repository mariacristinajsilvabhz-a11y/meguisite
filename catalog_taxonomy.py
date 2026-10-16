"""Famílias de produto da Megui. Ocasiões são coleções, não categorias.
A mesma versão é usada na projeção do Hub e na navegação do site.
"""
import re
import unicodedata

VERSION = '20261016-familias-v1'

def normalize(value):
    return re.sub(r'\s+', ' ', ''.join(c for c in unicodedata.normalize('NFKD', str(value or '')) if not unicodedata.combining(c)).lower()).strip()

# slug, título, ícone existente, imagem da navegação, descrição, subcategorias
_DEFINITIONS = [
 ('vestuario','Roupas & uniformes','tshirt','moletom','Camisetas, polos, uniformes, moletons e bonés.', [('camisetas','Camisetas'),('camisas-polos','Camisas & polos'),('moletons-jaquetas','Moletons & jaquetas'),('uniformes','Uniformes & aventais'),('bones-chapeus','Bonés, chapéus & viseiras'),('outros-vestuario','Outras peças')]),
 ('bolsas-acessorios','Bolsas, mochilas & nécessaires','bag','ecobag','Mochilas, bolsas, sacolas, nécessaires e malas.', [('mochilas','Mochilas'),('bolsas-termicas','Bolsas térmicas'),('sacolas-sacochilas','Sacolas & sacochilas'),('necessaires','Nécessaires'),('malas','Malas & bolsas de viagem'),('pastas-notebook','Pastas para notebook'),('carteiras-documentos','Carteiras & porta-documentos'),('bolsas','Bolsas & pochetes')]),
 ('copos-garrafas','Copos, canecas & garrafas','bottle','copo-termico','Garrafas, squeezes, canecas, copos e acessórios para bebidas.', [('garrafas-squeezes','Garrafas & squeezes'),('canecas-xicaras','Canecas & xícaras'),('copos-tacas','Copos & taças'),('acessorios-bebidas','Acessórios para bebidas')]),
 ('papelaria','Papelaria & escritório','create-art','caderno','Canetas, cadernos, agendas, blocos e organização de escritório.', [('canetas-lapis','Canetas, lápis & lapiseiras'),('cadernos-agendas','Cadernos & agendas'),('blocos-anotacoes','Blocos & anotações'),('pastas-estojos','Pastas & estojos'),('acessorios-escritorio','Acessórios de escritório')]),
 ('tecnologia','Tecnologia & eletrônicos','create-art','caderno','Carregadores, áudio, informática e acessórios eletrônicos.', [('carregadores','Carregadores & power banks'),('audio','Fones & caixas de som'),('informatica','Informática & armazenamento'),('acessorios-celular','Acessórios para celular'),('eletronicos','Outros eletrônicos')]),
 ('casa-cozinha','Casa, cozinha & churrasco','mug','copo-termico','Utensílios, marmitas, kits de churrasco, vinho e utilidades domésticas.', [('churrasco','Churrasco'),('vinho-bar','Vinho & bar'),('queijos-petiscos','Queijos & petiscos'),('marmitas','Marmitas & recipientes'),('cozinha','Utensílios de cozinha'),('casa','Casa & decoração')]),
 ('cuidados-pessoais','Cuidados pessoais','destaques','ecobag','Beleza, higiene, saúde e cuidados do dia a dia.', [('beleza','Beleza & manicure'),('higiene','Higiene & proteção'),('saude','Saúde & bem-estar'),('costura','Kits de costura')]),
 ('lazer-esportes','Esporte, lazer & viagem','eventos','bone','Artigos esportivos, jogos, guarda-chuvas e acessórios de viagem.', [('esporte','Artigos esportivos'),('jogos-brinquedos','Jogos & brinquedos'),('guarda-chuvas','Guarda-chuvas & sombrinhas'),('viagem','Acessórios de viagem')]),
 ('acessorios-utilidades','Chaveiros & utilidades','kit','bone','Chaveiros, ferramentas, lanternas e acessórios automotivos.', [('chaveiros','Chaveiros'),('ferramentas','Ferramentas'),('lanternas','Lanternas & iluminação'),('automotivos','Acessórios automotivos'),('acessorios','Outras utilidades')]),
 ('grafica','Impressos & comunicação visual','banner','papelaria','Cartões, adesivos, impressos, banners, embalagens e sinalização.', [('cartoes-impressos','Cartões & impressos'),('adesivos','Adesivos & etiquetas'),('banners-placas','Banners, placas & sinalização'),('embalagens','Embalagens personalizadas'),('credenciais','Credenciais, cordões & pulseiras')]),
 ('kits-presentes','Kits & presentes','kit','caderno','Kits executivos e conjuntos de produtos para presentear.', [('kits-executivos','Kits executivos & escritório'),('kits-presente','Kits de presente')]),
 ('pets','Linha pet','destaques','ecobag','Acessórios e cuidados para animais de estimação.', [('acessorios-pet','Acessórios para pets')]),
 ('outros','Outros personalizados','kit','bone','Outros itens do catálogo que não pertencem às famílias acima.', [('outros-itens','Outros itens')]),
]
CATEGORIES = [dict(slug=s,name=n,icon=i,homepage_image='img/inicio/'+im+'.webp',images=['img/inicio/'+im+'.webp'],description=d,subcategories=[dict(slug=k,name=v) for k,v in subs]) for s,n,i,im,d,subs in _DEFINITIONS]
CATEGORY_MAP = {c['slug']:c for c in CATEGORIES}
SUBCATEGORY_MAP = {s['slug']:(c['slug'],s['name']) for c in CATEGORIES for s in c['subcategories']}
COLLECTIONS = [dict(slug='brindes',name='Todos os brindes',description='Produtos para personalizar e presentear.'),dict(slug='corporativo',name='Para empresas',description='Kits, papelaria, bolsas, tecnologia e itens para equipes.'),dict(slug='eventos',name='Para eventos',description='Roupas, kits, copos e materiais para encontros.'),dict(slug='destaques',name='Seleção Megui',description='Uma seleção de modelos disponíveis para personalizar.')]

# Regras por nome têm precedência sobre uma categoria de fornecedor genérica ou herdada.
_RULES = [
 ('pets','acessorios-pet',r'\b(?:pet|pets|cachorro|cachorros|gato|gatos|coleira|comedouro|bebedouro|guia retratil)\b'),
 ('acessorios-utilidades','chaveiros',r'\bchaveiros?\b'),
 ('bolsas-acessorios','pastas-notebook',r'\b(?:pasta|case|capa|maleta)\b.*\b(?:notebook|laptop|tablet)\b'),
 ('bolsas-acessorios','bolsas-termicas',r'\b(?:bolsa|mochila|sacola|lancheira)\b.*\btermic[ao]\b|\bcooler\b'),
 ('bolsas-acessorios','necessaires',r'\bnecessaires?\b'),
 ('bolsas-acessorios','mochilas',r'\bmochilas?\b'),
 ('bolsas-acessorios','sacolas-sacochilas',r'\b(?:ecobags?|sacolas?|sacochilas?|sacochiletes?)\b'),
 ('bolsas-acessorios','malas',r'\b(?:malas?|maletas?|bolsa de viagem|bolsa viagem)\b'),
 ('bolsas-acessorios','carteiras-documentos',r'\b(?:carteiras?|porta[ -]documentos?|porta[ -]passaportes?)\b'),
 ('bolsas-acessorios','bolsas',r'\b(?:bolsas?|pochetes?|sacos? de malha|saquinhos? de malha)\b'),
 ('vestuario','camisetas',r'\b(?:camisetas?|baby[ -]?looks?|regatas?)\b'),
 ('vestuario','camisas-polos',r'\b(?:camisas?|polos?)\b'),
 ('vestuario','moletons-jaquetas',r'\b(?:moletom|moletons|jaquetas?|blusoes|blusao|corta[ -]vento)\b'),
 ('vestuario','uniformes',r'\b(?:uniformes?|jalecos?|aventais|avental|macacao|calcas?|scrubs?)\b'),
 ('vestuario','bones-chapeus',r'\b(?:bone|bones|chapeu|chapeus|viseiras?|gorros?|toucas?)\b'),
 ('copos-garrafas','acessorios-bebidas',r'^(?:kit |conjunto (?:de )?)?(?:canudos?|tampas?|tirantes? (?:para |p/ ?)?copos?|porta[ -]copos?)\b'),
 ('copos-garrafas','garrafas-squeezes',r'\b(?:garrafas?|squeezes?|squezzes?|squezze|cantis|cantil|bules?)\b'),
 ('copos-garrafas','canecas-xicaras',r'\b(?:canecas?|xicaras?)\b'),
 ('copos-garrafas','copos-tacas',r'\b(?:copos?|tacas?|tumblers?|copoes)\b'),
 ('cuidados-pessoais','costura',r'\b(?:costura|agulhas?)\b'),
 ('cuidados-pessoais','beleza',r'\b(?:manicure|maquiagem|pinceis|pincel|espelhos?|escova de cabelo|pentes?|lixas?|alicates? de unha|cortador de unha|batom|massageador facial)\b'),
 ('cuidados-pessoais','higiene',r'\b(?:higiene|alcool|antisseptic|escova dental|fio dental|sabonete|saboneteira|mascara|protetor labial|protetor solar|escova de dente|porta[ -]escova)\b'),
 ('cuidados-pessoais','saude',r'\b(?:termometros?|comprimidos?|remedios?|medicamentos?|porta[ -]pilulas?|massageador|primeiros socorros|bolsa de gel|bolsa gel)\b'),
 ('casa-cozinha','churrasco',r'\b(?:churrasco|churrasqueira|churrasqueiro|espetos?|grelhas?)\b'),
 ('casa-cozinha','vinho-bar',r'\b(?:vinho|vinhos|saca[ -]rolhas?|abridor(?:es)?|abridor|coqueteleiras?|dosadores?|drinks?|whisky|cerveja|cervejeir[ao])\b'),
 ('casa-cozinha','queijos-petiscos',r'\b(?:queijos?|petiscos?|petisqueiras?|tabuas?)\b'),
 ('casa-cozinha','marmitas',r'\b(?:marmitas?|potes?|recipientes?|porta[ -]alimentos?|lancheiras?)\b'),
 ('casa-cozinha','cozinha',r'\b(?:cozinha|talher(?:es)?|facas?|garfos?|colher(?:es)?|espátulas?|espatulas?|descascador|ralador|saladeira|saladas?|pegador|tigelas?|bowl|saleiro|temperos?|misturador|coador(?:es)?|prensa francesa|cafeteira|moedor)\b'),
 ('papelaria','canetas-lapis',r'\b(?:canetas?|lapis|lapiseiras?|marca[ -]textos?|borrachas?|apontador(?:es)?)\b'),
 ('papelaria','cadernos-agendas',r'\b(?:cadernos?|cadernetas?|agendas?|planners?|diarios?)\b'),
 ('papelaria','blocos-anotacoes',r'\b(?:blocos?|anotacoes|notas adesivas|post[ -]?it|ficharios?)\b'),
 ('papelaria','pastas-estojos',r'\b(?:pastas?|estojos?)\b'),
 ('kits-presentes','kits-executivos',r'\b(?:kits?|conjuntos?)\b.*\b(?:executivo|executivos|escritorio|corporativo|onboarding|boas[ -]vindas)\b'),
 ('tecnologia','carregadores',r'\b(?:carregador(?:es)?|power[ -]?banks?|baterias?|pilhas?|cabo|cabos|adaptador|adaptadores)\b'),
 ('tecnologia','audio',r'\b(?:fones?|headphones?|headsets?|caixas? de som|caixa som|alto[ -]falante|microfones?)\b'),
 ('tecnologia','informatica',r'\b(?:pen[ -]?drives?|pendrives?|mouse|mouses|mouse[ -]?pads?|teclados?|hub usb|memoria|webcams?)\b'),
 ('tecnologia','acessorios-celular',r'\b(?:celular(?:es)?|smartphones?|pop[ -]?sockets?|suporte.*(?:tablet|telefone)|porta[ -]celular|lente|tripé|tripe|bastao selfie)\b'),
 ('tecnologia','eletronicos',r'\b(?:alexa|echo|smartwatch|relogios?|relogio|umidificador(?:es)?|calculadoras?|rastreador|projetor|impressora|eletronico|eletronicos|ventilador)\b'),
 ('lazer-esportes','guarda-chuvas',r'\b(?:guarda[ -]?chuvas?|sombrinhas?|ombrelones?)\b'),
 ('lazer-esportes','jogos-brinquedos',r'\b(?:jogos?|brinquedos?|bonecas?|bonecos?|pelucias?|quebra[ -]cabeca|domino|baralhos?|xadrez|dama|colorir|frisbee|ioio|yo[ -]?yo|bolhas de sabao)\b'),
 ('lazer-esportes','esporte',r'\b(?:esporte|esportiv[oa]|fitness|yoga|bolas?|corda de pular|extensor|pedometro|apitos?|medalhas?|trofeus?|toalhas?|squeeze holder|munhequeira|faixa elastica|colchonete)\b'),
 ('lazer-esportes','viagem',r'\b(?:viagem|viagens|travesseiros?|almofadas?|identificador de bagagem|etiqueta de bagagem|tag de bagagem|tapa[ -]olhos|porta[ -]mala)\b'),
 ('acessorios-utilidades','automotivos',r'\b(?:carros?|automotivos?|veicular|veiculos?|para[ -]sol)\b'),
 ('acessorios-utilidades','lanternas',r'\b(?:lanternas?|luminarias?|luminaria|luzes?|lampadas?|lampiao|abajur)\b'),
 ('acessorios-utilidades','ferramentas',r'\b(?:ferramentas?|trenas?|canivetes?|martelos?|chaves?|chave de|multifuncional|nivel|alicates?|chave de fenda)\b'),
 ('grafica','credenciais',r'\b(?:credenciais|credencial|crachas?|cordoes?|cordao|lanyard|pulseiras?)\b'),
 ('grafica','adesivos',r'\b(?:adesivos?|etiquetas?|rotulos?|stickers?|imãs?|imas|imã|ima)\b'),
 ('grafica','banners-placas',r'\b(?:banners?|wind[ -]?flags?|bandeiras?|faixas?|lonas?|placas?|totens?|totem|sinalizacao|displays?|backdrops?|roll[ -]?ups?)\b'),
 ('grafica','embalagens',r'\b(?:embalagens?|caixas?|sacolas? de papel|envelopes?|sacos? de papel)\b'),
 ('grafica','cartoes-impressos',r'\b(?:cartoes?|cartao|panfletos?|flyers?|folders?|calendarios?|catalogos?|convites?|certificados?|tal(?:ao|oes)|receituarios?|timbrad[oa]|impresso|impressos|postais|revistas?|livros?|apostilas?|cardapios?|menus?|pastas? com bolsa)\b'),
 ('papelaria','acessorios-escritorio',r'\b(?:escritorio|organizador(?:es)?|porta[ -]canetas?|reguas?|pranchetas?|grampeadores?|clips?|clipes?|porta[ -]cartoes?|porta[ -]cartao)\b'),
 ('casa-cozinha','casa',r'\b(?:casa|decoracao|porta[ -]retratos?|vasos?|velas?|aromatizadores?|difusor(?:es)?|porta[ -]joias|cofres?|lixeiras?|tapetes?|jardim|plantas?|porta[ -]chaves?|porta[ -]chave)\b'),
 ('kits-presentes','kits-presente',r'\b(?:kits?|conjuntos?|presentes?)\b'),
 ('acessorios-utilidades','acessorios',r'\b(?:mosquetoes|mosquetao|porta[ -]bolsa|prendedor(?:es)?|pins?|bottons?|botton|botoes|suporte|trava|lupas?)\b'),
]
_RULES += [
 ('tecnologia','carregadores',r'\b(?:dock station|desk pad carregador)\b'),
 ('tecnologia','audio',r'\bcaixinha de som\b'),
 ('tecnologia','informatica',r'\b(?:desk[ -]pad|pen card|camera|cam cover)\b'),
 ('tecnologia','eletronicos',r'\b(?:climatizador|climatizadores|aspirador)\b'),
 ('bolsas-acessorios','necessaires',r'\bfrasqueiras?\b'),
 ('bolsas-acessorios','pastas-notebook',r'\bporta[ -]notebook\b'),
 ('bolsas-acessorios','bolsas',r'\b(?:porta[ -]tenis|porta[ -]oculos|saquinho|saco de veludo|porta[ -]pratos)\b'),
 ('lazer-esportes','esporte',r'\b(?:antistress|antiestresse|munhequeiras?|esportivas?|esteiras?)\b'),
 ('lazer-esportes','jogos-brinquedos',r'\b(?:miniaturas?|squishy|skate|espada|carrinho|caminhao|guindaste|gorila|fusca|fruta de vinil|drone jato|celular infantil|mini mesa de basquete)\b'),
 ('lazer-esportes','viagem',r'\b(?:oculos|leques?|capa de chuva)\b'),
 ('acessorios-utilidades','automotivos',r'\b(?:lixeirinha automotiva|lixocar)\b'),
 ('acessorios-utilidades','ferramentas',r'\bfita metrica\b'),
 ('acessorios-utilidades','lanternas',r'\b(?:LED|pisca[ -]pisca|fio de fada|iluminador)\b'),
 ('casa-cozinha','vinho-bar',r'\bbalde de gelo\b'),
 ('casa-cozinha','marmitas',r'\b(?:bandejas?|baldes?|galao|jarras?|chaleiras?)\b'),
 ('casa-cozinha','cozinha',r'\b(?:descanso de panela|processador de alimentos|spray culinario|porta[ -]latas)\b'),
 ('casa-cozinha','casa',r'\b(?:home spray|enfeites?|dispenser|globo de neve|porta[ -]objetos|organizador plastico)\b'),
 ('cuidados-pessoais','beleza',r'\b(?:escova magica|escova raquete|cortar cabelo|aparador de barba|organizador de cosmeticos)\b'),
 ('cuidados-pessoais','higiene',r'\bhigienizador\b'),
 ('papelaria','canetas-lapis',r'\bcanetinhas?\b'),
 ('papelaria','acessorios-escritorio',r'\b(?:marca[ -]paginas?|risque[ -]rabisque)\b'),
 ('tecnologia','acessorios-celular',r'\bcapa a prova d.?agua\b'),
 ('grafica','banners-placas',r'\bplaquinhas?\b'),
 ('grafica','embalagens',r'\b(?:frascos?|tubo de acrilico)\b'),
 ('grafica','adesivos',r'\bpapel de parede\b'),
 ('bolsas-acessorios','bolsas',r'^veludo costurado\b'),
 ('casa-cozinha','casa',r'\b(?:ampulheta|painel de tv)\b'),
 ('papelaria','canetas-lapis',r'^carga park\b'),
 ('papelaria','acessorios-escritorio',r'\bpapel termico\b'),
 ('tecnologia','eletronicos',r'^(?:cond|evap) hw\b'),
 ('lazer-esportes','jogos-brinquedos',r'\b(?:lousa|quishy)\b'),
]
RULES = [(c,s,re.compile(p,re.I)) for c,s,p in _RULES]

def classify(product):
    name = re.sub(r'\s+—\s+.*$', '', normalize(product.get('nome') or product.get('name')))
    source = normalize(product.get('categoria_original') or product.get('category'))
    candidates = [(m.start(),i,c,sub) for i,(c,sub,pattern) in enumerate(RULES) if sub!='kits-presente' and (m:=pattern.search(name))]
    result = None
    if re.match(r'^(?:kit|conjunto)\b',name):
        purpose = re.match(r'^(?:kit|conjunto)(?: de)? (churrasco|vinho|queijo|ferramentas|costura|manicure|executivo|escritorio|corporativo|onboarding)\b',name)
        if purpose:
            expected = {'churrasco':('casa-cozinha','churrasco'),'vinho':('casa-cozinha','vinho-bar'),'queijo':('casa-cozinha','queijos-petiscos'),'ferramentas':('acessorios-utilidades','ferramentas'),'costura':('cuidados-pessoais','costura'),'manicure':('cuidados-pessoais','beleza')}
            result = expected.get(purpose[1],('kits-presentes','kits-executivos'))
        elif len({c for _,_,c,sub in candidates})>1 and re.search(r'\b(?:com|e)\b',name):
            result = ('kits-presentes','kits-presente')
    if result is None and candidates:
        _,_,category,subtype = min(candidates)
        result = (category,subtype)
    if result is None and re.search(r'\b(?:kit|conjunto|presente)\b',name):result=('kits-presentes','kits-presente')
    if result is None:
        # Fornecedor é evidência auxiliar; linha de negócio nunca determina tipo de produto.
        result = next(((c,s) for c,s,p in RULES if p.search(source)), ('outros','outros-itens'))
    category, subtype = result
    product.update(categoria=category,subcategoria=subtype,categoria_nome=CATEGORY_MAP[category]['name'],subcategoria_nome=SUBCATEGORY_MAP[subtype][1])
    return product

def matches(product, slug):
    category = product.get('categoria') or product.get('category')
    if slug in ('', 'destaques'):return True
    if slug == 'brindes':return category not in {'vestuario','grafica'}
    if slug == 'corporativo':return category in {'vestuario','bolsas-acessorios','copos-garrafas','papelaria','tecnologia','kits-presentes','grafica'}
    if slug == 'eventos':return category in {'vestuario','bolsas-acessorios','copos-garrafas','papelaria','kits-presentes','grafica'}
    return category == slug


def is_public_product(product):
    """Cadastros explicitamente chamados de teste não são itens de vitrine."""
    return not re.match(r'^produto(?: (?:de|para))? teste\b',normalize(product.get('nome') or product.get('name')))
