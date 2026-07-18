/**
 * QUEUE MANAGER
 * Gerencia filas BullMQ + Redis
 * Responsável por enfileirar jobs de integração
 */

import Queue, { Queue as BullQueue, Job } from 'bull';

export enum QueueType {
  SYNC = 'integration:sync',
  WEBHOOK = 'integration:webhook',
  REFRESH_TOKEN = 'integration:refresh-token',
  HEALTH_CHECK = 'integration:health-check',
  RETRY = 'integration:retry',
}

export interface QueueJob {
  type: QueueType;
  provider: string;
  connectionId: string;
  companyId: string;
  data?: Record<string, any>;
  priority?: number;
  delayMs?: number;
  attempts?: number;
}

export class QueueManager {
  private queues: Map<QueueType, BullQueue> = new Map();
  private redisUrl: string;

  constructor() {
    this.redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.initializeQueues();
  }

  /**
   * Inicializar filas
   */
  private initializeQueues(): void {
    // Sync queue - sincronização de dados
    this.queues.set(
      QueueType.SYNC,
      new Queue(QueueType.SYNC, this.redisUrl, {
        defaultJobOptions: {
          removeOnComplete: true,
          removeOnFail: false,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      })
    );

    // Webhook queue - processamento de webhooks
    this.queues.set(
      QueueType.WEBHOOK,
      new Queue(QueueType.WEBHOOK, this.redisUrl, {
        defaultJobOptions: {
          removeOnComplete: true,
          removeOnFail: false,
          attempts: 5,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        },
      })
    );

    // Refresh token queue - renovação de tokens
    this.queues.set(
      QueueType.REFRESH_TOKEN,
      new Queue(QueueType.REFRESH_TOKEN, this.redisUrl, {
        defaultJobOptions: {
          removeOnComplete: true,
          attempts: 2,
        },
      })
    );

    // Health check queue - verificação de saúde
    this.queues.set(
      QueueType.HEALTH_CHECK,
      new Queue(QueueType.HEALTH_CHECK, this.redisUrl, {
        defaultJobOptions: {
          removeOnComplete: true,
        },
      })
    );

    // Retry queue - reintentar jobs falhados
    this.queues.set(
      QueueType.RETRY,
      new Queue(QueueType.RETRY, this.redisUrl, {
        defaultJobOptions: {
          removeOnComplete: true,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
        },
      })
    );

    console.log('[QueueManager] Filas inicializadas');
  }

  /**
   * Enfileirar job
   */
  async enqueue(job: QueueJob): Promise<Job> {
    const queue = this.queues.get(job.type);

    if (!queue) {
      throw new Error(`Fila ${job.type} não encontrada`);
    }

    const bullJob = await queue.add(
      {
        provider: job.provider,
        connectionId: job.connectionId,
        companyId: job.companyId,
        data: job.data,
      },
      {
        priority: job.priority || 5,
        delay: job.delayMs || 0,
        attempts: job.attempts || 3,
      }
    );

    console.log(
      `[QueueManager] Job enfileirado: ${job.type} (ID: ${bullJob.id}, Provider: ${job.provider})`
    );

    return bullJob;
  }

  /**
   * Registrar handler para fila
   */
  async onProcess(
    queueType: QueueType,
    handler: (job: Job, queue: BullQueue) => Promise<any>
  ): Promise<void> {
    const queue = this.queues.get(queueType);

    if (!queue) {
      throw new Error(`Fila ${queueType} não encontrada`);
    }

    queue.process(5, async (job) => {
      try {
        console.log(`[QueueManager] Processando job: ${queueType} (${job.id})`);
        const result = await handler(job, queue);
        console.log(`[QueueManager] Job completado: ${queueType} (${job.id})`);
        return result;
      } catch (error) {
        console.error(`[QueueManager] Erro ao processar job: ${job.id}`, error);
        throw error;
      }
    });

    // Eventos da fila
    queue.on('completed', (job) => {
      console.log(`[QueueManager] Job completado: ${queueType} (${job.id})`);
    });

    queue.on('failed', (job, err) => {
      console.error(
        `[QueueManager] Job falhou: ${queueType} (${job.id}), tentativas: ${job.attemptsMade}/${job.opts.attempts}`,
        err.message
      );
    });

    queue.on('error', (error) => {
      console.error(`[QueueManager] Erro na fila: ${queueType}`, error);
    });
  }

  /**
   * Obter status das filas
   */
  async getStatus(): Promise<Record<string, any>> {
    const status: Record<string, any> = {};

    for (const [queueType, queue] of this.queues) {
      const counts = await queue.getJobCounts();
      status[queueType] = {
        waiting: counts.waiting,
        active: counts.active,
        completed: counts.completed,
        failed: counts.failed,
        delayed: counts.delayed,
      };
    }

    return status;
  }

  /**
   * Limpar fila
   */
  async clearQueue(queueType: QueueType): Promise<void> {
    const queue = this.queues.get(queueType);

    if (!queue) {
      throw new Error(`Fila ${queueType} não encontrada`);
    }

    await queue.clean(0, 'completed');
    await queue.clean(0, 'failed');
    console.log(`[QueueManager] Fila ${queueType} limpa`);
  }

  /**
   * Fechar todas as filas
   */
  async close(): Promise<void> {
    for (const queue of this.queues.values()) {
      await queue.close();
    }
    console.log('[QueueManager] Todas as filas fechadas');
  }

  /**
   * Obter fila por tipo
   */
  getQueue(queueType: QueueType): BullQueue | undefined {
    return this.queues.get(queueType);
  }
}

let queueManager: QueueManager;

export function getQueueManager(): QueueManager {
  if (!queueManager) {
    queueManager = new QueueManager();
  }
  return queueManager;
}
