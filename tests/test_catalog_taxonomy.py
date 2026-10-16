import unittest
from catalog_taxonomy import classify, matches, is_public_product

class ProductTaxonomyTests(unittest.TestCase):
    def test_real_product_names_and_misleading_words(self):
        cases = [
            ('Boné poliéster aba curva','vestuario','bones-chapeus'),
            ('Boneca infantil','lazer-esportes','jogos-brinquedos'),
            ('Mochila de nylon USB 20 L','bolsas-acessorios','mochilas'),
            ('Bolsa térmica 10 L','bolsas-acessorios','bolsas-termicas'),
            ('Caneca térmica com abridor','copos-garrafas','canecas-xicaras'),
            ('Porta copos de bambu','copos-garrafas','acessorios-bebidas'),
            ('Kit churrasco com avental','casa-cozinha','churrasco'),
            ('Kit ferramentas 20 peças','acessorios-utilidades','ferramentas'),
            ('Kit manicure','cuidados-pessoais','beleza'),
            ('Kit costura 27 peças','cuidados-pessoais','costura'),
            ('Kit escritório caderno, caneca e caneta','kits-presentes','kits-executivos'),
            ('Conjunto caneta e chaveiro','kits-presentes','kits-presente'),
            ('Caderno ecológico com caneta','papelaria','cadernos-agendas'),
            ('Caneta com suporte para celular','papelaria','canetas-lapis'),
            ('Porta canetas de metal','papelaria','acessorios-escritorio'),
            ('Carregador via indução - bambu','tecnologia','carregadores'),
            ('Caixinha de som bambu','tecnologia','audio'),
            ('Chaveiro trena emborrachada','acessorios-utilidades','chaveiros'),
            ('Porta notebook','bolsas-acessorios','pastas-notebook'),
            ('Bebedouro pet','pets','acessorios-pet'),
            ('Papel de parede','grafica','adesivos'),
            ('Credencial personalizada','grafica','credenciais'),
        ]
        for name,category,subtype in cases:
            with self.subTest(name=name):
                p=classify({'nome':name,'categoria_original':'Corporativo Kit Gráfica','linha_negocio':'Meg Gráfica'})
                self.assertEqual((p['categoria'],p['subcategoria']),(category,subtype))

    def test_source_is_only_fallback_and_unknown_is_explicit(self):
        self.assertEqual(classify({'nome':'Modelo X','categoria_original':'Canecas'})['categoria'],'copos-garrafas')
        self.assertEqual(classify({'nome':'Modelo X','linha_negocio':'Meg Roupas'})['categoria'],'outros')

    def test_test_records_and_event_collection(self):
        for name in ['Produto de teste','Produto para teste de variacao 02','Produto teste ****@']:
            self.assertFalse(is_public_product({'nome':name}))
        self.assertTrue(is_public_product({'nome':'Caneca com estampa teste de cores'}))
        self.assertFalse(matches(classify({'nome':'Kit churrasco'}),'eventos'))
        self.assertTrue(matches(classify({'nome':'Sacochila personalizada'}),'eventos'))
