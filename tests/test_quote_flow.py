import io
import json
import unittest
from unittest.mock import patch, PropertyMock
from app import app, hub_catalog, PRODUCTS

class QuoteFlowTests(unittest.TestCase):
    def setUp(self):
        app.config.update(TESTING=True, SECRET_KEY='test-only')
        self.client = app.test_client()
        self.catalog = patch.object(type(hub_catalog), 'enabled', new_callable=PropertyMock, return_value=False)
        self.catalog.start()
        self.addCleanup(self.catalog.stop)
        self.client.post('/orcamento/adicionar/1', data={'qty': '2'})

    def test_single_form_and_product_image(self):
        text = self.client.get('/orcamento').get_data(as_text=True)
        self.assertIn('quote-product-image', text)
        self.assertIn('name="qty_1"', text)
        self.assertEqual(text.count('class="container quote-layout quote-project-form"'), 1)
        self.assertEqual(text.count('<form'), text.count('</form>'))

    def test_validation_retains_all_contact_and_item_changes(self):
        response = self.client.post('/orcamento/whatsapp', data={
            'name': 'Ana', 'email': 'invalid', 'phone': '123',
            'company': 'Empresa Teste', 'deadline': 'Em dezembro',
            'general_notes': 'Bordado pequeno', 'qty_1': '75', 'notes_1': 'Tamanho M'})
        self.assertEqual(response.status_code, 422)
        text = response.get_data(as_text=True)
        for value in ['Empresa Teste', 'Em dezembro', 'Bordado pequeno', 'Tamanho M', 'value="75"', 'aria-invalid="true"']:
            self.assertIn(value, text)
        with self.client.session_transaction() as session:
            self.assertEqual(session['quote_cart']['1']['qty'], 75)

    def test_submit_sends_latest_quantity_without_separate_save(self):
        with patch.dict('os.environ', {'MEGUI_HUB_URL': 'https://hub.test', 'SITE_CATALOG_TOKEN': 'test'}), patch('app.urlopen', return_value=io.BytesIO(b'{"numero":"123"}')) as remote:
            response = self.client.post('/orcamento/whatsapp', data={
                'name': 'Ana', 'email': 'ana@example.com', 'phone': '31999999999',
                'qty_1': '37', 'notes_1': 'Bordado'})
        payload = json.loads(remote.call_args.args[0].data)
        self.assertEqual(payload['items'][0]['qty'], 37)
        self.assertEqual(payload['items'][0]['notes'], 'Bordado')
        self.assertEqual(response.status_code, 302)
        self.assertTrue(response.location.startswith('https://wa.me/'))
        with self.client.session_transaction() as session:
            self.assertEqual(session['quote_cart'], {})

    def test_service_failure_retains_selection_and_form(self):
        with patch.dict('os.environ', {'MEGUI_HUB_URL': '', 'SITE_CATALOG_TOKEN': ''}):
            response = self.client.post('/orcamento/whatsapp', data={
                'name': 'Ana', 'email': 'ana@example.com', 'phone': '31999999999',
                'company': 'Empresa Teste', 'qty_1': '15'})
        self.assertEqual(response.status_code, 503)
        self.assertIn('Empresa Teste', response.get_data(as_text=True))
        with self.client.session_transaction() as session:
            self.assertEqual(session['quote_cart']['1']['qty'], 15)

    def test_remove_saves_other_edits(self):
        self.client.post('/orcamento/adicionar/2')
        self.client.post('/orcamento/remover/1', data={'qty_2': '20', 'notes_2': 'Azul', 'company': 'Empresa Teste'})
        with self.client.session_transaction() as session:
            self.assertNotIn('1', session['quote_cart'])
            self.assertEqual(session['quote_cart']['2']['qty'], 20)

    def test_redirect_stays_on_site(self):
        for target in ['https://example.com', '//example.com', '/\\example.com']:
            response = self.client.post('/orcamento/adicionar/1', data={'next': target})
            self.assertEqual(response.location, '/orcamento')

if __name__ == '__main__':
    unittest.main()
