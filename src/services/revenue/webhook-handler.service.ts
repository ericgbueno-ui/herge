import { EventBus } from '@/core/events/event-bus';
import { Logger } from '@/lib/logger';
import { AuditLogger } from './audit-logger.service';

export interface WebhookPayload {
  event: string;
  companyId: string;
  timestamp: Date;
  data: any;
  signature?: string;
}

export interface WebhookResponse {
  success: boolean;
  webhookId?: string;
  error?: string;
  processingTime: number;
}

export class WebhookHandlerService {
  private logger: Logger;
  private auditLogger: AuditLogger;
  private eventBus: EventBus;

  constructor(eventBus: EventBus, logger: Logger, auditLogger: AuditLogger) {
    this.eventBus = eventBus;
    this.logger = logger;
    this.auditLogger = auditLogger;

    this.registerEventListeners();
  }

  private registerEventListeners() {
    // Sale events
    this.eventBus.on('sale:created', (data) => this.handleSaleCreated(data));
    this.eventBus.on('sale:completed', (data) => this.handleSaleCompleted(data));
    this.eventBus.on('sale:lost', (data) => this.handleSaleLost(data));

    // Commission events
    this.eventBus.on('commission:created', (data) => this.handleCommissionCreated(data));
    this.eventBus.on('commission:paid', (data) => this.handleCommissionPaid(data));

    // Goal events
    this.eventBus.on('goal:achieved', (data) => this.handleGoalAchieved(data));
    this.eventBus.on('goal:failed', (data) => this.handleGoalFailed(data));

    // Forecast events
    this.eventBus.on('forecast:generated', (data) => this.handleForecastGenerated(data));

    // Loss events
    this.eventBus.on('loss:reason_created', (data) => this.handleLossReasonCreated(data));
  }

  private async handleSaleCreated(data: any) {
    const payload: WebhookPayload = {
      event: 'sale:created',
      companyId: data.companyId,
      timestamp: new Date(),
      data,
    };

    await this.processWebhook(payload);
    await this.auditLogger.log({
      companyId: data.companyId,
      action: 'SALE_CREATED',
      entity: 'RevenueSale',
      entityId: data.saleId,
      changes: { totalAmount: data.totalAmount },
      status: 'SUCCESS',
    });
  }

  private async handleSaleCompleted(data: any) {
    const payload: WebhookPayload = {
      event: 'sale:completed',
      companyId: data.companyId,
      timestamp: new Date(),
      data,
    };

    await this.processWebhook(payload);
    await this.auditLogger.log({
      companyId: data.companyId,
      action: 'SALE_COMPLETED',
      entity: 'RevenueSale',
      entityId: data.saleId,
      changes: { profit: data.profit },
      status: 'SUCCESS',
    });
  }

  private async handleSaleLost(data: any) {
    const payload: WebhookPayload = {
      event: 'sale:lost',
      companyId: data.companyId,
      timestamp: new Date(),
      data,
    };

    await this.processWebhook(payload);
    await this.auditLogger.log({
      companyId: data.companyId,
      action: 'SALE_LOST',
      entity: 'RevenueSale',
      entityId: data.saleId,
      changes: { reason: data.reason },
      status: 'SUCCESS',
    });
  }

  private async handleCommissionCreated(data: any) {
    const payload: WebhookPayload = {
      event: 'commission:created',
      companyId: data.companyId,
      timestamp: new Date(),
      data,
    };

    await this.processWebhook(payload);
    await this.auditLogger.log({
      companyId: data.companyId,
      action: 'COMMISSION_CREATED',
      entity: 'RevenueCommission',
      entityId: data.commissionId,
      changes: { amount: data.amount },
      status: 'SUCCESS',
    });
  }

  private async handleCommissionPaid(data: any) {
    const payload: WebhookPayload = {
      event: 'commission:paid',
      companyId: data.companyId,
      timestamp: new Date(),
      data,
    };

    await this.processWebhook(payload);
    await this.auditLogger.log({
      companyId: data.companyId,
      action: 'COMMISSION_PAID',
      entity: 'RevenueCommission',
      entityId: data.commissionId,
      changes: { status: 'PAGA', totalPaid: data.totalPaid },
      status: 'SUCCESS',
    });
  }

  private async handleGoalAchieved(data: any) {
    await this.auditLogger.log({
      companyId: data.companyId,
      action: 'GOAL_ACHIEVED',
      entity: 'RevenueGoal',
      entityId: data.goalId,
      changes: { metric: data.metric },
      status: 'SUCCESS',
    });
  }

  private async handleGoalFailed(data: any) {
    await this.auditLogger.log({
      companyId: data.companyId,
      action: 'GOAL_FAILED',
      entity: 'RevenueGoal',
      entityId: data.goalId,
      changes: { reason: data.reason },
      status: 'SUCCESS',
    });
  }

  private async handleForecastGenerated(data: any) {
    await this.auditLogger.log({
      companyId: data.companyId,
      action: 'FORECAST_GENERATED',
      entity: 'RevenueForecast',
      entityId: data.forecastDate,
      changes: { projectedRevenue: data.projectedRevenue },
      status: 'SUCCESS',
    });
  }

  private async handleLossReasonCreated(data: any) {
    await this.auditLogger.log({
      companyId: data.companyId,
      action: 'LOSS_REASON_CREATED',
      entity: 'RevenueLossReason',
      entityId: data.reasonId,
      changes: { reason: data.reason },
      status: 'SUCCESS',
    });
  }

  private async processWebhook(payload: WebhookPayload): Promise<WebhookResponse> {
    const startTime = Date.now();

    try {
      // TODO: Integração com CONNECT - enviar para o barramento
      // const connectResponse = await this.connectService.sendEvent(payload);

      this.logger.info(`Webhook processed: ${payload.event}`, {
        companyId: payload.companyId,
        event: payload.event,
      });

      return {
        success: true,
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      this.logger.error(`Webhook processing failed: ${payload.event}`, {
        companyId: payload.companyId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime,
      };
    }
  }

  async retryFailedWebhooks(companyId: string, limit: number = 10) {
    this.logger.info('Retrying failed webhooks', { companyId, limit });

    // TODO: Query failed webhooks from database and retry
  }

  async getWebhookStatus(companyId: string) {
    // TODO: Return webhook delivery status and statistics
    return {
      companyId,
      totalWebhooks: 0,
      successful: 0,
      failed: 0,
      lastDelivery: null,
    };
  }
}
