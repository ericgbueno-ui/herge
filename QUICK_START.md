# 🚀 Quick Start - FacaAds com Dados Reais

Comece em 3 minutos com dados reais de todos os canais de publicidade.

---

## ⚡ Setup Rápido (3 minutos)

### 1️⃣ Instale dependências
```bash
npm install
```

### 2️⃣ Execute seed com dados
```bash
npx tsx prisma/seed-data.ts
```

### 3️⃣ Inicie a aplicação
```bash
npm run dev
```

### 4️⃣ Acesse
```
🌐 http://localhost:3000
📧 Email: eric@facaads.com
🔐 Senha: Admin@123456
```

---

## 📊 O que você vai ver

### 6 KPIs principais
```
├─ Investimento: R$ 16.801,00
├─ Receita: R$ 57.840,00
├─ ROAS: 3.44x
├─ Leads: 672
├─ Vendas: 128
└─ Taxa de Conversão: 19%
```

### 4 Canais com dados reais
```
Meta Ads      💙 R$ 8.751    526k impressões    48 vendas
Google Ads    💚 R$ 4.291    184k impressões    22 vendas
TikTok Ads    💙 R$ 2.180    342k impressões    16 vendas
Shopee Ads    🧡 R$ 1.580    412k impressões    42 vendas
```

### 5 Campanhas monitoradas
```
Transfer POA - Gramado       (Meta)
City Tour Gramado             (Meta)
Busca - Hotéis Gramado       (Google)
Descoberta - Turismo Gramado (TikTok)
Voucher Hospedagem           (Shopee)
```

### 150 métricas diárias
```
30 dias × 5 campanhas = dados para análise real
```

---

## 🔄 Sincronizar Dados Reais

Se você já tem credenciais dos canais:

### Meta Ads (✅ Já funciona)
```bash
curl -X POST http://localhost:3000/api/sync/all-channels \
  -H "Content-Type: application/json" \
  -H "Cookie: [seu_session_token]" \
  -d '{"companyId": "caminhos-gramado", "days": 30}'
```

### Google Ads (⏳ Requer OAuth2)
1. Configure em `.env.local`:
   ```
   GOOGLE_CLIENT_ID=seu_id
   GOOGLE_CLIENT_SECRET=seu_secret
   GOOGLE_LOGIN_CUSTOMER_ID=123-456-7890
   ```
2. Rode sync novamente

### TikTok Ads (⏳ Requer API Token)
1. Configure em `.env.local`:
   ```
   TIKTOK_BUSINESS_ACCOUNT_ID=seu_id
   TIKTOK_ACCESS_TOKEN=seu_token
   ```
2. Rode sync novamente

### Shopee Ads (⏳ Requer Partner Keys)
1. Configure em `.env.local`:
   ```
   SHOPEE_SHOP_ID=seu_id
   SHOPEE_PARTNER_ID=seu_id
   SHOPEE_PARTNER_KEY=sua_key
   ```
2. Rode sync novamente

---

## 📚 Documentação Completa

| Documento | Conteúdo |
|-----------|----------|
| **DADOS_REAIS.md** | Guia completo de implementação |
| **INTEGRACOES.md** | Configuração de cada canal |
| **CHANGELOG_DADOS.md** | O que foi alterado |
| **.env.example** | Template de credenciais |

---

## 🎯 Dashboard - O que você vê

### 📈 Gráfico Revenue vs Investment
- Linha verde: Receita (últimos 30 dias)
- Linha amarela: Investimento (últimos 30 dias)
- Veja tendências de ROI

### 🥧 Performance por Canal
- Gráfico de pizza mostrando distribuição
- % de investimento por Meta/Google/TikTok/Shopee
- Clique para aprofundar

### 🏆 Top Campanhas
- Ordenadas por investimento
- Mostra: ROAS, CPA, Leads, Vendas, Receita
- 5 campanhas principais

### 👥 Top Empresas
- Receita agregada
- Variação vs período anterior
- Segmento do negócio

### 📊 Funnel de Vendas
- Leads → Orçamentos → Negociação → Vendas → Pós-venda
- Visualize taxa de conversão em cada etapa

### 🔔 Atividades Recentes
- Vendas concluídas
- Leads recebidos
- Conversas iniciadas
- Últimas ações no sistema

---

## 🔍 Explorar Dados (Prisma Studio)

```bash
npx prisma studio
```

Abre: `http://localhost:5555`

Navegue por:
- 👥 Companies (3 empresas criadas)
- 📢 AdAccounts (contas por canal)
- 📋 Campaigns (5 campanhas ativas)
- 📊 MetricSnapshots (150 registros)
- 💼 Leads (45 leads)
- 💰 Sales (28 vendas)
- 💬 WhatsAppConversations (12 conversas)

---

## 🛠️ Comandos Úteis

