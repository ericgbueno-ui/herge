# HERGÉ ENTERPRISE — FASE 01

## 1. Estrutura atual

- App Router em `src/app`
- Entrada principal em `/`
- Fluxo legado ainda exposto em `/projects`, `/companies`, `/meta-ads` e `/settings`
- Autenticação centralizada em `src/lib/auth.ts`
- Proteção de rotas via `src/proxy.ts`
- Shell visual já existente com `src/components/Sidebar.tsx`, `src/components/Header.tsx` e `src/components/DashboardOverview.tsx`
- Banco e permissões modelados em `prisma/schema.prisma`

### Páginas identificadas no app

- `/`
- `/login`
- `/loading`
- `/dashboard`
- `/companies`
- `/companies/[id]`
- `/companies/[id]/ai-leads`
- `/companies/[id]/crm`
- `/companies/[id]/financeiro`
- `/companies/[id]/financeiro/nova-venda`
- `/companies/[id]/integracoes`
- `/companies/[id]/whatsapp`
- `/companies/[id]/whatsapp/[conversationId]`
- `/meta-ads`
- `/projects`
- `/settings`
- `/test/dashboard`

### Camadas técnicas principais

- App Router e layouts: `src/app/layout.tsx`, `src/app/dashboard/layout.tsx`, `src/app/settings/layout.tsx`
- Auth: `src/lib/auth.ts`, `src/proxy.ts`
- Permissões e tenancy: `prisma/schema.prisma`, `src/lib/auth-middleware.ts`
- UI compartilhada: `src/components/*`
- API: `src/app/api/*`

## 2. Estrutura proposta

### Fluxo principal

1. Login
2. Loading
3. Verificação de autorização
4. Dashboard Master
5. Módulos

### Direção de navegação

- Dashboard como primeiro destino após autenticação
- Sidebar enterprise única para a navegação principal
- Topbar com pesquisa global, empresa ativa, notificações, tema e perfil
- Módulos futuros mantidos como scaffold visual, sem implementação funcional nesta fase

### Direção de UX

- Entrada premium, centralizada e limpa
- Loading com animação e barra de progresso
- Shell enterprise escuro no dashboard
- Organização do dashboard em blocos executivos
- Compatibilidade total com as funcionalidades existentes

## 3. Arquivos reutilizados

- `src/components/DashboardOverview.tsx`
- `src/lib/auth.ts`
- `src/lib/auth-middleware.ts`
- `prisma/schema.prisma`
- `src/app/dashboard/layout.tsx` como base do shell principal
- `src/components/providers.tsx`

## 4. Arquivos modificados

- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/app/page.tsx`
- `src/app/login/page.tsx`
- `src/app/dashboard/layout.tsx`
- `src/app/dashboard/page.tsx`
- `src/app/meta-ads/page.tsx`
- `src/app/settings/page.tsx`
- `src/components/Header.tsx`
- `src/components/Sidebar.tsx`
- `src/proxy.ts`

## 5. Arquivos criados

- `src/app/loading/page.tsx`
- `src/app/loading/loading-client.tsx`
- `FASE_1_RELATORIO.md`

## 6. Componentes reutilizados

- `DashboardOverview`
- `Sidebar`
- `Header`
- `Providers`
- `auth()`

## 7. Componentes novos

- `LoadingClient`

## 8. Melhorias implementadas

- Redirecionamento inicial corrigido para abrir o dashboard master
- Login redesenhado com experiência premium e CTA mais claro
- Fluxo pós-login agora passa por uma tela dedicada de loading
- Proxy atualizado para proteger a nova rota de loading e manter as rotas principais protegidas
- Sidebar reorganizada para a ordem enterprise solicitada
- Topbar reorganizada com pesquisa global, empresa ativa, notificações, tema e perfil
- Shell do dashboard reforçado com identidade enterprise
- Página do dashboard recebeu um bloco introdutório de fase 01
- Navegação legada de `/projects` foi reduzida nos pontos mais visíveis do fluxo
- Base visual preparada para expansão sem quebrar o legado

## 9. Próxima etapa

- Implementar os módulos com a mesma hierarquia da navegação enterprise
- Tornar a seleção de empresa ativa funcional no shell
- Conectar pesquisa global, notificações e tema a dados reais
- Expandir o dashboard com blocos dedicados para:
  - Top Campanhas
  - Top Empresas
  - Top Produtos
  - Top Vendedores
  - Últimas atividades
  - Alertas IA
  - Tarefas
- Consolidar páginas de CRM, Leads, Campanhas, WhatsApp, Financeiro, Relatórios, IA, Integrações, Usuários, Configurações e Perfil sob a nova organização

## Observação

Nesta fase, os módulos não foram implementados. O objetivo foi organizar o fluxo, o shell, a navegação e a experiência inicial sem remover compatibilidade com o que já existe.
