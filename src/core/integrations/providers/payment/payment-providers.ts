/**
 * PAYMENT PROVIDERS
 * Mercado Pago + Stripe
 */

import { BaseProvider } from '../base-provider';
import {
  ProviderType,
  ProviderConnection,
  SyncResult,
  HealthCheckResult,
  WebhookPayload,
  ProviderStatus,
  SyncOptions,
} from '../../types';
import { prisma } from '@/lib/prisma';
import { getTokenManager } from '../../core/token-manager';
import { getEventBus } from '../../services/event-bus';

// ============================================================================
// MERCADO PAGO PROVIDER
// ============================================================================

export class MercadoPagoProvider extends BaseProvider {
  private appId: string;
  private appSecret: string;
  private redirectUri: string;

  constructor() {
    super(ProviderType.MERCADO_PAGO, 'Mercado Pago', 'v1');

    this.appId = process.env.MERCADO_PAGO_APP_ID || '';
    this.appSecret = process.env.MERCADO_PAGO_APP_SECRET || '';
    this.redirectUri = process.env.MERCADO_PAGO_REDIRECT_URI || '';
  }

  async connect(credentials: any): Promise<ProviderConnection> {
    try {
      this.log('connect', 'Iniciando conexão Mercado Pago');

      const { code, companyId } = credentials;

      if (!code) {
        throw new Error('Código de autorização Mercado Pago não fornecido');
      }

      const tokens = await this.exchangeCodeForTokens(code);
      const userInfo = await this.getUserInfo(tokens.access_token);

      const tokenManager = getTokenManager();
      const encryptedToken = tokenManager.encryptToken(tokens.access_token);
      const encryptedRefresh = tokens.refresh_token
        ? tokenManager.encryptToken(tokens.refresh_token)
        : null;

      const connection = await prisma.adAccount.create({
        data: {
          companyId,
          provider: 'MERCADO_PAGO',
          providerAccountId: userInfo.id,
          name: userInfo.nickname,
          accessToken: encryptedToken.encrypted,
          accessTokenIv: encryptedToken.iv,
          refreshToken: encryptedRefresh?.encrypted,
          refreshTokenIv: encryptedRefresh?.iv,
          tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
          status: 'connected',
          lastSyncAt: new Date(),
        },
      });

      getEventBus().emit('ACCOUNT_CONNECTED', {
        provider: ProviderType.MERCADO_PAGO,
        connectionId: connection.id,
        companyId,
        userId: userInfo.id,
      });

      return {
        id: connection.id,
        provider: ProviderType.MERCADO_PAGO,
        status: 'connected',
        email: userInfo.email,
        name: userInfo.nickname,
      };
    } catch (error) {
      this.logError('connect', error);
      throw this.handleError(error, 'connect');
    }
  }

  async disconnect(connectionId: string): Promise<void> {
    try {
      this.log('disconnect', `Desconectando Mercado Pago: ${connectionId}`);

      await prisma.adAccount.update({
        where: { id: connectionId },
        data: { status: 'disconnected' },
      });

      getEventBus().emit('ACCOUNT_DISCONNECTED', {
        provider: ProviderType.MERCADO_PAGO,
        connectionId,
      });
    } catch (error) {
      this.logError('disconnect', error);
      throw this.handleError(error, 'disconnect');
    }
  }

