import unittest
from unittest.mock import patch, PropertyMock
from app import app, hub_catalog


class PasseioTests(unittest.TestCase):
    def setUp(self):
        app.config.update(TESTING=True, SECRET_KEY='test-only')
        self.client = app.test_client()
        catalog = patch.object(type(hub_catalog), 'enabled', new_callable=PropertyMock, return_value=False)
        catalog.start()
        self.addCleanup(catalog.stop)

    def test_feed_renders_with_search_categories_and_surprise(self):
        for url in ['/produtos-passeio', '/produtos-passeio?categoria=vestuario', '/produtos-passeio?q=caneca',
                    '/produtos-passeio?surpresa=abc123', '/produtos-passeio?ate=3']:
            response = self.client.get(url)
            self.assertEqual(response.status_code, 200, url)
            self.assertIn('data-passeio', response.get_data(as_text=True))

    def test_unknown_category_is_404(self):
        self.assertEqual(self.client.get('/produtos-passeio?categoria=nao-existe').status_code, 404)

    def test_next_page_fragment_has_no_layout(self):
        text = self.client.get('/produtos-passeio/mais?pagina=2').get_data(as_text=True)
        self.assertNotIn('<html', text)

    def test_add_from_feed_returns_tray_thumbnails(self):
        response = self.client.post('/orcamento/adicionar/1', data={'qty': '50'}, headers={'Accept': 'application/json'})
        data = response.get_json()
        self.assertEqual(data['count'], 1)
        self.assertEqual(len(data['thumbs']), 1)
        page = self.client.get('/produtos-passeio').get_data(as_text=True)
        self.assertIn('data-tray-count>1<', page)


if __name__ == '__main__':
    unittest.main()
