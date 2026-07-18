# 🔗 Guia de Integrações - FacaAds

Este documento descreve como configurar e sincronizar dados reais de cada canal de publicidade.

## 📋 Sumário

- [Meta Ads (Facebook/Instagram)](#meta-ads)
- [Google Ads](#google-ads)
- [TikTok Ads](#tiktok-ads)
- [Shopee Ads](#shopee-ads)
- [Sincronização de Dados](#sincronização-de-dados)
- [Dados de Demonstração](#dados-de-demonstração)

---

## 🔵 Meta Ads

### Credenciais Necessárias

1. **Access Token** (Meta Ads API)
   - Acesso: [Facebook Developers](https://developers.facebook.com)
   - Escopo: `ads_management`, `ads_read`
   - Variável: `META_ADS_ACCESS_TOKEN`

2. **Account ID** (Ad Account)
   - Formato: sem prefixo `act_` (apenas números)
   - Variável: `META_ADS_ACCOUNT_ID`
   - Exemplo: `1501790135057764` (Caminhos do Sul Gramado)

3. **Pixel ID** (opcional, para rastreamento de conversões)
   - Variável: `META_PIXEL_ID`

### Configuração

```bash
# .env.local
META_ADS_ACCESS_TOKEN="seu_access_token_aqui"
META_ADS_ACCOUNT_ID="seu_account_id"
META_PIXEL_ID="seu_pixel_id"
```

### Dados Sincronizados

- ✅ Campanhas (nome, objetivo, status)
- ✅ Métricas diárias (gasto, impressões, clicks, conversões, receita)
- ✅ Alcance (reach)
- ✅ Ações (purchases, leads, etc)

### Histórico de Dados

- **Caminhos do Sul Gramado** (`act_1501790135057764`)
  - Período: Últimos 30 dias
  - Campanhas ativas:
    - Transfer POA - Gramado (conversões)
    - City Tour Gramado (conversões)
  - Spend mensal: ~R$ 4.820
  - ROAS: ~2.3x

---

## 🟢 Google Ads

### Credenciais Necessárias

1. **Developer Token**
   - Acesso: [Google Ads API](https://developers.google.com/google-ads/api)
   - Variável: `GOOGLE_DEVELOPER_TOKEN`

2. **OAuth2 Credentials** (Client ID + Secret)
   - Redirect URI: `http://localhost:3000/api/auth/google/callback`
   - Variáveis: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

3. **Login Customer ID** (MCC, se aplicável)
   - Formato: números com hífens
   - Variável: `GOOGLE_LOGIN_CUSTOMER_ID`
   - Exemplo: `123-456-7890`

### Configuração

```bash
# .env.local
GOOGLE_DEVELOPER_TOKEN="sua_dev_token"
GOOGLE_CLIENT_ID="seu_client_id"
GOOGLE_CLIENT_SECRET="seu_client_secret"
GOOGLE_LOGIN_CUSTOMER_ID="123-456-7890"
```

### Dados Sincronizados

- Campanhas (nome, status, orçamento)
- Métricas diárias (gasto, impressions, clicks, conversões)
- Grupos de anúncios
- Tipos de campanha (Search, Display, Shopping, etc)

### Status

⚠️ **Não configurado** - Requer credenciais OAuth2 do Google

---

## 🎵 TikTok Ads

### Credenciais Necessárias

1. **Access Token** (TikTok Ads API)
   - Acesso: [TikTok for Developers](https://developer.tiktok.com)
   - Escopo: `analytics_read`, `campaign_read`
   - Variável: `TIKTOK_ACCESS_TOKEN`

2. **Business Account ID**
   - Formato: números
   - Variável: `TIKTOK_BUSINESS_ACCOUNT_ID`

### Configuração

```bash
# .env.local
TIKTOK_BUSINESS_ACCOUNT_ID="seu_account_id"
TIKTOK_ACCESS_TOKEN="seu_access_token"
```

### Dados Sincronizados

- Campanhas (nome, status, objetivo)
- Métricas diárias (gasto, impressões, clicks, conversões)
- Taxa de engajamento (engagement rate)

### Status

⚠️ **Não configurado** - Requer credenciais TikTok Developer

---

## 🧡 Shopee Ads

### Credenciais Necessárias

1. **Shop ID**
   - Formato: números
   - Variável: `SHOPEE_SHOP_ID`

2. **Partner ID + Partner Key** (Shopee API)
   - Acesso: [Shopee Seller Center](https://seller.shopee.com.br)
   - Variáveis: `SHOPEE_PARTNER_ID`, `SHOPEE_PARTNER_KEY`

### Configuração

```bash
# .env.local
SHOPEE_SHOP_ID="seu_shop_id"
SHOPEE_PARTNER_ID="seu_partner_id"
SHOPEE_PARTNER_KEY="sua_partner_key"
```

### Dados Sincronizados

- Anúncios (name, status, bid)
- Métricas diárias (gasto, impressões, clicks, vendas, ROI)
- Dados de produto

### Status

⚠️ **Não configurado** - Requer credenciais Shopee API

---

## 🔄 Sincronização de Dados

### Endpoint Manual

```bash
curl -X POST http://localhost:3000/api/sync/all-channels \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer seu_token" \
  -d '{"companyId": "caminhos-gramado", "days": 30}'
```

### Response

```json
{
  "ok": true,
  "message": "Sincronização concluída: 42 registros atualizados",
  "results": {
    "meta": { "synced": 35, "error": null },
    "google": { "synced": 0, "error": "Não configurado" },
    "tiktok": { "synced": 0, "error": "Não configurado" },
    "shopee": { "synced": 7, "error": null }
  },
  "timestamp": "2024-07-18T10:30:00Z"
}
```

### Agendamento (Cron)

```bash
# Sincronizar diariamente às 2 AM (UTC)
0 2 * * * curl -X POST http://localhost:3000/api/cron/sync-ads \
  -H "x-cron-secret: $CRON_SECRET"
```

---

## 📊 Dados de Demonstração

### Ativar Seed Completo

```bash
# Criar banco com dados de exemplo
npm run db:seed

# Ou com seed customizado
npx tsx prisma/seed-data.ts
```

### O que é criado

- ✅ 3 empresas (Caminhos do Sul, Multi Trip, Colchões Brasil)
- ✅ 5 contas de anúncios (1 por canal)
- ✅ 5 campanhas ativas
- ✅ 150 métricas diárias (30 dias × 5 campanhas)
- ✅ 45 leads gerados
- ✅ 28 vendas concluídas
- ✅ 32 conversões offline
- ✅ 12 conversas WhatsApp

### Credenciais Padrão

- **Email**: `eric@facaads.com`
- **Senha**: `Admin@123456`
- **Empresa Padrão**: Caminhos do Sul Gramado

---

## 📈 Estrutura de Dados

### Tabelas Principais

```prisma
AdAccount
  ├─ channel: "META" | "GOOGLE" | "TIKTOK" | "SHOPEE"
  ├─ externalAccountId: string
  ├─ accessToken: string?
  └─ campaigns: Campaign[]

Campaign
  ├─ name: string
  ├─ objective: string?
  ├─ externalCampaignId: string
  └─ snapshots: MetricSnapshot[]

MetricSnapshot (diária)
  ├─ date: Date
  ├─ spend: Decimal
  ├─ impressions: Int
  ├─ clicks: Int
  ├─ conversions: Int
  └─ conversionValue: Decimal?
```

---

## 🔐 Segurança

### Tokens & Secrets

- **Nunca** commitar `.env.local` no git
- Usar `.env.example` para documentar variáveis necessárias
- Rotacionar tokens periodicamente
- Usar webhooks `X-Secret` headers para validação

### Permissões

- **Admin**: Pode sincronizar, editar campanhas, ver todas as métricas
- **Analyst**: Pode visualizar relatórios, exportar dados
- **Viewer**: Acesso somente leitura a dashboards

---

## 🚀 Próximos Passos

1. **Meta Ads**: ✅ Configurado e testado
2. **Google Ads**: ⏳ Implementar autenticação OAuth2
3. **TikTok Ads**: ⏳ Implementar API integration
4. **Shopee Ads**: ⏳ Implementar API integration
5. **Webhooks**: ⏳ Receber conversões em tempo real
6. **IA Autônoma**: ⏳ Otimização automática de campanhas

---

## 📞 Suporte

Para dúvidas sobre configuração:
- [Meta Ads API Docs](https://developers.facebook.com/docs/marketing-api)
- [Google Ads API Docs](https://developers.google.com/google-ads/api)
- [TikTok Ads API Docs](https://business-api.tiktok.com)
- [Shopee API Docs](https://open.shopee.com/documents)
