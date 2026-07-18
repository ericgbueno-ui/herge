# 🟢 Google Ads - Guia Completo de Integração

**Status**: ⏳ Estrutura pronta, aguardando credenciais OAuth2

---

## 📋 Resumo Executivo

O projeto **FacaAds** possui integração completa com **Google Ads API** para sincronizar:
- ✅ Campanhas (nome, tipo, ID externo)
- ✅ Métricas diárias (gasto, impressões, clicks, conversões, receita)
- ✅ Múltiplas contas simultâneas
- ✅ Refresh automático de tokens

**O que falta**: Apenas configurar credenciais OAuth2 do Google Cloud Console

---

## 🏗️ Arquitetura Implementada

### 1. **Autenticação OAuth2** (`src/lib/google-ads/auth.ts`)
```typescript
// Armazena refresh tokens de forma segura
storeGoogleAdsToken(payload: {
  refreshToken: string      // Obtido do OAuth
  customerId: string        // Ex: 1234567890
  accountName: string       // Nome amigável
})
```

**Endpoints**:
- `POST /api/auth/google/connect` - Conectar conta
- `GET /api/auth/google/accounts` - Listar contas conectadas

### 2. **Sincronização** (`src/lib/google-ads/sync.ts`)
```typescript
// Busca métricas diárias via Google Ads API
syncGoogleAdsAccount(account, days)
// Retorna: { campaigns: number, snapshots: number }
```

**Cron Job**:
- `GET /api/cron/sync-google-ads` - Sincroniza todas as contas (5 minutos em prod)

### 3. **Requisições à API** (`src/lib/ads/google.ts`)
```typescript
// Query GAQL para buscar campanhas e métricas
fetchGoogleAdsCampaignMetrics({
  customerId: string        // Customer ID (sem hífens)
  since: string            // YYYY-MM-DD
  until: string            // YYYY-MM-DD
})
```

---

## 🔑 Credenciais Necessárias

### Variáveis de Ambiente
```bash
# Obrigatório
GOOGLE_ADS_DEVELOPER_TOKEN="seu_dev_token_aqui"
GOOGLE_ADS_CLIENT_ID="seu_client_id.apps.googleusercontent.com"
GOOGLE_ADS_CLIENT_SECRET="seu_client_secret"

# Opcional (se usar MCC)
GOOGLE_ADS_LOGIN_CUSTOMER_ID="123-456-7890"

# Opcional (pode ser obtido durante OAuth)
GOOGLE_ADS_REFRESH_TOKEN="seu_refresh_token"
```

---

## 🚀 Setup Passo a Passo

### Passo 1: Criar Projeto no Google Cloud Console

1. Acesse: https://console.cloud.google.com
2. Crie um novo projeto chamado "FacaAds"
3. Aguarde 30 segundos para ativar

### Passo 2: Ativar Google Ads API

1. Vá para "APIs & Serviços" > "Biblioteca"
2. Busque "Google Ads API"
3. Clique em "Ativar"
4. Aguarde 1-2 minutos para ativar

### Passo 3: Obter Developer Token

1. Acesse: https://ads.google.com/dev
2. Clique em "Aplicações meu"
3. Crie uma nova aplicação:
   - Nome: FacaAds
   - Tipo: WEB
   - URL: http://localhost:3000
4. Copie o **Developer Token** (será usado em produção)
5. ⚠️ Inicialmente em "TEST", precisa ser aprovado pelo Google para produção

### Passo 4: Criar Credenciais OAuth2

1. No Google Cloud Console:
   - Vá para "APIs & Serviços" > "Credenciais"
   - Clique em "Criar Credenciais" > "ID de Cliente OAuth"
   - Selecione "Aplicativo Web"

2. Configure:
   - **Nome**: FacaAds
   - **URIs autorizados de origem**:
     ```
     http://localhost:3000
     http://127.0.0.1:3000
     https://seu-dominio.com (em produção)
     ```
   - **URIs de redirecionamento autorizados**:
     ```
     http://localhost:3000/api/auth/google/callback
     https://seu-dominio.com/api/auth/google/callback
     ```

3. Copie:
   - **Client ID**
   - **Client Secret**

### Passo 5: Adicionar Credenciais ao `.env.local`

```bash
# .env.local

# Google Ads - Credenciais Obrigatórias
GOOGLE_ADS_DEVELOPER_TOKEN="seu_dev_token_aqui"
GOOGLE_ADS_CLIENT_ID="seu_client_id.apps.googleusercontent.com"
GOOGLE_ADS_CLIENT_SECRET="seu_client_secret"

# Opcional: Se usar MCC (Manager Account)
GOOGLE_ADS_LOGIN_CUSTOMER_ID="123-456-7890"

# Será preenchido automaticamente após autorizar
# GOOGLE_ADS_REFRESH_TOKEN="será_obtido_do_oauth"
```

### Passo 6: Testar Fluxo OAuth

1. Reinicie aplicação:
   ```bash
   npm run dev
   ```

2. Acesse: http://localhost:3000/companies/[id]/integracoes

3. Clique em "Conectar Google Ads"

4. Autorize com sua conta Google

