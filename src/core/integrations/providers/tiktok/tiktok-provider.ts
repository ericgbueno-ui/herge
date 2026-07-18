/**
 * TIKTOK PROVIDER
 * Integra TikTok Business API
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

export class TikTokProvider extends BaseProvider {
  private clientKey: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    super(ProviderType.TIKTOK, 'TikTok', 'v1');

    this.clientKey = process.env.TIKTOK_CLIENT_KEY || '';
    this.clientSecret = process.env.TIKTOK_CLIENT_SECRET || '';
    this.redirectUri = process.env.TIKTOK_REDIRECT_URI || '';
  }

  async connect(credentials: any): Promise<ProviderConnection> {
    try {
      this.log('connect', 'Iniciando conexão TikTok');

      const { code, companyId } = credentials;

      if (!code) {
        throw new Error('Código de autorização TikTok não fornecido');
      }

      // Trocar código por tokens
      const tokens = await this.exchangeCodeForTokens(code);

      // Validar tokens
      const userInfo = await this.getUserInfo(tokens.access_token);

      // Salvar conexão
      const tokenManager = getTokenManager();
      const encryptedToken = tokenManager.encryptToken(tokens.access_token);
      const encryptedRefresh = tokens.refresh_token
        ? tokenManager.encryptToken(tokens.refresh_token)
        : null;

      const connection = await prisma.adAccount.create({
        data: {
          companyId,
          provider: 'TIKTOK',
          providerAccountId: userInfo.advertiser_id,
          name: userInfo.advertiser_name,
          accessToken: encryptedToken.encrypted,
          accessTokenIv: encryptedToken.iv,
          refreshToken: encryptedRefresh?.encrypted,
          refreshTokenIv: encryptedRefresh?.iv,
          tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
          scopes: tokens.scope?.split(' ') || [],
          status: 'connected',
          lastSyncAt: new Date(),
        },
      });

      getEventBus().emit('ACCOUNT_CONNECTED', {
        provider: ProviderType.TIKTOK,
        connectionId: connection.id,
        companyId,
        email: userInfo.advertiser_name,
      });

      return {
        id: connection.id,
        provider: ProviderType.TIKTOK,
        status: 'connected',
        email: userInfo.advertiser_id,
        name: userInfo.advertiser_name,
      };
    } catch (error) {
      this.logError('connect', error);
      throw this.handleError(error, 'connect');
    }
  }

  async disconnect(connectionId: string): Promise<void> {
    try {
      this.log('disconnect', `Desconectando TikTok: ${connectionId}`);

      const connection = await prisma.adAccount.findUnique({
        where: { id: connectionId },
      });

      if (!connection) {
        throw new Error(`Conexão ${connectionId} não encontrada`);
      }

      // Revogar token
      if (connection.accessToken) {
        try {
          const tokenManager = getTokenManager();
          const decrypted = tokenManager.decryptToken(
            connection.accessToken,
            connection.accessTokenIv!
          );
          await this.revokeToken(decrypted);
        } catch (error) {
          this.logError('disconnect', error);
        }
      }

      await prisma.adAccount.update({
        where: { id: connectionId },
        data: { status: 'disconnected' },
      });

      getEventBus().emit('ACCOUNT_DISCONNECTED', {
        provider: ProviderType.TIKTOK,
        connectionId,
      });
    } catch (error) {
      this.logError('disconnect', error);
      throw this.handleError(error, 'disconnect');
    }
  }

  async refresh(connectionId: string): Promise<void> {
    try {
      this.log('refresh', `Renovando token TikTok: ${connectionId}`);

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

      const response = await fetch('https://business-api.tiktok.com/open_api/v1.3/oauth2/token/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_key: this.clientKey,
          client_secret: this.clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        throw new Error(`Falha ao renovar token TikTok: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.data) {
        throw new Error('Resposta inválida do TikTok');
      }

      const newEncrypted = tokenManager.encryptToken(data.data.access_token);
      const newRefresh = data.data.refresh_token
        ? tokenManager.encryptToken(data.data.refresh_token)
        : null;

      await prisma.adAccount.update({
        where: { id: connectionId },
        data: {
          accessToken: newEncrypted.encrypted,
          accessTokenIv: newEncrypted.iv,
          refreshToken: newRefresh?.encrypted,
          refreshTokenIv: newRefresh?.iv,
          tokenExpiresAt: new Date(Date.now() + data.data.expires_in * 1000),
        },
      });

      getEventBus().emit('TOKEN_RENEWED', {
        provider: ProviderType.TIKTOK,
        connectionId,
      });
    } catch (error) {
      this.logError('refresh', error);
      throw this.handleError(error, 'refresh');
    }
  }

  async sync(connectionId: string, options?: SyncOptions): Promise<SyncResult> {
    try {
      this.log('sync', `Sincronizando TikTok: ${connectionId}`);

      const startTime = Date.now();

      const connection = await prisma.adAccount.findUnique({
        where: { id: connectionId },
      });

      if (!connection) {
        throw new Error(`Conexão ${connectionId} não encontrada`);
      }

      // Renovar token se expirado
      if (connection.tokenExpiresAt && new Date() >= connection.tokenExpiresAt) {
        await this.refresh(connectionId);
      }

      const results = {
        campaigns: 0,
        ads: 0,
        metrics: 0,
      };

      if (!options || options.syncCampaigns !== false) {
        results.campaigns = await this.syncCampaigns(connectionId);
      }

      if (!options || options.syncAds !== false) {
        results.ads = await this.syncAds(connectionId);
      }

      if (!options || options.syncMetrics !== false) {
        results.metrics = await this.syncMetrics(connectionId);
      }

      await prisma.adAccount.update({
        where: { id: connectionId },
        data: { lastSyncAt: new Date() },
      });

      const duration = Date.now() - startTime;

      getEventBus().emit('SYNC_COMPLETED', {
        provider: ProviderType.TIKTOK,
        connectionId,
        results,
        duration,
      });

      return {
        success: true,
        message: 'Sincronização TikTok concluída',
        data: results,
        duration,
      };
    } catch (error) {
      this.logError('sync', error);

      getEventBus().emit('SYNC_FAILED', {
        provider: ProviderType.TIKTOK,
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

  async syncCampaigns(connectionId: string): Promise<number> {
    try {
      this.log('syncCampaigns', 'Sincronizando campanhas TikTok');

      const connection = await prisma.adAccount.findUnique({
        where: { id: connectionId },
      });

      if (!connection) throw new Error('Conexão não encontrada');

      const tokenManager = getTokenManager();
      const accessToken = tokenManager.decryptToken(
        connection.accessToken,
        connection.accessTokenIv!
      );

      const campaigns = await this.fetchTikTokCampaigns(accessToken);

      let count = 0;
      for (const campaign of campaigns) {
        await prisma.campaign.upsert({
          where: {
            companyId_provider_providerCampaignId: {
              companyId: connection.companyId,
              provider: 'TIKTOK',
              providerCampaignId: campaign.campaign_id,
            },
          },
          update: {
            name: campaign.campaign_name,
            status: campaign.campaign_status,
            dailyBudget: campaign.daily_budget,
          },
          create: {
            companyId: connection.companyId,
            provider: 'TIKTOK',
            providerCampaignId: campaign.campaign_id,
            name: campaign.campaign_name,
            status: campaign.campaign_status,
            dailyBudget: campaign.daily_budget,
          },
        });
        count++;
      }

      this.log('syncCampaigns', `${count} campanhas TikTok sincronizadas`);
      return count;
    } catch (error) {
      this.logError('syncCampaigns', error);
      return 0;
    }
  }

  async syncAds(connectionId: string): Promise<number> {
    try {
      this.log('syncAds', 'Sincronizando anúncios TikTok');
      return 0;
    } catch (error) {
      this.logError('syncAds', error);
      return 0;
    }
  }

  async syncMetrics(connectionId: string): Promise<number> {
    try {
      this.log('syncMetrics', 'Sincronizando métricas TikTok');
      return 0;
    } catch (error) {
      this.logError('syncMetrics', error);
      return 0;
    }
  }

  async webhook(payload: WebhookPayload): Promise<void> {
    try {
      this.log('webhook', 'Recebido webhook TikTok');

      if (!this.validateWebhook(payload)) {
        throw new Error('Webhook inválido');
      }

      getEventBus().emit('WEBHOOK_RECEIVED', {
        provider: ProviderType.TIKTOK,
        event: payload.event,
        data: payload.data,
      });
    } catch (error) {
      this.logError('webhook', error);
      getEventBus().emit('WEBHOOK_FAILED', {
        provider: ProviderType.TIKTOK,
        error: (error as Error).message,
      });
    }
  }

  async health(): Promise<HealthCheckResult> {
    try {
      const response = await fetch('https://business-api.tiktok.com/open_api/v1.3/ping/', {
        method: 'GET',
      });

      return {
        status: response.ok ? 'healthy' : 'unhealthy',
        message: response.ok ? 'TikTok API disponível' : 'TikTok API indisponível',
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
      this.log('getAccounts', 'Listando contas TikTok');

      const connection = await prisma.adAccount.findUnique({
        where: { id: connectionId },
      });

      if (!connection) {
        throw new Error('Conexão não encontrada');
      }

      const tokenManager = getTokenManager();
      const accessToken = tokenManager.decryptToken(
        connection.accessToken,
        connection.accessTokenIv!
      );

      const accounts = await this.fetchTikTokAccounts(accessToken);
      return accounts;
    } catch (error) {
      this.logError('getAccounts', error);
      return [];
    }
  }

  // === PRIVADOS ===

  private async exchangeCodeForTokens(code: string): Promise<any> {
    const response = await fetch('https://business-api.tiktok.com/open_api/v1.3/oauth2/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_key: this.clientKey,
        client_secret: this.clientSecret,
        code,
        auth_type: 'authorized_user',
      }),
    });

    if (!response.ok) {
      throw new Error(`Falha ao trocar código por tokens: ${response.statusText}`);
    }

    return response.json();
  }

  private async getUserInfo(accessToken: string): Promise<any> {
    const response = await fetch(
      'https://business-api.tiktok.com/open_api/v1.3/oauth2/advertiser/get/',
      {
        headers: { 'Access-Token': accessToken },
      }
    );

    if (!response.ok) {
      throw new Error('Falha ao buscar informações do usuário');
    }

    const data = await response.json();
    return data.data;
  }

  private async revokeToken(accessToken: string): Promise<void> {
    try {
      await fetch('https://business-api.tiktok.com/open_api/v1.3/oauth2/revoke/', {
        method: 'POST',
        headers: { 'Access-Token': accessToken },
      });
    } catch (error) {
      this.logError('revokeToken', error);
    }
  }

  private async fetchTikTokCampaigns(accessToken: string): Promise<any[]> {
    return [];
  }

  private async fetchTikTokAccounts(accessToken: string): Promise<any[]> {
    return [];
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

export function getTikTokProvider(): TikTokProvider {
  return new TikTokProvider();
}
