'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { Wallet, RefreshCw, Eye, EyeOff, TrendingUp, Coins } from 'lucide-react';
import { formatUnits, isAddress } from 'viem';
import { erc20Abi } from '@/lib/web3-config';
import { getTokenPriceByContract, TokenPrice } from '@/lib/price-service';
import { cn, formatTokenAmount } from '@/lib/utils';

interface TokenBalance {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: bigint;
  formattedBalance: string;
  priceData?: TokenPrice;
  usdValue?: number;
}

interface WalletBalanceProps {
  tokenAddresses?: string[];
  className?: string;
  showUsdValues?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

/**
 * 钱包余额查询组件
 * 查询用户钱包中指定ERC-20代币的余额
 */
export function WalletBalance({
  tokenAddresses = [],
  className,
  showUsdValues = true,
  autoRefresh = true,
  refreshInterval = 60000, // 60秒
}: WalletBalanceProps) {
  const { address: walletAddress, isConnected } = useAccount();
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hideSmallBalances, setHideSmallBalances] = useState(false);
  const [totalUsdValue, setTotalUsdValue] = useState(0);

  /**
   * 获取单个代币的基本信息
   */
  const useTokenInfo = (tokenAddress: string) => {
    const symbol = useReadContract({
      address: tokenAddress as `0x${string}`,
      abi: erc20Abi,
      functionName: 'symbol',
      query: {
        enabled: isAddress(tokenAddress) && isConnected,
      },
    });

    const name = useReadContract({
      address: tokenAddress as `0x${string}`,
      abi: erc20Abi,
      functionName: 'name',
      query: {
        enabled: isAddress(tokenAddress) && isConnected,
      },
    });

    const decimals = useReadContract({
      address: tokenAddress as `0x${string}`,
      abi: erc20Abi,
      functionName: 'decimals',
      query: {
        enabled: isAddress(tokenAddress) && isConnected,
      },
    });

    const balance = useReadContract({
      address: tokenAddress as `0x${string}`,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: walletAddress ? [walletAddress] : undefined,
      query: {
        enabled: isAddress(tokenAddress) && isConnected && !!walletAddress,
      },
    });

    return { symbol, name, decimals, balance };
  };

