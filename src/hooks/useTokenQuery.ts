'use client';

import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAccount, useReadContract } from 'wagmi';
import { erc20Abi } from '@/lib/web3-config';
import { tokenQueryKeys, queryOptions } from '@/lib/query-client';
import { isAddress } from 'viem';
import { usePerformanceMonitor } from './usePerformanceMonitor';

/**
 * 代币信息接口
 */
export interface TokenInfo {
  symbol?: string;
  name?: string;
  decimals?: number;
  totalSupply?: bigint;
}

/**
 * 使用React Query增强的代币查询Hook
 * 在wagmi的useReadContract基础上添加缓存和性能监控
 */
export function useTokenQuery(address: string | null) {
  const { isConnected, chain } = useAccount();
  const { measureTokenQuery, recordCacheHit } = usePerformanceMonitor();
  const queryClient = useQueryClient();

  const isValidAddress = address && isAddress(address);
  const chainId = chain?.id || 1;

  // 查询代币符号 - 使用wagmi的useReadContract
  const {
    data: symbolData,
    isLoading: symbolLoading,
    error: symbolError,
    refetch: refetchSymbol,
  } = useReadContract({
    address: address as `0x${string}`,
    abi: erc20Abi,
    functionName: 'symbol',
    query: {
      enabled: !!isValidAddress && isConnected,
      ...queryOptions.tokenInfo,
    },
  });

  // 查询代币名称
  const {
    data: nameData,
    isLoading: nameLoading,
    error: nameError,
    refetch: refetchName,
  } = useReadContract({
    address: address as `0x${string}`,
    abi: erc20Abi,
    functionName: 'name',
    query: {
      enabled: !!isValidAddress && isConnected,
      ...queryOptions.tokenInfo,
    },
  });

  // 查询代币小数位数
  const {
    data: decimalsData,
    isLoading: decimalsLoading,
    error: decimalsError,
    refetch: refetchDecimals,
  } = useReadContract({
    address: address as `0x${string}`,
    abi: erc20Abi,
    functionName: 'decimals',
    query: {
      enabled: !!isValidAddress && isConnected,
      ...queryOptions.tokenInfo,
    },
  });

  // 查询代币总供应量
  const {
    data: totalSupplyData,
    isLoading: totalSupplyLoading,
    error: totalSupplyError,
    refetch: refetchTotalSupply,
  } = useReadContract({
    address: address as `0x${string}`,
    abi: erc20Abi,
    functionName: 'totalSupply',
    query: {
      enabled: !!isValidAddress && isConnected,
      ...queryOptions.tokenInfo,
    },
  });

  // 性能监控
  const measurement = measureTokenQuery();
  
  // 当所有查询完成时结束性能测量
  useEffect(() => {
    if (!symbolLoading && !nameLoading && !decimalsLoading && !totalSupplyLoading) {
      measurement.end();
    }
  }, [symbolLoading, nameLoading, decimalsLoading, totalSupplyLoading, measurement]);

  // 组合所有查询结果
  const tokenInfo: TokenInfo = {
    symbol: symbolData,
    name: nameData,
    decimals: decimalsData,
    totalSupply: totalSupplyData,
  };

  const isLoading = symbolLoading || nameLoading || decimalsLoading || totalSupplyLoading;
  const hasError = symbolError || nameError || decimalsError || totalSupplyError;
  const error = symbolError || nameError || decimalsError || totalSupplyError;

  // 检查是否有完整的代币信息
  const hasTokenInfo = symbolData && totalSupplyData !== undefined && decimalsData !== undefined;

  return {
    // 组合的代币信息
    tokenInfo,
    isLoading,
    hasError,
    error,
    hasTokenInfo,
    
    // 单独的查询状态
    symbol: {
      data: symbolData,
      isLoading: symbolLoading,
      error: symbolError,
    },
    name: {
      data: nameData,
      isLoading: nameLoading,
      error: nameError,
    },
    decimals: {
      data: decimalsData,
      isLoading: decimalsLoading,
      error: decimalsError,
    },
    totalSupply: {
      data: totalSupplyData,
      isLoading: totalSupplyLoading,
      error: totalSupplyError,
    },
    
    // 缓存和重新获取控制
    refetch: () => {
      refetchSymbol();
      refetchName();
      refetchDecimals();
      refetchTotalSupply();
    },
    
    invalidateCache: () => {
      if (address && chainId) {
        queryClient.invalidateQueries({
          queryKey: tokenQueryKeys.detail(address, chainId),
        });
      }
    },
    
    // 预取相关数据
    prefetchTokenInfo: (tokenAddress: string) => {
      if (isAddress(tokenAddress) && chainId) {
        queryClient.prefetchQuery({
          queryKey: tokenQueryKeys.info(tokenAddress, chainId, 'symbol'),
          queryFn: () => {
            // 这里可以预取数据，但需要实际的查询逻辑
            return null;
          },
          ...queryOptions.tokenInfo,
        });
      }
    },
  };
}

/**
 * 获取缓存的代币信息
 * 不会触发新的查询，只返回已缓存的数据
 */
export function useCachedTokenInfo(address: string, chainId: number) {
  const queryClient = useQueryClient();
  
  const getCachedData = (property: string) => {
    return queryClient.getQueryData(
      tokenQueryKeys.info(address, chainId, property)
    );
  };
  
  return {
    symbol: getCachedData('symbol'),
    name: getCachedData('name'),
    decimals: getCachedData('decimals'),
    totalSupply: getCachedData('totalSupply'),
  };
}

/**
 * 批量预取代币信息
 * 用于优化用户体验，提前加载可能需要的数据
 */
export function usePrefetchTokens() {
  const queryClient = useQueryClient();
  const { chain } = useAccount();
  
  const prefetchTokens = (addresses: string[]) => {
    const chainId = chain?.id || 1;
    
    addresses.forEach(address => {
      if (isAddress(address)) {
        // 预取基本信息
        ['symbol', 'name', 'decimals', 'totalSupply'].forEach(property => {
          queryClient.prefetchQuery({
            queryKey: tokenQueryKeys.info(address, chainId, property),
            queryFn: () => {
              // 实际的预取逻辑需要在这里实现
              // 可以调用合约或API
              return null;
            },
            ...queryOptions.tokenInfo,
          });
        });
      }
    });
  };
  
  return { prefetchTokens };
}