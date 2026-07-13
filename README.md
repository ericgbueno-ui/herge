# Hergé Gestão de tráfego

Dashboard de monitoramento de campanhas multi-canal: Meta Ads, Google Ads, TikTok Ads e Shopee Ads.
Visualize gastos, CTR, conversões e CPA em tempo real com sincronização automática diária.

## Stack

Next.js (App Router) + TypeScript, Neon Postgres + Prisma, NextAuth (Credentials), Recharts.

## Arquitetura

- **Meta Ads**: Marketing API (Insights) puxando métricas diárias por campanha
- **Google Ads**: Google Ads API v21 via MCC (uma conta gerenciadora acessa todas as contas vinculadas)
- **TikTok Ads**: TikTok Marketing API (reports)
- **Shopee Ads**: Importação manual de CSV via `POST /api/import/shopee-ads` (sem API pública de relatórios confirmada)

## Setup

1. `npm install`
2. Copie `.env.example` para `.env` e configure:
   - `DATABASE_URL`: Connection string do Neon
   - `AUTH_SECRET`: gerar com `npx auth secret`
   - Credenciais de cada canal conforme precisar (cada um é independente)
3. `npx prisma migrate dev --name init`
4. Crie usuário admin:
   ```
   SEED_ADMIN_EMAIL="seu-email@example.com" \
   SEED_ADMIN_PASSWORD="sua-senha" \
   npm run db:seed
   ```
5. `npm run dev` (abre em http://localhost:3000)

## Sincronização

- `GET /api/cron/sync-ads` — puxa dados dos últimos 7 dias de cada canal, grava snapshot diário
- Agendado via `vercel.json` (Vercel Cron, 06h UTC todo dia) quando deployado
- Protegido por `CRON_SECRET` quando configurado
- Canais sem credencial configurada são pulados

## Shopee Ads

Como não há API pública confirmada de relatórios, use:

```bash
curl -X POST http://localhost:3000/api/import/shopee-ads \
  -F "file=@relatorio.csv" \
  -F "shopId=123456789" \
  -H "Authorization: Bearer <seu-token-nextauth>"
```

Os nomes de coluna do CSV são configuráveis em `src/lib/ads/shopee.ts` (veja `COLUMN_ALIASES`).

## Pendências conhecidas

- Shopee Ads depende de importação manual de CSV
