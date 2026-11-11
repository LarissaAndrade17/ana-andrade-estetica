# Ana Andrade Estética

Site responsivo em HTML, CSS e JavaScript, com painel administrativo e integração parcial com Supabase.

## Recursos conectados ao Supabase nesta versão
- Cadastro e login de clientes pelo Supabase Auth.
- Acesso administrativo validado pelo campo `profiles.role = 'admin'`.
- Salvamento do nome e telefone do perfil.
- Solicitação de agendamentos online.
- Consulta dos próprios agendamentos na área da cliente.
- Painel da Ana com listagem de solicitações online e atualização de status/observação.
- Atualização em tempo real dos pedidos no painel.

## Recursos que continuam locais
Publicações, comentários, curtidas, catálogo de procedimentos, disponibilidade do calendário, agendamentos manuais, pagamentos, notas e apresentação da Ana ainda usam `localStorage`. Eles não sincronizam entre dispositivos nesta versão. O upload de foto de perfil também não está conectado ao Supabase Storage.

## Contato
O chat interno foi removido. O site mantém o atalho do WhatsApp configurado no número informado pela responsável.

## Como executar
1. Extraia o ZIP.
2. Abra a pasta `ana-andrade-clean` no VS Code.
3. Inicie o Live Server pelo arquivo `index.html`.
4. Entre ou crie uma conta em **Minha conta**.
5. A conta da Ana precisa existir em Supabase Authentication e ter `profiles.role = 'admin'`; após o login, o site direciona essa conta ao painel.

## Configuração Supabase
A URL do projeto e a publishable key estão em `js/supabase-config.js`. A publishable key é apropriada para uso no navegador. Nunca coloque uma chave `secret` ou `service_role` no front-end.

A integração espera as tabelas e colunas descritas em `SUPABASE-INTEGRACAO.md`, com políticas RLS adequadas. Não desative RLS para contornar erros.
