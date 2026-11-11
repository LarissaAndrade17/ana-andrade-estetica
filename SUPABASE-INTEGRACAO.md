# Integração Supabase — Ana Andrade Estética

## Recursos conectados nesta versão
- Cadastro e login de clientes pelo Supabase Auth.
- Login administrativo validado pela coluna `profiles.role = 'admin'`; não existe senha administrativa fixa no JavaScript.
- Perfil de cliente (`name` e `phone`) salvo na tabela `profiles`.
- Solicitações públicas de agendamento salvas em `appointments`.
- Painel administrativo com listagem online de solicitações e atualização de status/observação.
- Área da cliente com consulta dos próprios agendamentos.
- Atualizações de solicitações no painel via Realtime.
- Atalho de WhatsApp mantido; o chat interno foi removido.

## Estrutura esperada
- `profiles`: `id`, `name`, `phone`, `role`.
- `appointments`: `id`, `client_id`, `client_name`, `email`, `phone`, `procedure`, `appointment_date`, `appointment_time`, `notes`, `status`, `admin_note`, `created_at`.

A coluna `id` de `profiles` deve corresponder a `auth.users.id`. A tabela `appointments` deve ter `client_id` vinculado ao usuário autenticado. Configure RLS para que cada cliente leia apenas os próprios registros e para que somente administradores possam consultar todos os pedidos e atualizar `status` e `admin_note`.

## Como testar
1. Abra a pasta do projeto no VS Code.
2. Inicie o Live Server e acesse a URL local por HTTP.
3. Confirme que a URL e a publishable key estão corretas em `js/supabase-config.js`.
4. Confirme que Email/Password está habilitado no Supabase Auth.
5. Confirme que a conta da Ana existe em Authentication > Users e que `profiles.role` dessa conta é `admin`.
6. Teste cadastro/login de cliente, envio de agendamento e atualização no painel.

A publishable key pode ficar no navegador. Nunca coloque uma chave `secret` ou `service_role` no front-end. Não desative RLS para contornar erros de permissão.

## Limites que permanecem
Os módulos de publicações, comentários, procedimentos, disponibilidade, pagamentos e agendamentos manuais continuam usando armazenamento local nesta versão. Fotos de perfil ainda não estão conectadas ao Supabase Storage. Esses recursos não sincronizam entre dispositivos.
