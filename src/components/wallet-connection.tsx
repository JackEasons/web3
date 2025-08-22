'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useDisconnect } from 'wagmi';
import { Wallet, Copy, ExternalLink } from 'lucide-react';
import { formatAddress } from '@/lib/utils';
import { useState, useEffect } from 'react';

/**
 * 钱包连接组件
 * 提供钱包连接、断开连接和状态显示功能
 */
export function WalletConnection() {
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  // 客户端检查，确保只在客户端使用wagmi hooks
  useEffect(() => {
    setMounted(true);
  }, []);

  // 在服务端或未挂载时显示加载状态
  if (!mounted) {
    return (
      <div className="cyberpunk-card rounded-2xl p-8 neon-border-cyan animate-neon-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 neon-border-cyan rounded-xl animate-neon-glow">
            <Wallet className="h-6 w-6 neon-text-cyan" />
          </div>
          <h2 className="text-2xl font-bold neon-text-cyan glitch-effect" data-text="钱包连接">钱包连接</h2>
        </div>
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <span className="neon-text-cyan">正在加载钱包组件...</span>
        </div>
      </div>
    );
  }

  return <WalletConnectionContent copied={copied} setCopied={setCopied} />;
}

/**
 * 钱包连接内容组件
 * 只在客户端渲染，使用wagmi hooks
 */
function WalletConnectionContent({ 
  copied, 
  setCopied 
}: { 
  copied: boolean; 
  setCopied: (value: boolean) => void; 
}) {
  const { address, isConnected, chain } = useAccount();
  const { disconnect } = useDisconnect();

  /**
   * 复制地址到剪贴板
   */
  const copyAddress = async () => {
    if (address) {
      try {
        await navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('复制失败:', err);
      }
    }
  };

  /**
   * 在区块链浏览器中查看地址
   */
  const viewOnExplorer = () => {
    if (address && chain) {
      const explorerUrl = chain.blockExplorers?.default?.url;
      if (explorerUrl) {
        window.open(`${explorerUrl}/address/${address}`, '_blank');
      }
    }
  };

  return (
    <div className="cyberpunk-card rounded-2xl p-8 neon-border-cyan animate-neon-border">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 neon-border-cyan rounded-xl animate-neon-glow">
          <Wallet className="h-6 w-6 neon-text-cyan" />
        </div>
        <h2 className="text-2xl font-bold neon-text-cyan glitch-effect" data-text="钱包连接">钱包连接</h2>
      </div>

      {!isConnected ? (
        <div className="text-center py-10">
          <div className="mb-6">
            <div className="w-20 h-20 neon-border-pink rounded-full flex items-center justify-center mx-auto mb-4 animate-neon-pink-glow scan-line">
              <Wallet className="h-10 w-10 neon-text-pink" />
            </div>
            <p className="neon-text-green mb-8 text-lg leading-relaxed terminal-style px-4 py-2 rounded-lg">
              请连接您的 MetaMask 钱包以开始使用 DApp
            </p>
          </div>
          <ConnectButton.Custom>
            {({
              account,
              chain,
              openAccountModal,
              openChainModal,
              openConnectModal,
              authenticationStatus,
              mounted,
            }) => {
              // 注意：如果你的应用使用SSR，确保组件已挂载
              const ready = mounted && authenticationStatus !== 'loading';
              const connected =
                ready &&
                account &&
                chain &&
                (!authenticationStatus ||
                  authenticationStatus === 'authenticated');

              return (
                <div
                  {...(!ready && {
                    'aria-hidden': true,
                    'style': {
                      opacity: 0,
                      pointerEvents: 'none',
                      userSelect: 'none',
                    },
                  })}
                >
                  {(() => {
                    if (!connected) {
                      return (
                        <button
                          onClick={openConnectModal}
                          type="button"
                          className="neon-button font-bold py-4 px-8 rounded-xl flex items-center gap-3 mx-auto transform hover:scale-105 active:scale-95 animate-neon-glow"
                        >
                          <Wallet className="h-5 w-5 relative z-10" />
                          <span className="relative z-10">连接钱包</span>
                        </button>
                      );
                    }

                    if (chain.unsupported) {
                      return (
                        <button
                          onClick={openChainModal}
                          type="button"
                          className="neon-border-pink bg-transparent border-2 text-pink-400 font-bold py-4 px-8 rounded-xl transform hover:scale-105 active:scale-95 animate-neon-pink-glow hover:bg-pink-400/10"
                        >
                          <span className="relative z-10">切换网络</span>
                        </button>
                      );
                    }

                    return (
                      <div className="flex gap-4">
                        <button
                          onClick={openChainModal}
                          type="button"
                          className="neon-border-purple bg-transparent neon-text-purple font-medium py-3 px-6 rounded-xl transition-all duration-300 hover:bg-purple-400/10 animate-circuit-pulse"
                        >
                          {chain.name}
                        </button>

                        <button
                          onClick={openAccountModal}
                          type="button"
                          className="neon-button font-medium py-3 px-6 rounded-xl transform hover:scale-105 animate-neon-glow"
                        >
                          <span className="relative z-10">
                            {account.displayName}
                            {account.displayBalance
                              ? ` (${account.displayBalance})`
                              : ''}
                          </span>
                        </button>
                      </div>
                    );
                  })()}
                </div>
              );
            }}
          </ConnectButton.Custom>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 连接状态指示器 */}
          <div className="flex items-center gap-3 justify-center">
            <div className="relative">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse neon-text-green"></div>
              <div className="absolute inset-0 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
            </div>
            <span className="neon-text-green font-semibold text-lg animate-neon-green-glow">钱包已连接</span>
          </div>

          {/* 钱包信息卡片 */}
          <div className="cyberpunk-card rounded-xl p-6 space-y-4 neon-border-green scan-line">
            <div className="flex items-center justify-between">
              <span className="text-sm neon-text-cyan font-medium">钱包地址</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyAddress}
                  className="p-2 neon-border-cyan rounded-lg transition-all duration-200 group hover:bg-cyan-400/10 animate-circuit-pulse"
                  title="复制地址"
                >
                  <Copy className="h-4 w-4 neon-text-cyan group-hover:animate-neon-glow" />
                </button>
                <button
                  onClick={viewOnExplorer}
                  className="p-2 neon-border-purple rounded-lg transition-all duration-200 group hover:bg-purple-400/10 animate-circuit-pulse"
                  title="在区块链浏览器中查看"
                >
                  <ExternalLink className="h-4 w-4 neon-text-purple group-hover:animate-neon-purple-glow" />
                </button>
              </div>
            </div>
            <div className="font-mono text-lg neon-text-green break-all terminal-style p-3 rounded-lg">
              {formatAddress(address || '', 8, 6)}
            </div>
            {copied && (
              <div className="text-sm neon-text-green animate-fade-in animate-neon-green-glow">✓ 地址已复制到剪贴板</div>
            )}
          </div>

          {/* 网络信息 */}
          {chain && (
            <div className="cyberpunk-card rounded-xl p-6 neon-border-purple scan-line">
              <div className="flex items-center justify-between">
                <span className="text-sm neon-text-purple font-medium">当前网络</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-lg font-bold neon-text-green animate-neon-green-glow">
                    {chain.name}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 断开连接按钮 */}
          <button
            onClick={() => disconnect()}
            className="w-full neon-border-pink bg-transparent border-2 neon-text-pink hover:bg-pink-400/10 font-medium py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 animate-neon-pink-glow"
          >
            <span className="relative z-10">断开连接</span>
          </button>
        </div>
      )}
    </div>
  );
}