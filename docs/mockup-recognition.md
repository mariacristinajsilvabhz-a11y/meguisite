# Editor público 2D e reconhecimento

O botão Criar arte e `/criar-arte` estão ativados por padrão. `MOCKUP_STUDIO_ENABLED=0` pausa novamente. O editor público não inclui visualização 3D nem Meshy; as APIs 3D ficam bloqueadas.

A foto da peça permanece no navegador. MobileNet V2 0.50, pré-treinado no ImageNet, sugere uma classe visual. A inferência usa um Web Worker com CPU, sem depender de WebGL, conta externa ou cobrança por uso. Todos os arquivos são hospedados no próprio site e baixados apenas ao enviar uma foto. O modelo não reconhece SKU, tecido específico, técnica de impressão ou todos os produtos do catálogo.

O usuário deve enviar uma peça por foto, inteira e preferencialmente com fundo liso. A interface apresenta o tipo como sugestão e permite confirmar/trocar o tipo manualmente. Classes desconhecidas ou baixa confiança mantêm a seleção manual. Um algoritmo de contraste estima o contorno em fundo uniforme; ele não é segmentação semântica. Em fundo complexo, usa uma área inicial ajustável. A estampa permanece 2D e pode ser refinada pelos controles de área, posição, tamanho e rotação. A foto original mantém seus materiais e sombras; o acabamento visual integrado usa multiplicação de cores.

## Dependências

- TensorFlow.js core, converter e backend CPU 4.22.0; MobileNet 2.1.1. Licença Apache 2.0 em `static/mockups/vision/LICENSE-tensorflow.txt`.
- Modelo Google MobileNet V2 0.50 224 classificação, versão 2: `https://tfhub.dev/google/imagenet/mobilenet_v2_050_224/classification/2/model.json?tfjs-format=file`.
- Pesos convertidos de float32 para float16 para reduzir download a aproximadamente 3,9 MB. A leitura TensorFlow.js restaura float32 durante a execução. Não foi realizado treinamento específico para a Megui.
- `vision/runtime.js` contém o runtime empacotado com esbuild 0.25.5, com adaptador explícito de plataforma para Workers. Não há chamada de API com a foto.

## Validação

`node tests/mockup_recognition.cjs` verifica mapeamentos, baixa confiança, contorno e proporções. `node tests/mockup_vision_runtime.cjs` executa o runtime real em contexto de worker CPU e reconhece três imagens de referência: camiseta, caneca e almofada. As amostras RGB comprimidas foram extraídas do atlas ilustrativo do próprio editor. Elas não representam avaliação de precisão em fotos de clientes. A garrafa e a mochila do atlas não foram classificadas com segurança; o fluxo manual é mantido nesses casos.

`python -m unittest discover -s tests -q` verifica as rotas e integração preservada, com a API 3D habilitada somente dentro da configuração de testes.