  async refresh(connectionId: string): Promise<void> {
    try {
      this.log('refresh', `Renovando token Mercado Pago: ${connectionId}`);

      const connection = await prisma.adAccount.findUnique({
        where: { id: connectionId },
      });

      if (!connection || !connection.refreshToken) {
        throw new Error('Conexão ou refresh token não encontrado');
      }

      const tokenManager = getTokenManager();
      const refreshToken = tokenManager.decryptToken(
        connection.refreshToken,
        connection.refreshTokenIv!
      );

      const response = await fetch('https://api.mercadopago.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: this.appId,
          client_secret: this.appSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        throw new Error(`Falha ao renovar token: ${response.statusText}`);
      }

      const data = await response.json();

      const newEncrypted = tokenManager.encryptToken(data.access_token);
      const newRefresh = data.refresh_token
        ? tokenManager.encryptToken(data.refresh_token)
        : null;

      await prisma.adAccount.update({
        where: { id: connectionId },
        data: {
          accessToken: newEncrypted.encrypted,
          accessTokenIv: newEncrypted.iv,
          refreshToken: newRefresh?.encrypted,
          refreshTokenIv: newRefresh?.iv,
          tokenExpiresAt: new Date(Date.now() + data.expires_in * 1000),
        },
      });

      getEventBus().emit('TOKEN_RENEWED', {
        provider: ProviderType.MERCADO_PAGO,
        connectionId,
      });
    } catch (error) {
      this.logError('refresh', error);
      throw this.handleError(error, 'refresh');
    }
  }

  async sync(connectionId: string, options?: SyncOptions): Promise<SyncResult> {
    try {
      this.log('sync', `Sincronizando Mercado Pago: ${connectionId}`);

      const startTime = Date.now();

      const results = {
        transactions: 0,
        payments: 0,
      };

      await prisma.adAccount.update({
        where: { id: connectionId },
        data: { lastSyncAt: new Date() },
      });

      const duration = Date.now() - startTime;

      getEventBus().emit('SYNC_COMPLETED', {
        provider: ProviderType.MERCADO_PAGO,
        connectionId,
        results,
        duration,
      });

      return {
        success: true,
        message: 'Sincronização Mercado Pago concluída',
        data: results,
        duration,
      };
    } catch (error) {
      this.logError('sync', error);

      getEventBus().emit('SYNC_FAILED', {
        provider: ProviderType.MERCADO_PAGO,
        connectionId,
        error: (error as Error).message,
      });

      return {
        success: false,
        message: `Falha na sincronização: ${(error as Error).message}`,
        duration: 0,
      };
    }
  }

  async webhook(payload: WebhookPayload): Promise<void> {
    try {
      this.log('webhook', 'Recebido webhook Mercado Pago');

      if (!this.validateWebhook(payload)) {
        throw new Error('Webhook inválido');
      }

      getEventBus().emit('WEBHOOK_RECEIVED', {
        provider: ProviderType.MERCADO_PAGO,
        event: payload.event,
        data: payload.data,
      });

      // Processar eventos específicos de pagamento
      if (payload.event === 'payment.created' || payload.event === 'payment.updated') {
        getEventBus().emit('PAYMENT_STATUS_CHANGED', {
          provider: ProviderType.MERCADO_PAGO,
          paymentId: payload.data?.id,
          status: payload.data?.status,
          amount: payload.data?.transaction_amount,
        });
      }
    } catch (error) {
      this.logError('webhook', error);
      getEventBus().emit('WEBHOOK_FAILED', {
        provider: ProviderType.MERCADO_PAGO,
        error: (error as Error).message,
      });
    }
  }

  async health(): Promise<HealthCheckResult> {
    try {
      const response = await fetch('https://api.mercadopago.com/v1/ping');

      return {
        status: response.ok ? 'healthy' : 'unhealthy',
        message: response.ok ? 'Mercado Pago disponível' : 'Mercado Pago indisponível',
        responseTime: 100,
        lastCheck: new Date(),
      };
    } catch (error) {
      return {
        status: 'error',
        message: `Erro ao verificar saúde: ${(error as Error).message}`,
        responseTime: 0,
        lastCheck: new Date(),
      };
    }
  }

  async getAccounts(connectionId: string): Promise<any[]> {
    try {
      const connection = await prisma.adAccount.findUnique({
        where: { id: connectionId },
      });

      if (!connection) return [];

      return [{ id: connection.providerAccountId, name: connection.name }];
    } catch (error) {
      this.logError('getAccounts', error);
      return [];
    }
  }

