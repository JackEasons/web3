'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import {
  Network,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  ExternalLink,
  Copy,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import {
  erc20Abi,
  allChains,
  getChainName,
  getBlockExplorerUrl,
  isTestnet,
  getNativeTokenSymbol,
} from '@/lib/web3-config';
import { getTokenPriceByContract, TokenPrice } from '@/lib/price-service';
import { cn, formatTokenAmount } from '@/lib/utils';
import { isAddress } from 'viem';

interface CrossChainTokenData {
  chainId: number;
  chainName: string;
  isTestnet: boolean;
  nativeSymbol: string;
  tokenInfo?: {
    symbol: string;
    name: string;
    decimals: number;
    totalSupply: bigint;
    balance?: bigint;
  };
  priceData?: TokenPrice;
  loading: boolean;
  error?: string;
  exists: boolean;
}

interface CrossChainQueryProps {
  contractAddress: string;
  className?: string;
  includeTestnets?: boolean;
  showPrices?: boolean;
  showBalances?: boolean;
  selectedChains?: number[];
}

/**
 * 跨链查询组件
 * 同时查询多个区块链网络上的代币信息
 */
export function CrossChainQuery({
  contractAddress,
  className,
  includeTestnets = false,
  showPrices = true,
  showBalances = false,
  selectedChains,
}: CrossChainQueryProps) {
  const { address: walletAddress, isConnected } = useAccount();
  const [crossChainData, setCrossChainData] = useState<CrossChainTokenData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedChains, setExpandedChains] = useState<Set<number>>(new Set());

  // 获取要查询的链列表
  const chainsToQuery = selectedChains
    ? allChains.filter(chain => selectedChains.includes(chain.id))
    : allChains.filter(chain => includeTestnets || !isTestnet(chain.id));

  /**
   * 查询单个链上的代币信息
   */
  const queryChainData = useCallback(async (chainId: number): Promise<CrossChainTokenData> => {
    const chainName = getChainName(chainId);
    const nativeSymbol = getNativeTokenSymbol(chainId);
    const isTestnetChain = isTestnet(chainId);

    const baseData: CrossChainTokenData = {
      chainId,
      chainName,
      isTestnet: isTestnetChain,
      nativeSymbol,
      loading: true,
      error: undefined,
      exists: false,
    };

    try {
      // 这里应该使用实际的跨链查询逻辑
      // 由于wagmi hooks的限制，我们需要使用不同的方法来查询多链数据
      
      // 模拟查询延迟
      await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500));
      
      // 模拟数据 - 实际实现中应该调用相应链的RPC
      const hasToken = Math.random() > 0.3; // 70%概率存在代币
      
      if (!hasToken) {
        return {
          ...baseData,
          loading: false,
          exists: false,
        };
      }

      const mockTokenInfo = {
        symbol: `TOKEN${chainId}`,
        name: `Token on ${chainName}`,
        decimals: 18,
        totalSupply: BigInt(Math.floor(Math.random() * 1000000000) + 1000000) * BigInt(10 ** 18),
        balance: showBalances && walletAddress 
          ? BigInt(Math.floor(Math.random() * 1000) + 1) * BigInt(10 ** 18)
          : undefined,
      };

      let priceData: TokenPrice | undefined;
      if (showPrices && !isTestnetChain) {
        try {
          const price = await getTokenPriceByContract(contractAddress);
          if (price) {
            priceData = price;
          }
        } catch (err) {
          console.warn(`获取 ${chainName} 上的价格数据失败:`, err);
        }
      }

      return {
        ...baseData,
        tokenInfo: mockTokenInfo,
        priceData,
        loading: false,
        exists: true,
      };
    } catch (err) {
      return {
        ...baseData,
        loading: false,
        error: `查询失败: ${err instanceof Error ? err.message : '未知错误'}`,
        exists: false,
      };
    }
  }, [contractAddress, showPrices, showBalances, walletAddress]);

  /**
   * 查询所有链的数据
   */
  const queryAllChains = useCallback(async () => {
    if (!contractAddress || !isAddress(contractAddress)) {
      setError('请提供有效的合约地址');
      return;
    }

    setLoading(true);
    setError(null);

    // 初始化数据
    const initialData: CrossChainTokenData[] = chainsToQuery.map(chain => ({
      chainId: chain.id,
      chainName: getChainName(chain.id),
      isTestnet: isTestnet(chain.id),
      nativeSymbol: getNativeTokenSymbol(chain.id),
      loading: true,
      exists: false,
    }));
    
    setCrossChainData(initialData);

    try {
      // 并行查询所有链
      const promises = chainsToQuery.map(chain => queryChainData(chain.id));
      const results = await Promise.all(promises);
      
      setCrossChainData(results);
    } catch (err) {
      setError('跨链查询失败');
      console.error('Cross-chain query error:', err);
    } finally {
      setLoading(false);
    }
  }, [contractAddress, chainsToQuery, queryChainData]);

  // 当合约地址变化时自动查询
  useEffect(() => {
    if (contractAddress && isAddress(contractAddress)) {
      queryAllChains();
    }
  }, [contractAddress, includeTestnets, showPrices, showBalances, queryAllChains]);

  /**
   * 切换链的展开状态
   */
  const toggleChainExpanded = (chainId: number) => {
    const newExpanded = new Set(expandedChains);
    if (newExpanded.has(chainId)) {
      newExpanded.delete(chainId);
    } else {
      newExpanded.add(chainId);
    }
    setExpandedChains(newExpanded);
  };

  /**
   * 复制地址到剪贴板
   */
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // 这里可以添加toast提示
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  /**
   * 格式化价格
   */
  const formatPrice = (price: number): string => {
    if (price < 0.01) return price.toExponential(2);
    if (price < 1) return price.toFixed(6);
    if (price < 100) return price.toFixed(4);
    return price.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // 统计信息
  const stats = {
    total: crossChainData.length,
    exists: crossChainData.filter(data => data.exists).length,
    loading: crossChainData.filter(data => data.loading).length,
    errors: crossChainData.filter(data => data.error).length,
  };

  if (!contractAddress) {
    return (
      <div className={cn('cyberpunk-card p-6', className)}>
        <div className="flex items-center justify-center text-gray-400">
          <Network className="w-5 h-5 mr-2" />
          <span>请输入代币合约地址以开始跨链查询</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('cyberpunk-card p-6 space-y-6', className)}>
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
            <Network className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">跨链查询</h3>
            <p className="text-sm text-gray-400">
              查询 {stats.total} 个网络，发现 {stats.exists} 个代币
            </p>
          </div>
        </div>

        <button
          onClick={queryAllChains}
          disabled={loading}
          className={cn(
            'p-2 rounded-lg transition-colors',
            loading
              ? 'opacity-50 cursor-not-allowed'
              : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
          )}
          title="刷新查询"
        >
          <RefreshCw className={cn('w-4 h-4', { 'animate-spin': loading })} />
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 rounded-lg p-3 border border-blue-500/30">
          <div className="text-sm text-gray-400 mb-1">总网络</div>
          <div className="text-lg font-bold text-white">{stats.total}</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 border border-green-500/30">
          <div className="text-sm text-gray-400 mb-1">存在代币</div>
          <div className="text-lg font-bold text-green-400">{stats.exists}</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 border border-yellow-500/30">
          <div className="text-sm text-gray-400 mb-1">查询中</div>
          <div className="text-lg font-bold text-yellow-400">{stats.loading}</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 border border-red-500/30">
          <div className="text-sm text-gray-400 mb-1">查询失败</div>
          <div className="text-lg font-bold text-red-400">{stats.errors}</div>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span className="text-red-400">{error}</span>
          </div>
        </div>
      )}

      {/* 链列表 */}
      <div className="space-y-3">
        {crossChainData.map((chainData) => {
          const isExpanded = expandedChains.has(chainData.chainId);
          
          return (
            <div
              key={chainData.chainId}
              className={cn(
                'border rounded-lg transition-all duration-200',
                chainData.exists
                  ? 'border-green-500/30 bg-green-500/5'
                  : chainData.error
                  ? 'border-red-500/30 bg-red-500/5'
                  : chainData.loading
                  ? 'border-yellow-500/30 bg-yellow-500/5'
                  : 'border-gray-600 bg-gray-800/50'
              )}
            >
              {/* 链头部 */}
              <div
                className="p-4 cursor-pointer hover:bg-gray-700/30 transition-colors"
                onClick={() => toggleChainExpanded(chainData.chainId)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
                      chainData.exists
                        ? 'bg-green-500/20 text-green-400'
                        : chainData.error
                        ? 'bg-red-500/20 text-red-400'
                        : chainData.loading
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-gray-600/20 text-gray-400'
                    )}>
                      {chainData.chainName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-medium text-white flex items-center space-x-2">
                        <span>{chainData.chainName}</span>
                        {chainData.isTestnet && (
                          <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">
                            测试网
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-gray-400">
                        Chain ID: {chainData.chainId} • {chainData.nativeSymbol}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {chainData.loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-yellow-400" />
                    ) : chainData.exists ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : chainData.error ? (
                      <XCircle className="w-4 h-4 text-red-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* 展开的详细信息 */}
              {isExpanded && chainData.exists && chainData.tokenInfo && (
                <div className="px-4 pb-4 border-t border-gray-700">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    {/* 基本信息 */}
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium text-gray-400">基本信息</h5>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">符号:</span>
                          <span className="text-white font-medium">{chainData.tokenInfo.symbol}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">名称:</span>
                          <span className="text-white">{chainData.tokenInfo.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">小数位:</span>
                          <span className="text-white">{chainData.tokenInfo.decimals}</span>
                        </div>
                      </div>
                    </div>

                    {/* 供应量信息 */}
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium text-gray-400">供应量</h5>
                      <div className="text-sm">
                        <div className="text-white font-mono">
                          {formatTokenAmount(
                            chainData.tokenInfo.totalSupply,
                            chainData.tokenInfo.decimals
                          )} {chainData.tokenInfo.symbol}
                        </div>
                      </div>
                    </div>

                    {/* 价格信息 */}
                    {showPrices && chainData.priceData && (
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-gray-400">价格信息</h5>
                        <div className="space-y-1 text-sm">
                          <div className="text-white font-medium">
                            ${formatPrice(chainData.priceData.current_price)}
                          </div>
                          <div className={cn(
                            'flex items-center space-x-1',
                            chainData.priceData.price_change_percentage_24h >= 0
                              ? 'text-green-400'
                              : 'text-red-400'
                          )}>
                            {chainData.priceData.price_change_percentage_24h >= 0 ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                            <span>
                              {chainData.priceData.price_change_percentage_24h.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 余额信息 */}
                    {showBalances && chainData.tokenInfo.balance && (
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-gray-400">钱包余额</h5>
                        <div className="text-sm text-white font-mono">
                          {formatTokenAmount(
                            chainData.tokenInfo.balance,
                            chainData.tokenInfo.decimals
                          )} {chainData.tokenInfo.symbol}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center space-x-2 mt-4">
                    <button
                      onClick={() => copyToClipboard(contractAddress)}
                      className="flex items-center space-x-1 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm text-gray-300 transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                      <span>复制地址</span>
                    </button>
                    <a
                      href={getBlockExplorerUrl(chainData.chainId, contractAddress)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm text-white transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>查看浏览器</span>
                    </a>
                  </div>
                </div>
              )}

              {/* 错误信息 */}
              {isExpanded && chainData.error && (
                <div className="px-4 pb-4 border-t border-gray-700">
                  <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-red-400" />
                      <span className="text-red-400 text-sm">{chainData.error}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 底部信息 */}
      <div className="text-xs text-gray-400 text-center pt-4 border-t border-gray-700">
        <p>跨链查询可能需要一些时间，请耐心等待</p>
        <p className="mt-1">合约地址: {contractAddress}</p>
      </div>

      {/* 霓虹边框动画 */}
      <div className="absolute inset-0 rounded-lg border border-blue-500/30 animate-neon-border pointer-events-none" />
    </div>
  );
}