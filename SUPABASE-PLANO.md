# Próxima etapa: backend real (Supabase)

Para que a cliente crie conta, Ana responda pelo painel, mensagens cheguem instantaneamente e agenda/postagens sincronizem em todos os aparelhos:

1. Criar projeto no Supabase.
2. Ativar Email/Password em Authentication.
3. Criar tabelas necessárias para cada módulo ainda local: procedures, posts, post_comments, post_likes, availability e payments.
4. Ativar Realtime para os módulos que forem conectados futuramente.
5. Criar bucket Storage para imagens.
6. Configurar RLS: cliente acessa/edita apenas o próprio perfil e agendamentos; Ana usa conta com papel administrativo.
7. Inserir URL do projeto e chave `anon` em arquivo público de configuração. A chave `service_role` nunca deve ir para o front-end.

O ZIP atual é o protótipo de interface e fluxo. A conexão exige criar o projeto Supabase e configurar credenciais e políticas; não é possível fingir chat em tempo real usando apenas localStorage.


## Campos adicionais para o fluxo de agendamento
Na tabela `appointments`, inclua pelo menos:
- `status` (texto; por exemplo `requested`, `available`, `busy`, `confirmed`, `cancelled`)
- `admin_note` (texto, observação enviada pela Ana)
- `client_id` (referência ao usuário autenticado)
- `appointment_date` e `appointment_time`

Ative Realtime para `appointments`. A cliente deve poder inserir solicitações e ler apenas seus próprios agendamentos; somente a conta administrativa autorizada pode consultar todos os pedidos e alterar `status` e `admin_note`. O chat interno foi removido do projeto.