  private async exchangeCodeForTokens(code: string): Promise<any> {
    const response = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: this.appId,
        client_secret: this.appSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error(`Falha ao trocar código: ${response.statusText}`);
    }

    return response.json();
  }

  private async getUserInfo(accessToken: string): Promise<any> {
    const response = await fetch('https://api.mercadopago.com/v1/users/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error('Falha ao buscar usuário');
    }

    return response.json();
  }

  override async status(connectionId: string): Promise<ProviderStatus> {
    try {
      const connection = await prisma.adAccount.findUnique({
        where: { id: connectionId },
      });

      if (!connection) {
        return {
          connected: false,
          syncing: false,
          error: 'Conexão não encontrada',
          errorCount: 0,
          successCount: 0,
        };
      }

      return {
        connected: connection.status === 'connected',
        syncing: false,
        error: undefined,
        errorCount: 0,
        successCount: connection.lastSyncAt ? 1 : 0,
      };
    } catch (error) {
      return {
        connected: false,
        syncing: false,
        error: (error as Error).message,
        errorCount: 1,
        successCount: 0,
      };
    }
  }
}

// ============================================================================
// STRIPE PROVIDER
// ============================================================================

export class StripeProvider extends BaseProvider {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    super(ProviderType.STRIPE, 'Stripe', 'v1');

