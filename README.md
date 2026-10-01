# Megui Site v0.1

Primeiro esqueleto do novo site próprio da Megui, pronto para deploy no Render.

## O que já funciona

- Home responsiva
- Menu: Início, Produtos, Sobre nós, Contato, Meu orçamento
- Catálogo com categorias
- Três linhas de negócio: Meg Personalizados, Meg Roupas e Meg Gráfica
- Página individual de produto
- Carrinho de orçamento (sem pagamento)
- Quantidade e observação por item
- Envio de todos os itens para o WhatsApp
- Visual lilás + preto
- Estrutura pronta para futuramente integrar ao Mag Hub

## Rodar localmente

```bash
pip install -r requirements.txt
python app.py
```

Abra http://localhost:5000

## Deploy no Render

1. Suba esta pasta para um repositório GitHub.
2. No Render: New > Blueprint.
3. Escolha o repositório.
4. O Render lê o `render.yaml`.
5. Em Environment, configure:
   - `WHATSAPP_NUMBER`: número no formato internacional, **somente números**. Ex.: 5531999999999.
   - `SECRET_KEY`: o Blueprint já gera uma automaticamente.
6. Faça o deploy.

## Logo oficial

O arquivo atual `static/img/logo-placeholder.svg` é apenas provisório.
Quando tivermos a logo oficial em PNG/SVG, substitua pelo arquivo real e ajuste a referência em `templates/base.html`.

## Próximos passos

- Banco PostgreSQL
- Painel administrativo / Mag Hub
- Cadastro real de produtos
- Busca, filtros e paginação
- Fotos reais
- Integração automática de estoque e fornecedores
- Solicitação de orçamento registrada no CRM antes de abrir o WhatsApp
- SEO por categoria e produto
- Analytics / Pixel

### Catálogo conectado ao Megui Hub

A vitrine consulta o catálogo ativo do Hub por uma API somente de leitura. Configure `MEGUI_HUB_URL` no site e a mesma `SITE_CATALOG_TOKEN` nos dois serviços pelo ambiente do Render. A chave nunca vai para o navegador. Custos, preços e fornecedores não integram o contrato comercial.

Produtos, fotos, descrições e estoque são consultados com cache de 60 segundos. Em indisponibilidade temporária, uma resposta previamente carregada pode ser utilizada por até 24 horas. Após um reinício, a primeira consulta depende do Hub; sem resposta válida, a página informa a indisponibilidade e oferece WhatsApp. O catálogo mostra 48 itens por página, exibe somente produtos com estoque positivo e busca em todo o catálogo. Os IDs de orçamento do Hub usam um intervalo separado dos exemplos editoriais anteriores, preservando os carrinhos existentes.

A categoria comercial é derivada do nome/categoria/linha do Hub. A descrição original da categoria continua no produto, sem alterar o banco. Eventos mantém seu catálogo em `/categoria/eventos` e uma apresentação em `/eventos`. `destaques` reúne produtos com disponibilidade. Estoques de ofertas equivalentes usam o maior saldo, evitando somar duas vezes o mesmo estoque de fornecedores.
