# MASTER 04 PARTE 03: SCHEMA EXTENSION FOR ATTRIBUTION ENGINE

**Status:** Design Document (Ready to Migrate)  
**Data:** 18 de julho de 2026  
**Objective:** Extend existing Prisma schema with Attribution, Revenue Intelligence, and KPI models

---

## 🎯 OBJETIVO

Adicionar models ao schema EXISTENTE sem remover, alterar ou quebrar relacionamentos.

**Princípio:** Row-level Multi-tenancy via `companyId` em toda tabela sensível.

---

## 📊 NOVOS MODELS A ADICIONAR

### 1. **LEAD ATTRIBUTION** (rastreabilidade de origem)

```prisma
// Estender Lead model com relacionamentos de attribution
model Lead {
  // ... campos existentes ...
  
  // NOVOS campos de attribution
  attributionChannelId    String?
  attributionCampaignId   String?
  attributionAdSetId      String?
  attributionAdId         String?
  attributionCreativeId   String?
  
  // UTMs e dados de origem
  utm_source              String?
  utm_medium              String?
  utm_campaign            String?
  utm_term                String?
  utm_content             String?
  
  // Dispositivo/contexto
  device                  String?      // mobile|desktop|tablet
  browser                 String?
  os                      String?
  ip                      String?      // hasheado por segurança
  
  // Localização
  city                    String?
  state                   String?
  country                 String?
  latitude                Float?
  longitude               Float?
  
  // Rastreamento de pixel
  pixelId                 String?
  pixelFired              Boolean      @default(false)
  pixelFiredAt            DateTime?
  
  // Lead scoring
  score                   Int          @default(0)
  qualified              Boolean       @default(false)
  qualifiedAt            DateTime?
  
  // Relacionamentos
  attribution             LeadAttribution?
  journey                 LeadJourneyEvent[]
  deals                   Deal[]
  customer                Customer?
  
  @@index([companyId, attributionChannelId])
  @@index([companyId, qualified])
  @@index([createdAt, companyId])
}

// Novo model: Detalhe completo da atribuição
model LeadAttribution {
  id                    String   @id @default(cuid())
  companyId             String
  leadId                String   @unique
  
  // Attribution chain
  channel               String   // META|GOOGLE|TIKTOK|SHOPEE|ORGANIC|DIRECT|REFERRAL
  source                String   // campanhas, anúncios, etc
  
  // Campanha > AdSet > Ad > Creative
  campaignId            String?
  adSetId               String?
  adId                  String?
  creativeId            String?
  
  // Dados da atribuição
  firstTouchAt          DateTime  @default(now())
  lastTouchAt           DateTime  @updatedAt
  touchPoints           Int       @default(1)
  
  // Modelo de atribuição (para futuro)
  attributionModel      String    @default("last_click") // first_click|last_click|linear|time_decay
  weight                Float?    // peso neste modelo
  
  // Metadata da jornada
  journeyLength         Int       @default(1)
  journeyDuration       Int?      // em segundos
  touchPointsJson       Json?     // array de toques
  
  // Qualidade
  isRobot               Boolean   @default(false)
  isDuplicate           Boolean   @default(false)
  duplicateOf           String?   // referência para duplicata
  
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  lead                  Lead      @relation(fields: [leadId], references: [id], onDelete: Cascade)
  company               Company   @relation(fields: [companyId], references: [id], onDelete: Cascade)
  
  @@index([companyId, channel])
  @@index([leadId])
  @@index([isDuplicate])
  @@index([createdAt])
}

// Novo model: Eventos da jornada do lead
model LeadJourneyEvent {
  id              String   @id @default(cuid())
  leadId          String
  companyId       String
  
  eventType       String   // view|click|add_to_cart|initiate_checkout|purchase|message
  eventSource     String   // web|app|whatsapp|capi
  
  // Dados do evento
  url             String?
  referrer        String?
  eventData       Json?    // dados customizados
  
  // Contexto
  device          String?
  browser         String?
  
  timestamp       DateTime @default(now())
  
  lead            Lead     @relation(fields: [leadId], references: [id], onDelete: Cascade)
  company         Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  
  @@index([leadId, timestamp])
  @@index([companyId, eventType])
}
```

### 2. **REVENUE INTELLIGENCE** (rastreamento de receita)

