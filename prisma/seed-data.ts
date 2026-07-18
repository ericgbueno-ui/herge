import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed com dados reais...");

  // ============= CRIAR USUÁRIO ADMIN =============
  const adminEmail = "eric@facaads.com";
  const adminPassword = "Admin@123456";
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash },
    create: { email: adminEmail, name: "Eric Bueno", passwordHash },
  });
  console.log(`✅ Admin criado: ${adminEmail}`);

  // ============= CRIAR EMPRESAS =============
  const companies = await Promise.all([
    prisma.company.upsert({
      where: { id: "caminhos-gramado" },
      update: {},
      create: {
        id: "caminhos-gramado",
        name: "Caminhos do Sul Gramado",
        segment: "Turismo",
        responsibleName: "Roberto Silva",
        phone: "(54) 99999-0001",
        whatsapp: "(54) 99999-0001",
        city: "Gramado",
        state: "RS",
        website: "www.caminhosdsul.com.br",
        instagram: "@caminhosdosulgramado",
        facebook: "Caminhos do Sul",
        tiktok: "caminhosdosulgramado",
        notes: "Agência de turismo em Gramado - Foco em transfers, city tours e hospedagem",
      },
    }),
    prisma.company.upsert({
      where: { id: "multi-trip" },
      update: {},
      create: {
        id: "multi-trip",
        name: "Multi Trip Viagens",
        segment: "Turismo",
        responsibleName: "Juliana Costa",
        phone: "(51) 98888-0002",
        whatsapp: "(51) 98888-0002",
        city: "Porto Alegre",
        state: "RS",
        website: "www.multitrip.com.br",
        instagram: "@multitrip",
        facebook: "MultiTrip",
        notes: "Agência de viagens e turismo - Pacotes internacionais",
      },
    }),
    prisma.company.upsert({
      where: { id: "colchoes-brasil" },
      update: {},
      create: {
        id: "colchoes-brasil",
        name: "Colchões Brasil Premium",
        segment: "Mobiliário",
        responsibleName: "Marcos Ferreira",
        phone: "(11) 97777-0003",
        whatsapp: "(11) 97777-0003",
        city: "São Paulo",
        state: "SP",
        website: "www.colchoesbrasilpremium.com.br",
        instagram: "@colchoesbrasilpremium",
        notes: "Fabricante e distribuidor de colchões premium - E-commerce forte",
      },
    }),
  ]);
  console.log(`✅ Criadas ${companies.length} empresas`);

  // ============= ASSOCIAR USUÁRIO ÀS EMPRESAS =============
  for (const company of companies) {
    await prisma.companyUser.upsert({
      where: { userId_companyId: { userId: admin.id, companyId: company.id } },
      update: {},
      create: {
        userId: admin.id,
        companyId: company.id,
        role: "admin",
        isOwner: true,
      },
    });
  }
  console.log(`✅ Usuário associado às empresas`);

  // ============= CRIAR AD ACCOUNTS =============
  const caminhos = companies[0];
  const adAccounts = await Promise.all([
    // Meta - Caminhos do Sul
    prisma.adAccount.upsert({
      where: { channel_externalAccountId: { channel: "META", externalAccountId: "1501790135057764" } },
      update: {},
      create: {
        channel: "META",
        externalAccountId: "1501790135057764",
        name: "Meta Ads - Caminhos do Sul",
        accessToken: process.env.META_ADS_ACCESS_TOKEN || "",
        companyId: caminhos.id,
      },
    }),
    // Google - Caminhos do Sul
    prisma.adAccount.upsert({
      where: { channel_externalAccountId: { channel: "GOOGLE", externalAccountId: "7481234567" } },
      update: {},
      create: {
        channel: "GOOGLE",
        externalAccountId: "7481234567",
        name: "Google Ads - Caminhos do Sul",
        loginCustomerId: "1234567890",
        companyId: caminhos.id,
      },
    }),
    // TikTok - Caminhos do Sul
    prisma.adAccount.upsert({
      where: { channel_externalAccountId: { channel: "TIKTOK", externalAccountId: "1234567890123456" } },
      update: {},
      create: {
        channel: "TIKTOK",
        externalAccountId: "1234567890123456",
        name: "TikTok Ads - Caminhos do Sul",
        companyId: caminhos.id,
      },
    }),
    // Shopee - Caminhos do Sul
    prisma.adAccount.upsert({
      where: { channel_externalAccountId: { channel: "SHOPEE", externalAccountId: "987654321" } },
      update: {},
      create: {
        channel: "SHOPEE",
        externalAccountId: "987654321",
        name: "Shopee Ads - Caminhos do Sul",
        companyId: caminhos.id,
      },
    }),
  ]);
  console.log(`✅ Criadas ${adAccounts.length} contas de anúncios`);

  // ============= CRIAR CAMPANHAS =============
  const campaigns = await Promise.all([
    // Meta Campaign 1
    prisma.campaign.upsert({
      where: { adAccountId_externalCampaignId: { adAccountId: adAccounts[0].id, externalCampaignId: "23847293847" } },
      update: {},
      create: {
        adAccountId: adAccounts[0].id,
        externalCampaignId: "23847293847",
        name: "Transfer POA - Gramado",
        objective: "CONVERSIONS",
        companyId: caminhos.id,
      },
    }),
    // Meta Campaign 2
    prisma.campaign.upsert({
      where: { adAccountId_externalCampaignId: { adAccountId: adAccounts[0].id, externalCampaignId: "23847293848" } },
      update: {},
      create: {
        adAccountId: adAccounts[0].id,
        externalCampaignId: "23847293848",
        name: "City Tour Gramado",
        objective: "CONVERSIONS",
        companyId: caminhos.id,
      },
    }),
    // Google Campaign
    prisma.campaign.upsert({
      where: { adAccountId_externalCampaignId: { adAccountId: adAccounts[1].id, externalCampaignId: "98765432100" } },
      update: {},
      create: {
        adAccountId: adAccounts[1].id,
        externalCampaignId: "98765432100",
        name: "Busca - Hotéis Gramado",
        objective: "CONVERSIONS",
        companyId: caminhos.id,
      },
    }),
    // TikTok Campaign
    prisma.campaign.upsert({
      where: { adAccountId_externalCampaignId: { adAccountId: adAccounts[2].id, externalCampaignId: "tt_gramado_001" } },
      update: {},
      create: {
        adAccountId: adAccounts[2].id,
        externalCampaignId: "tt_gramado_001",
        name: "Descoberta - Turismo Gramado",
        objective: "CONVERSIONS",
        companyId: caminhos.id,
      },
    }),
    // Shopee Campaign
    prisma.campaign.upsert({
      where: { adAccountId_externalCampaignId: { adAccountId: adAccounts[3].id, externalCampaignId: "sh_gramado_001" } },
      update: {},
      create: {
        adAccountId: adAccounts[3].id,
        externalCampaignId: "sh_gramado_001",
        name: "Voucher Hospedagem",
        objective: "CONVERSIONS",
        companyId: caminhos.id,
      },
    }),
  ]);
  console.log(`✅ Criadas ${campaigns.length} campanhas`);

  // ============= CRIAR MÉTRICAS DIÁRIAS (últimos 30 dias) =============
  const today = new Date();
  const snapshots = [];

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    // Meta snapshots
    snapshots.push(
      prisma.metricSnapshot.upsert({
        where: { campaignId_date: { campaignId: campaigns[0].id, date } },
        update: {},
        create: {
          campaignId: campaigns[0].id,
          date,
          spend: Math.random() * 300 + 150,
          impressions: Math.floor(Math.random() * 8000 + 5000),
          clicks: Math.floor(Math.random() * 250 + 150),
          conversions: Math.floor(Math.random() * 8 + 3),
          conversionValue: Math.random() * 1500 + 800,
        },
      }),
      prisma.metricSnapshot.upsert({
        where: { campaignId_date: { campaignId: campaigns[1].id, date } },
        update: {},
        create: {
          campaignId: campaigns[1].id,
          date,
          spend: Math.random() * 250 + 120,
          impressions: Math.floor(Math.random() * 6000 + 4000),
          clicks: Math.floor(Math.random() * 200 + 100),
          conversions: Math.floor(Math.random() * 6 + 2),
          conversionValue: Math.random() * 1200 + 600,
        },
      }),
      prisma.metricSnapshot.upsert({
        where: { campaignId_date: { campaignId: campaigns[2].id, date } },
        update: {},
        create: {
          campaignId: campaigns[2].id,
          date,
          spend: Math.random() * 200 + 100,
          impressions: Math.floor(Math.random() * 4000 + 2500),
          clicks: Math.floor(Math.random() * 180 + 80),
          conversions: Math.floor(Math.random() * 5 + 1),
          conversionValue: Math.random() * 1000 + 500,
        },
      }),
      prisma.metricSnapshot.upsert({
        where: { campaignId_date: { campaignId: campaigns[3].id, date } },
        update: {},
        create: {
          campaignId: campaigns[3].id,
          date,
          spend: Math.random() * 150 + 80,
          impressions: Math.floor(Math.random() * 7000 + 4000),
          clicks: Math.floor(Math.random() * 300 + 150),
          conversions: Math.floor(Math.random() * 7 + 2),
          conversionValue: Math.random() * 800 + 400,
        },
      }),
      prisma.metricSnapshot.upsert({
        where: { campaignId_date: { campaignId: campaigns[4].id, date } },
        update: {},
        create: {
          campaignId: campaigns[4].id,
          date,
          spend: Math.random() * 120 + 60,
          impressions: Math.floor(Math.random() * 8000 + 5000),
          clicks: Math.floor(Math.random() * 280 + 120),
          conversions: Math.floor(Math.random() * 9 + 3),
          conversionValue: Math.random() * 900 + 450,
        },
      })
    );
  }

  await Promise.all(snapshots);
  console.log(`✅ Criadas ${snapshots.length} métricas diárias`);

  // ============= CRIAR LEADS =============
  const leads = [];
  for (let i = 0; i < 45; i++) {
    leads.push(
      prisma.lead.upsert({
        where: { companyId_email_phone: { companyId: caminhos.id, email: `lead${i}@example.com`, phone: "" } },
        update: {},
        create: {
          companyId: caminhos.id,
          name: `Lead ${i + 1} - Turismo`,
          email: `lead${i}@example.com`,
          phone: `(54) 9${Math.floor(Math.random() * 9000 + 1000)}-0000`,
          source: ["meta", "google", "tiktok"][Math.floor(Math.random() * 3)],
          campaign: campaigns[Math.floor(Math.random() * campaigns.length)].name,
          city: "Gramado",
          state: "RS",
          estimatedValue: Math.random() * 5000 + 1000,
          valueInvested: Math.random() * 300 + 50,
          campaignId: campaigns[Math.floor(Math.random() * campaigns.length)].id,
        },
      })
    );
  }
  await Promise.all(leads);
  console.log(`✅ Criados ${leads.length} leads`);

  // ============= CRIAR VENDAS =============
  const sales = [];
  for (let i = 0; i < 28; i++) {
    sales.push(
      prisma.sale.upsert({
        where: { id: `sale-${i}` },
        update: {},
        create: {
          id: `sale-${i}`,
          companyId: caminhos.id,
          amount: Math.random() * 5000 + 1500,
          profit: Math.random() * 1500 + 300,
          source: "campaigns",
          campaignId: campaigns[Math.floor(Math.random() * campaigns.length)].id,
          paymentStatus: i % 3 === 0 ? "pending" : "completed",
          productName: ["Transfer", "City Tour", "Hospedagem", "Pacote Completo"][Math.floor(Math.random() * 4)],
          quantity: Math.floor(Math.random() * 3 + 1),
        },
      })
    );
  }
  await Promise.all(sales);
  console.log(`✅ Criadas ${sales.length} vendas`);

  // ============= CRIAR CONVERSÕES OFFLINE =============
  const conversions = [];
  for (let i = 0; i < 32; i++) {
    conversions.push(
      prisma.conversionEvent.create({
        data: {
          campaignId: campaigns[Math.floor(Math.random() * campaigns.length)].id,
          channel: ["META", "GOOGLE", "TIKTOK", "SHOPEE"][Math.floor(Math.random() * 4)] as any,
          sourceType: "MANUAL",
          amount: Math.random() * 4000 + 500,
          companyId: caminhos.id,
          utm_source: "campaignsync",
          utm_campaign: campaigns[0].name,
        },
      })
    );
  }
  await Promise.all(conversions);
  console.log(`✅ Criadas ${conversions.length} conversões offline`);

  // ============= CRIAR CONVERSAS WHATSAPP =============
  const conversations = [];
  for (let i = 0; i < 12; i++) {
    conversations.push(
      prisma.whatsAppConversation.upsert({
        where: { companyId_phoneNumber: { companyId: caminhos.id, phoneNumber: `${55}11${99000000 + i}` } },
        update: {},
        create: {
          companyId: caminhos.id,
          phoneNumber: `${55}11${99000000 + i}`,
          status: Math.random() > 0.3 ? "open" : "closed",
          lastMessageAt: new Date(Date.now() - Math.random() * 86400000),
          averageResponseTime: Math.floor(Math.random() * 1800 + 120),
        },
      })
    );
  }
  await Promise.all(conversations);
  console.log(`✅ Criadas ${conversations.length} conversas WhatsApp`);

  // ============= INTEGRAÇÃO SHOPIFY =============
  await prisma.companyIntegration.upsert({
    where: { companyId_type: { companyId: caminhos.id, type: "SHOPIFY" } },
    update: {},
    create: {
      companyId: caminhos.id,
      type: "SHOPIFY",
      name: "Loja Shopify - Caminhos do Sul",
      status: "connected",
      connectedAt: new Date(),
    },
  });

  console.log(`\n✨ Seed concluído com sucesso!`);
  console.log(`📊 Resumo:`);
  console.log(`   - ${companies.length} empresas`);
  console.log(`   - ${adAccounts.length} contas de anúncios`);
  console.log(`   - ${campaigns.length} campanhas`);
  console.log(`   - ${snapshots.length} métricas diárias`);
  console.log(`   - ${leads.length} leads`);
  console.log(`   - ${sales.length} vendas`);
  console.log(`   - ${conversions.length} conversões`);
  console.log(`   - ${conversations.length} conversas WhatsApp`);
  console.log(`\n🔐 Admin: ${adminEmail} / ${adminPassword}`);
}

main()
  .catch((err) => {
    console.error("❌ Erro no seed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
