# 🟢 Google Ads - Quick Config (5 Minutos)

## Status Atual
```
✅ Código implementado e pronto
✅ Endpoints criados
✅ Banco de dados estruturado
⏳ Aguardando: Credenciais OAuth2 do Google
```

---

## ⚡ Quick Setup

### 1️⃣ Google Cloud Console (2 min)

```bash
# Acesse
https://console.cloud.google.com

# Crie novo projeto
Project: "FacaAds"

# Ative API
Search: "Google Ads API" → Enable

# Criar OAuth2
APIs & Services → Credentials → Create → OAuth Client ID

Tipo: Web Application

URIs de origem autorizados:
  └─ http://localhost:3000

URIs de redirecionamento:
  └─ http://localhost:3000/api/auth/google/callback

Copie:
  ✅ Client ID
  ✅ Client Secret
```

### 2️⃣ Developer Token (2 min)

```bash
# Acesse
https://ads.google.com/dev

# Create Application
  Name: FacaAds
  Type: WEB
  URL: http://localhost:3000

Copie:
  ✅ Developer Token
```

### 3️⃣ Configurar .env.local (1 min)

```bash
# .env.local

GOOGLE_ADS_DEVELOPER_TOKEN="seu_dev_token_aqui"
GOOGLE_ADS_CLIENT_ID="seu_client_id.apps.googleusercontent.com"
GOOGLE_ADS_CLIENT_SECRET="seu_client_secret"

# Opcional (se usar MCC)
GOOGLE_ADS_LOGIN_CUSTOMER_ID="123-456-7890"
```

### 4️⃣ Reiniciar App

```bash
npm run dev
```

### 5️⃣ Autorizar no Dashboard

```
http://localhost:3000
→ Companies
→ [Empresa]
→ Integrações
→ Conectar Google Ads
→ Autorizar com conta Google
→ Pronto! ✅
```

---

## 📊 Resultado

Depois de configurar, você terá:

```
✅ Campanhas sincronizadas automaticamente
✅ Métricas diárias atualizadas
✅ ROI por campanha calculado
✅ Dados em tempo real no dashboard
✅ Sincronização agendada a cada 4 horas
```

---

## 🔗 Links Essenciais

| Link | O quê |
|------|-------|
| [Google Cloud Console](https://console.cloud.google.com) | Criar OAuth |
| [Google Ads Dev](https://ads.google.com/dev) | Developer Token |
| [Documentação Completa](./GOOGLE_ADS_SETUP.md) | Guia detalhado |

---

## ✅ Checklist

- [ ] Criar projeto Google Cloud
- [ ] Ativar Google Ads API
- [ ] Obter Developer Token
- [ ] Criar OAuth2 credentials
- [ ] Adicionar em .env.local
- [ ] Reiniciar `npm run dev`
- [ ] Autorizar no dashboard
- [ ] Verificar dados sincronizados

---

**Tempo total**: ~5 minutos  
**Dificuldade**: ⭐⭐ (Fácil)  
**Suporte**: Ver [GOOGLE_ADS_SETUP.md](./GOOGLE_ADS_SETUP.md)
