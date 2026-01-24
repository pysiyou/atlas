/**
 * Application Logging Utility
 * Provides structured logging with different levels
 * In production, logs can be sent to monitoring services (Sentry, LogRocket, etc.)
 */

export const LogLevel = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
} as const;

export type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;
  private isProduction = import.meta.env.PROD;

  /**
   * Debug level logging - only in development
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      // eslint-disable-next-line no-console
      console.log(`[${LogLevel.DEBUG}] ${message}`, context || '');
    }
  }

  /**
   * Info level logging
   */
  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      // eslint-disable-next-line no-console
      console.info(`[${LogLevel.INFO}] ${message}`, context || '');
    }
    // In production, send to monitoring service
    if (this.isProduction) {
      this.sendToMonitoring(LogLevel.INFO, message, context);
    }
  }

  /**
   * Warning level logging
   */
  warn(message: string, context?: LogContext): void {
    console.warn(`[${LogLevel.WARN}] ${message}`, context || '');
    if (this.isProduction) {
      this.sendToMonitoring(LogLevel.WARN, message, context);
    }
  }

  /**
   * Error level logging
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext = {
      ...context,
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : error,
    };

    console.error(`[${LogLevel.ERROR}] ${message}`, errorContext);

    if (this.isProduction) {
      this.sendToMonitoring(LogLevel.ERROR, message, errorContext);
    }
  }

  /**
   * Log data initialization events
   */
  dataInit(entityType: string, count: number): void {
    this.debug(`🌱 Initializing ${entityType}`, { count });
  }

  /**
   * Log data loading events
   */
  dataLoaded(entityType: string, count: number): void {
    this.info(`📦 ${entityType} loaded`, { count });
  }

  /**
   * Log version information
   */
  version(version: number | string): void {
    this.info(`📊 Data version: ${version}`);
  }

  /**
   * Send logs to monitoring service (placeholder for production integration).
   * Planned: Sentry, LogRocket, or similar. TODO: Integrate when chosen.
   *
   * @param level - Log level (DEBUG, INFO, WARN, ERROR)
   * @param message - Log message
   * @param context - Optional context data
   */
  private sendToMonitoring(level: LogLevel, message: string, context?: LogContext): void {
    // TODO: Integrate with monitoring service (Sentry, LogRocket, etc.)
    // Example:
    // Sentry.captureMessage(message, {
    //   level: level.toLowerCase(),
    //   extra: context,
    // });

    // Prevent unused variable warnings until monitoring is integrated
    void level;
    void message;
    void context;
  }
}

// Export singleton instance
export const logger = new Logger();

// Export for testing or custom instances
export { Logger };
