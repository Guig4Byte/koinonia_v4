# CHANGED_FILES

## Documentação atualizada com o código

### Arquivos alterados

- `README.md`
- `docs/AGENT_BRIEFING.md`
- `docs/PRODUCT.md`
- `docs/GLOSSARY.md`
- `docs/ARCHITECTURE.md`
- `docs/Perfil.txt`
- `docs/Koinonia.txt`

### O que foi atualizado

- Documentação alinhada à autenticação real atual:
  - `/login`;
  - `/logout`;
  - cookie `HttpOnly` `koinonia-session`;
  - `getCurrentUser()`;
  - `middleware.ts`;
  - `User.passwordHash`;
  - redirecionamento por papel.
- Remoção de ambiguidades sobre sessão demo e seletor manual de perfil.
- Inclusão do tema local no login e no app:
  - `Claro`;
  - `Pergaminho`;
  - `Escuro`;
  - `koinonia-theme`.
- Atualização das regras de presença sem dado:
  - usar `hasPresenceData`;
  - não exibir `0%` quando o correto for `—` / `Sem registro`.
- Reforço dos helpers atuais:
  - `src/features/signals/sections.ts`;
  - `src/features/events/presence-summary.ts`;
  - `src/lib/auth/*`.
- Revisão de propósito de cada documento:
  - briefing operacional;
  - produto;
  - glossário;
  - arquitetura;
  - experiência;
  - visão futura/legada;
  - README prático.

### Observação

Nenhum arquivo de código foi alterado nesta entrega.
