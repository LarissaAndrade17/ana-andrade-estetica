# Ana Andrade Estética — abrir no VS Code

1. Extraia o ZIP.
2. No VS Code, use **Arquivo → Abrir Pasta** e selecione `ana-andrade-clean`.
3. Inicie o Live Server pelo arquivo `index.html`.
4. Acesse **Minha conta** para entrar ou criar uma conta de cliente.
5. A conta administrativa é autenticada pelo Supabase: entre com o e-mail e a senha da Ana. O sistema direciona automaticamente ao painel quando `profiles.role` estiver como `admin`.

## Recursos conectados
- Cadastro/login de clientes e login administrativo pelo Supabase Auth.
- Perfil básico de cliente salvo no Supabase.
- Solicitações de agendamento online.
- Painel com pedidos online e atualização de status/observação.
- Consulta dos agendamentos na área da cliente.
- Atalho do WhatsApp.

## Observações
Publicações, procedimentos, disponibilidade, pagamentos e registros manuais ainda são locais neste protótipo. Consulte `SUPABASE-INTEGRACAO.md` para conferir as tabelas e políticas esperadas. Não coloque chaves secretas do Supabase no navegador.
