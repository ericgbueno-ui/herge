/**
 * POST /api/v1/integrations/sync
 * Sincronizar dados de um provider
 */

import { NextRequest, NextResponse } from 'next/server';
import { getIntegrationCore } from '@/core/integrations/core/integration-core';
import { getQueueManager, QueueType } from '@/core/integrations/queue/queue-manager';

export async function POST(request: NextRequest) {
  try {
    const { connectionId, companyId } = await request.json();

    if (!connectionId || !companyId) {
      return NextResponse.json(
        { error: 'connectionId e companyId são obrigatórios' },
        { status: 400 }
      );
    }

    // Enfileirar sync job
    const queueManager = getQueueManager();

    // Buscar provider da conexão para obter o tipo
    const core = getIntegrationCore();
    const connection = await core.getConnection(connectionId);

    if (!connection) {
      return NextResponse.json(
        { error: 'Conexão não encontrada' },
        { status: 404 }
      );
    }

    const job = await queueManager.enqueue({
      type: QueueType.SYNC,
      provider: connection.provider,
      connectionId,
      companyId,
      priority: 5,
    });

    return NextResponse.json({
      success: true,
      jobId: job.id,
      message: 'Sincronização enfileirada',
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
