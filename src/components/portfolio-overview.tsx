'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAccount } from 'wagmi';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  BarChart3,
  PieChart as PieChartIcon,
  Filter,
  ArrowUpDown,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTokenPriceByContract, TokenPrice } from '@/lib/price-service';

interface PortfolioToken {
  address: string;
  symbol: string;
  name: string;
  balance: number;
  decimals: number;
  priceData?: TokenPrice;
  usdValue: number;
  percentage: number;
  change24h: number;
  changePercentage24h: number;
}

interface PortfolioOverviewProps {
  tokenAddresses: string[];
  className?: string;
  showChart?: boolean;
  chartType?: 'pie' | 'bar';
  autoRefresh?: boolean;
  refreshInterval?: number;
}

type SortOption = 'value' | 'percentage' | 'change' | 'symbol';
type SortDirection = 'asc' | 'desc';

/**
 * 持仓概览组件
 * 显示用户的代币持仓分布和价值分析
 */
export function PortfolioOverview({
  tokenAddresses,
  className,
  showChart = true,
  chartType = 'pie',
  autoRefresh = true,
  refreshInterval = 60000,
}: PortfolioOverviewProps) {
  const { address: walletAddress, isConnected } = useAccount();
  const [portfolio, setPortfolio] = useState<PortfolioToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('value');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterMinValue, setFilterMinValue] = useState(0);
  const [currentChartType, setCurrentChartType] = useState<'pie' | 'bar'>(chartType);

  // 颜色配置
  const COLORS = [
    '#00ffff', // cyan
    '#ff00ff', // magenta
    '#00ff00', // green
    '#ffff00', // yellow
    '#ff6600', // orange
    '#6600ff', // purple
    '#ff0066', // pink
    '#66ff00', // lime
    '#0066ff', // blue
    '#ff3300', // red
  ];

  /**
   * 获取持仓数据
   */
  const fetchPortfolioData = useCallback(async () => {
    if (!isConnected || !walletAddress || tokenAddresses.length === 0) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 模拟获取持仓数据
      const portfolioPromises = tokenAddresses.map(async (address, index) => {
        try {
          // 模拟代币信息
          const mockTokenInfo = {
            symbol: `TOKEN${index + 1}`,
            name: `Token ${index + 1}`,
            balance: Math.random() * 1000 + 10, // 随机余额
            decimals: 18,
          };

          // 获取价格数据
          const priceData = await getTokenPriceByContract(address);
          
          const usdValue = mockTokenInfo.balance * (priceData?.current_price || 0);
          const change24h = usdValue * ((priceData?.price_change_percentage_24h || 0) / 100);

          return {
            address,
            symbol: mockTokenInfo.symbol,
            name: mockTokenInfo.name,
            balance: mockTokenInfo.balance,
            decimals: mockTokenInfo.decimals,
            priceData,
            usdValue,
            percentage: 0, // 将在后面计算
            change24h,
            changePercentage24h: priceData?.price_change_percentage_24h || 0,
          } as PortfolioToken;
        } catch (err) {
          console.error(`获取代币 ${address} 数据失败:`, err);
          return null;
        }
      });

      const results = await Promise.all(portfolioPromises);
      const validTokens = results.filter((token): token is PortfolioToken => token !== null);
      
      // 计算总价值和百分比
      const totalValue = validTokens.reduce((sum, token) => sum + token.usdValue, 0);
      const tokensWithPercentage = validTokens.map(token => ({
        ...token,
        percentage: totalValue > 0 ? (token.usdValue / totalValue) * 100 : 0,
      }));

      setPortfolio(tokensWithPercentage);
    } catch (err) {
      setError('获取持仓数据失败');
      console.error('Portfolio fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [isConnected, walletAddress, tokenAddresses]);

  // 初始加载
  useEffect(() => {
    fetchPortfolioData();
  }, [fetchPortfolioData]);

  // 自动刷新
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchPortfolioData, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchPortfolioData]);

  /**
   * 排序和过滤后的持仓数据
   */
  const sortedAndFilteredPortfolio = useMemo(() => {
    let filtered = portfolio.filter(token => token.usdValue >= filterMinValue);
    
    return filtered.sort((a, b) => {
      let aValue: number, bValue: number;
      
      switch (sortBy) {
        case 'value':
          aValue = a.usdValue;
          bValue = b.usdValue;
          break;
        case 'percentage':
          aValue = a.percentage;
          bValue = b.percentage;
          break;
        case 'change':
          aValue = a.changePercentage24h;
          bValue = b.changePercentage24h;
          break;
        case 'symbol':
          return sortDirection === 'asc' 
            ? a.symbol.localeCompare(b.symbol)
            : b.symbol.localeCompare(a.symbol);
        default:
          aValue = a.usdValue;
          bValue = b.usdValue;
      }
      
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });
  }, [portfolio, sortBy, sortDirection, filterMinValue]);

  /**
   * 计算总体统计
   */
  const portfolioStats = useMemo(() => {
    const totalValue = portfolio.reduce((sum, token) => sum + token.usdValue, 0);
    const totalChange24h = portfolio.reduce((sum, token) => sum + token.change24h, 0);
    const totalChangePercentage = totalValue > 0 ? (totalChange24h / (totalValue - totalChange24h)) * 100 : 0;
    
    return {
      totalValue,
      totalChange24h,
      totalChangePercentage,
      tokenCount: portfolio.length,
    };
  }, [portfolio]);

  /**
   * 饼图数据
   */
  const pieChartData = sortedAndFilteredPortfolio.map((token, index) => ({
    name: token.symbol,
    value: token.usdValue,
    percentage: token.percentage,
    color: COLORS[index % COLORS.length],
  }));

  /**
   * 柱状图数据
   */
  const barChartData = sortedAndFilteredPortfolio.map(token => ({
    symbol: token.symbol,
    value: token.usdValue,
    change: token.changePercentage24h,
  }));

  /**
   * 格式化USD价值
   */
  const formatUsdValue = (value: number): string => {
    if (value < 0.01) return '$0.00';
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  /**
   * 自定义饼图Tooltip
   */
  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-900 border border-cyan-500/50 rounded-lg p-3 shadow-lg">
          <p className="text-cyan-400 font-medium">{data.name}</p>
          <p className="text-white">{formatUsdValue(data.value)}</p>
          <p className="text-gray-400 text-sm">{data.percentage.toFixed(2)}%</p>
        </div>
      );
    }
    return null;
  };

  /**
   * 处理排序
   */
  const handleSort = (option: SortOption) => {
    if (sortBy === option) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(option);
      setSortDirection('desc');
    }
  };

  if (!isConnected) {
    return (
      <div className={cn('cyberpunk-card p-6', className)}>
        <div className="flex items-center justify-center text-yellow-400">
          <Wallet className="w-5 h-5 mr-2" />
          <span>请先连接钱包</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('cyberpunk-card p-6 space-y-6', className)}>
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">持仓概览</h3>
            <p className="text-sm text-gray-400">
              {portfolioStats.tokenCount} 个代币
            </p>
          </div>
        </div>

        <button
          onClick={fetchPortfolioData}
          disabled={loading}
          className={cn(
            'p-2 rounded-lg transition-colors',
            loading
              ? 'opacity-50 cursor-not-allowed'
              : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
          )}
        >
          <RefreshCw className={cn('w-4 h-4', { 'animate-spin': loading })} />
        </button>
      </div>

      {/* 总体统计 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800/50 rounded-lg p-4 border border-cyan-500/30">
          <div className="flex items-center space-x-2 mb-2">
            <DollarSign className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-gray-400">总价值</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {formatUsdValue(portfolioStats.totalValue)}
          </p>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4 border border-green-500/30">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-sm text-gray-400">24小时变化</span>
          </div>
          <p className={cn(
            'text-2xl font-bold',
            portfolioStats.totalChangePercentage >= 0 ? 'text-green-400' : 'text-red-400'
          )}>
            {portfolioStats.totalChangePercentage >= 0 ? '+' : ''}
            {portfolioStats.totalChangePercentage.toFixed(2)}%
          </p>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4 border border-purple-500/30">
          <div className="flex items-center space-x-2 mb-2">
            <Percent className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-gray-400">代币数量</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {portfolioStats.tokenCount}
          </p>
        </div>
      </div>

      {/* 图表区域 */}
      {showChart && sortedAndFilteredPortfolio.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-bold text-white">持仓分布</h4>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentChartType('pie')}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  currentChartType === 'pie'
                    ? 'bg-cyan-500/20 text-cyan-400'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                )}
              >
                <PieChartIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentChartType('bar')}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  currentChartType === 'bar'
                    ? 'bg-cyan-500/20 text-cyan-400'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                )}
              >
                <BarChart3 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              {currentChartType === 'pie' ? (
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percentage }) => `${name} ${percentage.toFixed(1)}%`}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              ) : (
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="symbol" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" tickFormatter={formatUsdValue} />
                  <Tooltip
                    formatter={(value: number) => [formatUsdValue(value), '价值']}
                    labelStyle={{ color: '#fff' }}
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="value" fill="#06b6d4" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 控制面板 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">最小价值:</span>
            <input
              type="number"
              value={filterMinValue}
              onChange={(e) => setFilterMinValue(Number(e.target.value))}
              className="w-20 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-sm text-white"
              placeholder="0"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <ArrowUpDown className="w-4 h-4 text-gray-400" />
          <select
            value={`${sortBy}-${sortDirection}`}
            onChange={(e) => {
              const [option, direction] = e.target.value.split('-') as [SortOption, SortDirection];
              setSortBy(option);
              setSortDirection(direction);
            }}
            className="px-3 py-1 bg-gray-800 border border-gray-600 rounded text-sm text-white"
          >
            <option value="value-desc">价值 (高到低)</option>
            <option value="value-asc">价值 (低到高)</option>
            <option value="percentage-desc">占比 (高到低)</option>
            <option value="percentage-asc">占比 (低到高)</option>
            <option value="change-desc">涨幅 (高到低)</option>
            <option value="change-asc">涨幅 (低到高)</option>
            <option value="symbol-asc">代币 (A-Z)</option>
            <option value="symbol-desc">代币 (Z-A)</option>
          </select>
        </div>
      </div>

      {/* 持仓列表 */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-5 h-5 animate-spin text-cyan-400 mr-2" />
            <span className="text-gray-400">加载持仓数据...</span>
          </div>
        ) : sortedAndFilteredPortfolio.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-gray-400">
            <Wallet className="w-5 h-5 mr-2" />
            <span>暂无持仓数据</span>
          </div>
        ) : (
          sortedAndFilteredPortfolio.map((token, index) => (
            <div
              key={token.address}
              className="p-4 bg-gray-800/50 rounded-lg border border-gray-600 hover:border-cyan-500/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ backgroundColor: `${COLORS[index % COLORS.length]}20`, color: COLORS[index % COLORS.length] }}
                  >
                    {token.symbol.slice(0, 2)}
                  </div>
                  <div>
                    <h5 className="font-medium text-white">{token.symbol}</h5>
                    <p className="text-xs text-gray-400">{token.name}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-medium text-white">
                    {formatUsdValue(token.usdValue)}
                  </p>
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="text-gray-400">
                      {token.percentage.toFixed(2)}%
                    </span>
                    <span className={cn(
                      'flex items-center',
                      token.changePercentage24h >= 0 ? 'text-green-400' : 'text-red-400'
                    )}>
                      {token.changePercentage24h >= 0 ? (
                        <TrendingUp className="w-3 h-3 mr-1" />
                      ) : (
                        <TrendingDown className="w-3 h-3 mr-1" />
                      )}
                      {Math.abs(token.changePercentage24h).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 霓虹边框动画 */}
      <div className="absolute inset-0 rounded-lg border border-purple-500/30 animate-neon-border pointer-events-none" />
    </div>
  );
}