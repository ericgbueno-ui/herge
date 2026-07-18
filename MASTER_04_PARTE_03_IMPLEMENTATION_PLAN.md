# MASTER 04 PARTE 03: MARKETING INTELLIGENCE
## Implementation Plan - Attribution Engine + Revenue Intelligence

**Status:** Fase 1 Completa - Architecture Ready  
**Data:** 18 de julho de 2026  
**Total Effort:** 80-120 horas (2-3 sprints)

---

## 🎯 OBJETIVO

Transformar HERGÉ em um motor de inteligência que **rastreia o cliente do primeiro clique até o pós-venda**, respondendo:

- ✅ Qual campanha gera mais lucro?
- ✅ Qual anúncio vende mais?
- ✅ Qual criativo gera maior ticket médio?
- ✅ Qual vendedor converte melhor leads do Google?
- ✅ Quanto custa adquirir um cliente?
- ✅ Qual é o retorno financeiro de cada canal?

---

## 📋 FASE 1: ARQUITETURA BASE (COMPLETA)

### ✅ Deliverables

```
✅ Schema Extension (14 novos models)
   ├── LeadAttribution (rastreamento de origem)
   ├── LeadJourneyEvent (eventos da jornada)
   ├── Deal (negócios/oportunidades)
   ├── Pipeline (pipeline configurável)
   ├── Customer (cliente permanente)
   ├── SaleProduct (produtos vendidos)
   ├── RevenueReport (cache de receita)
   ├── KPISnapshot (cache de KPIs)
   ├── CompanyGoal (objetivos)
   ├── KPIAlert (alertas de KPI)
   └── ... (mais 4 models)

✅ Core Services
   ├── AttributionService (Lead → Deal → Sale)
   ├── KPIService (Calcular métricas)
   └── (Preparado para: RevenueService, ReportService)

✅ Documentação
   ├── MASTER_04_PARTE_03_SCHEMA_EXTENSION.md
   ├── MASTER_04_PARTE_03_IMPLEMENTATION_PLAN.md
   └── Arquitetura pronta
```

---

## 📅 PRÓXIMAS FASES

### FASE 2: DATABASE + MIGRATIONS (3-4 dias)

**Tarefas:**
- [ ] Executar Prisma migration (criar todos os 14 modelos)
- [ ] Validar relacionamentos
- [ ] Criar índices otimizados
- [ ] Seed data para testes
- [ ] Backup strategy

**Effort:** 8-12 horas

---

### FASE 3: ATTRIBUTION CORE (5-7 dias)

**Implementar:**
- [ ] `attributeLead()` - Auto-rastrear quando lead entra
- [ ] `recordJourneyEvent()` - Log de todos os eventos
- [ ] `attributeDeal()` - Link lead → deal
- [ ] `attributeSale()` - Link deal → sale → revenue
- [ ] `convertToCustomer()` - Lead → cliente permanente
- [ ] Lead deduplication (mesmo email/phone)
- [ ] Lead scoring automático

**Testing:**
- [ ] Unit tests para cada método
- [ ] Integration tests (flow completo)
- [ ] Performance tests (1000+ leads)

**Effort:** 20-30 horas

---

### FASE 4: KPI CALCULATION ENGINE (5-7 dias)

**Implementar:**
- [ ] `calculateKPIs()` - Funil completo (impressions → clientes)
- [ ] `getCampaignKPI()` - KPI por campanha
- [ ] `rankCampaignsByProfit()` - Qual vende mais
- [ ] `rankProductsByRevenue()` - Qual produto mais receita
- [ ] `rankSellersByConversion()` - Qual vendedor converte melhor
- [ ] `comparePeriods()` - Comparativos (dia/semana/mês)
- [ ] `getCACByChannel()` - Custo de aquisição por canal
- [ ] KPI Snapshot cache (performance)

