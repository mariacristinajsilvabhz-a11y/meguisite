"""Cliente somente de leitura do catálogo do Hub, com cache e última versão válida."""
import os
import re
import json
import time
import threading
import logging
import unicodedata
from urllib.request import Request, urlopen
from urllib.parse import urlencode, urlparse
from urllib.error import HTTPError

class CatalogUnavailable(Exception):
    pass

class HubCatalog:
    def __init__(self):
        self.base=os.getenv('MEGUI_HUB_URL','').rstrip('/')
        self.token=os.getenv('SITE_CATALOG_TOKEN','')
        self.cache={}
        self.lock=threading.Lock()

    @property
    def enabled(self):
        return bool(self.base and self.token)

    def fetch(self,path,params=None):
        key=path+'?'+urlencode(params or {})
        cached=self.cache.get(key)
        if cached and time.monotonic()-cached[0]<30:return cached[1]
        try:
            with self.lock:
                cached=self.cache.get(key)
                if cached and time.monotonic()-cached[0]<30:return cached[1]
                req=Request(self.base+key,headers={'Authorization':'Bearer '+self.token,'Accept':'application/json'})
                with urlopen(req,timeout=25) as response:
                    data=json.loads(response.read(4_000_000))
                if not isinstance(data,dict) or not any(k in data for k in ('produtos','produto')):
                    raise ValueError('Resposta inválida do catálogo')
                # Não descarta a última resposta válida ao receber uma falha.
                if len(self.cache)>256:
                    oldest=min(self.cache,key=lambda k:self.cache[k][0]);self.cache.pop(oldest,None)
                self.cache[key]=(time.monotonic(),data)
                return data
        except HTTPError as error:
            logging.warning("Hub catalog HTTP status=%s", error.code)
            if error.code==404:return None
            if cached and time.monotonic()-cached[0]<86400:return cached[1]
            raise CatalogUnavailable() from error
        except Exception as error:
            logging.warning("Hub catalog unavailable: %s", type(error).__name__)
            if cached and time.monotonic()-cached[0]<86400:return cached[1]
            raise CatalogUnavailable() from error

    def list(self,category='',query='',page=1,limit=48,vitrine=False):
        data=self.fetch('/api/site/catalogo',{'categoria':category,'q':query,'pagina':page,'limite':limit,'vitrine':int(vitrine)})
        return [adapt(p) for p in data['produtos'] if int(p.get('estoque') or 0)>0],data['paginacao']

    def get(self,hub_id):
        data=self.fetch('/api/site/catalogo/'+str(hub_id))
        return adapt(data['produto']) if data and int(data['produto'].get('estoque') or 0)>0 else None


# Values are a fixed palette; supplier text is never interpolated into CSS.
COLOR_SWATCHES = {
    'preto':'#252326','branco':'#fffefa','azul':'#3c68ae','azul claro':'#91c3e0',
    'azul escuro':'#263f6c','verde':'#548165','verde claro':'#a8c78c','verde escuro':'#2f5847',
    'vermelho':'#b63e43','cinza':'#9b9a9c','prata':'linear-gradient(125deg,#a7aaae,#eeeeef,#94999f)',
    'inox':'linear-gradient(125deg,#a7aaae,#eeeeef,#94999f)',
    'rosa':'#d993b4','roxo':'#84578f','lilas':'#b49ac5','lavanda':'#b49ac5',
    'laranja':'#df8b44','amarelo':'#e7cd61','dourado':'#c3a25a','marrom':'#8a6350',
    'bege':'#cfbea0','off white':'#eee9dc','off-white':'#eee9dc','cru':'#ded3bb',
    'vinho':'#773d50','pessego':'#e4ad8c','cobre':'#b98261','bronze':'#a3835c',
    'chumbo':'#5b5c60','kraft':'#b49570','madeira':'#c8a47b',
    'transparente':'repeating-linear-gradient(45deg,#fff 0 4px,#dedce0 4px 5px)',
    'colorido':'conic-gradient(#b45362,#e6c16e,#6f9b77,#7299c8,#b45362)',
}

def color_swatch(value):
    key=''.join(c for c in unicodedata.normalize('NFKD',str(value or '')) if not unicodedata.combining(c)).lower().strip()
    return COLOR_SWATCHES.get(key,'')


def safe_image(value):
    value=str(value or '')
    parsed=urlparse(value)
    return value if parsed.scheme in {'http','https'} and parsed.netloc else ''


def adapt(p):
    image=p.get('imagem') or ''
    parsed=urlparse(image)
    if parsed.scheme not in {'http','https'} or not parsed.netloc:image=''
    description=re.sub('<[^>]*>',' ',p.get('descricao') or '')
    description=re.sub(r'\s+',' ',description).strip()
    variants=[]
    for variant in p.get('variacoes') or []:
        variants.append({'id':str(variant['id']),'sku':str(variant.get('sku') or ''),
                         'color':str(variant.get('cor') or ''),'swatch':color_swatch(variant.get('cor')),'stock':max(0,int(variant.get('estoque') or 0)),
                         'image':safe_image(variant.get('imagem'))})
    gallery=list(dict.fromkeys(url for url in [image]+[safe_image(v) for v in p.get('imagens',[])] if url))
    return {'variants':variants,'gallery':gallery,'id':1_000_000_000+int(p['id']),'hub_id':int(p['id']),
            'slug':'hub-'+str(p['id']),'name':p['nome'].removesuffix(' — '+str(p.get('sku_mestre') or '')),'sku':p.get('sku_mestre') or str(p['id']),
            'category':p.get('categoria') or 'brindes','line':p.get('linha_negocio') or 'Megui Personalizados',
            'short':description[:160] or 'Personalização para sua marca. Consulte acabamentos e disponibilidade.',
            'description':description or 'Consulte nossa equipe para definir a quantidade, a personalização e o prazo deste produto.',
            'tags':[p.get('categoria_original') or 'Personalizável'],
            'visual':'hub','image_url':image,'image':'','image_reference':False,
            'stock':max(0,int(p.get('estoque') or 0))}
