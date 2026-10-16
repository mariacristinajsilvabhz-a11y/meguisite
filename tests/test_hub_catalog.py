import unittest
import time
from unittest.mock import patch
from urllib.error import URLError
from hub_catalog import HubCatalog, CatalogUnavailable, adapt
from app import app, hub_catalog

PRODUCT={'id':42,'nome':'Caneca personalizada','sku_mestre':'XBZ-42','categoria':'brindes',
         'estoque':21,'imagem':'https://example.com/caneca.jpg','descricao':'<b>Caneca</b>',
         'preco':3.14,'custo':2.50}

class CatalogTests(unittest.TestCase):
    def test_outage_uses_previous_snapshot_but_not_after_one_day(self):
        catalog=HubCatalog();catalog.base='https://hub.test';catalog.token='test'
        payload={'produtos':[PRODUCT],'paginacao':{'total':1}}
        catalog.cache['/api/site/catalogo?']=(time.monotonic()-120,payload)
        with patch('hub_catalog.urlopen',side_effect=URLError('offline')):
            self.assertEqual(catalog.fetch('/api/site/catalogo'),payload)
            catalog.cache['/api/site/catalogo?']=(time.monotonic()-90000,payload)
            with self.assertRaises(CatalogUnavailable):catalog.fetch('/api/site/catalogo')

    def test_costs_are_not_exposed_and_ids_survive_product_renames(self):
        first=adapt(PRODUCT);second=adapt(dict(PRODUCT,nome='Nome atualizado'))
        self.assertEqual(first['id'],second['id']);self.assertEqual(first['slug'],second['slug'])
        self.assertNotIn('preco',first);self.assertNotIn('custo',first)
        self.assertEqual(first['description'],'Caneca')
        self.assertEqual(adapt(dict(PRODUCT,imagem='javascript:alert(1)'))['image_url'],'')

    def test_catalog_detail_search_and_quote_use_hub_sku(self):
        data={'produtos':[PRODUCT],'produto':PRODUCT,'paginacao':{'total':12000,'pagina':1,'paginas':250}}
        with patch.object(hub_catalog,'base','https://hub.test'),patch.object(hub_catalog,'token','test'),patch.object(hub_catalog,'fetch',return_value=data):
            client=app.test_client()
            for route in ['/produtos','/produto/hub-42','/api/busca-produtos?q=caneca']:
                response=client.get(route);self.assertEqual(response.status_code,200)
                self.assertIn(b'Caneca personalizada',response.data)
                self.assertNotIn(b'\"preco\"',response.data)
                self.assertNotIn(b'R$ 3,14',response.data)
            response=client.post('/orcamento/adicionar/1000000042',data={'qty':30},headers={'Accept':'application/json'})
            self.assertEqual(response.status_code,200)
            quote=client.get('/orcamento');self.assertIn(b'XBZ-42',quote.data)
            self.assertIn(b'value="30"',quote.data)

class VariantTests(unittest.TestCase):
    def test_colors_keep_separate_quote_items_and_validate_offer(self):
        product=dict(PRODUCT,variacoes=[
            {'id':7,'sku':'6520-AZU','cor':'Azul','estoque':20,'imagem':'https://example.com/blue.jpg'},
            {'id':8,'sku':'6520-VD','cor':'Verde','estoque':10,'imagem':'https://example.com/green.jpg'},
            {'id':9,'sku':'6520-PT','cor':'Preto','estoque':0,'imagem':'javascript:alert(1)'}],
            imagens=['https://example.com/blue.jpg','https://example.com/green.jpg','javascript:alert(1)'])
        with patch.object(hub_catalog,'base','https://hub.test'),patch.object(hub_catalog,'token','test'),patch.object(hub_catalog,'fetch',return_value={'produto':product}):
            client=app.test_client()
            detail=client.get('/produto/hub-42')
            self.assertEqual(detail.status_code,200)
            self.assertIn(b'data-catalog-photo',detail.data)
            for variant in ('7','8'):
                self.assertEqual(client.post('/orcamento/adicionar/1000000042',data={'qty':50,'variant_id':variant}).status_code,302)
            for invalid in ('9','999'):
                self.assertEqual(client.post('/orcamento/adicionar/1000000042',data={'variant_id':invalid}).status_code,400)
            quote=client.get('/orcamento')
            self.assertIn(b'6520-AZU',quote.data);self.assertIn(b'6520-VD',quote.data)
            client.post('/orcamento/atualizar/1000000042:7',data={'qty':80})
            with client.session_transaction() as session:
                self.assertEqual(session['quote_cart']['1000000042:7']['qty'],80)
                self.assertEqual(session['quote_cart']['1000000042:8']['qty'],50)
            client.post('/orcamento/remover/1000000042:7')
            self.assertNotIn(b'6520-AZU',client.get('/orcamento').data)
        adapted=adapt(product)
        self.assertEqual(len(adapted['gallery']),3)
        self.assertEqual(adapted['variants'][2]['image'],'')

if __name__=='__main__':unittest.main()
