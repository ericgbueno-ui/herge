import type { DailyCampaignMetric } from "./types";

/**
 * Shopee Ads (Seller Center) não tem uma API pública confirmada de relatórios de campanha
 * pro público em geral — diferente do Shopee Open Platform (pedidos/produtos/logística),
 * que é documentado e é o que normalmente se associa a "API do Shopee".
 *
 * Enquanto isso não for confirmado/liberado, a entrada de dados é via CSV exportado
 * manualmente do painel de Ads do Seller Center (Marketing Centre > Relatórios).
 *
 * Os nomes de coluna abaixo são uma melhor tentativa e PRECISAM ser conferidos contra
 * um export real antes do primeiro uso — ajuste COLUMN_ALIASES se os nomes vierem diferentes.
 */

const COLUMN_ALIASES: Record<keyof RawRow, string[]> = {
  campaignId: ["id da campanha", "campaign id", "ad id"],
  campaignName: ["nome da campanha", "campaign name"],
  date: ["data", "date"],
  spend: ["gasto", "cost", "spend", "custo"],
  impressions: ["impressoes", "impressions"],
  clicks: ["cliques", "clicks"],
  conversions: ["conversoes", "conversions", "pedidos", "orders"],
  conversionValue: ["gmv", "conversion value", "valor de conversao"],
};

interface RawRow {
  campaignId: string;
  campaignName: string;
  date: string;
  spend: string;
  impressions: string;
  clicks: string;
  conversions: string;
  conversionValue: string;
}

function normalizeHeader(header: string): string {
  return header
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells;
}

function toIsoDate(value: string): string {
  // aceita "DD/MM/YYYY" ou "YYYY-MM-DD"
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) {
    const [, day, month, year] = match;
    return `${year}-${month}-${day}`;
  }
  throw new Error(`Formato de data não reconhecido no CSV do Shopee Ads: "${value}"`);
}

function parseNumber(value: string): number {
  const cleaned = value.replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, "");
  return Number(cleaned || 0);
}

export function parseShopeeAdsCsv(csvContent: string): DailyCampaignMetric[] {
  const lines = csvContent.split(/\r?\n/).filter((l: any) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map(normalizeHeader);

  function columnIndex(field: keyof RawRow): number {
    const aliases = COLUMN_ALIASES[field];
    const idx = headers.findIndex((h) => aliases.includes(h));
    if (idx === -1) {
      throw new Error(
        `Coluna pro campo "${field}" não encontrada no CSV. Cabeçalhos encontrados: ${headers.join(", ")}. Ajuste COLUMN_ALIASES em src/lib/ads/shopee.ts.`
      );
    }
    return idx;
  }

  const indexes = {
    campaignId: columnIndex("campaignId"),
    campaignName: columnIndex("campaignName"),
    date: columnIndex("date"),
    spend: columnIndex("spend"),
    impressions: columnIndex("impressions"),
    clicks: columnIndex("clicks"),
    conversions: columnIndex("conversions"),
    conversionValue: columnIndex("conversionValue"),
  };

  return lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    return {
      externalCampaignId: cells[indexes.campaignId],
      campaignName: cells[indexes.campaignName],
      date: toIsoDate(cells[indexes.date]),
      spend: parseNumber(cells[indexes.spend]),
      impressions: parseNumber(cells[indexes.impressions]),
      clicks: parseNumber(cells[indexes.clicks]),
      conversions: parseNumber(cells[indexes.conversions]),
      conversionValue: parseNumber(cells[indexes.conversionValue]),
    } satisfies DailyCampaignMetric;
  });
}
