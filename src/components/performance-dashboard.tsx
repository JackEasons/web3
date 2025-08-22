'use client';

import React, { useState, useEffect } from 'react';
import { Activity, Clock, Zap, Database, AlertTriangle, TrendingUp, X } from 'lucide-react';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';

/**
 * 性能监控仪表板组件属性
 */
interface PerformanceDashboardProps {
  isVisible: boolean;
  onClose: () => void;
}

/**
 * 性能监控仪表板组件
 * 显示应用的实时性能指标和统计信息
 */
export function PerformanceDashboard({ isVisible, onClose }: PerformanceDashboardProps) {
  const {
    getMetrics,
    getEvents,
    getPerformanceSummary,
    measureMemoryUsage,
    clearData,
    exportData,
  } = usePerformanceMonitor();

  const [metrics, setMetrics] = useState(getMetrics());
  const [summary, setSummary] = useState(getPerformanceSummary());
  const [memoryInfo, setMemoryInfo] = useState<any>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // 定期更新性能数据
  useEffect(() => {
    if (!isVisible || !autoRefresh) return;

    const interval = setInterval(() => {
      setMetrics(getMetrics());
      setSummary(getPerformanceSummary());
      const memory = measureMemoryUsage();
      if (memory) setMemoryInfo(memory);
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible, autoRefresh, getMetrics, getPerformanceSummary, measureMemoryUsage]);

  /**
   * 格式化数值显示
   */
  const formatValue = (value: number | undefined, unit: string = 'ms', decimals: number = 1): string => {
    if (value === undefined) return 'N/A';
    return `${value.toFixed(decimals)}${unit}`;
  };

  /**
   * 获取性能等级颜色
   */
  const getPerformanceColor = (value: number | undefined, thresholds: { good: number; poor: number }): string => {
    if (value === undefined) return 'text-gray-400';
    if (value <= thresholds.good) return 'neon-text-green';
    if (value <= thresholds.poor) return 'text-yellow-400';
    return 'neon-text-pink';
  };

  /**
   * 导出性能数据
   */
  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="cyberpunk-card rounded-2xl neon-border-green w-full max-w-6xl max-h-[90vh] overflow-hidden animate-scale-in">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b neon-border-green">
          <div className="flex items-center gap-3">
            <div className="p-2 neon-border-green rounded-xl animate-circuit-pulse">
              <Activity className="h-6 w-6 neon-text-green" />
            </div>
            <div>
              <h2 className="text-2xl font-bold neon-text-green glitch-effect" data-text="性能监控">性能监控</h2>
              <p className="text-sm neon-text-cyan mt-1">实时应用性能指标和统计</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 text-green-400 bg-transparent border-2 neon-border-green rounded focus:ring-green-400"
              />
              <span className="text-sm neon-text-green">自动刷新</span>
            </label>
            <button
              onClick={handleExport}
              className="neon-border-cyan bg-transparent neon-text-cyan px-4 py-2 rounded-lg hover:bg-cyan-400/10 transition-colors"
            >
              导出数据
            </button>
            <button
              onClick={clearData}
              className="neon-border-pink bg-transparent neon-text-pink px-4 py-2 rounded-lg hover:bg-pink-400/10 transition-colors"
            >
              清除数据
            </button>
            <button
              onClick={onClose}
              className="p-2 neon-border-green rounded-lg hover:bg-green-400/10 transition-colors"
            >
              <X className="h-5 w-5 neon-text-green" />
            </button>
          </div>
        </div>

        {/* 性能指标网格 */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Core Web Vitals */}
          <div className="mb-8">
            <h3 className="text-xl font-bold neon-text-cyan mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Core Web Vitals
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="cyberpunk-card rounded-xl p-4 neon-border-cyan">
                <div className="text-sm neon-text-cyan mb-2">FCP</div>
                <div className={`text-2xl font-bold ${getPerformanceColor(metrics.FCP, { good: 1800, poor: 3000 })}`}>
                  {formatValue(metrics.FCP)}
                </div>
                <div className="text-xs text-gray-500 mt-1">First Contentful Paint</div>
              </div>
              
              <div className="cyberpunk-card rounded-xl p-4 neon-border-purple">
                <div className="text-sm neon-text-purple mb-2">LCP</div>
                <div className={`text-2xl font-bold ${getPerformanceColor(metrics.LCP, { good: 2500, poor: 4000 })}`}>
                  {formatValue(metrics.LCP)}
                </div>
                <div className="text-xs text-gray-500 mt-1">Largest Contentful Paint</div>
              </div>
              
              <div className="cyberpunk-card rounded-xl p-4 neon-border-yellow">
                <div className="text-sm text-yellow-400 mb-2">FID</div>
                <div className={`text-2xl font-bold ${getPerformanceColor(metrics.FID, { good: 100, poor: 300 })}`}>
                  {formatValue(metrics.FID)}
                </div>
                <div className="text-xs text-gray-500 mt-1">First Input Delay</div>
              </div>
              
              <div className="cyberpunk-card rounded-xl p-4 neon-border-pink">
                <div className="text-sm neon-text-pink mb-2">CLS</div>
                <div className={`text-2xl font-bold ${getPerformanceColor(metrics.CLS, { good: 0.1, poor: 0.25 })}`}>
                  {formatValue(metrics.CLS, '', 3)}
                </div>
                <div className="text-xs text-gray-500 mt-1">Cumulative Layout Shift</div>
              </div>
              
              <div className="cyberpunk-card rounded-xl p-4 neon-border-green">
                <div className="text-sm neon-text-green mb-2">TTFB</div>
                <div className={`text-2xl font-bold ${getPerformanceColor(metrics.TTFB, { good: 800, poor: 1800 })}`}>
                  {formatValue(metrics.TTFB)}
                </div>
                <div className="text-xs text-gray-500 mt-1">Time to First Byte</div>
              </div>
            </div>
          </div>

          {/* 自定义性能指标 */}
          <div className="mb-8">
            <h3 className="text-xl font-bold neon-text-cyan mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5" />
              应用性能指标
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="cyberpunk-card rounded-xl p-4 neon-border-cyan">
                <div className="text-sm neon-text-cyan mb-2">查询时间</div>
                <div className={`text-2xl font-bold ${getPerformanceColor(summary.averageQueryTime, { good: 500, poor: 2000 })}`}>
                  {formatValue(summary.averageQueryTime)}
                </div>
                <div className="text-xs text-gray-500 mt-1">平均代币查询时间</div>
              </div>
              
              <div className="cyberpunk-card rounded-xl p-4 neon-border-purple">
                <div className="text-sm neon-text-purple mb-2">渲染时间</div>
                <div className={`text-2xl font-bold ${getPerformanceColor(summary.averageRenderTime, { good: 16, poor: 100 })}`}>
                  {formatValue(summary.averageRenderTime)}
                </div>
                <div className="text-xs text-gray-500 mt-1">平均组件渲染时间</div>
              </div>
              
              <div className="cyberpunk-card rounded-xl p-4 neon-border-green">
                <div className="text-sm neon-text-green mb-2">缓存命中率</div>
                <div className={`text-2xl font-bold ${getPerformanceColor((1 - summary.cacheHitRate) * 100, { good: 20, poor: 50 })}`}>
                  {formatValue(summary.cacheHitRate * 100, '%', 0)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {metrics.cacheStats ? `${metrics.cacheStats.hits}/${metrics.cacheStats.total}` : 'N/A'}
                </div>
              </div>
              
              <div className="cyberpunk-card rounded-xl p-4 neon-border-yellow">
                <div className="text-sm text-yellow-400 mb-2">内存使用</div>
                <div className={`text-2xl font-bold ${getPerformanceColor(memoryInfo?.usedJSHeapSize / (1024 * 1024), { good: 50, poor: 100 })}`}>
                  {memoryInfo ? formatValue(memoryInfo.usedJSHeapSize / (1024 * 1024), 'MB') : 'N/A'}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {memoryInfo ? `/ ${formatValue(memoryInfo.jsHeapSizeLimit / (1024 * 1024), 'MB')}` : 'JavaScript堆内存'}
                </div>
              </div>
            </div>
          </div>

          {/* 性能摘要 */}
          <div className="mb-8">
            <h3 className="text-xl font-bold neon-text-cyan mb-4 flex items-center gap-2">
              <Database className="h-5 w-5" />
              性能摘要
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="cyberpunk-card rounded-xl p-4 neon-border-cyan">
                <div className="text-sm neon-text-cyan mb-2">总事件数</div>
                <div className="text-2xl font-bold neon-text-cyan">{summary.totalEvents}</div>
              </div>
              
              <div className="cyberpunk-card rounded-xl p-4 neon-border-pink">
                <div className="text-sm neon-text-pink mb-2">错误数量</div>
                <div className="text-2xl font-bold neon-text-pink">{summary.errorCount}</div>
              </div>
              
              <div className="cyberpunk-card rounded-xl p-4 neon-border-yellow">
                <div className="text-sm text-yellow-400 mb-2">慢交互</div>
                <div className="text-2xl font-bold text-yellow-400">{summary.slowInteractions}</div>
              </div>
              
              <div className="cyberpunk-card rounded-xl p-4 neon-border-green">
                <div className="text-sm neon-text-green mb-2">性能评分</div>
                <div className="text-2xl font-bold neon-text-green">
                  {summary.errorCount === 0 && summary.slowInteractions === 0 ? 'A' : 
                   summary.errorCount < 5 && summary.slowInteractions < 3 ? 'B' : 'C'}
                </div>
              </div>
            </div>
          </div>

          {/* 性能建议 */}
          <div>
            <h3 className="text-xl font-bold neon-text-cyan mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              性能建议
            </h3>
            <div className="cyberpunk-card rounded-xl p-6 neon-border-yellow">
              <div className="space-y-3">
                {summary.averageQueryTime > 2000 && (
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
                    <div>
                      <div className="font-medium text-yellow-400">查询性能优化</div>
                      <div className="text-sm text-gray-300">代币查询时间较长，建议检查网络连接或优化查询逻辑</div>
                    </div>
                  </div>
                )}
                
                {summary.averageRenderTime > 100 && (
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
                    <div>
                      <div className="font-medium text-yellow-400">渲染性能优化</div>
                      <div className="text-sm text-gray-300">组件渲染时间较长，建议使用React.memo或优化组件结构</div>
                    </div>
                  </div>
                )}
                
                {summary.cacheHitRate < 0.5 && (
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
                    <div>
                      <div className="font-medium text-yellow-400">缓存优化</div>
                      <div className="text-sm text-gray-300">缓存命中率较低，建议调整缓存策略或增加缓存时间</div>
                    </div>
                  </div>
                )}
                
                {memoryInfo && memoryInfo.usedJSHeapSize / (1024 * 1024) > 100 && (
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
                    <div>
                      <div className="font-medium text-yellow-400">内存优化</div>
                      <div className="text-sm text-gray-300">内存使用量较高，建议检查是否存在内存泄漏</div>
                    </div>
                  </div>
                )}
                
                {summary.totalEvents === 0 && (
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 neon-text-green mt-0.5" />
                    <div>
                      <div className="font-medium neon-text-green">性能良好</div>
                      <div className="text-sm text-gray-300">当前应用性能表现良好，继续保持！</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}