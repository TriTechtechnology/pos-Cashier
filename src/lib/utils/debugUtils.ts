/**
 * 🪄 MAGICAL Professional Debug Utilities
 * 
 * PURPOSE: Industry-leading debugging and monitoring utilities using
 * advanced logging patterns and performance monitoring for real-world apps.
 * 
 * ✨ MAGICAL FEATURES:
 * - 🎯 Professional structured logging
 * - ⚡ Performance monitoring with metrics
 * - 🛡️ Error tracking and reporting
 * - 🔥 Advanced debugging helpers
 * - 💎 Production-safe logging levels
 * - 🚀 Memory usage monitoring
 */

import React from 'react';

// 🪄 MAGICAL: Professional log levels
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

// 🪄 MAGICAL: Professional logger configuration
interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enablePerformance: boolean;
  enableMemoryTracking: boolean;
  prefix?: string;
}

// 🪄 MAGICAL: Default configuration for different environments
const getDefaultConfig = (): LoggerConfig => ({
  level: process.env.NODE_ENV === 'production' ? LogLevel.WARN : LogLevel.DEBUG,
  enableConsole: process.env.NODE_ENV !== 'production',
  enablePerformance: true,
  enableMemoryTracking: process.env.NODE_ENV !== 'production',
  prefix: '[POS]'
});

// 🪄 MAGICAL: Professional performance monitoring
class PerformanceMonitor {
  private static marks = new Map<string, number>();
  
  static mark(name: string): void {
    if (typeof performance !== 'undefined') {
      this.marks.set(name, performance.now());
    }
  }
  
  static measure(name: string, startMark: string): number {
    if (typeof performance !== 'undefined') {
      const startTime = this.marks.get(startMark);
      if (startTime) {
        const duration = performance.now() - startTime;
        console.log(`⚡ [PERF] ${name}: ${duration.toFixed(2)}ms`);
        return duration;
      }
    }
    return 0;
  }
  
  static memoryUsage(): string {
    if (typeof (performance as any)?.memory !== 'undefined') {
      const memory = (performance as any).memory;
      return `Memory: ${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB / ${Math.round(memory.totalJSHeapSize / 1024 / 1024)}MB`;
    }
    return 'Memory info not available';
  }
}

// 🪄 MAGICAL: Professional logger class
class ProfessionalLogger {
  private config: LoggerConfig;
  
  constructor(config?: Partial<LoggerConfig>) {
    this.config = { ...getDefaultConfig(), ...config };
  }
  
  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level;
  }
  
  private formatMessage(level: string, module: string, message: string, data?: any): void {
    if (!this.config.enableConsole) return;
    
    const timestamp = new Date().toISOString();
    const prefix = this.config.prefix || '[POS]';
    const formattedMessage = `${prefix} ${timestamp} [${level}] [${module}] ${message}`;
    
    switch (level) {
      case 'DEBUG':
        console.debug(formattedMessage, data);
        break;
      case 'INFO':
        console.info(formattedMessage, data);
        break;
      case 'WARN':
        console.warn(formattedMessage, data);
        break;
      case 'ERROR':
      case 'FATAL':
        console.error(formattedMessage, data);
        break;
    }
    
    if (this.config.enableMemoryTracking && level === 'DEBUG') {
      console.debug(`🧠 ${PerformanceMonitor.memoryUsage()}`);
    }
  }
  
  debug(module: string, message: string, data?: any): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.formatMessage('DEBUG', module, message, data);
    }
  }
  
  info(module: string, message: string, data?: any): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.formatMessage('INFO', module, message, data);
    }
  }
  
  warn(module: string, message: string, data?: any): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.formatMessage('WARN', module, message, data);
    }
  }
  
  error(module: string, message: string, error?: Error | any): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.formatMessage('ERROR', module, message, error);
    }
  }
  
  fatal(module: string, message: string, error?: Error | any): void {
    if (this.shouldLog(LogLevel.FATAL)) {
      this.formatMessage('FATAL', module, message, error);
    }
  }
  
  // 🪄 MAGICAL: Professional performance logging
  performance(module: string, operation: string, fn: () => any): any {
    if (!this.config.enablePerformance) return fn();
    
    const markName = `${module}-${operation}-start`;
    PerformanceMonitor.mark(markName);
    
    try {
      const result = fn();
      PerformanceMonitor.measure(`${module}.${operation}`, markName);
      return result;
    } catch (error) {
      this.error(module, `Performance monitoring failed for ${operation}`, error);
      throw error;
    }
  }
  
  // 🪄 MAGICAL: Professional async performance logging
  async performanceAsync<T>(module: string, operation: string, fn: () => Promise<T>): Promise<T> {
    if (!this.config.enablePerformance) return fn();
    
    const markName = `${module}-${operation}-start`;
    PerformanceMonitor.mark(markName);
    
    try {
      const result = await fn();
      PerformanceMonitor.measure(`${module}.${operation}`, markName);
      return result;
    } catch (error) {
      this.error(module, `Async performance monitoring failed for ${operation}`, error);
      throw error;
    }
  }
}