5. Você será redirecionado e o **Refresh Token** será salvo automaticamente

---

## 🔄 Fluxo de Autorização

```
┌─────────────────┐
│  App FacaAds    │
│  (Cliente)      │
└────────┬────────┘
         │
         │ 1. Redireciona para Google
         ↓
┌─────────────────────────────────────┐
│  Google OAuth2                      │
│  (User autoriza acesso)             │
└────────┬────────────────────────────┘
         │
         │ 2. Retorna com Authorization Code
         ↓
┌─────────────────┐
│  FacaAds        │
│  Backend        │
│  /api/auth/     │
│  google/        │
│  callback       │
└────────┬────────┘
         │
         │ 3. Troca code por tokens
         ↓
┌──────────────────────────┐
│  Google OAuth2           │
│  /token endpoint         │
└────────┬─────────────────┘
         │
         │ 4. Retorna access_token + refresh_token
         ↓
┌──────────────────────────┐
│  FacaAds DB              │
│  Armazena refresh_token  │
│  com segurança           │
└──────────────────────────┘
```

---

## 📊 Dados Sincronizados

### Campo: Campaign
```
├─ campaign.id                   (ID externo do Google)
├─ campaign.name                 (Nome da campanha)
├─ campaign.advertising_channel_type
│  ├─ SEARCH
│  ├─ DISPLAY
│  ├─ SHOPPING
│  ├─ VIDEO
│  └─ UNKNOWN
```

### Campo: Metrics (Diária)
```
├─ metrics.cost_micros          (Gasto em micros, ÷1.000.000)
├─ metrics.impressions          (Visualizações)
├─ metrics.clicks               (Cliques)
├─ metrics.conversions          (Conversões rastreadas)
└─ metrics.conversions_value    (Valor em conversões)
```

---

## 💾 Armazenamento no Banco

### Tabela: `AdAccount` (Google Ads)
```sql
channel:             'GOOGLE'
externalAccountId:   '1234567890'        -- Customer ID
name:                'Google Ads - Minha Empresa'
refreshToken:        '[ENCRYPTED]'       -- Armazenado com segurança
loginCustomerId:     '123-456-7890'      -- Opcional, se usar MCC
lastSyncedAt:        2024-07-18T10:30:00 -- Última sincronização
```

### Tabela: `Campaign` (Criadas a partir do Google Ads)
```sql
adAccountId:         [referência ao AdAccount]
externalCampaignId:  '123456789'         -- Campaign ID do Google
name:                'Search - Minha Empresa'
objective:           'SEARCH'            -- SEARCH, DISPLAY, etc.
companyId:           'caminhos-gramado'  -- Associada à empresa
```

### Tabela: `MetricSnapshot` (Métricas Diárias)
```sql
campaignId:          [referência à Campaign]
date:                2024-07-18
spend:               250.50              -- Em BRL
impressions:         5000
clicks:              150
conversions:         12
conversionValue:     2500.00
```

---

## 🔌 Endpoints da API

### 1. Conectar Conta Google Ads
```bash
POST /api/auth/google/connect

Body:
{
  "refreshToken": "token_obtido_do_oauth",
  "customerId": "1234567890",
  "accountName": "Google Ads - Minha Empresa"
}

Response:
{
  "ok": true,
  "message": "Google Ads account connected successfully",
  "account": {
    "id": "clk123abc",
    "name": "Google Ads - Minha Empresa",
    "externalId": "1234567890"
  }
}
```

### 2. Listar Contas Conectadas
```bash
GET /api/auth/google/accounts

Response:
{
  "ok": true,
  "accounts": [
    {
      "id": "clk123abc",
      "name": "Google Ads - Minha Empresa",
      "externalId": "1234567890",
      "lastSyncedAt": "2024-07-18T10:30:00Z"
    }
  ]
}
```

### 3. Sincronizar (Cron Job)
```bash
GET /api/cron/sync-google-ads
Header: Authorization: Bearer {CRON_SECRET}

Response:
{
  "ok": true,
  "message": "Synced 2/2 Google Ads accounts",
  "results": [
    {
      "account": "Google Ads - Minha Empresa",
      "ok": true,
      "campaigns": 5,
      "snapshots": 150
    }
  ]
}
```

---

## 🐛 Troubleshooting

### ❌ "GOOGLE_ADS_DEVELOPER_TOKEN não configurado"
**Solução:**
```bash
# 1. Obter developer token em: https://ads.google.com/dev
# 2. Adicionar em .env.local
GOOGLE_ADS_DEVELOPER_TOKEN="seu_token"
# 3. Reiniciar aplicação
npm run dev
```

### ❌ "Invalid refresh token"
**Causa:** Token expirou ou foi revogado  
**Solução:**
1. Desconectar a conta
2. Autorizar novamente (novo OAuth flow)
3. Novo refresh token será salvo

### ❌ "Developer Token is invalid"
**Causa:** Token é de teste, não funciona em produção  
**Solução:**
1. Solicitar acesso de produção em: https://ads.google.com/dev
2. Google aprova em 2-3 dias úteis
3. Usar novo token em produção

