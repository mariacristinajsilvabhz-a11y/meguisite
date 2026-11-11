import json
import re
import unittest
from pathlib import Path
from unittest.mock import PropertyMock, patch
from xml.etree import ElementTree as ET

from app import app, hub_catalog
from editorial import GUIDES, PUBLISHED


class EditorialSeoTests(unittest.TestCase):
    def setUp(self):
        app.config.update(TESTING=True, SECRET_KEY='test-only')
        self.client = app.test_client()
        mocked = patch.object(type(hub_catalog), 'enabled', new_callable=PropertyMock, return_value=False)
        mocked.start()
        self.addCleanup(mocked.stop)

    def test_guides_are_discoverable_and_images_exist(self):
        home = self.client.get('/').get_data(as_text=True)
        self.assertIn('href="/guias"', home)
        hub = self.client.get('/guias')
        self.assertEqual(hub.status_code, 200)
        for guide in GUIDES:
            path = '/guias/' + guide['slug']
            self.assertIn(path, hub.get_data(as_text=True))
            self.assertTrue((Path(app.static_folder) / guide['image']).is_file())
            response = self.client.get(path + '?utm_source=test')
            self.assertEqual(response.status_code, 200)
            html = response.get_data(as_text=True)
            self.assertEqual(len(re.findall(r'<h1[ >]', html)), 1)
            canonical = re.search(r'<link rel="canonical" href="([^"]+)"', html)[1]
            self.assertTrue(canonical.endswith(path))
            schemas = [json.loads(s) for s in re.findall(r'<script type="application/ld\+json">(.*?)</script>', html, re.S)]
            article = next(s for s in schemas if s.get('@type') == 'Article')
            self.assertEqual(article['mainEntityOfPage']['@id'], canonical)
            self.assertEqual(article['dateModified'], PUBLISHED)
            self.assertEqual(article['headline'], guide['title'])
            self.assertIn('BreadcrumbList', html)
            self.assertIn('content="article"', html)
            self.assertIn('https://wa.me/', html)
            self.assertNotIn('noindex', html)

    def test_sitemap_uses_known_editorial_dates_only(self):
        response = self.client.get('/sitemap.xml')
        self.assertEqual(response.status_code, 200)
        root = ET.fromstring(response.data)
        ns = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
        entries = {u.find('s:loc', ns).text: u.find('s:lastmod', ns) for u in root}
        for guide in GUIDES:
            url = next(u for u in entries if u.endswith('/guias/' + guide['slug']))
            self.assertEqual(entries[url].text, PUBLISHED)
        home = next(u for u in entries if u.endswith('/'))
        self.assertIsNone(entries[home])

    def test_unknown_guide_is_404(self):
        self.assertEqual(self.client.get('/guias/nao-existe').status_code, 404)
