# Sistema de autenticação e conta

## O que foi implementado

- Cadastro e login de clientes com Supabase Auth.
- Sessão persistente e renovação automática de token pelo cliente Supabase.
- Header responsivo com avatar, nome, conta, pedidos, favoritos e logout.
- Perfil com nome, endereço e avatar privado no Supabase Storage.
- Carrinho e favoritos vinculados ao usuário, com migração dos dados de visitante no primeiro login.
- Área “Meus pedidos”, incluindo pagamentos pendentes.
- Checkout autenticado e pedidos vinculados ao ID do usuário.
- Área administrativa protegida, detalhes do cliente e atualização do andamento do pedido.
- RLS para impedir acesso aos dados de outros clientes e função de servidor para ações administrativas.

## Migration necessária

Aplicar, na ordem existente, o arquivo:

`supabase/migrations/20260813030000_user_accounts.sql`

Ele cria `profiles`, `addresses`, `favorites`, `cart_items`, `order_items`, `payments`, o bucket privado `avatars`, novos campos em `orders`, índices, gatilhos e políticas RLS. Contas antigas recebem automaticamente um perfil durante a migration.

## Autenticação

As senhas são processadas exclusivamente pelo Supabase Auth e não são salvas pelo aplicativo. O Supabase armazena o hash seguro e mantém a sessão através de access/refresh tokens. Nenhuma senha é gravada no LocalStorage.

## Sincronização

Visitantes continuam podendo usar carrinho e favoritos localmente. Ao entrar, esses dados são mesclados com os dados da conta e salvos no Supabase. Depois disso, carrinho e favoritos são recuperados pelo ID autenticado em qualquer dispositivo. Pedidos, perfil, endereço e avatar também são vinculados ao mesmo ID.

## Configuração

Use `.env.example` como referência. Nunca exponha `SUPABASE_SERVICE_ROLE_KEY`, `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET` ou `RESEND_API_KEY` no frontend ou em repositório público.

No Supabase Auth, configure as URLs permitidas do site em Authentication > URL Configuration. Se a confirmação de e-mail estiver ativada, o usuário precisará confirmar o endereço antes do primeiro login.

## Verificações realizadas

- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
