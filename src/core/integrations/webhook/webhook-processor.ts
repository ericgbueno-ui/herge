/**
 * WEBHOOK PROCESSOR
 * Pipeline seguro para processar webhooks
 * Valida → Autentica → Enfileira → Processa
 */

import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { getQueueManager, QueueType } from '../queue/queue-manager';
import { getEventBus } from '../services/event-bus';
import { getIntegrationLogger } from '../logging/integration-logger';

export interface WebhookRequest {
  provider: string;
  signature?: string;
  timestamp?: string;
  body: any;
  headers?: Record<string, string>;
}

export interface WebhookValidation {
  valid: boolean;
  error?: string;
  provider?: string;
  connectionId?: string;
}

export class WebhookProcessor {
  /**
   * Processar webhook completo
   * Entrada: signature do header + payload
   * Saída: job na fila
   */
  async process(request: WebhookRequest): Promise<void> {
    try {
      console.log(`[WebhookProcessor] Recebido webhook de ${request.provider}`);

      // 1. Validar assinatura
      const validation = await this.validate(request);

      if (!validation.valid) {
        throw new Error(`Validação falhou: ${validation.error}`);
      }

      // 2. Registrar webhook recebido
      await this.logWebhook(request, validation);

      // 3. Enfileirar para processamento
      const queueManager = getQueueManager();
      await queueManager.enqueue({
        type: QueueType.WEBHOOK,
        provider: request.provider,
        connectionId: validation.connectionId || '',
        companyId: validation.connectionId
          ? await this.getCompanyId(validation.connectionId)
          : '',
        data: {
          payload: request.body,
          receivedAt: new Date(),
        },
      });

      // 4. Emitir evento
      getEventBus().emit('WEBHOOK_RECEIVED', {
        provider: request.provider,
        valid: true,
      });

      console.log(`[WebhookProcessor] Webhook de ${request.provider} enfileirado`);
    } catch (error) {
      console.error('[WebhookProcessor] Erro ao processar webhook:', error);

      getEventBus().emit('WEBHOOK_FAILED', {
        provider: request.provider,
        error: (error as Error).message,
      });

      throw error;
    }
  }

  /**
   * Validar webhook
   * 1. Verifica assinatura HMAC
   * 2. Verifica timestamp (anti-replay)
   * 3. Verifica se provider existe
   */
  private async validate(request: WebhookRequest): Promise<WebhookValidation> {
    try {
      const { provider, signature, timestamp, body } = request;

      // 1. Validar provider
      if (!provider) {
        return {
          valid: false,
          error: 'Provider não fornecido',
        };
      }

      // 2. Validar timestamp (últimas 5 minutos)
      if (timestamp) {
        const requestTime = new Date(timestamp).getTime();
        const now = Date.now();
        const diffMinutes = (now - requestTime) / 1000 / 60;

        if (diffMinutes > 5) {
          return {
            valid: false,
            error: 'Timestamp muito antigo (replay attack potencial)',
          };
        }
      }

      // 3. Validar assinatura HMAC
      const isValidSignature = await this.validateSignature(provider, signature, body);

      if (!isValidSignature) {
        return {
          valid: false,
          error: 'Assinatura HMAC inválida',
        };
      }

      // 4. Buscar conexão associada ao webhook
      const connectionId = await this.findConnectionByProvider(provider, body);

      return {
        valid: true,
        provider,
        connectionId,
      };
    } catch (error) {
      return {
        valid: false,
        error: `Erro ao validar webhook: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Validar assinatura HMAC SHA256
   */
  private async validateSignature(
    provider: string,
    signature?: string,
    body?: any
  ): Promise<boolean> {
    if (!signature) {
      return false;
    }

    try {
      // Buscar secret do provider (armazenado no banco)
      const secret = await this.getWebhookSecret(provider);

      if (!secret) {
        console.warn(`[WebhookProcessor] Secret não encontrado para provider: ${provider}`);
        return false;
      }

      // Computar HMAC do body
      const payload = typeof body === 'string' ? body : JSON.stringify(body);
      const computedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      // Comparar com timing-safe
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(computedSignature)
      );
    } catch (error) {
      console.error('[WebhookProcessor] Erro ao validar assinatura:', error);
      return false;
    }
  }

  /**
   * Encontrar conexão associada ao webhook
   */
  private async findConnectionByProvider(
    provider: string,
    body: any
  ): Promise<string | undefined> {
    try {
      // Buscar por provider account ID no body
      // Cada provider tem uma forma diferente de identificar

      let providerAccountId: string | undefined;

      switch (provider.toUpperCase()) {
        case 'META':
          providerAccountId = body.ad_account_id;
          break;
        case 'GOOGLE':
          providerAccountId = body.customer_id;
          break;
        case 'TIKTOK':
          providerAccountId = body.advertiser_id;
          break;
        case 'SHOPEE':
          providerAccountId = String(body.shop_id);
          break;
        case 'WHATSAPP':
          providerAccountId = body.metadata?.phone_number_id;
          break;
        case 'MERCADO_PAGO':
          providerAccountId = body.user_id;
          break;
        case 'STRIPE':
          providerAccountId = body.user_id;
          break;
      }

      if (!providerAccountId) {
        return undefined;
      }

      // Buscar conexão
      const connection = await prisma.adAccount.findFirst({
        where: {
          provider: provider.toUpperCase(),
          providerAccountId,
        },
        select: { id: true },
      });

      return connection?.id;
    } catch (error) {
      console.error('[WebhookProcessor] Erro ao encontrar conexão:', error);
      return undefined;
    }
  }

  /**
   * Buscar secret do webhook
   */
  private async getWebhookSecret(provider: string): Promise<string | undefined> {
    // Em produção, buscar do vault/secrets manager
    // Aqui retornamos do env por simplicidade

    const providerUpper = provider.toUpperCase();

    switch (providerUpper) {
      case 'META':
        return process.env.META_WEBHOOK_SECRET;
      case 'GOOGLE':
        return process.env.GOOGLE_WEBHOOK_SECRET;
      case 'TIKTOK':
        return process.env.TIKTOK_WEBHOOK_SECRET;
      case 'SHOPEE':
        return process.env.SHOPEE_WEBHOOK_SECRET;
      case 'WHATSAPP':
        return process.env.WHATSAPP_WEBHOOK_SECRET;
      case 'MERCADO_PAGO':
        return process.env.MERCADO_PAGO_WEBHOOK_SECRET;
      case 'STRIPE':
        return process.env.STRIPE_WEBHOOK_SECRET;
      default:
        return undefined;
    }
  }

  /**
   * Registrar webhook recebido
   */
  private async logWebhook(
    request: WebhookRequest,
    validation: WebhookValidation
  ): Promise<void> {
    try {
      const logger = getIntegrationLogger();

      await logger.logWebhook({
        provider: request.provider,
        connectionId: validation.connectionId,
        valid: validation.valid,
        error: validation.error,
        receivedAt: new Date(),
      });
    } catch (error) {
      console.error('[WebhookProcessor] Erro ao registrar webhook:', error);
    }
  }

  /**
   * Obter companyId de uma conexão
   */
  private async getCompanyId(connectionId: string): Promise<string> {
    try {
      const connection = await prisma.adAccount.findUnique({
        where: { id: connectionId },
        select: { companyId: true },
      });

      return connection?.companyId || '';
    } catch (error) {
      console.error('[WebhookProcessor] Erro ao obter companyId:', error);
      return '';
    }
  }
}

let processor: WebhookProcessor;

export function getWebhookProcessor(): WebhookProcessor {
  if (!processor) {
    processor = new WebhookProcessor();
  }
  return processor;
}