```prisma
// Estender Sale model com rastreamento de receita
model Sale {
  // ... campos existentes ...
  
  // Rastreamento de origem (attribution)
  leadId              String?
  customerId          String?
  dealId              String?
  
  // Custos e lucro
  productCost         Decimal?  @db.Decimal(12, 2)
  discount            Decimal?  @db.Decimal(12, 2)
  tax                 Decimal?  @db.Decimal(12, 2)
  shipping            Decimal?  @db.Decimal(12, 2)
  
  // Cálculos
  netRevenue          Decimal?  @db.Decimal(12, 2)  // amount - discount
  grossProfit         Decimal?  @db.Decimal(12, 2)  // amount - productCost
  netProfit           Decimal?  @db.Decimal(12, 2)  // grossProfit - tax - shipping
  
  // Comissão e margem
  commissionRate      Float?    // percentual
  commission          Decimal?  @db.Decimal(12, 2)
  marginPercent       Float?    // lucro / revenue
  
  // Vendedor/responsável
  salePersonId        String?
  
  // Produtos
  products            SaleProduct[]
  
  // Relacionamentos
  lead                Lead?     @relation(fields: [leadId], references: [id], onDelete: SetNull)
  customer            Customer? @relation(fields: [customerId], references: [id], onDelete: SetNull)
  deal                Deal?     @relation(fields: [dealId], references: [id], onDelete: SetNull)
  
  @@index([customerId])
  @@index([leadId])
  @@index([dealId])
}

// Novo model: Detalhes de cada produto vendido
model SaleProduct {
  id          String   @id @default(cuid())
  companyId   String
  saleId      String
  
  productId   String
  productName String
  quantity    Int
  unitPrice   Decimal  @db.Decimal(12, 2)
  totalPrice  Decimal  @db.Decimal(12, 2)
  
  // Attribution (qual campanha vendeu este produto)
  campaignId  String?
  
  createdAt   DateTime @default(now())
  
  sale        Sale     @relation(fields: [saleId], references: [id], onDelete: Cascade)
  company     Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  
  @@index([companyId, productId])
  @@index([campaignId])
}

// Novo model: Relatório de receita por canal/campanha/período
model RevenueReport {
  id                  String   @id @default(cuid())
  companyId           String
  
  // Dimensão de agrupamento
  period              String   // day|week|month|year
  date                DateTime @db.Date
  
  // Por qual dimensão estamos agrupando
  channel             String?  // META|GOOGLE|etc (null = total)
  campaignId          String?  // (null = total)
  productId           String?  // (null = total)
  
  // Métricas
  totalRevenue        Decimal  @db.Decimal(12, 2) @default(0)
  totalCost           Decimal  @db.Decimal(12, 2) @default(0)
  totalProfit         Decimal  @db.Decimal(12, 2) @default(0)
  marginPercent       Float    @default(0)
  
  // Leads e conversões
  leads               Int      @default(0)
  sales               Int      @default(0)
  conversionRate      Float    @default(0)
  
  // Attribution
  firstTouchRevenue   Decimal? @db.Decimal(12, 2) // receita atribuível ao first touch
  lastTouchRevenue    Decimal? @db.Decimal(12, 2)
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  company             Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  
  @@unique([companyId, period, date, channel, campaignId, productId])
  @@index([companyId, date])
  @@index([channel])
}
```

### 3. **DEALS E PIPELINE** (negócios)

```prisma
// Novo model: Negócios/Oportunidades
model Deal {
  id              String   @id @default(cuid())
  companyId       String
  
  // Básico
  title           String
  description     String?
  
  // Lead e Cliente
  leadId          String
  customerId      String?
  
  // Pipeline
  pipelineId      String?
  stageId         String?
  
  // Valores
  value           Decimal  @db.Decimal(12, 2)
  probability     Float    @default(50) // 0-100
  expectedValue   Decimal? @db.Decimal(12, 2) // value * probability/100
  
  // Datas
  expectedCloseDate DateTime?
  closedAt        DateTime?
  
  // Status
  status          String   @default("open") // open|won|lost
  lostReason      String?  // Preço|Concorrência|Sem Interesse|etc
  
  // Responsável
  ownerUserId     String?
  
  // Relacionamentos
  sales           Sale[]
  
  lead            Lead     @relation(fields: [leadId], references: [id], onDelete: Restrict)
  customer        Customer? @relation(fields: [customerId], references: [id], onDelete: SetNull)
  company         Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([companyId, status])
  @@index([leadId])
  @@index([customerId])
  @@index([closedAt])
}

// Novo model: Pipeline e suas etapas
model Pipeline {
  id          String   @id @default(cuid())
  companyId   String
  
  name        String
  description String?
  isDefault   Boolean  @default(false)
  
  stages      PipelineStage[]
  
  company     Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([companyId])
}

model PipelineStage {
  id          String   @id @default(cuid())
  pipelineId  String
  
  name        String
  order       Int      // sequência
  color       String?  // para UI
  isFinal     Boolean  @default(false)
  isWon       Boolean  @default(false)
  
  pipeline    Pipeline @relation(fields: [pipelineId], references: [id], onDelete: Cascade)
  
  @@unique([pipelineId, order])
}
```

### 4. **CUSTOMER E CLIENTE PERMANENTE**

```prisma
// Novo model: Cliente (após venda)
model Customer {
  id              String   @id @default(cuid())
  companyId       String
  
  // Básico
  name            String
  email           String?
  phone           String?
  
  // Link com lead original
  leadId          String?
  
  // Dados de cliente
  type            String   @default("individual") // individual|company
  taxId           String?  // CPF/CNPJ
  
  // Histórico
  totalSpent      Decimal  @db.Decimal(12, 2) @default(0)
  ordersCount     Int      @default(0)
  averageOrderValue Decimal? @db.Decimal(12, 2)
  
  // Lifetime Value (LTV)
  ltv             Decimal? @db.Decimal(12, 2)
  ltv30Days       Decimal? @db.Decimal(12, 2)
  ltv90Days       Decimal? @db.Decimal(12, 2)
  ltv365Days      Decimal? @db.Decimal(12, 2)
  
  // Churn
  isActive        Boolean  @default(true)
  lastPurchaseAt  DateTime?
  churnRisk       Boolean  @default(false)
  
  // Score
  score           Int      @default(0)
  
  sales           Sale[]
  deals           Deal[]
  lead            Lead?    @relation(fields: [leadId], references: [id], onDelete: SetNull)
  company         Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@unique([companyId, email])
  @@index([companyId, isActive])
}
```

