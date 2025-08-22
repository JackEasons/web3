'use client';

import * as React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit';
import { config } from '@/lib/web3-config';
import { queryClient } from '@/lib/query-client';
import dynamic from 'next/dynamic';

import '@rainbow-me/rainbowkit/styles.css';

// 动态导入完整的Web3Provider，确保只在客户端加载
const EnhancedWeb3Provider = dynamic(
  () => import('./providers/web3-provider').then(mod => ({ default: mod.Web3Provider })),
  {
    ssr: false,
    loading: () => null, // 不显示加载状态，因为我们有基础Provider
  }
);

/**
 * Web3提供者组件
 * 包装应用程序以提供Web3功能，确保SSR兼容性
 */
export function Providers({ children }: { children: React.ReactNode }) {
  // 客户端检查，确保只在客户端渲染增强的Web3组件
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <RainbowKitProvider
          theme={{
            lightMode: lightTheme({
              accentColor: '#3B82F6',
              accentColorForeground: 'white',
              borderRadius: 'medium',
              fontStack: 'system',
              overlayBlur: 'small',
            }),
            darkMode: darkTheme({
              accentColor: '#3B82F6',
              accentColorForeground: 'white',
              borderRadius: 'medium',
              fontStack: 'system',
              overlayBlur: 'small',
            }),
          }}
          modalSize="compact"
        >
          {/* 确保始终有WagmiProvider包装，避免useAccount等hooks报错 */}
          {mounted ? (
            <EnhancedWeb3Provider>
              {children}
            </EnhancedWeb3Provider>
          ) : (
            <div suppressHydrationWarning>
              {children}
            </div>
          )}
        </RainbowKitProvider>
      </WagmiProvider>
      {/* React Query开发工具 - 仅在开发环境显示 */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools
          initialIsOpen={false}
        />
      )}
    </QueryClientProvider>
  );
}