'use client';

import { useEffect, useCallback, useRef } from 'react';

/**
 * 性能指标接口
 */
interface PerformanceMetrics {
  // Core Web Vitals
  FCP?: number; // First Contentful Paint
  LCP?: number; // Largest Contentful Paint
  FID?: number; // First Input Delay
  CLS?: number; // Cumulative Layout Shift
  TTFB?: number; // Time to First Byte
  
  // 自定义指标
  queryTime?: number; // 代币查询时间
  renderTime?: number; // 组件渲染时间
  cacheHitRate?: number; // 缓存命中率
  
  // 新增性能指标
  memoryUsage?: number; // 内存使用量 (MB)
  interactionTime?: number; // 用户交互响应时间
  networkTime?: number; // 网络请求时间
  errorRate?: number; // 错误率
  
  // 缓存统计
  cacheStats?: {
    hits: number;
    total: number;
  };
}

/**
 * 性能事件接口
 */
interface PerformanceEvent {
  type: 'web-vital' | 'custom' | 'error';
  name: string;
  value: number;
  timestamp: number;
  url: string;
  userAgent: string;
}

/**
 * 性能监控Hook
 * 收集和报告应用性能指标，包括Core Web Vitals和自定义指标
 */
export function usePerformanceMonitor() {
  const metricsRef = useRef<PerformanceMetrics>({});
  const eventsRef = useRef<PerformanceEvent[]>([]);
  const observersRef = useRef<PerformanceObserver[]>([]);

  /**
   * 记录性能事件
   */
  const recordEvent = useCallback((event: Omit<PerformanceEvent, 'timestamp' | 'url' | 'userAgent'>) => {
    const performanceEvent: PerformanceEvent = {
      ...event,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };
    
    eventsRef.current.push(performanceEvent);
    
    // 限制事件数量，避免内存泄漏
    if (eventsRef.current.length > 100) {
      eventsRef.current = eventsRef.current.slice(-50);
    }
    
    // 在开发环境下输出到控制台
    if (process.env.NODE_ENV === 'development') {
      console.log('Performance Event:', performanceEvent);
    }
  }, []);

  /**
   * 测量代币查询性能
   */
  const measureTokenQuery = useCallback(() => {
    const startTime = performance.now();
    
    return {
      end: () => {
        const duration = performance.now() - startTime;
        metricsRef.current.queryTime = duration;
        
        recordEvent({
          type: 'custom',
          name: 'token-query-duration',
          value: duration
        });
        
        return duration;
      }
    };
  }, [recordEvent]);

  /**
   * 测量组件渲染性能
   */
  const measureRender = useCallback((componentName: string) => {
    const startTime = performance.now();
    
    return {
      end: () => {
        const duration = performance.now() - startTime;
        metricsRef.current.renderTime = duration;
        
        recordEvent({
          type: 'custom',
          name: `${componentName}-render-duration`,
          value: duration
        });
        
        // 记录渲染性能阈值警告
        if (duration > 100) {
          recordEvent({
            type: 'custom',
            name: `${componentName}-slow-render`,
            value: duration
          });
        }
        
        return duration;
      }
    };
  }, [recordEvent]);

  /**
   * 记录缓存命中率
   */
  const recordCacheHit = useCallback((hit: boolean) => {
    // 使用更精确的缓存命中率计算
    const cacheStats = metricsRef.current.cacheStats || { hits: 0, total: 0 };
    cacheStats.total += 1;
    if (hit) cacheStats.hits += 1;
    
    const newRate = cacheStats.total > 0 ? cacheStats.hits / cacheStats.total : 0;
    metricsRef.current.cacheHitRate = newRate;
    metricsRef.current.cacheStats = cacheStats;
    
    recordEvent({
      type: 'custom',
      name: 'cache-hit-rate',
      value: newRate
    });
    
    recordEvent({
      type: 'custom',
      name: hit ? 'cache-hit' : 'cache-miss',
      value: 1
    });
  }, [recordEvent]);

  /**
   * 记录错误
   */
  const recordError = useCallback((error: Error, context?: string) => {
    recordEvent({
      type: 'error',
      name: `error-${context || 'unknown'}`,
      value: 1
    });
    
    // 在开发环境下输出错误详情
    if (process.env.NODE_ENV === 'development') {
      console.error('Performance Error:', error, context);
    }
  }, [recordEvent]);

  /**
   * 获取当前性能指标
   */
  const getMetrics = useCallback((): PerformanceMetrics => {
    return { ...metricsRef.current };
  }, []);

  /**
   * 获取性能事件历史
   */
  const getEvents = useCallback((): PerformanceEvent[] => {
    return [...eventsRef.current];
  }, []);

  /**
   * 导出性能数据
   */
  const exportData = useCallback(() => {
    return {
      metrics: getMetrics(),
      events: getEvents(),
      exportTime: Date.now(),
      version: '1.0'
    };
  }, [getMetrics, getEvents]);

  /**
   * 测量内存使用情况
   */
  const measureMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const memoryInfo = {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
      };
      
      recordEvent({
        type: 'custom',
        name: 'memory-usage',
        value: memoryInfo.usedJSHeapSize / (1024 * 1024) // MB
      });
      
      return memoryInfo;
    }
    return null;
  }, [recordEvent]);

  /**
   * 测量用户交互性能
   */
  const measureInteraction = useCallback((interactionName: string) => {
    const startTime = performance.now();
    
    return {
      end: () => {
        const duration = performance.now() - startTime;
        
        recordEvent({
          type: 'custom',
          name: `interaction-${interactionName}`,
          value: duration
        });
        
        // 记录交互延迟警告
        if (duration > 200) {
          recordEvent({
            type: 'custom',
            name: `slow-interaction-${interactionName}`,
            value: duration
          });
        }
        
        return duration;
      }
    };
  }, [recordEvent]);

  /**
   * 测量网络请求性能
   */
  const measureNetworkRequest = useCallback((requestName: string) => {
    const startTime = performance.now();
    
    return {
      end: (success: boolean = true) => {
        const duration = performance.now() - startTime;
        
        recordEvent({
          type: 'custom',
          name: `network-${requestName}`,
          value: duration
        });
        
        recordEvent({
          type: 'custom',
          name: `network-${requestName}-${success ? 'success' : 'error'}`,
          value: 1
        });
        
        // 记录慢网络请求
        if (duration > 3000) {
          recordEvent({
            type: 'custom',
            name: `slow-network-${requestName}`,
            value: duration
          });
        }
        
        return duration;
      }
    };
  }, [recordEvent]);

  /**
   * 获取性能摘要
   */
  const getPerformanceSummary = useCallback(() => {
    const events = eventsRef.current;
    const summary = {
      totalEvents: events.length,
      errorCount: events.filter(e => e.type === 'error').length,
      averageQueryTime: 0,
      averageRenderTime: 0,
      cacheHitRate: metricsRef.current.cacheHitRate || 0,
      slowInteractions: events.filter(e => e.name.includes('slow-')).length,
    };
    
    const queryEvents = events.filter(e => e.name.includes('token-query'));
    if (queryEvents.length > 0) {
      summary.averageQueryTime = queryEvents.reduce((sum, e) => sum + e.value, 0) / queryEvents.length;
    }
    
    const renderEvents = events.filter(e => e.name.includes('render-duration'));
    if (renderEvents.length > 0) {
      summary.averageRenderTime = renderEvents.reduce((sum, e) => sum + e.value, 0) / renderEvents.length;
    }
    
    return summary;
  }, []);

  /**
   * 清除性能数据
   */
  const clearData = useCallback(() => {
    metricsRef.current = {};
    eventsRef.current = [];
  }, []);

  /**
   * 初始化Web Vitals监控
   */
  useEffect(() => {
    // 检查浏览器支持
    if (typeof window === 'undefined' || !window.PerformanceObserver) {
      return;
    }

    const observers: PerformanceObserver[] = [];

    try {
      // 监控 LCP (Largest Contentful Paint)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        
        if (lastEntry) {
          metricsRef.current.LCP = lastEntry.startTime;
          recordEvent({
            type: 'web-vital',
            name: 'LCP',
            value: lastEntry.startTime
          });
        }
      });
      
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      observers.push(lcpObserver);

      // 监控 FID (First Input Delay)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          metricsRef.current.FID = entry.processingStart - entry.startTime;
          recordEvent({
            type: 'web-vital',
            name: 'FID',
            value: entry.processingStart - entry.startTime
          });
        });
      });
      
      fidObserver.observe({ entryTypes: ['first-input'] });
      observers.push(fidObserver);

      // 监控 CLS (Cumulative Layout Shift)
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        const entries = list.getEntries();
        
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        
        if (clsValue > 0) {
          metricsRef.current.CLS = clsValue;
          recordEvent({
            type: 'web-vital',
            name: 'CLS',
            value: clsValue
          });
        }
      });
      
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      observers.push(clsObserver);

      // 监控导航时间
      const navigationObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          // TTFB (Time to First Byte)
          const ttfb = entry.responseStart - entry.requestStart;
          metricsRef.current.TTFB = ttfb;
          
          recordEvent({
            type: 'web-vital',
            name: 'TTFB',
            value: ttfb
          });
          
          // FCP (First Contentful Paint)
          if (entry.firstContentfulPaint) {
            metricsRef.current.FCP = entry.firstContentfulPaint;
            recordEvent({
              type: 'web-vital',
              name: 'FCP',
              value: entry.firstContentfulPaint
            });
          }
        });
      });
      
      navigationObserver.observe({ entryTypes: ['navigation'] });
      observers.push(navigationObserver);

    } catch (error) {
      console.warn('Performance monitoring setup failed:', error);
    }

    observersRef.current = observers;

    // 清理函数
    return () => {
      observers.forEach(observer => {
        try {
          observer.disconnect();
        } catch (error) {
          console.warn('Failed to disconnect performance observer:', error);
        }
      });
    };
  }, [recordEvent]);

  /**
   * 页面可见性变化时记录事件
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      recordEvent({
        type: 'custom',
        name: 'visibility-change',
        value: document.hidden ? 0 : 1
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [recordEvent]);

  return {
    // 测量方法
    measureTokenQuery,
    measureRender,
    measureInteraction,
    measureNetworkRequest,
    measureMemoryUsage,
    recordCacheHit,
    recordError,
    
    // 数据获取
    getMetrics,
    getEvents,
    getPerformanceSummary,
    exportData,
    clearData,
    
    // 当前指标（只读）
    metrics: metricsRef.current
  };
}