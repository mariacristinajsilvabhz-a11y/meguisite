"""Optional Meshy adapter. Enable only after configuring the account and daily budget."""
import base64
import binascii
import json
import os
import re
import secrets
import sqlite3
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen
from flask import Blueprint, jsonify, request, session

mockup_3d = Blueprint('mockup_3d', __name__, url_prefix='/api/mockups/3d')

def enabled():
    return (os.getenv('MESHY_ENABLE_IMAGE_TO_3D') == '1' and bool(os.getenv('MESHY_API_KEY'))
            and bool(os.getenv('SECRET_KEY')))

def provider(path, payload=None):
    body = json.dumps(payload).encode() if payload is not None else None
    req = Request('https://api.meshy.ai/openapi/v1/image-to-3d' + path, data=body,
                  headers={'Authorization': 'Bearer ' + os.environ['MESHY_API_KEY'], 'Content-Type': 'application/json'})
    with urlopen(req, timeout=25) as response:
        return json.loads(response.read(2_000_000))

def reserve():
    # Atomic global cap applies even when a visitor creates a new browser session.
    connection = sqlite3.connect(os.getenv('MESHY_QUOTA_DB', '/tmp/megui-meshy-quota.sqlite'), timeout=5)
    try:
        connection.execute('CREATE TABLE IF NOT EXISTS quota (day TEXT PRIMARY KEY, used INTEGER NOT NULL)')
        connection.execute('BEGIN IMMEDIATE')
        day = time.strftime('%Y-%m-%d', time.gmtime())
        used = connection.execute('SELECT used FROM quota WHERE day=?', (day,)).fetchone()
        cap = max(0, min(100, int(os.getenv('MESHY_DAILY_LIMIT', '10'))))
        if (used[0] if used else 0) >= cap:
            connection.rollback()
            return False
        connection.execute('INSERT INTO quota VALUES (?,1) ON CONFLICT(day) DO UPDATE SET used=used+1', (day,))
        connection.commit()
        return True
    finally:
        connection.close()

@mockup_3d.get('/config')
def config():
    session.setdefault('mockup_csrf', secrets.token_urlsafe(24))
    return jsonify(enabled=enabled(), csrf=session['mockup_csrf'], provider='Meshy')

@mockup_3d.post('/tasks')
def create_task():
    if not enabled():
        return jsonify(error='A geração por foto ainda não foi ativada.'), 503
    if request.headers.get('Origin') != request.host_url.rstrip('/') or not secrets.compare_digest(
            request.headers.get('X-Mockup-CSRF', ''), session.get('mockup_csrf', 'missing')):
        return jsonify(error='Reabra o estúdio para continuar.'), 403
    if request.content_length is None or request.content_length > 6_000_000:
        return jsonify(error='Envie uma foto de até 4 MB.'), 413
    data = request.get_json(silent=True) or {}
    image = data.get('image', '')
    if not isinstance(image, str) or not re.match(r'^data:image/(png|jpeg);base64,', image):
        return jsonify(error='Envie uma imagem PNG ou JPG.'), 400
    try:
        raw = base64.b64decode(image.split(',', 1)[1], validate=True)
    except (ValueError, binascii.Error):
        return jsonify(error='Imagem inválida.'), 400
    if not (raw.startswith(b'\x89PNG\r\n\x1a\n') if image.startswith('data:image/png') else raw.startswith(b'\xff\xd8\xff')):
        return jsonify(error='Imagem inválida.'), 400
    if len(raw) > 4_000_000:
        return jsonify(error='Envie uma foto de até 4 MB.'), 413
    if session.get('mockup_requested', 0) >= 3 or not reserve():
        return jsonify(error='Limite de geração atingido. Peça ajuda à Megui.'), 429
    session['mockup_requested'] = session.get('mockup_requested', 0) + 1
    try:
        result = provider('', {'image_url': image, 'ai_model': 'meshy-7.1', 'should_texture': True,
                              'enable_pbr': True, 'should_remesh': True, 'target_polycount': 15000,
                              'target_formats': ['glb'], 'image_enhancement': False})
        task = result['result']
        if not isinstance(task, str) or not re.fullmatch(r'[a-zA-Z0-9-]{8,80}', task):
            raise ValueError('Invalid task')
        session['mockup_tasks'] = (session.get('mockup_tasks', []) + [task])[-3:]
        return jsonify(task=task), 202
    except (HTTPError, URLError, TimeoutError, ValueError, KeyError):
        return jsonify(error='Não foi possível iniciar a geração. A Megui precisa verificar a conexão e os créditos.'), 502

@mockup_3d.get('/tasks/<task>')
def task_status(task):
    if not enabled():
        return jsonify(error='Geração indisponível.'), 503
    if task not in session.get('mockup_tasks', []):
        return jsonify(error='Modelo não encontrado.'), 404
    try:
        result = provider('/' + task)
        model = result.get('model_urls', {}).get('glb')
        if model and (urlparse(model).scheme != 'https' or urlparse(model).hostname != 'assets.meshy.ai'):
            raise ValueError('Invalid model URL')
        return jsonify(status=result.get('status'), progress=result.get('progress', 0), model=model)
    except (HTTPError, URLError, TimeoutError, ValueError):
        return jsonify(error='Não foi possível consultar o modelo. Tente novamente.'), 502