### ❌ "Unauthorized redirect_uri"
**Causa:** URL de redirecionamento não está configurada  
**Solução:**
1. Ir ao Google Cloud Console
2. Credenciais > Editar OAuth Client
3. Adicionar URLs:
   - http://localhost:3000/api/auth/google/callback
   - https://seu-dominio.com/api/auth/google/callback

### ❌ "Dados não sincronizam"
**Verificar:**
```bash
# 1. Verificar se conta tem refresh token
npx prisma studio
# Ir em AdAccount, filtrar por channel = "GOOGLE"
# Verificar se refreshToken está preenchido

# 2. Testar acesso token manualmente
curl -X POST https://oauth2.googleapis.com/token \
  -d "client_id=YOUR_CLIENT_ID&client_secret=YOUR_SECRET&refresh_token=REFRESH_TOKEN&grant_type=refresh_token"

# 3. Ver logs
npm run dev
# Procurar por erros de sincronização
```

---

## 📈 Exemplo: Campanhas Sincronizadas

Após configurar e sincronizar, você verá no dashboard:

```
┌─────────────────────────────────────────┐
│  Google Ads - Campanhas Sincronizadas   │
├─────────────────────────────────────────┤
│                                         │
│  1. Search - Minha Empresa              │
│     Tipo: SEARCH                        │
│     Spend: R$ 2.150,00                  │
│     Impressões: 85.000                  │
│     Clicks: 1.240                       │
│     Conversões: 18                      │
│     Taxa de Conversão: 2,1%             │
│     CPC: R$ 1,73                        │
│                                         │
│  2. Display - Remarketing               │
│     Tipo: DISPLAY                       │
│     Spend: R$ 890,50                    │
│     Impressões: 42.000                  │
│     Clicks: 520                         │
│     Conversões: 8                       │
│     Taxa de Conversão: 1,5%             │
│     CPC: R$ 1,71                        │
│                                         │
│  3. YouTube - Brand Awareness           │
│     Tipo: VIDEO                         │
│     Spend: R$ 1.250,00                  │
│     Impressões: 580.000                 │
│     Views: 125.000                      │
│     Conversões: 12                      │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🔐 Segurança

### Armazenamento de Tokens
- ✅ Refresh tokens armazenados encriptados no banco
- ✅ Access tokens obtidos dinamicamente (expiram em 1 hora)
- ✅ Regeneração automática de tokens
- ✅ Nunca armazenar access tokens permanentemente

### Permissões Mínimas
```
✅ googleads.readonly    // Ler campanhas e métricas
❌ googleads.manage      // Não modificar campanhas
```

### Em Produção
```bash
# 1. Usar HTTPS obrigatoriamente
# 2. Validar CRON_SECRET em sync endpoints
# 3. Renovar OAuth tokens periodicamente
# 4. Usar variáveis de ambiente seguras
# 5. Não commitar .env.local com tokens reais
```

---

## 📅 Agendamento de Sincronização

### Desenvolvimento (Manual)
```bash
# Sincronizar manualmente
curl -X GET http://localhost:3000/api/cron/sync-google-ads \
  -H "Authorization: Bearer $CRON_SECRET"
```

### Produção (Automático)

**Opção 1: Vercel Cron**
```
vercel.json:
{
  "crons": [{
    "path": "/api/cron/sync-google-ads",
    "schedule": "0 */4 * * *"  // A cada 4 horas
  }]
}
```

**Opção 2: External Cron Service**
```
Service: EasyCron ou cronapp.io
Endpoint: https://seu-dominio.com/api/cron/sync-google-ads
Header: Authorization: Bearer $CRON_SECRET
Intervalo: 4-6 horas
```

---

## 📚 Documentação Adicional

- [Google Ads API Docs](https://developers.google.com/google-ads/api)
- [GAQL Reference](https://developers.google.com/google-ads/api/fields/v21)
- [OAuth2 Flow](https://developers.google.com/identity/protocols/oauth2/web-server-flow)
- [Customer IDs](https://support.google.com/google-ads/answer/1704344)

---

## ✅ Checklist de Implementação

- [ ] Criar projeto no Google Cloud Console
- [ ] Ativar Google Ads API
- [ ] Obter Developer Token (https://ads.google.com/dev)
- [ ] Criar OAuth2 Client ID
- [ ] Configurar redirect URIs
- [ ] Adicionar credenciais em `.env.local`
- [ ] Testar autorização OAuth
- [ ] Verificar sincronização funciona
- [ ] Confirmar dados aparecem no dashboard
- [ ] Configurar cron job em produção
- [ ] Validar segurança (HTTPS, secrets, etc)

---

## 🚀 Próximas Funcionalidades

- [ ] Modificar campanhas via API (bids, budgets)
- [ ] Criar campanhas automaticamente
- [ ] Pausar/retomar campanhas
- [ ] A/B testing automático
- [ ] Otimização por IA
- [ ] Relatórios preditivos

---

**Último Update**: 18 de julho de 2024  
**Status**: ⏳ Aguardando OAuth2  
**Prioridade**: 🔴 Alta (1º canal a configurar após Meta)
