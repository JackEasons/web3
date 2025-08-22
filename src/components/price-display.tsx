'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, DollarSign, RefreshCw } from 'lucide-react';
import { getTokenPriceByContract, TokenPrice, SupportedCurrency } from '@/lib/price-service';
import { cn } from '@/lib/utils';

interface PriceDisplayProps {
  contractAddress: string;
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // 毫秒
  showCurrencySelector?: boolean;
}

/**
 * 价格展示组件
 * 显示代币的实时价格信息，包括价格变化和动画效果
 */
export function PriceDisplay({
  contractAddress,
  className,
  autoRefresh = true,
  refreshInterval = 30000, // 30秒
  showCurrencySelector = true,
}: PriceDisplayProps) {
  const [priceData, setPriceData] = useState<TokenPrice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState<SupportedCurrency>('usd');
  const [lastPrice, setLastPrice] = useState<number | null>(null);
  const [priceAnimation, setPriceAnimation] = useState<'up' | 'down' | null>(null);

  // 支持的货币选项
  const currencyOptions: { value: SupportedCurrency; label: string; symbol: string }[] = [
    { value: 'usd', label: 'USD', symbol: '$' },
    { value: 'eur', label: 'EUR', symbol: '€' },
    { value: 'jpy', label: 'JPY', symbol: '¥' },
    { value: 'gbp', label: 'GBP', symbol: '£' },
    { value: 'cny', label: 'CNY', symbol: '¥' },
    { value: 'krw', label: 'KRW', symbol: '₩' },
  ];

  const currentCurrencyOption = currencyOptions.find(opt => opt.value === currency);

  /**
   * 获取价格数据
   */
  const fetchPriceData = useCallback(async () => {
    if (!contractAddress) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getTokenPriceByContract(contractAddress, currency);
      if (data) {
        // 检查价格变化并触发动画
        if (lastPrice !== null && data.current_price !== lastPrice) {
          setPriceAnimation(data.current_price > lastPrice ? 'up' : 'down');
          setTimeout(() => setPriceAnimation(null), 1000);
        }
        setLastPrice(data.current_price);
        setPriceData(data);
      } else {
        setError('无法获取价格数据');
      }
    } catch (err) {
      setError('获取价格失败');
      console.error('Price fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [contractAddress, currency, lastPrice]);

  // 初始加载和货币变化时获取数据
  useEffect(() => {
    fetchPriceData();
  }, [fetchPriceData]);

  // 自动刷新
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchPriceData, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchPriceData]);

  /**
   * 格式化价格显示
   */
  const formatPrice = (price: number): string => {
    if (price === 0) return '0';
    
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
   * 格式化百分比变化
   */
  const formatPercentage = (percentage: number): string => {
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
  };

  /**
   * 格式化市值
   */
  const formatMarketCap = (marketCap: number): string => {
    if (marketCap >= 1e12) {
      return `${(marketCap / 1e12).toFixed(2)}T`;
    } else if (marketCap >= 1e9) {
      return `${(marketCap / 1e9).toFixed(2)}B`;
    } else if (marketCap >= 1e6) {
      return `${(marketCap / 1e6).toFixed(2)}M`;
    } else if (marketCap >= 1e3) {
      return `${(marketCap / 1e3).toFixed(2)}K`;
    }
    return marketCap.toFixed(2);
  };

  if (error) {
    return (
      <div className={cn('cyberpunk-card p-4', className)}>
        <div className="flex items-center justify-center text-red-400">
          <span className="text-sm">{error}</span>
          <button
            onClick={fetchPriceData}
            className="ml-2 p-1 hover:bg-red-500/20 rounded transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  if (!priceData) {
    return (
      <div className={cn('cyberpunk-card p-4', className)}>
        <div className="flex items-center justify-center">
          <RefreshCw className={cn('w-5 h-5 animate-spin text-cyan-400', { 'opacity-50': !loading })} />
          <span className="ml-2 text-sm text-gray-400">
            {loading ? '获取价格中...' : '暂无价格数据'}
          </span>
        </div>
      </div>
    );
  }

  const isPositiveChange = priceData.price_change_percentage_24h >= 0;

  return (
    <div className={cn('cyberpunk-card p-6 space-y-4', className)}>
      {/* 头部：代币信息和货币选择器 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white">{priceData.name}</h3>
            <p className="text-sm text-gray-400 uppercase">{priceData.symbol}</p>
          </div>
        </div>

        {showCurrencySelector && (
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as SupportedCurrency)}
            className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:border-cyan-400 focus:outline-none"
          >
            {currencyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* 主要价格显示 */}
      <div className="space-y-2">
        <div className="flex items-baseline space-x-2">
          <span
            className={cn(
              'text-3xl font-bold transition-all duration-300',
              {
                'text-green-400 animate-pulse': priceAnimation === 'up',
                'text-red-400 animate-pulse': priceAnimation === 'down',
                'text-white': !priceAnimation,
              }
            )}
          >
            {currentCurrencyOption?.symbol}{formatPrice(priceData.current_price)}
          </span>
          <span className="text-sm text-gray-400">{currentCurrencyOption?.label}</span>
        </div>

        {/* 24小时变化 */}
        <div className="flex items-center space-x-2">
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
            {formatPercentage(priceData.price_change_percentage_24h)}
          </span>
          <span className="text-sm text-gray-400">
            ({isPositiveChange ? '+' : ''}{currentCurrencyOption?.symbol}{formatPrice(Math.abs(priceData.price_change_24h))})
          </span>
        </div>
      </div>

      {/* 详细信息 */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700">
        <div>
          <p className="text-xs text-gray-400 mb-1">市值</p>
          <p className="text-sm font-medium text-white">
            {currentCurrencyOption?.symbol}{formatMarketCap(priceData.market_cap)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">24小时交易量</p>
          <p className="text-sm font-medium text-white">
            {currentCurrencyOption?.symbol}{formatMarketCap(priceData.total_volume)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">24小时最高</p>
          <p className="text-sm font-medium text-green-400">
            {currentCurrencyOption?.symbol}{formatPrice(priceData.high_24h)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">24小时最低</p>
          <p className="text-sm font-medium text-red-400">
            {currentCurrencyOption?.symbol}{formatPrice(priceData.low_24h)}
          </p>
        </div>
      </div>

      {/* 刷新按钮和最后更新时间 */}
      <div className="flex items-center justify-between pt-2 text-xs text-gray-400">
        <span>
          最后更新: {new Date(priceData.last_updated).toLocaleTimeString()}
        </span>
        <button
          onClick={fetchPriceData}
          disabled={loading}
          className={cn(
            'p-1 rounded hover:bg-gray-700 transition-colors',
            { 'opacity-50 cursor-not-allowed': loading }
          )}
        >
          <RefreshCw className={cn('w-4 h-4', { 'animate-spin': loading })} />
        </button>
      </div>

      {/* 霓虹边框动画 */}
      <div className="absolute inset-0 rounded-lg border border-cyan-500/30 animate-neon-border pointer-events-none" />
    </div>
  );
}