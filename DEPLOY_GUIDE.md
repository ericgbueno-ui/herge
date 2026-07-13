# 🚀 Guia de Deploy - FacaADS Dashboard

## Vercel Deployment

### Pré-requisitos
- ✅ Repositório Git (GitHub, GitLab, Bitbucket)
- ✅ Conta Vercel (vercel.com)
- ✅ Neon Database URL

---

## Step 1: Preparar Repositório Git

```bash
cd "C:\projetos ia\Hergé"

# Adicionar remote do GitHub
git remote add origin https://github.com/seu-usuario/facaads.git

# Push para GitHub
git branch -M main
git push -u origin main
```

---

## Step 2: Conectar no Vercel

1. Acesse https://vercel.com/new
2. Clique em "Import Git Repository"
3. Selecione seu repositório (GitHub)
4. Vercel detectará Next.js automaticamente ✅

---

## Step 3: Configurar Environment Variables

No painel do Vercel, vá para **Settings → Environment Variables** e adicione:

### Database
```
DATABASE_URL = postgresql://neondb_owner:npg_tKYk7Frdfl4u@ep-hidden-term-ac4vckpp-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### Authentication
```
AUTH_SECRET = (gere com: openssl rand -base64 32)
```

### Meta Ads
```
META_BUSINESS_ACCOUNT_ID = seu_id
META_ACCESS_TOKEN = seu_token
META_PIXEL_ID = seu_pixel_id
```

### Google Ads
```
GOOGLE_DEVELOPER_TOKEN = seu_token
GOOGLE_CLIENT_ID = seu_client_id
GOOGLE_CLIENT_SECRET = seu_client_secret
GOOGLE_LOGIN_CUSTOMER_ID = seu_mcc_id
```

### TikTok Ads
```
TIKTOK_BUSINESS_ACCOUNT_ID = seu_id
TIKTOK_ACCESS_TOKEN = seu_token
```

### Webhooks & Cron
```
CRON_SECRET = (gere com: openssl rand -base64 32)
CONVERSION_WEBHOOK_SECRET = (gere com: openssl rand -base64 32)
```

---

## Step 4: Deploy

1. Clique em **Deploy** no Vercel
2. Aguarde ~2-3 minutos
3. Seu app estará em: `https://seu-projeto.vercel.app`

---

## Step 5: Testar Endpoints

Após o deploy:

### 1. Login
```
GET https://seu-projeto.vercel.app/login
```

### 2. Dashboard
```
GET https://seu-projeto.vercel.app/dashboard
```
(Requer autenticação)

### 3. Webhook de Conversão
```bash
curl -X POST https://seu-projeto.vercel.app/api/webhooks/conversion \
  -H "Authorization: Bearer $CONVERSION_WEBHOOK_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "channel": "GOOGLE",
    "campaign_id": "test-123",
    "source_type": "API",
    "amount": 100.00,
    "metadata": {"email": "test@example.com"}
  }'
```

### 4. Cron Jobs (automático)
- **Sync Ads:** 06:00 UTC diariamente
- **Detect Alerts:** Cada hora

---

## ⚠️ Troubleshooting

### Deploy falha com erro de type
```bash
# Local - rebuild e check
npm run build
```

### Cron jobs não executam
1. Verifique se `vercel.json` está presente
2. Confirme `CRON_SECRET` configurado
3. Acesse: `https://seu-projeto.vercel.app/api/cron/sync-ads?token=$CRON_SECRET`

### Database não conecta
1. Verifique DATABASE_URL no Vercel
2. Adicione IP de Vercel na whitelist do Neon
3. Teste localmente: `npm exec ts-node test-db-connection.ts`

### Webhook retorna 401
```bash
# Verifique o token
echo $CONVERSION_WEBHOOK_SECRET
```

---

## 📊 Monitorar Deploy

No painel Vercel:
- **Analytics:** Visualize usage, latency, status
- **Deployments:** Histórico de deploys
- **Environment:** Variáveis e secrets
- **Logs:** Função logs em tempo real

---

## 🔄 CI/CD

Após o deploy inicial:
- Cada push para `main` dispara novo build
- Pull requests geram preview deployments
- Rollback instantâneo se necessário

---

## 🆘 Suporte

Para problemas:
1. Verifique logs: `Vercel Dashboard → Deployments → Function Logs`
2. Teste localmente com `npm run dev`
3. Valide schema Prisma: `npx prisma validate`

---

**Status:** 🟢 Ready for deployment
