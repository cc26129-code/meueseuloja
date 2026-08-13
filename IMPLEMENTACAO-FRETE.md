# Implementação do cálculo de frete

O checkout usa o Melhor Envio apenas no servidor. O navegador envia CEP, IDs e quantidades; preço, estoque, peso, dimensões, subtotal, frete e total são reconstruídos a partir do Supabase.

## Fluxo

1. O cliente informa o CEP no checkout.
2. `quoteShipping` valida a sessão, carrega os produtos e consulta o Melhor Envio.
3. A cotação é salva por 20 minutos em `shipping_quotes` e vinculada ao usuário.
4. Ao gerar o PIX, `createPixOrder` carrega novamente os produtos e consulta novamente o Melhor Envio.
5. Se o carrinho, produto, serviço ou valor do frete mudou, o pagamento é interrompido e uma nova cotação é solicitada.
6. O Mercado Pago recebe exatamente `subtotal + shipping_amount`.
7. O pedido guarda snapshots dos itens, endereço e frete.

## Migration

Execute `supabase/migrations/20260813160000_shipping_checkout.sql` no projeto Supabase antes de publicar o frontend. Ela adiciona:

- `products.weight_kg`, `height_cm`, `width_cm` e `length_cm`;
- dados de frete e rastreio em `orders`;
- `addresses.postal_code`;
- tabelas privadas `shipping_quotes` e `shipping_provider_tokens`.

Depois da migration, edite todos os produtos antigos no painel e informe peso e dimensões. Produtos incompletos são bloqueados na cotação para evitar preço de frete incorreto.

## Variáveis de ambiente

Configure no backend/Lovable Cloud as variáveis documentadas em `.env.example`. Nunca use prefixo `VITE_` para credenciais do Melhor Envio.

O primeiro token pode ser inicializado pelas variáveis de ambiente. Depois disso, o servidor mantém o token renovado em `shipping_provider_tokens`, protegido por RLS e acessível somente pelo `service_role`.

Produção e Sandbox do Melhor Envio usam cadastros e tokens diferentes. Mantenha `MELHOR_ENVIO_ENVIRONMENT=sandbox` até concluir os testes.

## Teste manual

1. Rode a migration.
2. Configure as variáveis do Melhor Envio Sandbox.
3. Cadastre peso e dimensões em todos os produtos usados no teste.
4. Entre como cliente, adicione um produto e abra o checkout.
5. Informe endereço e CEP e selecione um frete.
6. Altere a quantidade: a cotação deve ser invalidada.
7. Calcule novamente e gere o PIX de teste.
8. Confirme no pedido que subtotal, frete e total estão separados.
9. Abra o painel de pedidos e salve um código de rastreio.
10. Confirme que o código aparece em Meus Pedidos.
