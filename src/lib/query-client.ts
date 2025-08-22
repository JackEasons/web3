'use client';

import { QueryClient } from '@tanstack/react-query';

/**
 * React Query客户端配置
 * 提供全局的数据缓存和状态管理
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 数据缓存时间：5分钟
      staleTime: 5 * 60 * 1000,
      // 缓存保持时间：10分钟
      gcTime: 10 * 60 * 1000,
      // 重试次数
      retry: 3,
      // 重试延迟
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // 窗口聚焦时重新获取数据
      refetchOnWindowFocus: false,
      // 网络重连时重新获取数据
      refetchOnReconnect: true,
      // 组件挂载时重新获取数据
      refetchOnMount: true,
    },
    mutations: {
      // 变更重试次数
      retry: 1,
      // 变更重试延迟
      retryDelay: 1000,
    },
  },
});

/**
 * 代币查询的查询键工厂
 * 用于生成一致的查询键，便于缓存管理
 */
export const tokenQueryKeys = {
  all: ['tokens'] as const,
  lists: () => [...tokenQueryKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...tokenQueryKeys.lists(), { filters }] as const,
  details: () => [...tokenQueryKeys.all, 'detail'] as const,
  detail: (address: string, chainId: number) => [...tokenQueryKeys.details(), address, chainId] as const,
  info: (address: string, chainId: number, property: string) => [
    ...tokenQueryKeys.detail(address, chainId),
    property,
  ] as const,
};

/**
 * 预定义的查询选项
 */
export const queryOptions = {
  // 代币基本信息查询选项
  tokenInfo: {
    staleTime: 10 * 60 * 1000, // 10分钟
    gcTime: 30 * 60 * 1000,    // 30分钟
    retry: 2,
  },
  // 代币余额查询选项
  tokenBalance: {
    staleTime: 30 * 1000,      // 30秒
    gcTime: 5 * 60 * 1000,     // 5分钟
    retry: 3,
  },
  // 价格数据查询选项
  priceData: {
    staleTime: 60 * 1000,      // 1分钟
    gcTime: 10 * 60 * 1000,    // 10分钟
    retry: 2,
    refetchInterval: 60 * 1000, // 每分钟自动刷新
  },
} as const;