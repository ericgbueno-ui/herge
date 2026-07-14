# 🎯 Integração Meta Ads - Guia de Configuração

## O que você precisa:

1. **Access Token** do Meta Ads (Token de Acesso Permanente)
2. **Ad Account ID** (formato: `act_XXXXXXXXX`)

---

## Passo 1: Obter o Access Token

### No Facebook Developers Console:

1. **Acesse:** https://developers.facebook.com/tools/explorer/
2. **Selecione** a aplicação Meta Ads no dropdown
3. **Copie o token** que aparece em "Token de acesso"
4. **Exemplo:**
   ```
   EAARaezi6GDMBR00vvlOtDzbhUqI87lBrh6ZBSZBHxszXHlHbkhVvlNHZAYzGp6LrjWUe0FEwa2lQJS90dNlbdSA2wsjW4ZCyCsjUQLNVL3KCyQUNh7yOEAA9CdDDVSxp4cadKZBIdHizHwOtuuwfQjmbbdaWp2SEQgnV12L3FVBsdz1CQJoZCLdP0dtgw3lEXHmKFL6eqqEhtowJ4dgA7cdZBEbCd0kzTDiCZBZASdfXDFWUHsYCn
   ```

---

## Passo 2: Obter o Ad Account ID

### Opção A: Graph API Explorer

1. **No Graph API Explorer**, cole a query:
   ```
   GET /me/adaccounts?fields=id,name
   ```

2. **Procure por:**
   ```json
   {
     "id": "act_282622741300039843",
     "name": "Arquiteto de Sonhos - Gestor de Tráfego"
   }
   ```

### Opção B: Facebook Business Manager

1. **Acesse:** https://business.facebook.com/settings
2. **Vá para:** Contas de Negócios → Ad Accounts
3. **Copie o ID** (formato: `act_123456789...`)

---

## Passo 3: Configurar no Hergé

### No arquivo `.env.local`:

```env
META_ADS_ACCESS_TOKEN=EAARaezi6GDMBR00vvlOtDzbhUqI87lBrh6ZBSZBHxszXHlHbkhVvlNHZAYzGp6LrjWUe0FEwa2lQJS90dNlbdSA2wsjW4ZCyCsjUQLNVL3KCyQUNh7yOEAA9CdDDVSxp4cadKZBIdHizHwOtuuwfQjmbbdaWp2SEQgnV12L3FVBsdz1CQJoZCLdP0dtgw3lEXHmKFL6eqqEhtowJ4dgA7cdZBEbCd0kzTDiCZBZASdfXDFWUHsYCn

META_ADS_ACCOUNT_ID=act_282622741300039843
```

---

## Passo 4: Acessar o Dashboard

### No Hergé:

1. **Acesse:** `/projects`
2. **Clique em:** `📘 Meta Ads Dashboard`
3. **Pronto!** Todos os dados carregam automaticamente

---

## O que você verá:

✅ **KPI Cards:**
- 💰 Gasto Total (últimos 30 dias)
- 👁️ Impressões
- 🖱️ Cliques (com CTR%)
- 💵 CPC Médio

✅ **Tabela de Campanhas:**
- Nome da campanha
- Gasto, Impressões, Cliques
- CTR, CPC, Conversões
- CPA, ROAS

✅ **Histórico Diário:**
- Dados dia a dia
- Gasto, Impressões, Cliques, Alcance

---

## Atualizar os Dados

**Clique em "🔄 Atualizar Dados"** para buscar os dados mais recentes do Meta Ads.

**Ou acesse:** `/api/meta/insights` para ver os dados em JSON.

---

## Solucionar Problemas

### Erro: "Meta Ads credentials not configured"

- ✅ Verifique se `.env.local` tem as 2 variáveis
- ✅ Reinicie o servidor (`npm run dev`)
- ✅ Copie o token e ID **exatamente** como mostramos

### Erro: "Invalid access token"

- ✅ Gere um **novo token** no Graph API Explorer
- ✅ Verifique se a app tem permissão para `ads_read`
- ✅ O token pode expirar - renovar quando necessário

### Sem dados na tabela

- ✅ Aguarde 30 segundos (primeira carga)
- ✅ Verifique se tem campanhas ativas no Meta
- ✅ Clique "🔄 Atualizar Dados"

---

## Para Múltiplas Contas

Se tiver mais de uma conta Meta, você pode:

1. **Criar um `.env.local` por conta:**
   ```
   # Conta 1
   META_ADS_ACCESS_TOKEN=token1
   META_ADS_ACCOUNT_ID=act_123

   # (mudar para Conta 2, reiniciar, ver dados, etc)
   ```

2. **Ou conectar no `/settings`** (método multi-conta do Hergé)

---

## API Endpoint

Todos os dados vêm de:

```
GET /api/meta/insights
```

**Retorna JSON com:**
- `metrics` - KPI totals (spend, impressions, clicks, ctr, cpc)
- `campaigns` - Array de campanhas
- `dailyInsights` - Array de dados diários
- `dateRange` - Período dos dados

---

**Pronto! Seu Meta Ads está 100% integrado no Hergé! 🚀**
