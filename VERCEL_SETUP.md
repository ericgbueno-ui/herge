# ⚡ Setup Vercel - FacaADS

Seu repositório GitHub está pronto:
**https://github.com/ericgbueno-ui/facaads**

## 🚀 Deploy em 3 passos

### Step 1: Ir para Vercel
```
https://vercel.com/new
```

### Step 2: Importar Repositório
1. Clique em **"Import Git Repository"**
2. Cole: `https://github.com/ericgbueno-ui/facaads`
3. Clique em **"Continue"**

### Step 3: Adicionar Environment Variables

Vercel detectará Next.js automaticamente. Antes de clicar Deploy, configure as variáveis:

**Settings → Environment Variables**

```
DATABASE_URL = postgresql://neondb_owner:npg_tKYk7Frdfl4u@ep-hidden-term-ac4vckpp-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

AUTH_SECRET = (gere com: openssl rand -base64 32)

META_BUSINESS_ACCOUNT_ID = seu_id
META_ACCESS_TOKEN = seu_token
META_PIXEL_ID = seu_pixel_id

GOOGLE_DEVELOPER_TOKEN = seu_token
GOOGLE_CLIENT_ID = seu_client_id
GOOGLE_CLIENT_SECRET = seu_client_secret
GOOGLE_LOGIN_CUSTOMER_ID = seu_mcc_id

TIKTOK_BUSINESS_ACCOUNT_ID = seu_id
TIKTOK_ACCESS_TOKEN = seu_token

CRON_SECRET = (gere com: openssl rand -base64 32)
CONVERSION_WEBHOOK_SECRET = (gere com: openssl rand -base64 32)
```

### Step 4: Clicar Deploy

Vercel vai:
- ✅ Fazer build do projeto
- ✅ Rodar migrações do Prisma
- ✅ Ativar cron jobs
- ✅ Gerar URL da aplicação

---

## 📊 Após o Deploy

Seu app estará em:
```
https://facaads.vercel.app
```

**Endpoints disponíveis:**
- Dashboard: https://facaads.vercel.app/dashboard
- Webhook: https://facaads.vercel.app/api/webhooks/conversion
- Cron Jobs: Automático

---

## ⏱️ Tempo estimado: 3-5 minutos

Go! 🚀
