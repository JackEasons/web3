'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { Calendar, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import {
  getTokenHistoricalPrices,
  getTokenDetailsByContract,
  HistoricalPrice,
  TimeRange,
  SupportedCurrency,
} from '@/lib/price-service';
import { cn } from '@/lib/utils';

interface PriceChartProps {
  contractAddress: string;
  className?: string;
  currency?: SupportedCurrency;
  defaultTimeRange?: TimeRange;
  showTimeRangeSelector?: boolean;
  chartType?: 'line' | 'area';
}

interface ChartDataPoint {
  timestamp: number;
  price: number;
  date: string;
  time: string;
}

/**
 * 价格走势图组件
 * 显示代币的历史价格走势，支持多时间段和不同图表类型
 */
export function PriceChart({
  contractAddress,
  className,
  currency = 'usd',
  defaultTimeRange = '7d',
  showTimeRangeSelector = true,
  chartType = 'area',
}: PriceChartProps) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>(defaultTimeRange);
  const [tokenInfo, setTokenInfo] = useState<{symbol: string; name: string} | null>(null);
  const [priceChange, setPriceChange] = useState<{value: number; percentage: number} | null>(null);

  // 时间范围选项
  const timeRangeOptions: { value: TimeRange; label: string }[] = [
    { value: '1h', label: '1小时' },
    { value: '24h', label: '24小时' },
    { value: '7d', label: '7天' },
    { value: '30d', label: '30天' },
    { value: '90d', label: '90天' },
    { value: '1y', label: '1年' },
  ];

  /**
   * 获取代币信息
   */
  const fetchTokenInfo = useCallback(async () => {
    try {
      const info = await getTokenDetailsByContract(contractAddress);
      if (info) {
        setTokenInfo(info);
      }
    } catch (err) {
      console.error('获取代币信息失败:', err);
    }
  }, [contractAddress]);

  /**
   * 获取历史价格数据
   */
  const fetchHistoricalData = useCallback(async () => {
    if (!contractAddress || !tokenInfo) return;

    setLoading(true);
    setError(null);

    try {
      // 使用合约地址作为fallback ID
      const tokenId = tokenInfo.symbol.toLowerCase() || contractAddress;
      const historicalPrices = await getTokenHistoricalPrices(
        tokenId,
        timeRange,
        currency
      );

      if (historicalPrices.length === 0) {
        setError('暂无历史价格数据');
        return;
      }

      // 转换数据格式
      const formattedData: ChartDataPoint[] = historicalPrices.map((item: HistoricalPrice) => {
        const date = new Date(item.timestamp);
        return {
          timestamp: item.timestamp,
          price: item.price,
          date: date.toLocaleDateString(),
          time: date.toLocaleTimeString(),
        };
      });

      setChartData(formattedData);

      // 计算价格变化
      if (formattedData.length >= 2) {
        const firstPrice = formattedData[0].price;
        const lastPrice = formattedData[formattedData.length - 1].price;
        const change = lastPrice - firstPrice;
        const changePercentage = (change / firstPrice) * 100;
        
        setPriceChange({
          value: change,
          percentage: changePercentage,
        });
      }
    } catch (err) {
      setError('获取历史数据失败');
      console.error('Historical data fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [contractAddress, tokenInfo, timeRange, currency]);

  // 获取代币信息
  useEffect(() => {
    if (contractAddress) {
      fetchTokenInfo();
    }
  }, [contractAddress, fetchTokenInfo]);

  // 获取历史数据
  useEffect(() => {
    if (tokenInfo) {
      fetchHistoricalData();
    }
  }, [tokenInfo, timeRange, currency, fetchHistoricalData]);

  /**
   * 格式化价格显示
   */
  const formatPrice = (price: number): string => {
    if (price < 0.01) {
      return price.toExponential(2);
    } else if (price < 1) {
      return price.toFixed(6);
    } else if (price < 100) {
      return price.toFixed(4);
    } else {
      return price.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
  };

  /**
   * 格式化X轴标签
   */
  const formatXAxisLabel = (timestamp: number): string => {
    const date = new Date(timestamp);
    
    switch (timeRange) {
      case '1h':
      case '24h':
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      case '7d':
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      case '30d':
      case '90d':
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      case '1y':
        return date.toLocaleDateString([], { month: 'short', year: '2-digit' });
      default:
        return date.toLocaleDateString();
    }
  };

  /**
   * 自定义Tooltip
   */
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-900 border border-cyan-500/50 rounded-lg p-3 shadow-lg">
          <p className="text-cyan-400 text-sm font-medium">
            {new Date(label).toLocaleString()}
          </p>
          <p className="text-white font-bold">
            ${formatPrice(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (error) {
    return (
      <div className={cn('cyberpunk-card p-6', className)}>
        <div className="flex items-center justify-center text-red-400">
          <BarChart3 className="w-5 h-5 mr-2" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  const isPositiveChange = priceChange && priceChange.percentage >= 0;

  return (
    <div className={cn('cyberpunk-card p-6', className)}>
      {/* 头部信息 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <BarChart3 className="w-6 h-6 text-cyan-400" />
          <div>
            <h3 className="text-lg font-bold text-white">
              {tokenInfo?.name || '价格走势'}
            </h3>
            {priceChange && (
              <div className="flex items-center space-x-2 mt-1">
                {isPositiveChange ? (
                  <TrendingUp className="w-4 h-4 text-green-400" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-400" />
                )}
                <span
                  className={cn('text-sm font-medium', {
                    'text-green-400': isPositiveChange,
                    'text-red-400': !isPositiveChange,
                  })}
                >
                  {isPositiveChange ? '+' : ''}{priceChange.percentage.toFixed(2)}%
                </span>
                <span className="text-xs text-gray-400">
                  ({timeRangeOptions.find(opt => opt.value === timeRange)?.label})
                </span>
              </div>
            )}
          </div>
        </div>

        {showTimeRangeSelector && (
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
              className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-sm text-white focus:border-cyan-400 focus:outline-none"
            >
              {timeRangeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 图表区域 */}
      <div className="h-80 w-full">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
            <span className="ml-3 text-gray-400">加载图表数据...</span>
          </div>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={isPositiveChange ? '#10b981' : '#ef4444'}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor={isPositiveChange ? '#10b981' : '#ef4444'}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={formatXAxisLabel}
                  stroke="#9ca3af"
                  fontSize={12}
                />
                <YAxis
                  tickFormatter={(value) => `$${formatPrice(value)}`}
                  stroke="#9ca3af"
                  fontSize={12}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={isPositiveChange ? '#10b981' : '#ef4444'}
                  strokeWidth={2}
                  fill="url(#priceGradient)"
                />
              </AreaChart>
            ) : (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={formatXAxisLabel}
                  stroke="#9ca3af"
                  fontSize={12}
                />
                <YAxis
                  tickFormatter={(value) => `$${formatPrice(value)}`}
                  stroke="#9ca3af"
                  fontSize={12}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke={isPositiveChange ? '#10b981' : '#ef4444'}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: isPositiveChange ? '#10b981' : '#ef4444' }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <BarChart3 className="w-8 h-8 mr-3" />
            <span>暂无图表数据</span>
          </div>
        )}
      </div>

      {/* 图表统计信息 */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-gray-700">
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-1">最高价</p>
            <p className="text-sm font-medium text-green-400">
              ${formatPrice(Math.max(...chartData.map(d => d.price)))}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-1">最低价</p>
            <p className="text-sm font-medium text-red-400">
              ${formatPrice(Math.min(...chartData.map(d => d.price)))}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-1">平均价</p>
            <p className="text-sm font-medium text-white">
              ${formatPrice(chartData.reduce((sum, d) => sum + d.price, 0) / chartData.length)}
            </p>
          </div>
        </div>
      )}

      {/* 霓虹边框动画 */}
      <div className="absolute inset-0 rounded-lg border border-purple-500/30 animate-neon-border pointer-events-none" />
    </div>
  );
}