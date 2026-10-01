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
                self.assertNotIn(b'3.14',response.data)
            response=client.post('/orcamento/adicionar/1000000042',data={'qty':30},headers={'Accept':'application/json'})
            self.assertEqual(response.status_code,200)
            quote=client.get('/orcamento');self.assertIn(b'XBZ-42',quote.data)
            self.assertIn(b'value="30"',quote.data)

if __name__=='__main__':unittest.main()
