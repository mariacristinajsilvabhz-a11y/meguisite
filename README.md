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
