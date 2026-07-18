/**
 * POST /api/v1/integrations/webhooks
 * Receber webhooks de providers
 * Endpoint público, deve validar assinatura
 */

import { NextRequest, NextResponse } from 'next/server';
import { getWebhookProcessor } from '@/core/integrations/webhook/webhook-processor';
import { getIntegrationLogger } from '@/core/integrations/logging/integration-logger';

export async function POST(request: NextRequest) {
  try {
    const provider = request.headers.get('x-provider') || request.headers.get('provider');

    if (!provider) {
      return NextResponse.json(
        { error: 'Header x-provider é obrigatório' },
        { status: 400 }
      );
    }

    const signature = request.headers.get('x-signature');
    const timestamp = request.headers.get('x-timestamp');
    const body = await request.json();

    // Processar webhook
    const processor = getWebhookProcessor();

    await processor.process({
      provider,
      signature: signature || undefined,
      timestamp: timestamp || undefined,
      body,
      headers: Object.fromEntries(request.headers),
    });

    return NextResponse.json({
      success: true,
      message: 'Webhook recebido e enfileirado',
    });
  } catch (error) {
    const logger = getIntegrationLogger();
    await logger.logError('webhook', 'process', error as Error);

    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/integrations/webhooks
 * Health check do endpoint
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    message: 'Webhook endpoint ativo',
    methods: ['POST'],
    requiredHeaders: ['x-provider'],
  });
}
