import unittest
from catalog_taxonomy import classify, matches, is_public_product

class ProductTaxonomyTests(unittest.TestCase):
    def test_real_product_names_and_misleading_words(self):
        cases = [
            ('Boné poliéster aba curva','vestuario','bones-chapeus'),
            ('Boneca infantil','brindes','jogos-brinquedos'),
            ('Mochila de nylon USB 20 L','bolsas-acessorios','mochilas'),
            ('Bolsa térmica 10 L','bolsas-acessorios','bolsas-termicas'),
            ('Caneca térmica com abridor','copos-garrafas','canecas-xicaras'),
            ('Porta copos de bambu','copos-garrafas','acessorios-bebidas'),
            ('Kit churrasco com avental','brindes','churrasco'),
            ('Kit ferramentas 20 peças','brindes','ferramentas'),
            ('Kit manicure','brindes','beleza'),
            ('Kit costura 27 peças','brindes','costura'),
            ('Kit escritório caderno, caneca e caneta','kits-presentes','kits-executivos'),
            ('Conjunto caneta e chaveiro','kits-presentes','kits-presente'),
            ('Caderno ecológico com caneta','grafica','cadernos-agendas'),
            ('Caneta com suporte para celular','grafica','canetas-lapis'),
            ('Porta canetas de metal','grafica','acessorios-escritorio'),
            ('Carregador via indução - bambu','brindes','carregadores'),
            ('Caixinha de som bambu','brindes','audio'),
            ('Chaveiro trena emborrachada','chaveiros','chaveiros'),
            ('Porta notebook','bolsas-acessorios','pastas-notebook'),
            ('Bebedouro pet','brindes','acessorios-pet'),
            ('Papel de parede','grafica','adesivos'),
            ('Credencial personalizada','grafica','credenciais'),
        ]
        for name,category,subtype in cases:
            with self.subTest(name=name):
                p=classify({'nome':name,'categoria_original':'Corporativo Kit Gráfica','linha_negocio':'Meg Gráfica'})
                self.assertEqual((p['categoria'],p['subcategoria']),(category,subtype))

    def test_source_is_only_fallback_and_unknown_is_explicit(self):
        self.assertEqual(classify({'nome':'Modelo X','categoria_original':'Canecas'})['categoria'],'copos-garrafas')
        self.assertEqual(classify({'nome':'Modelo X','linha_negocio':'Meg Roupas'})['familia'],'outros')

    def test_test_records_and_event_collection(self):
        for name in ['Produto de teste','Produto para teste de variacao 02','Produto teste ****@']:
            self.assertFalse(is_public_product({'nome':name}))
        self.assertTrue(is_public_product({'nome':'Caneca com estampa teste de cores'}))
        self.assertFalse(matches(classify({'nome':'Kit churrasco'}),'eventos'))
        self.assertTrue(matches(classify({'nome':'Sacochila personalizada'}),'eventos'))

    def test_supplier_products_appear_in_both_collection_and_specific_category(self):
        for name, category in [('Garrafa PET reciclado','copos-garrafas'),('Chaveiro com abridor','chaveiros'),('Mochila USB','bolsas-acessorios'),('Caneta com chaveiro','grafica'),('Sacola de papel kraft','grafica')]:
            with self.subTest(name=name):
                product=classify(dict(nome=name,fornecedor='XBZ'))
                self.assertEqual(product['categoria'],category)
                self.assertTrue(matches(product,'brindes'))
                self.assertTrue(matches(product,category))
        self.assertFalse(matches(classify(dict(nome='Camiseta',fornecedor='')), 'brindes'))