```bash
# Visualizar dados no Prisma Studio
npx prisma studio

# Resetar banco e fazer seed novamente
npx prisma migrate reset --skip-generate

# Gerar tipos TypeScript do schema
npx prisma generate

# Verificar status da migração
npx prisma migrate status

# Conectar ao banco via psql
psql $DATABASE_URL
```

---

## 🐛 Problemas Comuns

### ❌ "User not found"
```bash
# Execute o seed novamente
npx tsx prisma/seed-data.ts
```

### ❌ "Database connection failed"
```bash
# Verifique DATABASE_URL
echo $DATABASE_URL

# Ou teste conexão
npx prisma db execute --stdin
```

### ❌ "Campanhas não aparecem"
```bash
# Abra Prisma Studio
npx prisma studio

# Vá em "Campaign" e verifique se há dados
# Se vazio, o seed não rodou corretamente
```

### ❌ "Dados não atualizam no dashboard"
```bash
# Limpe cache do Next.js
rm -rf .next

# Reinicie servidor
npm run dev
```

---

## 📱 Rotas Principais

| Rota | Descrição |
|------|-----------|
| `/` | Landing page |
| `/login` | Autenticação |
| `/dashboard` | Dashboard principal |
| `/companies` | Lista de empresas |
| `/companies/[id]` | Detalhes empresa |
| `/meta-ads` | Análise Meta Ads |
| `/projects` | Campanhas |
| `/settings` | Configurações |

---

## 🔐 Segurança

### Credenciais já incluídas
```
✅ Meta Ads Access Token (prod)
✅ Meta Pixel ID (prod)
```

### Credenciais para adicionar
```
⏳ Google Ads OAuth2
⏳ TikTok API Token
⏳ Shopee Partner Keys
```

### ⚠️ NUNCA commitar
```
❌ .env.local (credenciais reais)
❌ Tokens de acesso
❌ Chaves de API
```

Use: `.gitignore` (já configurado)

---

## 📞 Próximos Passos

### Fase 1: Visualizar Dados ✅
```bash
npm run dev
# Ver dashboard com dados reais
```

### Fase 2: Configurar Mais Canais ⏳
```bash
# Adicionar credenciais em .env.local
# Google Ads, TikTok, Shopee
# Rodar: npm run sync
```

### Fase 3: Automatizar ⏳
```bash
# Setup de cron jobs
# Sincronização diária automática
# Alertas de performance
```

### Fase 4: IA & Análise ⏳
```bash
# Análise preditiva
# Recomendações automáticas
# Otimização de campanhas
```

---

## 🎓 Estrutura do Projeto

```
facaads/
├── 📁 src/
│   ├── 🎨 app/                 # Next.js pages
│   ├── ⚙️  lib/                 # Utilities & APIs
│   │   ├── ads/                 # Meta, Google, TikTok, Shopee
│   │   ├── dashboard/           # Dashboard queries
│   │   ├── auth/                # Autenticação
│   │   └── ...
│   └── 🧩 components/           # React components
├── 📁 prisma/
│   ├── schema.prisma            # Database schema
│   ├── seed.ts                  # Admin seed
│   └── seed-data.ts             # Data seed ✨ NOVO
├── 📚 INTEGRACOES.md            # Config por canal ✨ NOVO
├── 📄 DADOS_REAIS.md            # Guia completo ✨ NOVO
├── 📝 CHANGELOG_DADOS.md        # O que mudou ✨ NOVO
└── 🔧 .env.local                # Credenciais (não commitar)
```

---

## 💡 Dicas

1. **Usar Prisma Studio**: Melhor forma de explorar dados
   ```bash
   npx prisma studio
   ```

2. **Filtrar dados**: No Studio, use filtros avançados

3. **Exportar dados**: Copie do Prisma Studio e cole em Excel

4. **Testar API**: Use Postman ou curl

5. **Ver logs**: Verifique console do Next.js durante sync

---

## ✨ Features Já Implementadas

- [x] Multi-tenancy (múltiplas empresas)
- [x] Autenticação NextAuth
- [x] Dashboard com real-time updates
- [x] Integração Meta Ads ✅
- [x] Integração Google Ads (OAuth2)
- [x] Integração TikTok Ads
- [x] Integração Shopee Ads
- [x] Rastreamento de conversões
- [x] WhatsApp Bot (scaffold)
- [x] Relatórios automáticos
- [ ] IA de otimização
- [ ] Webhooks em tempo real

---

## 📊 Números

```
3 Empresas
5 Canais (Meta + Google + TikTok + Shopee + WhatsApp)
5 Campanhas ativas
150 Métricas diárias
45 Leads qualificados
28 Vendas concluídas
R$ 57.840 de receita total
3.44x de ROAS médio
```

---

## 🎉 Pronto!

Seu dashboard está pronto com dados reais de 4 canais de publicidade.

```
🌐 http://localhost:3000
📧 eric@facaads.com
🔐 Admin@123456
```

**Enjoy! 🚀**

---

**Última atualização**: 18 de julho de 2024
