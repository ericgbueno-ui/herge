/**
 * QUEUE MANAGER
 * Gerencia filas de integração
 * Responsável por enfileirar jobs de integração
 *
 * Fallback em memória para evitar dependência direta de Bull no build.
 */

export interface Job {
  id: string;
  data: {
    provider: string;
    connectionId: string;
    companyId: string;
    data?: Record<string, any>;
  };
  attemptsMade: number;
  opts: {
    attempts?: number;
  };
}

type QueueCounts = {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
};

type QueueHandler = (job: Job) => Promise<any>;

export class Queue {
  private waiting: Job[] = [];
  private active: Job[] = [];
  private completed: Job[] = [];
  private failed: Job[] = [];
  private delayed: Job[] = [];
  private listeners: Map<string, Array<(...args: any[]) => void>> = new Map();
  private handler?: QueueHandler;
  private counter = 0;

  constructor(
    private name: string,
    private redisUrl: string,
    private options?: Record<string, any>
  ) {
    void this.name;
    void this.redisUrl;
    void this.options;
  }

  async add(data: Job['data'], opts?: { priority?: number; delay?: number; attempts?: number }) {
    const job: Job = {
      id: `${this.name}-${++this.counter}`,
      data,
      attemptsMade: 0,
      opts: {
        attempts: opts?.attempts,
      },
    };

    const delay = opts?.delay || 0;
    if (delay > 0) {
      this.delayed.push(job);
      setTimeout(() => {
        this.delayed = this.delayed.filter((item) => item.id !== job.id);
        this.waiting.push(job);
        void this.drain();
      }, delay);
    } else {
      this.waiting.push(job);
      void this.drain();
    }

    return job;
  }

  process(_concurrency: number, handler: QueueHandler) {
    this.handler = handler;
    void this.drain();
  }

  on(event: string, handler: (...args: any[]) => void) {
    const list = this.listeners.get(event) || [];
    list.push(handler);
    this.listeners.set(event, list);
  }

  async getJobCounts(): Promise<QueueCounts> {
    return {
      waiting: this.waiting.length,
      active: this.active.length,
      completed: this.completed.length,
      failed: this.failed.length,
      delayed: this.delayed.length,
    };
  }

  async clean(_grace: number, status: 'completed' | 'failed') {
    if (status === 'completed') {
      this.completed = [];
    }

    if (status === 'failed') {
      this.failed = [];
    }
  }

  async close() {
    this.handler = undefined;
    this.waiting = [];
    this.active = [];
    this.delayed = [];
  }

  private emit(event: string, ...args: any[]) {
    const handlers = this.listeners.get(event) || [];
    handlers.forEach((handler) => {
      try {
        handler(...args);
      } catch (error) {
        console.error(`[Queue:${this.name}] Listener error`, error);
      }
    });
  }

  private async drain() {
    if (!this.handler || this.active.length > 0) {
      return;
    }

    const job = this.waiting.shift();
    if (!job) {
      return;
    }

    this.active.push(job);

    try {
      await this.handler(job);
      this.active = this.active.filter((item) => item.id !== job.id);
      this.completed.push(job);
      this.emit('completed', job);
    } catch (error) {
      job.attemptsMade += 1;
      this.active = this.active.filter((item) => item.id !== job.id);
      this.failed.push(job);
      this.emit('failed', job, error);
      this.emit('error', error);
    }

    void this.drain();
  }
}

type BullQueue = Queue;

export enum QueueType {
  SYNC = 'integration:sync',
  WEBHOOK = 'integration:webhook',
  REFRESH_TOKEN = 'integration:refresh-token',
  HEALTH_CHECK = 'integration:health-check',
  RETRY = 'integration:retry',
  WORKFLOW = 'workflow:execute',
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

    // Workflow queue - executar workflows em background
    this.queues.set(
      QueueType.WORKFLOW,
      new Queue(QueueType.WORKFLOW, this.redisUrl, {
        defaultJobOptions: {
          removeOnComplete: true,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 3000,
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