**Metrics to calculate:**
```
CTR = clicks / impressions
CAC = spend / customers
CPA = spend / sales
ROAS = revenue / spend
ROI = profit / spend
LTV = customer lifetime value
CLTV = LTV / CAC
Margin = profit / revenue
Conversion Rate = sales / leads
```

**Effort:** 24-35 horas

---

### FASE 5: RELATÓRIOS MULTI-DIMENSIONAIS (5-7 dias)

**Criar ReportService com queries otimizadas para:**
- [ ] Relatório por canal (Meta|Google|TikTok|Shopee|Organic)
- [ ] Relatório por campanha
- [ ] Relatório por produto
- [ ] Relatório por cidade/estado
- [ ] Relatório por empresa (multi-tenant)
- [ ] Relatório por usuário/vendedor
- [ ] Relatório por período (dia/semana/mês)

**Queries devem incluir:**
```
- Paginação (1000+ registros)
- Filtros (datas, canais, etc)
- Ordenação (ROI desc, receita desc)
- Cache (1 minuto)
```

**Effort:** 18-24 horas

---

### FASE 6: DASHBOARD ENTERPRISE (7-10 dias)

**Components:**
- [ ] KPI Cards (Receita, Lucro, ROI, ROAS, CAC, LTV)
- [ ] Funnel Chart (impressions → clientes)
- [ ] Revenue Breakdown (por canal/campanha)
- [ ] Performance Heatmap
- [ ] Rankings (campanhas, produtos, vendedores)
- [ ] Timeline (histórico de eventos)
- [ ] Comparativos (hoje vs ontem, 7d, 30d, 90d, 12m)
- [ ] Empty States elegantes (sem dados fictícios)

**Libraries:**
- Recharts (charts)
- React Query (data fetching + cache)
- Tailwind CSS (styling)

**Effort:** 30-40 horas

---

### FASE 7: BUSCA + EXPORTAÇÃO (3-4 dias)

**Busca Global:**
- [ ] Search campaigns
- [ ] Search leads
- [ ] Search customers
- [ ] Search products
- [ ] Full-text search

**Exportação:**
- [ ] CSV export
- [ ] Excel export
- [ ] PDF export (relatórios)

**Effort:** 10-15 horas

---

### FASE 8: ALERTAS + SCORING (3-4 dias)

**KPI Alerts:**
- [ ] ROAS caiu abaixo de X
- [ ] CPA aumentou acima de X
- [ ] Campanha parada (sem cliques)
- [ ] Pixel desconectado
- [ ] Conta expirada

**Scoring:**
- [ ] Lead Score automático
- [ ] Customer Score automático
- [ ] Campaign Score automático

**Effort:** 12-16 horas

---

### FASE 9: APIs + DOCUMENTAÇÃO (2-3 dias)

**REST APIs:**
```
GET    /api/v1/kpis                      KPIs do período
GET    /api/v1/kpis/campaigns/:id        KPI de campanha
GET    /api/v1/reports/by-channel        Relatório por canal
GET    /api/v1/reports/by-campaign       Relatório por campanha
POST   /api/v1/leads/:id/events          Registrar evento
GET    /api/v1/attribution/:leadId       Cadeia de atribuição
```

**Documentation:**
- [ ] README (arquitetura)
- [ ] API docs
- [ ] Example queries
- [ ] Performance tips

**Effort:** 8-12 horas

---

## 🗂️ ESTRUTURA DE ARQUIVOS A CRIAR

