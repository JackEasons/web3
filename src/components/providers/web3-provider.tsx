'use client';

import * as React from 'react';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit';
import { config } from '@/lib/web3-config';

import '@rainbow-me/rainbowkit/styles.css';

/**
 * Web3提供者组件
 * 动态加载的Web3组件，确保只在客户端渲染
 */
export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
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
        {children}
      </RainbowKitProvider>
    </WagmiProvider>
  );
}

export default Web3Provider;