  /**
   * 获取所有代币余额
   */
  const fetchAllBalances = useCallback(async () => {
    if (!isConnected || !walletAddress || tokenAddresses.length === 0) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const balancePromises = tokenAddresses.map(async (tokenAddress) => {
        try {
          // 这里我们需要手动获取代币信息，因为hooks不能在循环中使用
          // 实际实现中，您可能需要使用不同的方法来批量获取数据
          const tokenInfo = await getTokenBasicInfo(tokenAddress);
          const balance = await getTokenBalance(tokenAddress, walletAddress!);
          
          if (!tokenInfo || balance === null) {
            return null;
          }

          const formattedBalance = formatUnits(balance, tokenInfo.decimals);
          
          let priceData: TokenPrice | undefined;
          let usdValue: number | undefined;
          
          if (showUsdValues) {
            try {
              const price = await getTokenPriceByContract(tokenAddress);
              if (price) {
                priceData = price;
                usdValue = parseFloat(formattedBalance) * price.current_price;
              }
            } catch (err) {
              console.warn(`获取代币 ${tokenAddress} 价格失败:`, err);
            }
          }

          return {
            address: tokenAddress,
            symbol: tokenInfo.symbol,
            name: tokenInfo.name,
            decimals: tokenInfo.decimals,
            balance,
            formattedBalance,
            priceData,
            usdValue,
          } as TokenBalance;
        } catch (err) {
          console.error(`获取代币 ${tokenAddress} 余额失败:`, err);
          return null;
        }
      });

      const results = await Promise.all(balancePromises);
      const validBalances = results.filter((balance): balance is TokenBalance => balance !== null);
      
      setTokenBalances(validBalances);
      
      // 计算总USD价值
      if (showUsdValues) {
        const total = validBalances.reduce((sum, token) => {
          return sum + (token.usdValue || 0);
        }, 0);
        setTotalUsdValue(total);
      }
    } catch (err) {
      setError('获取余额失败');
      console.error('Balance fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [isConnected, walletAddress, tokenAddresses, showUsdValues]);

  /**
   * 获取代币基本信息（模拟实现）
   */
  const getTokenBasicInfo = async (tokenAddress: string) => {
    // 这里应该实现实际的代币信息获取逻辑
    // 可以使用 viem 的 multicall 或其他方法
    try {
      // 模拟返回，实际应该调用合约
      return {
        symbol: 'TOKEN',
        name: 'Token Name',
        decimals: 18,
      };
    } catch (err) {
      return null;
    }
  };

  /**
   * 获取代币余额（模拟实现）
   */
  const getTokenBalance = async (tokenAddress: string, walletAddress: string): Promise<bigint | null> => {
    // 这里应该实现实际的余额查询逻辑
    try {
      // 模拟返回，实际应该调用合约
      return BigInt('1000000000000000000'); // 1 token with 18 decimals
    } catch (err) {
      return null;
    }
  };

  // 初始加载
  useEffect(() => {
    fetchAllBalances();
  }, [fetchAllBalances]);

  // 自动刷新
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchAllBalances, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchAllBalances]);

  /**
   * 格式化USD价值
   */
  const formatUsdValue = (value: number): string => {
    if (value < 0.01) {
      return '$0.00';
    }
    return `$${value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  /**
   * 过滤小额余额
   */
  const filteredBalances = hideSmallBalances
    ? tokenBalances.filter(token => {
        const balanceValue = parseFloat(token.formattedBalance);
        const usdValue = token.usdValue || 0;
        return balanceValue > 0.001 || usdValue > 0.01;
      })
    : tokenBalances;

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

  if (tokenAddresses.length === 0) {
    return (
      <div className={cn('cyberpunk-card p-6', className)}>
        <div className="flex items-center justify-center text-gray-400">
          <Coins className="w-5 h-5 mr-2" />
          <span>请添加要查询的代币地址</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('cyberpunk-card p-6', className)}>
      {/* 头部 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white">钱包余额</h3>
            {showUsdValues && (
              <p className="text-sm text-gray-400">
                总价值: {formatUsdValue(totalUsdValue)}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* 隐藏小额余额切换 */}
          <button
            onClick={() => setHideSmallBalances(!hideSmallBalances)}
            className={cn(
              'p-2 rounded-lg transition-colors',
              hideSmallBalances
                ? 'bg-blue-500/20 text-blue-400'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            )}
            title={hideSmallBalances ? '显示所有余额' : '隐藏小额余额'}
          >
            {hideSmallBalances ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>

          {/* 刷新按钮 */}
          <button
            onClick={fetchAllBalances}
            disabled={loading}
            className={cn(
              'p-2 rounded-lg transition-colors',
              loading
                ? 'opacity-50 cursor-not-allowed'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            )}
            title="刷新余额"
          >
            <RefreshCw className={cn('w-4 h-4', { 'animate-spin': loading })} />
          </button>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* 余额列表 */}
      <div className="space-y-3">
        {loading && tokenBalances.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-5 h-5 animate-spin text-cyan-400 mr-2" />
            <span className="text-gray-400">加载余额中...</span>
          </div>
        ) : filteredBalances.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-gray-400">
            <Coins className="w-5 h-5 mr-2" />
            <span>暂无余额数据</span>
          </div>
        ) : (
          filteredBalances.map((token) => {
            const hasBalance = parseFloat(token.formattedBalance) > 0;
            const hasUsdValue = token.usdValue && token.usdValue > 0;

            return (
              <div
                key={token.address}
                className={cn(
                  'p-4 rounded-lg border transition-all duration-200',
                  hasBalance
                    ? 'border-green-500/30 bg-green-500/5'
                    : 'border-gray-600 bg-gray-800/50'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold',
                      hasBalance
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-gray-600/20 text-gray-400'
                    )}>
                      {token.symbol.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{token.symbol}</h4>
                      <p className="text-xs text-gray-400">{token.name}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className={cn(
                      'font-medium',
                      hasBalance ? 'text-white' : 'text-gray-400'
                    )}>
                      {formatTokenAmount(token.balance, token.decimals)} {token.symbol}
                    </p>
                    {showUsdValues && hasUsdValue && (
                      <div className="flex items-center space-x-1 text-sm text-gray-400">
                        <span>{formatUsdValue(token.usdValue!)}</span>
                        {token.priceData && token.priceData.price_change_percentage_24h !== 0 && (
                          <span className={cn(
                            'flex items-center',
                            token.priceData.price_change_percentage_24h >= 0
                              ? 'text-green-400'
                              : 'text-red-400'
                          )}>
                            <TrendingUp className="w-3 h-3 mr-1" />
                            {token.priceData.price_change_percentage_24h.toFixed(2)}%
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 底部信息 */}
      <div className="mt-4 pt-4 border-t border-gray-700 text-xs text-gray-400 text-center">
        <p>钱包地址: {walletAddress}</p>
        {autoRefresh && (
          <p className="mt-1">自动刷新间隔: {refreshInterval / 1000}秒</p>
        )}
      </div>

      {/* 霓虹边框动画 */}
      <div className="absolute inset-0 rounded-lg border border-green-500/30 animate-neon-border pointer-events-none" />
    </div>
  );
}