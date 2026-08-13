# Meu Seu Loja

Crie um site completo, profissional, moderno e sofisticado chamado “meueseuloja”, funcionando como uma vitrine/catálogo de produtos com um painel administrativo protegido por login.

IDENTIDADE VISUAL

O site deve ter uma aparência luxuosa, premium e elegante.

Utilize principalmente:

Preto profundo

Dourado elegante/metálico

Branco e off-white

Tons escuros complementares

Gradientes sutis em preto e dourado

Use uma tipografia moderna e sofisticada, bastante espaço entre os elementos, bordas elegantes, sombras suaves e animações discretas.

O resultado deve parecer um site profissional de uma marca premium, e não um template genérico.

O nome “meueseuloja” deve aparecer no header e na identidade visual do site.

PÁGINA PRINCIPAL

Crie uma homepage moderna contendo:

Header

Logo/nome meueseuloja

Menu de navegação

Link para a seção de produtos

Design responsivo

Header fixo ou com efeito elegante ao rolar

Hero

Criar uma seção inicial visualmente impactante com:

Título chamativo

Pequeno texto apresentando a loja

Botão “Ver produtos”

Elementos visuais sofisticados

Fundo elegante em preto/dourado

Produtos

Criar uma seção chamada “Nossos produtos”.

Os produtos devem ser carregados dinamicamente do banco de dados.

Cada produto deve aparecer em um card premium contendo:

Foto

Nome

Preço

Descrição

Botão de ação

Os cards devem ter animações suaves ao passar o mouse.

Se não houver produtos cadastrados, mostrar uma mensagem elegante informando que novos produtos serão adicionados em breve.

Rodapé

Criar um footer elegante contendo:

Nome meueseuloja

Pequena descrição

Links de navegação

Redes sociais, caso sejam configuradas

Copyright

PAINEL ADMINISTRATIVO

Criar uma área administrativa acessível através da rota:

/admin

Essa área deve possuir autenticação real.

Login inicial

Usuário:
luciaSouza

Senha inicial:
admin123S

IMPORTANTE:

NÃO coloque essas credenciais diretamente no código JavaScript/TypeScript do frontend.

A autenticação deve ser implementada de maneira segura no backend.

Se utilizar Supabase, utilize o sistema de autenticação do Supabase e configure o usuário administrador corretamente.

A senha deve ser armazenada apenas pelo sistema de autenticação, utilizando hash/credenciais seguras.

O frontend nunca deve expor a senha.

Depois de entrar, o administrador deve ser direcionado para:

/admin/dashboard

DASHBOARD ADMINISTRATIVO

Criar um dashboard moderno seguindo a mesma identidade visual preta e dourada do site.

O dashboard deve permitir:

Gerenciamento de produtos

Adicionar produto com:

Foto

Nome

Preço

Descrição

Também deve ser possível:

Visualizar produtos cadastrados

Editar produto

Alterar foto

Alterar nome

Alterar preço

Alterar descrição

Excluir produto

Confirmar antes de excluir

Fazer upload de novas imagens

Após adicionar ou editar um produto, a alteração deve aparecer automaticamente na página pública.

BANCO DE DADOS

Criar uma tabela de produtos contendo pelo menos:

id

name

price

description

image_url

created_at

updated_at

As informações devem permanecer salvas mesmo depois que o site for fechado ou atualizado.

Utilize um backend/banco de dados adequado, preferencialmente Supabase, caso esteja disponível no projeto.

Também configure armazenamento de imagens para os produtos.

SEGURANÇA

Implementar autenticação e autorização reais.

Somente usuários autenticados e autorizados como administradores podem:

Acessar /admin/dashboard

Criar produtos

Editar produtos

Excluir produtos

Fazer upload de imagens

Usuários comuns não devem conseguir executar essas operações através da API/banco de dados.

Configure as regras de segurança/RLS do banco de dados corretamente.

Não confiar apenas em esconder botões ou páginas no frontend.

RESPONSIVIDADE

O site deve funcionar perfeitamente em:

Celulares

Tablets

Notebooks

Desktops

No celular, adaptar automaticamente:

Menu

Cards

Imagens

Botões

Dashboard

Formulários

O painel administrativo também deve ser totalmente responsivo.

EXPERIÊNCIA DO USUÁRIO

Adicionar:

Loading states

Skeletons quando necessário

Mensagens de sucesso

Mensagens de erro

Confirmação antes de excluir

Validação dos formulários

Tratamento de erros de upload

Formatação correta de preços em R$

Animações suaves

Transições profissionais

O site deve ser rápido e otimizado.

FLUXO COMPLETO

O sistema deve funcionar desta forma:

Visitante acessa meueseuloja

Visualiza os produtos cadastrados

Administrador acessa /admin

Faz login

Entra no dashboard

Clica em “Adicionar produto”

Envia foto, nome, preço e descrição

Produto é salvo no banco de dados

Foto é salva no storage

Produto aparece automaticamente na homepage

Administrador pode editar o produto

Administrador pode excluir o produto

Administrador pode fazer logout

Depois do logout, não pode acessar o dashboard sem fazer login novamente

IMPORTANTE

Não quero apenas uma interface visual ou protótipo.

Quero um sistema funcional completo, com:

Frontend

Backend

Banco de dados

Autenticação

Área administrativa

Upload de imagens

CRUD de produtos

Persistência dos dados

Proteção das rotas

Regras de segurança

Design premium

Responsividade

Antes de finalizar, teste todo o fluxo:

Login → Dashboard → Adicionar produto → Produto aparece na loja → Editar produto → Alteração aparece na loja → Excluir produto → Logout → Tentar acessar dashboard sem login.

Corrija qualquer erro encontrado antes de considerar o projeto concluído.

O nome da aplicação deve ser meueseuloja em toda a interface.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://meueseuloja.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/41a01e14-f532-45eb-92bc-81a1de17cfa5).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
