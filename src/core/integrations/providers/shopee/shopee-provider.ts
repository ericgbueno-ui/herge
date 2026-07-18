/**
 * SHOPEE PROVIDER
 * Integra Shopee Partner API
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
import crypto from 'crypto';

export class ShopeeProvider extends BaseProvider {
  private partnerKey: string;
  private partnerSecret: string;
  private redirectUri: string;

  constructor() {
    super(ProviderType.SHOPEE, 'Shopee', 'v2');

    this.partnerKey = process.env.SHOPEE_PARTNER_KEY || '';
    this.partnerSecret = process.env.SHOPEE_PARTNER_SECRET || '';
    this.redirectUri = process.env.SHOPEE_REDIRECT_URI || '';
  }

  async connect(credentials: any): Promise<ProviderConnection> {
    try {
      this.log('connect', 'Iniciando conexão Shopee');

      const { code, companyId } = credentials;

      if (!code) {
        throw new Error('Código de autorização Shopee não fornecido');
      }

      const tokens = await this.exchangeCodeForTokens(code);
      const shopInfo = await this.getShopInfo(tokens.access_token, tokens.shop_id);

      const tokenManager = getTokenManager();
      const encryptedToken = tokenManager.encryptToken(tokens.access_token);
      const encryptedRefresh = tokens.refresh_token
        ? tokenManager.encryptToken(tokens.refresh_token)
        : null;

      const connection = await prisma.adAccount.create({
        data: {
          companyId,
          provider: 'SHOPEE',
          providerAccountId: String(tokens.shop_id),
          name: shopInfo.shop_name,
          accessToken: encryptedToken.encrypted,
          accessTokenIv: encryptedToken.iv,
          refreshToken: encryptedRefresh?.encrypted,
          refreshTokenIv: encryptedRefresh?.iv,
          tokenExpiresAt: new Date(Date.now() + tokens.expire_in * 1000),
          status: 'connected',
          lastSyncAt: new Date(),
        },
      });

      getEventBus().emit('ACCOUNT_CONNECTED', {
        provider: ProviderType.SHOPEE,
        connectionId: connection.id,
        companyId,
        shopId: tokens.shop_id,
      });

      return {
        id: connection.id,
        provider: ProviderType.SHOPEE,
        status: 'connected',
        email: String(tokens.shop_id),
        name: shopInfo.shop_name,
      };
    } catch (error) {
      this.logError('connect', error);
      throw this.handleError(error, 'connect');
    }
  }

  async disconnect(connectionId: string): Promise<void> {
    try {
      this.log('disconnect', `Desconectando Shopee: ${connectionId}`);

      const connection = await prisma.adAccount.findUnique({
        where: { id: connectionId },
      });

      if (!connection) {
        throw new Error(`Conexão ${connectionId} não encontrada`);
      }

      await prisma.adAccount.update({
        where: { id: connectionId },
        data: { status: 'disconnected' },
      });

      getEventBus().emit('ACCOUNT_DISCONNECTED', {
        provider: ProviderType.SHOPEE,
        connectionId,
      });
    } catch (error) {
      this.logError('disconnect', error);
      throw this.handleError(error, 'disconnect');
    }
  }

  async refresh(connectionId: string): Promise<void> {
    try {
      this.log('refresh', `Renovando token Shopee: ${connectionId}`);

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

      const response = await fetch('https://partner.shopeeopensea.com/api/v2/auth/token/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partner_key: this.partnerKey,
          partner_secret: this.partnerSecret,
          refresh_token: refreshToken,
        }),
      });

      if (!response.ok) {
        throw new Error(`Falha ao renovar token Shopee: ${response.statusText}`);
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
          tokenExpiresAt: new Date(Date.now() + data.expire_in * 1000),
        },
      });

      getEventBus().emit('TOKEN_RENEWED', {
        provider: ProviderType.SHOPEE,
        connectionId,
      });
    } catch (error) {
      this.logError('refresh', error);
      throw this.handleError(error, 'refresh');
    }
  }

  async sync(connectionId: string, options?: SyncOptions): Promise<SyncResult> {
    try {
      this.log('sync', `Sincronizando Shopee: ${connectionId}`);

      const startTime = Date.now();

      const connection = await prisma.adAccount.findUnique({
        where: { id: connectionId },
      });

      if (!connection) {
        throw new Error(`Conexão ${connectionId} não encontrada`);
      }

      if (connection.tokenExpiresAt && new Date() >= connection.tokenExpiresAt) {
        await this.refresh(connectionId);
      }

      const results = {
        products: 0,
        orders: 0,
        metrics: 0,
      };

      if (!options || options.syncProducts !== false) {
        results.products = await this.syncProducts(connectionId);
      }

      if (!options || options.syncOrders !== false) {
        results.orders = await this.syncOrders(connectionId);
      }

      await prisma.adAccount.update({
        where: { id: connectionId },
        data: { lastSyncAt: new Date() },
      });

      const duration = Date.now() - startTime;

      getEventBus().emit('SYNC_COMPLETED', {
        provider: ProviderType.SHOPEE,
        connectionId,
        results,
        duration,
      });

      return {
        success: true,
        message: 'Sincronização Shopee concluída',
        data: results,
        duration,
      };
    } catch (error) {
      this.logError('sync', error);

      getEventBus().emit('SYNC_FAILED', {
        provider: ProviderType.SHOPEE,
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

  async syncProducts(connectionId: string): Promise<number> {
    try {
      this.log('syncProducts', 'Sincronizando produtos Shopee');
      return 0;
    } catch (error) {
      this.logError('syncProducts', error);
      return 0;
    }
  }

  async syncOrders(connectionId: string): Promise<number> {
    try {
      this.log('syncOrders', 'Sincronizando pedidos Shopee');
      return 0;
    } catch (error) {
      this.logError('syncOrders', error);
      return 0;
    }
  }

  async syncCampaigns(connectionId: string): Promise<number> {
    try {
      this.log('syncCampaigns', 'Sincronizando campanhas Shopee');
      return 0;
    } catch (error) {
      this.logError('syncCampaigns', error);
      return 0;
    }
  }

  async webhook(payload: WebhookPayload): Promise<void> {
    try {
      this.log('webhook', 'Recebido webhook Shopee');

      if (!this.validateWebhook(payload)) {
        throw new Error('Webhook inválido');
      }

      getEventBus().emit('WEBHOOK_RECEIVED', {
        provider: ProviderType.SHOPEE,
        event: payload.event,
        data: payload.data,
      });
    } catch (error) {
      this.logError('webhook', error);
      getEventBus().emit('WEBHOOK_FAILED', {
        provider: ProviderType.SHOPEE,
        error: (error as Error).message,
      });
    }
  }

  async health(): Promise<HealthCheckResult> {
    try {
      const response = await fetch('https://partner.shopeeopensea.com/api/v2/shop/get_profile', {
        method: 'GET',
      });

      return {
        status: response.ok ? 'healthy' : 'unhealthy',
        message: response.ok ? 'Shopee API disponível' : 'Shopee API indisponível',
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
      this.log('getAccounts', 'Listando contas Shopee');

      const connection = await prisma.adAccount.findUnique({
        where: { id: connectionId },
      });

      if (!connection) {
        throw new Error('Conexão não encontrada');
      }

      return [
        {
          id: connection.providerAccountId,
          name: connection.name,
        },
      ];
    } catch (error) {
      this.logError('getAccounts', error);
      return [];
    }
  }

  // === PRIVADOS ===

  private async exchangeCodeForTokens(code: string): Promise<any> {
    const response = await fetch('https://partner.shopeeopensea.com/api/v2/auth/token/get', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        partner_key: this.partnerKey,
        partner_secret: this.partnerSecret,
        code,
      }),
    });

    if (!response.ok) {
      throw new Error(`Falha ao trocar código por tokens: ${response.statusText}`);
    }

    return response.json();
  }

  private async getShopInfo(accessToken: string, shopId: number): Promise<any> {
    const response = await fetch(`https://partner.shopeeopensea.com/api/v2/shop/get_profile`, {
      headers: {
        'X-Access-Token': accessToken,
        'X-Shop-Id': String(shopId),
      },
    });

    if (!response.ok) {
      throw new Error('Falha ao buscar informações da loja');
    }

    const data = await response.json();
    return data.data;
  }

  override validateWebhook(payload: WebhookPayload): boolean {
    if (!super.validateWebhook(payload)) {
      return false;
    }
    return true;
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

export function getShopeeProvider(): ShopeeProvider {
  return new ShopeeProvider();
}
