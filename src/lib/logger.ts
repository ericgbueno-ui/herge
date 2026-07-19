type LogMeta = Record<string, any>;

export class Logger {
  private write(level: string, message: string, meta?: LogMeta) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      meta,
    };

    if (level === 'ERROR') {
      console.error(JSON.stringify(entry));
      return;
    }

    if (level === 'WARN') {
      console.warn(JSON.stringify(entry));
      return;
    }

    console.log(JSON.stringify(entry));
  }

  debug(message: string, meta?: LogMeta) {
    this.write('DEBUG', message, meta);
  }

  info(message: string, meta?: LogMeta) {
    this.write('INFO', message, meta);
  }

  warn(message: string, meta?: LogMeta) {
    this.write('WARN', message, meta);
  }

  error(message: string, meta?: LogMeta) {
    this.write('ERROR', message, meta);
  }
}
