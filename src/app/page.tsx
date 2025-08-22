'use client';

import { WalletConnection } from "@/components/wallet-connection";
import { TokenQuery } from "@/components/token-query";
import { useState, Suspense } from "react";
import dynamic from "next/dynamic";

// 懒加载FavoritesManager组件以优化性能
const FavoritesManager = dynamic(
  () => import("@/components/favorites-manager").then(mod => ({ default: mod.FavoritesManager })),
  {
    loading: () => (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
        <div className="cyberpunk-card rounded-2xl neon-border-yellow w-full max-w-6xl max-h-[90vh] overflow-hidden animate-scale-in">
          <div className="flex items-center justify-center p-12">
            <div className="relative">
              <div className="h-12 w-12 animate-spin neon-text-yellow">
                <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div className="absolute inset-0 h-12 w-12 animate-ping text-yellow-400/30">
                <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
            </div>
            <span className="ml-4 neon-text-yellow text-lg font-medium terminal-style px-4 py-2 rounded-lg">正在加载收藏管理器...</span>
          </div>
        </div>
      </div>
    ),
    ssr: false
  }
);

/**
 * 主页面组件
 * 包含钱包连接和代币查询功能，具有现代化的视觉设计和动画效果
 */
export default function Home() {
  const [showFavoritesManager, setShowFavoritesManager] = useState(false);
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden circuit-bg">
      {/* 数字雨背景效果 */}
      <div className="digital-rain"></div>
      
      {/* 赛博朋克霓虹装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full mix-blend-screen filter blur-xl opacity-30 animate-neon-glow" style={{
          background: `radial-gradient(circle, hsl(var(--neon-cyan)) 0%, transparent 70%)`
        }}></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full mix-blend-screen filter blur-xl opacity-30 animate-neon-pink-glow animation-delay-2000" style={{
          background: `radial-gradient(circle, hsl(var(--neon-pink)) 0%, transparent 70%)`
        }}></div>
        <div className="absolute top-40 left-40 w-80 h-80 rounded-full mix-blend-screen filter blur-xl opacity-30 animate-neon-purple-glow animation-delay-4000" style={{
          background: `radial-gradient(circle, hsl(var(--neon-purple)) 0%, transparent 70%)`
        }}></div>
        <div className="absolute top-1/2 right-1/4 w-60 h-60 rounded-full mix-blend-screen filter blur-xl opacity-20 animate-neon-green-glow animation-delay-6000" style={{
          background: `radial-gradient(circle, hsl(var(--neon-green)) 0%, transparent 70%)`
        }}></div>
      </div>
      
      {/* 电路板网格背景 */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%2300ffff' stroke-width='0.5'%3E%3Cpath d='M10 10h80v80h-80z'/%3E%3Cpath d='M20 20h60v60h-60z'/%3E%3Cpath d='M30 30h40v40h-40z'/%3E%3Ccircle cx='50' cy='50' r='3' fill='%2300ffff'/%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      
      {/* 扫描线效果 */}
      <div className="absolute inset-0 scan-line"></div>
      
      <div className="relative z-10 container mx-auto px-4 max-w-4xl py-8">
        {/* 页面标题 */}
        <div className="text-center mb-12 animate-fade-in-up">
          <div className="inline-block mb-4">
            <div className="w-16 h-16 cyberpunk-card neon-border-cyan rounded-2xl flex items-center justify-center mx-auto mb-4 transform hover:scale-110 transition-transform duration-300 animate-neon-glow">
              <svg className="w-8 h-8 neon-text-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold neon-text-cyan mb-4 leading-tight glitch-effect animate-neon-glow" data-text="DAPP 代币查询">
            DAPP 代币查询
          </h1>
          <p className="text-xl neon-text-green max-w-2xl mx-auto leading-relaxed terminal-style px-4 py-2 rounded-lg">
            连接您的 MetaMask 钱包，轻松查询任意 ERC-20 代币的详细信息
          </p>
          <div className="mt-6 flex justify-center">
            <div className="w-24 h-1 neon-border-pink rounded-full animate-neon-border"></div>
          </div>
        </div>

        {/* 钱包连接区域 */}
        <div className="mb-8 animate-fade-in-up animation-delay-200">
          <WalletConnection />
        </div>

        {/* 代币查询区域 */}
        <div className="animate-fade-in-up animation-delay-400">
          <TokenQuery />
        </div>
        
        {/* 收藏管理按钮 */}
        <div className="text-center mt-8 animate-fade-in-up animation-delay-600">
          <button
            onClick={() => setShowFavoritesManager(true)}
            className="neon-border-yellow bg-transparent neon-text-yellow font-medium py-3 px-6 rounded-xl hover:bg-yellow-400/10 transition-all duration-300 animate-circuit-pulse"
          >
            <svg className="w-5 h-5 inline-block mr-2 fill-current" viewBox="0 0 24 24">
              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            管理收藏
          </button>
        </div>
      </div>
      
      {/* 收藏管理器 */}
      <FavoritesManager
        isVisible={showFavoritesManager}
        onClose={() => setShowFavoritesManager(false)}
      />
    </main>
  );
}