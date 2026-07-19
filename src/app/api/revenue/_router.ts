import { NextRequest, NextResponse } from 'next/server';

import * as analysisRoute from '@/api/routes/revenue/analysis/route';
import * as commissionsAttendantRoute from '@/api/routes/revenue/commissions/attendant/route';
import * as commissionsReportsRoute from '@/api/routes/revenue/commissions/reports/route';
import * as commissionsIdRoute from '@/api/routes/revenue/commissions/[id]/route';
import * as commissionsRoute from '@/api/routes/revenue/commissions/route';
import * as forecastsRoute from '@/api/routes/revenue/forecasts/route';
import * as goalsIdRoute from '@/api/routes/revenue/goals/[id]/route';
import * as goalsRoute from '@/api/routes/revenue/goals/route';
import * as indicatorsBulkRoute from '@/api/routes/revenue/indicators/bulk/route';
import * as indicatorsIdRoute from '@/api/routes/revenue/indicators/[id]/route';
import * as indicatorsRoute from '@/api/routes/revenue/indicators/route';
import * as kpisRoute from '@/api/routes/revenue/kpis/route';
import * as lossesAnalyticsRoute from '@/api/routes/revenue/losses/analytics/route';
import * as lossesIdRoute from '@/api/routes/revenue/losses/[id]/route';
import * as lossesRoute from '@/api/routes/revenue/losses/route';
import * as rankingsScoreRoute from '@/api/routes/revenue/rankings/score/route';
import * as rankingsRoute from '@/api/routes/revenue/rankings/route';
import * as salesActionsRoute from '@/api/routes/revenue/sales/actions/route';
import * as salesIdRoute from '@/api/routes/revenue/sales/[id]/route';
import * as salesMetricsRoute from '@/api/routes/revenue/sales/metrics/route';
import * as salesRoute from '@/api/routes/revenue/sales/route';

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';
type RouteModule = Partial<Record<Method, (req: NextRequest, context?: { params: Record<string, string> }) => Promise<Response>>>;

function methodNotAllowed(method: string) {
  return NextResponse.json(
    { error: `Method ${method} not allowed on this endpoint` },
    { status: 405 }
  );
}

async function invoke(
  module: RouteModule,
  method: Method,
  req: NextRequest,
  params?: Record<string, string>
) {
  const handler = module[method];
  if (!handler) {
    return methodNotAllowed(method);
  }

  return handler(req, params ? { params } : undefined);
}

function revenueIndex() {
  return NextResponse.json({
    service: 'revenue',
    endpoints: [
      '/api/revenue/sales',
      '/api/revenue/sales/:id',
      '/api/revenue/sales/metrics',
      '/api/revenue/sales/actions',
      '/api/revenue/kpis',
      '/api/revenue/rankings',
      '/api/revenue/rankings/score',
      '/api/revenue/goals',
      '/api/revenue/goals/:id',
      '/api/revenue/losses',
      '/api/revenue/losses/:id',
      '/api/revenue/losses/analytics',
      '/api/revenue/indicators',
      '/api/revenue/indicators/:id',
      '/api/revenue/indicators/bulk',
      '/api/revenue/commissions',
      '/api/revenue/commissions/:id',
      '/api/revenue/commissions/attendant',
      '/api/revenue/commissions/reports',
      '/api/revenue/forecasts',
      '/api/revenue/analysis',
    ],
  });
}

export async function dispatchRevenueRequest(
  req: NextRequest,
  method: Method,
  segments: string[]
) {
  const [head, tail] = segments;

  if (!head) {
    return revenueIndex();
  }

  switch (head) {
    case 'analysis':
      return invoke(analysisRoute, method, req);

    case 'kpis':
      return invoke(kpisRoute, method, req);

    case 'forecasts':
      return invoke(forecastsRoute, method, req);

    case 'rankings':
      if (tail === 'score') {
        return invoke(rankingsScoreRoute, method, req);
      }
      return invoke(rankingsRoute, method, req);

    case 'sales':
      if (!tail) {
        return invoke(salesRoute, method, req);
      }
      if (tail === 'metrics') {
        return invoke(salesMetricsRoute, method, req);
      }
      if (tail === 'actions') {
        return invoke(salesActionsRoute, method, req);
      }
      return invoke(salesIdRoute, method, req, { id: tail });

    case 'goals':
      if (!tail) {
        return invoke(goalsRoute, method, req);
      }
      return invoke(goalsIdRoute, method, req, { id: tail });

    case 'losses':
      if (!tail) {
        return invoke(lossesRoute, method, req);
      }
      if (tail === 'analytics') {
        return invoke(lossesAnalyticsRoute, method, req);
      }
      return invoke(lossesIdRoute, method, req, { id: tail });

    case 'indicators':
      if (!tail) {
        return invoke(indicatorsRoute, method, req);
      }
      if (tail === 'bulk') {
        return invoke(indicatorsBulkRoute, method, req);
      }
      return invoke(indicatorsIdRoute, method, req, { id: tail });

    case 'commissions':
      if (!tail) {
        return invoke(commissionsRoute, method, req);
      }
      if (tail === 'attendant') {
        return invoke(commissionsAttendantRoute, method, req);
      }
      if (tail === 'reports') {
        return invoke(commissionsReportsRoute, method, req);
      }
      return invoke(commissionsIdRoute, method, req, { id: tail });

    default:
      return NextResponse.json(
        { error: `Unknown revenue endpoint: ${segments.join('/')}` },
        { status: 404 }
      );
  }
}
