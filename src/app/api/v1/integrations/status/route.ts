/**
 * GET /api/v1/integrations/status
 * Status das integrações
 */

import { NextRequest, NextResponse } from 'next/server';
import { getIntegrationCore } from '@/core/integrations/core/integration-core';
import { getQueueManager } from '@/core/integrations/queue/queue-manager';
import { getResilienceManager } from '@/core/integrations/resilience/rate-limiter';
import { getScheduler } from '@/core/integrations/scheduler/scheduler-engine';

export async function GET(request: NextRequest) {
  try {
    const connectionId = request.nextUrl.searchParams.get('connectionId');

    if (!connectionId) {
      // Status geral do sistema
      const core = getIntegrationCore();
      const queueManager = getQueueManager();
      const resilienceManager = getResilienceManager();
      const scheduler = getScheduler();

      const systemStatus = {
        integration_core: await core.getStatus(),
        queue_manager: await queueManager.getStatus(),
        resilience: resilienceManager.getStatus(),
        scheduler: scheduler.getStatus(),
        timestamp: new Date(),
      };

      return NextResponse.json(systemStatus);
    } else {
      // Status de uma conexão específica
      const core = getIntegrationCore();
      const connection = await core.getConnection(connectionId);

      if (!connection) {
        return NextResponse.json(
          { error: 'Conexão não encontrada' },
          { status: 404 }
        );
      }

      const provider = core.getProvider(connection.provider);

      if (!provider) {
        return NextResponse.json(
          { error: 'Provider não encontrado' },
          { status: 404 }
        );
      }

      const status = await provider.status(connectionId);

      return NextResponse.json({
        connectionId,
        provider: connection.provider,
        status,
        lastSync: connection.lastSyncAt,
        connected: connection.status === 'connected',
        timestamp: new Date(),
      });
    }
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
