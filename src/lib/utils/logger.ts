/**
 * PRODUCTION LOGGING UTILITY
 *
 * Centralized logging with environment-based levels
 * - Development: All logs visible
 * - Production: Only warnings and errors
 *
 * Usage:
 * import { logger } from '@/lib/utils/logger';
 * logger.debug('Debug info', data);
 * logger.info('Info message', data);
 * logger.warn('Warning', data);
 * logger.error('Error', error);
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

class Logger {
  private logLevel: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    // Get log level from environment or default based on NODE_ENV
    this.isDevelopment = process.env.NODE_ENV === 'development';

    const envLogLevel = process.env.NEXT_PUBLIC_LOG_LEVEL as LogLevel;
    this.logLevel = envLogLevel || (this.isDevelopment ? 'debug' : 'warn');
  }

  /**
   * Debug logs - detailed information for debugging
   * Only visible in development or when LOG_LEVEL=debug
   */
  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.log(`🔍 [DEBUG] ${message}`, ...args);
    }
  }

  /**
   * Info logs - general information
   * Visible in development and when LOG_LEVEL=info or below
   */
  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.log(`ℹ️ [INFO] ${message}`, ...args);
    }
  }

  /**
   * Warning logs - potential issues
   * Always visible in production (default level)
   */
  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(`⚠️ [WARN] ${message}`, ...args);
    }
  }

  /**
   * Error logs - critical errors
   * Always visible (except when LOG_LEVEL=silent)
   */
  error(message: string, error?: any, ...args: any[]): void {
    if (this.shouldLog('error')) {
      console.error(`❌ [ERROR] ${message}`, error, ...args);

      // In production, you might want to send errors to monitoring service
      if (!this.isDevelopment && typeof window !== 'undefined') {
        // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
        // this.sendToErrorTracking(message, error);
      }
    }
  }

  /**
   * Performance tracking - measure operation duration
   */
  performance(operation: string, fn: () => void | Promise<void>): void | Promise<void> {
    if (this.shouldLog('debug')) {
      const start = performance.now();
      const result = fn();

      if (result instanceof Promise) {
        return result.finally(() => {
          const duration = performance.now() - start;
          if (duration > 100) {
            this.warn(`Slow operation: ${operation} took ${duration.toFixed(2)}ms`);
          } else {
            this.debug(`${operation} completed in ${duration.toFixed(2)}ms`);
          }
        });
      } else {
        const duration = performance.now() - start;
        if (duration > 100) {
          this.warn(`Slow operation: ${operation} took ${duration.toFixed(2)}ms`);
        } else {
          this.debug(`${operation} completed in ${duration.toFixed(2)}ms`);
        }
      }
    } else {
      return fn();
    }
  }

  /**
   * Group logs together (useful for debugging complex flows)
   */
  group(label: string, fn: () => void): void {
    if (this.shouldLog('debug')) {
      console.group(label);
      fn();
      console.groupEnd();
    } else {
      fn();
    }
  }

  /**
   * Trace logs - show stack trace
   */
  trace(message: string): void {
    if (this.shouldLog('debug')) {
      console.log(`🔍 [TRACE] ${message}`);
      console.trace();
    }
  }

  /**
   * Check if should log based on current level
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error', 'silent'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const requestedLevelIndex = levels.indexOf(level);

    return requestedLevelIndex >= currentLevelIndex;
  }

  /**
   * Change log level at runtime (for debugging)
   */
  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
    this.info(`Log level changed to: ${level}`);
  }

  /**
   * Get current log level
   */
  getLogLevel(): LogLevel {
    return this.logLevel;
  }
}

// Export singleton instance
export const logger = new Logger();

// Export type for external use
export type { LogLevel };

/**
 * Usage examples:
 *
 * // Development (all logs visible)
 * logger.debug('Cart state', cartState);
 * logger.info('Order created', orderId);
 * logger.warn('Slow network detected');
 * logger.error('Failed to sync', error);
 *
 * // Production (only warnings and errors)
 * // Set NEXT_PUBLIC_LOG_LEVEL=warn in .env.production
 * logger.debug('...');  // Hidden
 * logger.info('...');   // Hidden
 * logger.warn('...');   // Visible
 * logger.error('...');  // Visible
 *
 * // Performance tracking
 * logger.performance('sync-orders', async () => {
 *   await syncService.syncPendingOrders();
 * });
 *
 * // Grouped logs
 * logger.group('Cart Operations', () => {
 *   logger.debug('Item added', item);
 *   logger.debug('Total updated', total);
 * });
 */
