# Estúdio 3D

Camiseta, caneca, garrafa, caderno e almofada têm modelos geométricos ilustrativos locais. Materiais físicos, ambiente de reflexos RoomEnvironment, iluminação de estúdio, malha de tecido, bordas arredondadas e detalhes de construção aproximam a aparência de produto. A camiseta inclui volume, gola, mangas, barra e relevo de malha; os modelos continuam ilustrativos, sem corresponder a um SKU real digitalizado. Three.js 0.180.0 está incluído com licença MIT. O editor permite giro, zoom, cor da peça, detalhes, aplicação de arte e exportação da vista atual. Modelos ilustrativos não são dimensões de fabricação nem confirmação de cores disponíveis.

## Geração por foto

A interface de foto fica oculta até a integração estar habilitada. Configure no Render, em variáveis de ambiente:

- `MESHY_API_KEY`: segredo de uma conta Meshy com créditos.
- `MESHY_ENABLE_IMAGE_TO_3D=1`: ativa o envio de fotos e o consumo de créditos.
- `SECRET_KEY`: chave longa e aleatória para assinar as sessões Flask.
- `MESHY_DAILY_LIMIT=10`: teto global diário de tentativas (UTC); use 0 para suspender.
- `MESHY_QUOTA_DB`: arquivo SQLite do contador. Padrão `/tmp/megui-meshy-quota.sqlite`. Esse contador reinicia quando o disco efêmero é apagado; para preservar o teto entre reinícios, configure um caminho em disco persistente. O limite é compartilhado pelos processos da mesma instância, não por instâncias distintas.

Cada sessão pode criar no máximo três tarefas. Falhas de conexão também consomem uma tentativa local, evitando repetição de gastos. O preço e os créditos devem ser verificados na conta Meshy antes da ativação.

A foto é reduzida a até 1600 pixels, convertida para JPEG e enviada ao servidor e à Meshy somente ao clicar em Gerar. Não é armazenada pelo aplicativo. Política de retenção do fornecedor deve ser revisada pelo responsável antes de ativar. Não colocar a chave em JavaScript ou em commits.

O fornecedor estima a geometria e os lados ocultos. Não identifica SKU do catálogo nem garante reprodução exata. O modelo gerado pode ser girado, colorido e receber a estampa clicando em Posicionar arte e na superfície. A cor recolore os materiais, mantendo a textura gerada. Não há segmentação automática de tampas e detalhes nesses modelos. Geração pode levar minutos, diferentemente dos modelos prontos.

Sem a conta configurada, não são feitas chamadas pagas. Os quatro modelos locais funcionam sem serviço externo.

Validação das geometrias e materiais: `node tests/mockup_models.mjs`. Testes Flask: `python -m unittest discover -s tests -q`.
