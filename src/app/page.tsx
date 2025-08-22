import { WalletConnection } from "@/components/wallet-connection";
import { TokenQuery } from "@/components/token-query";

/**
 * 主页面组件
 * 包含钱包连接和代币查询功能，具有现代化的视觉设计和动画效果
 */
export default function Home() {
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
      </div>
    </main>
  );
}