### 5. **KPI E MÉTRICAS**

```prisma
// Novo model: KPI Cache (para performance)
model KPISnapshot {
  id              String   @id @default(cuid())
  companyId       String
  
  // Período
  period          String   // day|week|month
  date            DateTime @db.Date
  
  // Funil
  impressions     Int      @default(0)
  clicks          Int      @default(0)
  leads           Int      @default(0)
  qualified       Int      @default(0)
  deals           Int      @default(0)
  sales           Int      @default(0)
  
  // Taxas
  ctr             Float    @default(0) // clicks/impressions
  ctc             Float    @default(0) // clicks/cost
  costPerLead     Float    @default(0)
  conversionRate  Float    @default(0) // sales/leads
  
  // Financeiro
  spend           Decimal  @db.Decimal(12, 2) @default(0)
  revenue         Decimal  @db.Decimal(12, 2) @default(0)
  profit          Decimal  @db.Decimal(12, 2) @default(0)
  marginPercent   Float    @default(0)
  
  // Retorno
  roas            Float    @default(0) // revenue/spend
  roi             Float    @default(0) // profit/spend
  
  company         Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  
  createdAt       DateTime @default(now())
  
  @@unique([companyId, period, date])
  @@index([companyId, date])
}

// Novo model: Objetivos e metas
model CompanyGoal {
  id              String   @id @default(cuid())
  companyId       String
  
  name            String
  metric          String   // leads|revenue|profit|roi|roas|conversions
  
  // Valores
  target          Decimal  @db.Decimal(12, 2)
  current         Decimal  @db.Decimal(12, 2) @default(0)
  
  // Período
  period          String   // week|month|quarter|year
  startDate       DateTime
  endDate         DateTime
  
  // Status
  status          String   @default("in_progress") // in_progress|completed|failed
  progress        Float    @default(0) // 0-100
  
  company         Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([companyId, period])
}

// Novo model: Alertas de KPI
model KPIAlert {
  id              String   @id @default(cuid())
  companyId       String
  
  name            String
  metric          String   // roas|cpa|ctr|etc
  
  condition       String   // greater_than|less_than|equal
  threshold       Float
  
  // Status
  triggered       Boolean  @default(false)
  triggeredAt     DateTime?
  dismissedAt     DateTime?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  company         Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  
  @@index([companyId, metric])
}
```

---

## 🔗 RELACIONAMENTOS NOVOS NO COMPANY

```prisma
model Company {
  // ... campos existentes ...
  
  // Attribution
  leads              Lead[]
  leadAttributions   LeadAttribution[]
  leadJourneyEvents  LeadJourneyEvent[]
  
  // Revenue
  customers          Customer[]
  deals              Deal[]
  sales              Sale[]
  saleProducts       SaleProduct[]
  revenueReports     RevenueReport[]
  
  // KPIs
  kpiSnapshots       KPISnapshot[]
  goals              CompanyGoal[]
  kpiAlerts          KPIAlert[]
  
  // Pipeline
  pipelines          Pipeline[]
}
```

---

## 🔐 ÍNDICES CRÍTICOS (Performance)

```prisma
// Lead Attribution - queries mais frequentes
@@index([companyId, createdAt])
@@index([companyId, channel])
@@index([isDuplicate])

// Lead Journey - aggregações por lead
@@index([leadId, timestamp])
@@index([companyId, eventType])

// Revenue - relatórios por data/channel
@@index([companyId, date])
@@index([channel])
@@index([campaignId])

// Deals - pipeline overview
@@index([companyId, status])
@@index([customerId])

// KPI - timeseries queries
@@index([companyId, date])
@@unique([companyId, period, date]) // para upsert
```

---

## 📋 MIGRATION STRATEGY

1. **Sem Data Loss:** Todos os campos são NULLABLE ou têm defaults
2. **Sem Breaking Changes:** Apenas ADIÇÕES ao schema
3. **Backward Compatible:** Código antigo funciona sem alterações
4. **Incremental:** Tabelas criadas conforme necessário

**Prisma Migration Command:**
```bash
npx prisma migrate dev --name add_attribution_engine
```

---

## ✅ VALIDAÇÃO

- [ ] Lead ja tem email/phone/campaign? Mapear para LeadAttribution
- [ ] Sale já tem campaignId? Atualizar RevenueReport
- [ ] Duplicatas de leads? Usar isDuplicate flag
- [ ] Migração sem interrupção? Test em staging primeiro

---

**Status:** Ready to Migrate  
**Impact:** Zero breaking changes  
**Performance:** Indexes otimizados para queries de attribution
