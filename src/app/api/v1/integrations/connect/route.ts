/**
 * POST /api/v1/integrations/connect
 * Conectar conta de provider
 */

import { NextRequest, NextResponse } from 'next/server';
import { getIntegrationCore } from '@/core/integrations/core/integration-core';
import { getIntegrationLogger } from '@/core/integrations/logging/integration-logger';
import { ProviderType } from '@/core/integrations/types';

export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now();
    const { provider, code, companyId } = await request.json();

    // Validar entrada
    if (!provider || !code || !companyId) {
      return NextResponse.json(
        {
          error: 'Provider, code e companyId são obrigatórios',
        },
        { status: 400 }
      );
    }

    // Conectar via Integration Core
    const core = getIntegrationCore();
    const connection = await core.createConnection(
      companyId,
      provider,
      { code, companyId }
    );

    const duration = Date.now() - startTime;

    // Log
    const logger = getIntegrationLogger();
    await logger.log({
      timestamp: new Date(),
      level: 'INFO',
      provider,
      companyId,
      action: 'connect',
      message: 'Conexão estabelecida',
      data: { connectionId: connection.id },
      duration,
    });

    return NextResponse.json({
      success: true,
      connection,
    });
  } catch (error) {
    const logger = getIntegrationLogger();
    await logger.logError(
      'integration',
      'connect',
      error as Error,
      { method: 'POST', path: '/api/v1/integrations/connect' }
    );

    return NextResponse.json(
      {
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
