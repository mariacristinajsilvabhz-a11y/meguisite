import os
import tempfile
import unittest
from unittest.mock import patch
from app import app

class Mockup3DTests(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()
        app.config['TESTING'] = True
        self.previous_3d_enabled = app.config['MOCKUP_3D_ENABLED']
        app.config['MOCKUP_3D_ENABLED'] = True
        self.previous_enabled = app.config['MOCKUP_STUDIO_ENABLED']
        app.config['MOCKUP_STUDIO_ENABLED'] = True
    def tearDown(self):
        app.config['MOCKUP_3D_ENABLED'] = self.previous_3d_enabled
        app.config['MOCKUP_STUDIO_ENABLED'] = self.previous_enabled
    def test_disabled_without_account(self):
        with patch.dict(os.environ, {'MESHY_ENABLE_IMAGE_TO_3D': '0'}):
            self.assertFalse(self.client.get('/api/mockups/3d/config').json['enabled'])
            self.assertEqual(self.client.post('/api/mockups/3d/tasks').status_code, 503)
    def test_photo_generation_and_ownership(self):
        with tempfile.TemporaryDirectory() as folder, patch.dict(os.environ, {
            'MESHY_ENABLE_IMAGE_TO_3D': '1', 'MESHY_API_KEY': 'test', 'SECRET_KEY': 'test',
            'MESHY_QUOTA_DB': folder+'/quota.sqlite', 'MESHY_DAILY_LIMIT': '1'
        }), patch('mockup_3d.provider') as provider:
            config = self.client.get('/api/mockups/3d/config').json
            headers = {'Origin':'http://localhost','X-Mockup-CSRF':config['csrf']}
            self.assertEqual(self.client.post('/api/mockups/3d/tasks',json={},headers={}).status_code,403)
            self.assertEqual(self.client.post('/api/mockups/3d/tasks',json={'image':'data:image/png;base64,YWJj'},headers=headers).status_code,400)
            provider.return_value = {'result':'valid-task-1234'}
            result = self.client.post('/api/mockups/3d/tasks',json={'image':'data:image/png;base64,iVBORw0KGgo='},headers=headers)
            self.assertEqual(result.status_code,202)
            self.assertEqual(provider.call_args.args[1]['ai_model'],'meshy-7.1')
            self.assertEqual(app.test_client().get('/api/mockups/3d/tasks/valid-task-1234').status_code,404)
            self.assertEqual(self.client.post('/api/mockups/3d/tasks',json={'image':'data:image/png;base64,iVBORw0KGgo='},headers=headers).status_code,429)
            provider.return_value = {'status':'SUCCEEDED','model_urls':{'glb':'https://assets.meshy.ai/test.glb'}}
            self.assertEqual(self.client.get('/api/mockups/3d/tasks/valid-task-1234').json['model'],'https://assets.meshy.ai/test.glb')
            provider.return_value = {'status':'SUCCEEDED','model_urls':{'glb':'https://evil.test/test.glb'}}
            self.assertEqual(self.client.get('/api/mockups/3d/tasks/valid-task-1234').status_code,502)
    def test_editor_assets(self):
        for path in ['/criar-arte','/static/mockups/recognition.js','/static/mockups/recognition-worker.js','/static/mockups/vision/model.json','/static/mockups/vision/weights.bin']:
            with self.client.get(path) as response:
                self.assertEqual(response.status_code,200,path)
