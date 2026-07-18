/**
 * INTEGRATION LOGGER
 * Logging estruturado para integrações
 * JSON formato para análise
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export interface IntegrationLogEntry {
  timestamp: Date;
  level: LogLevel;
  provider: string;
  connectionId?: string;
  companyId?: string;
  action: string;
  message: string;
  data?: Record<string, any>;
  error?: string;
  duration?: number;
  statusCode?: number;
}

export interface WebhookLogEntry {
  provider: string;
  connectionId?: string;
  valid: boolean;
  error?: string;
  receivedAt: Date;
  signature?: string;
}

export interface AuditLogEntry {
  timestamp: Date;
  companyId: string;
  userId?: string;
  provider: string;
  action: string;
  targetId?: string;
  status: 'success' | 'failure';
  ip?: string;
  duration: number;
  result?: Record<string, any>;
  error?: string;
}

export class IntegrationLogger {
  /**
   * Log de integração estruturado
   */
  async log(entry: IntegrationLogEntry): Promise<void> {
    const logObject = {
      timestamp: entry.timestamp.toISOString(),
      level: entry.level,
      provider: entry.provider,
      connectionId: entry.connectionId,
      companyId: entry.companyId,
      action: entry.action,
      message: entry.message,
      data: entry.data,
      error: entry.error,
      duration: entry.duration,
      statusCode: entry.statusCode,
    };

    // Logar no console em formato JSON
    console.log(JSON.stringify(logObject));

    // Em produção, enviar para logging service (Datadog, CloudWatch, etc)
    // await this.sendToLoggingService(logObject);
  }

  /**
   * Log de webhook
   */
  async logWebhook(entry: WebhookLogEntry): Promise<void> {
    const logObject = {
      timestamp: new Date().toISOString(),
      type: 'webhook',
      provider: entry.provider,
      connectionId: entry.connectionId,
      valid: entry.valid,
      error: entry.error,
      receivedAt: entry.receivedAt.toISOString(),
      signature: entry.signature ? '***' : undefined, // Não logar secret
    };

    console.log(JSON.stringify(logObject));
  }

  /**
   * Log de auditoria
   */
  async logAudit(entry: AuditLogEntry): Promise<void> {
    const logObject = {
      timestamp: entry.timestamp.toISOString(),
      companyId: entry.companyId,
      userId: entry.userId,
      provider: entry.provider,
      action: entry.action,
      targetId: entry.targetId,
      status: entry.status,
      ip: entry.ip,
      duration: entry.duration,
      result: entry.result,
      error: entry.error,
    };

    console.log(JSON.stringify(logObject));

    // Em produção, persistir em banco de dados
    // await this.saveToDatabase(logObject);
  }

  /**
   * Log de erro
   */
  async logError(
    provider: string,
    action: string,
    error: Error,
    context?: Record<string, any>
  ): Promise<void> {
    const entry: IntegrationLogEntry = {
      timestamp: new Date(),
      level: LogLevel.ERROR,
      provider,
      action,
      message: error.message,
      error: error.stack,
      data: context,
    };

    await this.log(entry);
  }

  /**
   * Log de sincronização
   */
  async logSync(
    provider: string,
    connectionId: string,
    companyId: string,
    success: boolean,
    duration: number,
    result?: Record<string, any>,
    error?: string
  ): Promise<void> {
    const entry: IntegrationLogEntry = {
      timestamp: new Date(),
      level: success ? LogLevel.INFO : LogLevel.ERROR,
      provider,
      connectionId,
      companyId,
      action: 'sync',
      message: success ? 'Sincronização concluída' : 'Sincronização falhou',
      data: result,
      error,
      duration,
    };

    await this.log(entry);
  }

  /**
   * Log de token refresh
   */
  async logTokenRefresh(
    provider: string,
    connectionId: string,
    companyId: string,
    success: boolean,
    error?: string
  ): Promise<void> {
    const entry: IntegrationLogEntry = {
      timestamp: new Date(),
      level: success ? LogLevel.INFO : LogLevel.ERROR,
      provider,
      connectionId,
      companyId,
      action: 'token_refresh',
      message: success ? 'Token renovado' : 'Falha ao renovar token',
      error,
    };

    await this.log(entry);
  }

  /**
   * Log de health check
   */
  async logHealthCheck(
    provider: string,
    connectionId: string,
    status: 'healthy' | 'unhealthy' | 'error',
    responseTime: number,
    error?: string
  ): Promise<void> {
    const entry: IntegrationLogEntry = {
      timestamp: new Date(),
      level: status === 'healthy' ? LogLevel.INFO : LogLevel.WARN,
      provider,
      connectionId,
      action: 'health_check',
      message: `Health check: ${status}`,
      data: { status, responseTime },
      error,
      duration: responseTime,
    };

    await this.log(entry);
  }

  /**
   * Log de rate limit
   */
  async logRateLimit(
    provider: string,
    companyId: string,
    waitTime: number
  ): Promise<void> {
    const entry: IntegrationLogEntry = {
      timestamp: new Date(),
      level: LogLevel.WARN,
      provider,
      companyId,
      action: 'rate_limit',
      message: `Rate limit atingido, aguardando ${waitTime}ms`,
      data: { waitTime },
    };

    await this.log(entry);
  }

  /**
   * Log de circuit breaker
   */
  async logCircuitBreaker(
    provider: string,
    companyId: string,
    state: string,
    failureCount: number
  ): Promise<void> {
    const entry: IntegrationLogEntry = {
      timestamp: new Date(),
      level: LogLevel.WARN,
      provider,
      companyId,
      action: 'circuit_breaker',
      message: `Circuit breaker ${state}`,
      data: { state, failureCount },
    };

    await this.log(entry);
  }

  /**
   * Buscar logs por filtros
   * Em produção, fazer query em logging service
   */
  async search(filters: {
    provider?: string;
    companyId?: string;
    action?: string;
    level?: LogLevel;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<IntegrationLogEntry[]> {
    // Implementar busca em logging service
    // Por enquanto, retorna array vazio
    return [];
  }
}

let logger: IntegrationLogger;

export function getIntegrationLogger(): IntegrationLogger {
  if (!logger) {
    logger = new IntegrationLogger();
  }
  return logger;
}