// 🪄 MAGICAL: Global logger instance
export const logger = new ProfessionalLogger();

// 🪄 MAGICAL: Professional debugging decorators and utilities
export const debugUtils = {
  // 🪄 MAGICAL: Function call tracer
  trace: <T extends (...args: any[]) => any>(fn: T, name?: string): T => {
    return ((...args: any[]) => {
      const functionName = name || fn.name || 'anonymous';
      logger.debug('TRACE', `Calling function: ${functionName}`, { args });
      
      try {
        const result = fn(...args);
        logger.debug('TRACE', `Function ${functionName} completed`, { result });
        return result;
      } catch (error) {
        logger.error('TRACE', `Function ${functionName} failed`, error);
        throw error;
      }
    }) as T;
  },
  
  // 🪄 MAGICAL: React component profiler
  profileComponent: <T extends React.ComponentType<any>>(componentName: string, Component: T): T => {
    const ProfiledComponent = React.memo((props: any) => {
      return logger.performance('COMPONENT', `${componentName}.render`, () => {
        return React.createElement(Component, props);
      });
    });
    
    ProfiledComponent.displayName = `Profiled(${componentName})`;
    return ProfiledComponent as unknown as T;
  },
  
  // 🪄 MAGICAL: Hook performance monitor
  profileHook: (hookName: string, hookFn: () => any) => {
    return logger.performance('HOOK', hookName, hookFn);
  },
  
  // 🪄 MAGICAL: API call tracer
  traceApiCall: async <T>(
    endpoint: string,
    operation: () => Promise<T>
  ): Promise<T> => {
    return logger.performanceAsync('API', endpoint, async () => {
      logger.info('API', `Calling endpoint: ${endpoint}`);
      
      try {
        const result = await operation();
        logger.info('API', `Endpoint ${endpoint} succeeded`);
        return result;
      } catch (error) {
        logger.error('API', `Endpoint ${endpoint} failed`, error);
        throw error;
      }
    });
  },
  
  // 🪄 MAGICAL: State change monitor
  monitorStateChange: (stateName: string, oldValue: any, newValue: any) => {
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      logger.debug('STATE', `State change: ${stateName}`, {
        from: oldValue,
        to: newValue
      });
    }
  },
  
  // 🪄 MAGICAL: Error boundary logger
  logError: (error: Error, errorInfo?: any) => {
    logger.fatal('ERROR_BOUNDARY', 'React error boundary caught error', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      errorInfo
    });
  }
};

// 🪄 MAGICAL: Professional development helpers
export const devUtils = {
  // 🪄 MAGICAL: Component tree inspector
  inspectComponent: (component: React.ReactElement) => {
    if (process.env.NODE_ENV === 'development') {
      console.group('🔍 Component Inspector');
      console.log('Type:', component.type);
      console.log('Props:', component.props);
      console.log('Key:', component.key);
      console.groupEnd();
    }
  },
  
  // 🪄 MAGICAL: Store state inspector
  inspectStore: (storeName: string, state: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.group(`🏪 Store Inspector: ${storeName}`);
      console.log('Current State:', state);
      console.log('State Keys:', Object.keys(state));
      console.log('State Size:', JSON.stringify(state).length, 'characters');
      console.groupEnd();
    }
  },
  
  // 🪄 MAGICAL: Performance inspector
  inspectPerformance: () => {
    if (process.env.NODE_ENV === 'development' && typeof performance !== 'undefined') {
      console.group('⚡ Performance Inspector');
      console.log(PerformanceMonitor.memoryUsage());
      
      if ((performance as any).memory) {
        const memory = (performance as any).memory;
        console.log('Heap Usage:', {
          used: `${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB`,
          total: `${Math.round(memory.totalJSHeapSize / 1024 / 1024)}MB`,
          limit: `${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)}MB`
        });
      }
      
      console.groupEnd();
    }
  }
};

// 🪄 MAGICAL: Global error handler
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    logger.fatal('GLOBAL_ERROR', 'Unhandled JavaScript error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error
    });
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    logger.fatal('UNHANDLED_REJECTION', 'Unhandled Promise rejection', {
      reason: event.reason
    });
  });
}

export default debugUtils;