```
src/core/revenue-intelligence/
├── services/
│   ├── attribution-service.ts       ✅ (CRIADO)
│   ├── kpi-service.ts               ✅ (CRIADO)
│   ├── report-service.ts            📝 TODO
│   ├── funnel-service.ts            📝 TODO
│   └── index.ts
│
├── repositories/
│   ├── kpi-repository.ts            📝 TODO
│   ├── report-repository.ts         📝 TODO
│   └── index.ts
│
├── hooks/
│   ├── useKPIs.ts                   📝 TODO
│   ├── useReports.ts                📝 TODO
│   └── index.ts
│
├── components/
│   ├── KPICard.tsx                  📝 TODO
│   ├── FunnelChart.tsx              📝 TODO
│   ├── RevenueChart.tsx             📝 TODO
│   ├── RankingTable.tsx             📝 TODO
│   └── ...
│
├── pages/
│   ├── dashboard.tsx                📝 TODO
│   ├── reports.tsx                  📝 TODO
│   ├── attribution.tsx              📝 TODO
│   └── ...
│
├── api/
│   ├── kpis.ts                      📝 TODO
│   ├── reports.ts                   📝 TODO
│   └── ...
│
├── types/
│   ├── kpi.ts                       📝 TODO
│   ├── report.ts                    📝 TODO
│   └── index.ts
│
└── README.md                         📝 TODO
```

---

## 🔐 MULTI-TENANCY CHECKLIST

- [ ] Todo query filtra por `companyId`
- [ ] Nenhuma query sem `companyId` na cláusula WHERE
- [ ] Permissões: `can_view_reports`, `can_create_goals`, etc
- [ ] Isolamento de dados testado
- [ ] Rate limiting por tenant

---

## 🚀 PRIORIZAÇÃO

**MUST HAVE (Sprint 1-2):**
1. Schema migration
2. AttributionService (core)
3. KPIService (core)
4. Dashboard básico (5 cards)

**SHOULD HAVE (Sprint 2-3):**
5. Relatórios multi-dimensionais
6. Busca global
7. Exportação (CSV/Excel)

**NICE TO HAVE (Sprint 3):**
8. Alertas avançados
9. Scoring automático
10. APIs GraphQL

---

## 📊 MÉTRICAS DE SUCESSO

Após MASTER 04 Parte 03, o sistema deve responder:

1. ✅ "Qual campanha gera mais lucro?" (em < 500ms)
2. ✅ "Qual é o CAC por canal?" (em < 1s)
3. ✅ "Qual produto vende mais?" (ranking top 10)
4. ✅ "Qual vendedor converte melhor?" (score automático)
5. ✅ "Qual é o retorno de cada real gasto?" (ROAS por canal)
6. ✅ "Qual é a jornada completa de um cliente?" (timeline)
7. ✅ "Comparativo: este mês vs mês passado?" (deltas com %)
8. ✅ "Receita em tempo real?" (atualizado a cada venda)

---

## 📚 DOCUMENTAÇÃO A GERAR

1. **Mapa do Attribution Engine**
   - Fluxo: Lead → Journey → Deal → Sale → Revenue
   - Relacionamentos: Campaign → Lead → Customer

2. **Mapa dos KPIs**
   - Quais métricas calculamos
   - Como calcular cada uma
   - Performance expectations

3. **Mapa do Revenue Engine**
   - Receita por canal
   - Receita por campanha
   - Receita por produto

4. **Mapa dos Relatórios**
   - Relatórios disponíveis
   - Como usar cada um
   - Performance tips

---

## ⏱️ TIMELINE ESTIMADA

```
Semana 1: Fases 1-2 (Schema + Migrations)
Semana 2: Fase 3 (Attribution Core)
Semana 3: Fase 4 (KPI Calculation)
Semana 4: Fase 5 (Relatórios)
Semana 5: Fase 6 (Dashboard)
Semana 6: Fases 7-8 (Busca + Alertas)
Semana 7: Fase 9 (APIs + Docs)

Total: 7 semanas (ou 2-3 sprints intensivos)
Esforço: 80-120 horas
Team: 1-2 developers full-time
```

---

## 🎯 PRÓXIMA AÇÃO

**Imediatamente após aprovação:**
1. Executar Prisma migration (criar models)
2. Começar implementação de Phase 2
3. Testar fluxo completo Lead → Customer

---

**Status:** Ready for Phase 2 (Database Migration)  
**Blocker:** Nenhum  
**Risk:** Low (arquitetura validada, sem breaking changes)