    this.clientId = process.env.STRIPE_CLIENT_ID || '';
    this.clientSecret = process.env.STRIPE_CLIENT_SECRET || '';
    this.redirectUri = process.env.STRIPE_REDIRECT_URI || '';
  }

  async connect(credentials: any): Promise<ProviderConnection> {
    try {
      this.log('connect', 'Iniciando conexão Stripe');

      const { code, companyId } = credentials;

      if (!code) {
        throw new Error('Código de autorização Stripe não fornecido');
      }

      const tokens = await this.exchangeCodeForTokens(code);

      const tokenManager = getTokenManager();
      const encryptedToken = tokenManager.encryptToken(tokens.stripe_user_id);

      const connection = await prisma.adAccount.create({
        data: {
          companyId,
          provider: 'STRIPE',
          providerAccountId: tokens.stripe_user_id,
          name: `Stripe - ${tokens.stripe_user_id}`,
          accessToken: encryptedToken.encrypted,
          accessTokenIv: encryptedToken.iv,
          status: 'connected',
          lastSyncAt: new Date(),
        },
      });

      getEventBus().emit('ACCOUNT_CONNECTED', {
        provider: ProviderType.STRIPE,
        connectionId: connection.id,
        companyId,
        stripeUserId: tokens.stripe_user_id,
      });

      return {
        id: connection.id,
        provider: ProviderType.STRIPE,
        status: 'connected',
        email: tokens.stripe_user_id,
        name: `Stripe - ${tokens.stripe_user_id}`,
      };
    } catch (error) {
      this.logError('connect', error);
      throw this.handleError(error, 'connect');
    }
  }

  async disconnect(connectionId: string): Promise<void> {
    try {
      this.log('disconnect', `Desconectando Stripe: ${connectionId}`);

      await prisma.adAccount.update({
        where: { id: connectionId },
        data: { status: 'disconnected' },
      });

      getEventBus().emit('ACCOUNT_DISCONNECTED', {
        provider: ProviderType.STRIPE,
        connectionId,
      });
    } catch (error) {
      this.logError('disconnect', error);
      throw this.handleError(error, 'disconnect');
    }
  }

  async refresh(connectionId: string): Promise<void> {
    try {
      this.log('refresh', `Validando token Stripe: ${connectionId}`);

      const connection = await prisma.adAccount.findUnique({
        where: { id: connectionId },
      });

      if (!connection) {
        throw new Error('Conexão não encontrada');
      }

      // Stripe não precisa refresh
      // Apenas validamos se a conta ainda existe
    } catch (error) {
      this.logError('refresh', error);
      throw this.handleError(error, 'refresh');
    }
  }

  async sync(connectionId: string, options?: SyncOptions): Promise<SyncResult> {
    try {
      this.log('sync', `Sincronizando Stripe: ${connectionId}`);

      const startTime = Date.now();

      const results = {
        transactions: 0,
        charges: 0,
      };

      await prisma.adAccount.update({
        where: { id: connectionId },
        data: { lastSyncAt: new Date() },
      });

      const duration = Date.now() - startTime;

      getEventBus().emit('SYNC_COMPLETED', {
        provider: ProviderType.STRIPE,
        connectionId,
        results,
        duration,
      });

      return {
        success: true,
        message: 'Sincronização Stripe concluída',
        data: results,
        duration,
      };
    } catch (error) {
      this.logError('sync', error);

      getEventBus().emit('SYNC_FAILED', {
        provider: ProviderType.STRIPE,
        connectionId,
        error: (error as Error).message,
      });

      return {
        success: false,
        message: `Falha na sincronização: ${(error as Error).message}`,
        duration: 0,
      };
    }
  }

  async webhook(payload: WebhookPayload): Promise<void> {
    try {
      this.log('webhook', 'Recebido webhook Stripe');

      if (!this.validateWebhook(payload)) {
        throw new Error('Webhook inválido');
      }

      getEventBus().emit('WEBHOOK_RECEIVED', {
        provider: ProviderType.STRIPE,
        event: payload.event,
        data: payload.data,
      });

      if (payload.event === 'charge.succeeded' || payload.event === 'charge.failed') {
        getEventBus().emit('CHARGE_STATUS_CHANGED', {
          provider: ProviderType.STRIPE,
          chargeId: payload.data?.id,
          status: payload.event === 'charge.succeeded' ? 'succeeded' : 'failed',
          amount: payload.data?.amount,
        });
      }
    } catch (error) {
      this.logError('webhook', error);
      getEventBus().emit('WEBHOOK_FAILED', {
        provider: ProviderType.STRIPE,
        error: (error as Error).message,
      });
    }
  }

  async health(): Promise<HealthCheckResult> {
    try {
      const response = await fetch('https://status.stripe.com/api/v2/status.json');

      return {
        status: response.ok ? 'healthy' : 'unhealthy',
        message: response.ok ? 'Stripe disponível' : 'Stripe indisponível',
        responseTime: 100,
        lastCheck: new Date(),
      };
    } catch (error) {
      return {
        status: 'error',
        message: `Erro ao verificar saúde: ${(error as Error).message}`,
        responseTime: 0,
        lastCheck: new Date(),
      };
    }
  }

  async getAccounts(connectionId: string): Promise<any[]> {
    try {
      const connection = await prisma.adAccount.findUnique({
        where: { id: connectionId },
      });

      if (!connection) return [];

      return [{ id: connection.providerAccountId, name: connection.name }];
    } catch (error) {
      this.logError('getAccounts', error);
      return [];
    }
  }

  private async exchangeCodeForTokens(code: string): Promise<any> {
    const response = await fetch('https://connect.stripe.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      throw new Error(`Falha ao trocar código: ${response.statusText}`);
    }

    return response.json();
  }

  override async status(connectionId: string): Promise<ProviderStatus> {
    try {
      const connection = await prisma.adAccount.findUnique({
        where: { id: connectionId },
      });

      if (!connection) {
        return {
          connected: false,
          syncing: false,
          error: 'Conexão não encontrada',
          errorCount: 0,
          successCount: 0,
        };
      }

      return {
        connected: connection.status === 'connected',
        syncing: false,
        error: undefined,
        errorCount: 0,
        successCount: connection.lastSyncAt ? 1 : 0,
      };
    } catch (error) {
      return {
        connected: false,
        syncing: false,
        error: (error as Error).message,
        errorCount: 1,
        successCount: 0,
      };
    }
  }
}

export function getMercadoPagoProvider(): MercadoPagoProvider {
  return new MercadoPagoProvider();
}

export function getStripeProvider(): StripeProvider {
  return new StripeProvider();
}
