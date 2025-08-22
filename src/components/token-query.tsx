'use client';

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Search, AlertCircle, Coins, Loader2, History, Zap } from 'lucide-react';
import { formatTokenAmount } from '@/lib/utils';
import { isAddress } from 'viem';
import { useSearchHistory } from '@/hooks/useSearchHistory';
import { useFavorites } from '@/hooks/useFavorites';
import { useTokenQuery } from '@/hooks/useTokenQuery';
import { PriceDisplay } from '@/components/price-display';
import { PriceChart } from '@/components/price-chart';
import { CrossChainQuery } from '@/components/cross-chain-query';
import { WalletBalance } from '@/components/wallet-balance';
import { PortfolioOverview } from '@/components/portfolio-overview';
import dynamic from 'next/dynamic';

// 懒加载SearchHistory组件以优化性能
const SearchHistory = dynamic(
  () => import('@/components/search-history').then(mod => ({ default: mod.SearchHistory })),
  {
    loading: () => (
      <div className="absolute top-full left-0 right-0 mt-2 cyberpunk-card rounded-xl neon-border-cyan z-50 max-h-96 overflow-hidden animate-scale-in">
        <div className="flex items-center justify-center p-6">
          <div className="h-4 w-4 animate-spin neon-text-cyan mr-3">
            <History className="h-4 w-4" />
          </div>
          <span className="text-sm neon-text-cyan">正在加载搜索历史...</span>
        </div>
      </div>
    ),
    ssr: false
  }
);

// 懒加载TokenSelector组件以优化性能
const TokenSelector = dynamic(
  () => import('@/components/token-selector').then(mod => ({ default: mod.TokenSelector })),
  {
    loading: () => (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
        <div className="cyberpunk-card rounded-2xl neon-border-cyan w-full max-w-4xl max-h-[80vh] overflow-hidden animate-scale-in">
          <div className="flex items-center justify-center p-12">
            <div className="relative">
              <div className="h-8 w-8 animate-spin neon-text-cyan">
                <Coins className="h-8 w-8" />
              </div>
              <div className="absolute inset-0 h-8 w-8 animate-ping text-cyan-400/30">
                <Coins className="h-8 w-8" />
              </div>
            </div>
            <span className="ml-4 neon-text-cyan text-lg font-medium terminal-style px-4 py-2 rounded-lg">正在加载代币选择器...</span>
          </div>
        </div>
      </div>
    ),
    ssr: false
  }
);

/**
 * 代币查询组件
 * 提供代币合约地址输入和信息查询功能
 */
export function TokenQuery() {
  const [mounted, setMounted] = useState(false);

  // 客户端检查，确保只在客户端使用wagmi hooks
  useEffect(() => {
    setMounted(true);
  }, []);

  // 在服务端或未挂载时显示加载状态
  if (!mounted) {
    return (
      <div className="cyberpunk-card rounded-2xl p-8 neon-border-purple animate-neon-border">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 neon-border-purple rounded-xl animate-neon-purple-glow">
            <Coins className="h-6 w-6 neon-text-purple" />
          </div>
          <h2 className="text-2xl font-bold neon-text-purple glitch-effect" data-text="代币信息查询">代币信息查询</h2>
        </div>
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <span className="neon-text-purple">正在加载查询组件...</span>
        </div>
      </div>
    );
  }

  return <TokenQueryContent />;
}

/**
 * 代币查询内容组件
 * 只在客户端渲染，使用wagmi hooks
 */
function TokenQueryContent() {
  const { isConnected, chain } = useAccount();
  const [contractAddress, setContractAddress] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const [queryAddress, setQueryAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showTokenSelector, setShowTokenSelector] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  
  // 搜索历史和收藏功能
  const { addToHistory } = useSearchHistory();
  const { toggleFavorite, isFavorite } = useFavorites();

  // 使用新的缓存查询Hook
  const {
    tokenInfo,
    isLoading,
    hasError,
    error: queryError,
    hasTokenInfo,
    symbol,
    name,
    decimals,
    totalSupply,
    refetch,
    invalidateCache,
  } = useTokenQuery(queryAddress);

  // 解构代币信息
  const symbolData = symbol.data;
  const nameData = name.data;
  const decimalsData = decimals.data;
  const totalSupplyData = totalSupply.data;

  /**
   * 验证合约地址格式
   */
  const validateAddress = (address: string): boolean => {
    if (!address) return false;
    return isAddress(address);
  };

  /**
   * 处理查询提交
   */
  const handleQuery = async () => {
    setError(null);
    
    if (!contractAddress.trim()) {
      setError('请输入代币合约地址');
      return;
    }

    if (!validateAddress(contractAddress)) {
      setError('请输入有效的以太坊地址格式');
      return;
    }

    if (!isConnected) {
      setError('请先连接钱包');
      return;
    }

    setIsQuerying(true);
    setQueryAddress(contractAddress);
    setShowHistory(false);
    
    // 模拟查询延迟
    setTimeout(() => {
      setIsQuerying(false);
    }, 500);
  };

  /**
   * 处理输入变化
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setContractAddress(value);
    setError(null);
    
    // 如果清空输入，也清空查询结果
    if (!value.trim()) {
      setQueryAddress(null);
    }
  };

  /**
   * 处理选择历史记录
   */
  const handleSelectFromHistory = (address: string) => {
    setContractAddress(address);
    setShowHistory(false);
  };

  /**
   * 处理选择代币
   */
  const handleSelectToken = (address: string, tokenInfo?: { symbol: string; name: string; decimals: number }) => {
    setContractAddress(address);
    setShowTokenSelector(false);
    // 可以选择立即查询
    // handleQuery();
  };

  /**
   * 处理输入框聚焦
   */
  const handleInputFocus = () => {
    setInputFocused(true);
    setShowHistory(true);
  };

  /**
   * 处理输入框失焦
   */
  const handleInputBlur = () => {
    setInputFocused(false);
    // 延迟关闭，允许点击历史记录
    setTimeout(() => {
      if (!inputFocused) {
        setShowHistory(false);
      }
    }, 200);
  };

  /**
   * 处理收藏切换
   */
  const handleToggleFavorite = () => {
    if (!queryAddress || !chain?.id) return;
    
    const tokenInfoForFavorite = {
      address: queryAddress,
      chainId: chain.id,
      symbol: symbolData as string,
      name: nameData as string,
      decimals: decimalsData as number
    };
    
    toggleFavorite(tokenInfoForFavorite);
  };

  /**
   * 处理回车键查询
   */
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleQuery();
    }
  };

  // 检查是否有任何加载状态
  const isLoadingState = isLoading || isQuerying;
  
  // 检查是否有任何错误
  const hasContractError = hasError;
  
  // 检查当前代币是否已收藏
  const isCurrentTokenFavorite = queryAddress && chain?.id ? isFavorite(queryAddress, chain.id) : false;
  
  // 当查询成功时，添加到搜索历史
  useEffect(() => {
    if (hasTokenInfo && queryAddress && symbolData && nameData) {
      addToHistory(queryAddress, {
        symbol: symbolData as string,
        name: nameData as string
      });
    }
  }, [hasTokenInfo, queryAddress, symbolData, nameData, addToHistory]);

  return (
    <div className="cyberpunk-card rounded-2xl p-8 neon-border-purple animate-neon-border">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 neon-border-purple rounded-xl animate-neon-purple-glow">
          <Coins className="h-6 w-6 neon-text-purple" />
        </div>
        <h2 className="text-2xl font-bold neon-text-purple glitch-effect" data-text="代币信息查询">代币信息查询</h2>
      </div>

      {/* 查询表单 */}
      <div className="space-y-6">
        <div>
          <label htmlFor="contract-address" className="block text-lg font-semibold neon-text-cyan mb-4 terminal-style px-2">
            ERC-20 代币合约地址
          </label>
          <div className="relative">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  id="contract-address"
                  type="text"
                  value={contractAddress}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  placeholder="0x..."
                  className="w-full px-6 py-4 terminal-style neon-border-cyan rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all duration-300 font-mono text-lg neon-text-cyan placeholder-gray-500 hover:bg-cyan-400/5 scan-line"
                  disabled={isLoading}
                />
                
                {/* 搜索历史组件 */}
                <SearchHistory
                  isVisible={showHistory && !showTokenSelector}
                  onSelectAddress={handleSelectFromHistory}
                  onClose={() => setShowHistory(false)}
                  searchKeyword={contractAddress}
                />
              </div>
              
              {/* 历史记录按钮 */}
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="neon-border-green bg-transparent neon-text-green py-4 px-4 rounded-xl hover:bg-green-400/10 transition-all duration-300 animate-circuit-pulse"
                title="搜索历史"
                disabled={isLoading}
              >
                <History className="h-5 w-5" />
              </button>
              
              {/* 快捷选择按钮 */}
              <button
                onClick={() => setShowTokenSelector(true)}
                className="neon-border-purple bg-transparent neon-text-purple py-4 px-4 rounded-xl hover:bg-purple-400/10 transition-all duration-300 animate-neon-purple-glow"
                title="快捷选择代币"
                disabled={isLoading}
              >
                <Zap className="h-5 w-5" />
              </button>
              
              {/* 查询按钮 */}
              <button
                onClick={handleQuery}
                disabled={isLoadingState || !contractAddress.trim()}
                className="neon-button font-bold py-4 px-8 rounded-xl flex items-center gap-3 min-w-[140px] justify-center transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none animate-neon-purple-glow"
              >
                {isLoadingState ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin relative z-10" />
                    <span className="relative z-10">查询中...</span>
                  </>
                ) : (
                  <>
                    <Search className="h-5 w-5 relative z-10" />
                    <span className="relative z-10">查询</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 错误提示 */}
        {(error || hasContractError) && (
          <div className="cyberpunk-card neon-border-pink rounded-xl p-6 flex items-start gap-4 animate-scale-in scan-line">
            <div className="p-2 neon-border-pink rounded-lg animate-neon-pink-glow">
              <AlertCircle className="h-5 w-5 neon-text-pink flex-shrink-0" />
            </div>
            <div>
              <h4 className="neon-text-pink font-bold mb-2 text-lg glitch-effect" data-text="查询失败">查询失败</h4>
              <p className="neon-text-pink text-base leading-relaxed terminal-style px-2">
                {error || '无法获取代币信息，请检查合约地址是否正确或网络连接是否正常'}
              </p>
            </div>
          </div>
        )}

        {/* 连接钱包提示 */}
        {!isConnected && (
          <div className="cyberpunk-card neon-border-yellow rounded-xl p-6 flex items-start gap-4 animate-scale-in scan-line" style={{
            borderColor: 'hsl(var(--neon-yellow))',
            boxShadow: '0 0 5px hsl(var(--neon-yellow)), inset 0 0 5px hsl(var(--neon-yellow) / 0.1)'
          }}>
            <div className="p-2 rounded-lg animate-circuit-pulse" style={{
              borderColor: 'hsl(var(--neon-yellow))',
              border: '1px solid'
            }}>
              <AlertCircle className="h-5 w-5 flex-shrink-0" style={{
                color: 'hsl(var(--neon-yellow))',
                textShadow: '0 0 5px hsl(var(--neon-yellow))'
              }} />
            </div>
            <div>
              <h4 className="font-bold mb-2 text-lg glitch-effect" style={{
                color: 'hsl(var(--neon-yellow))',
                textShadow: '0 0 5px hsl(var(--neon-yellow))'
              }} data-text="需要连接钱包">需要连接钱包</h4>
              <p className="text-base leading-relaxed terminal-style px-2" style={{
                color: 'hsl(var(--neon-yellow))',
                textShadow: '0 0 5px hsl(var(--neon-yellow))'
              }}>
                请先连接您的 MetaMask 钱包以查询代币信息
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 查询结果 */}
      {queryAddress && isConnected && (
        <div className="mt-8 pt-8 border-t neon-border-cyan">
          <h3 className="text-2xl font-bold neon-text-cyan mb-6 flex items-center gap-3 glitch-effect animate-neon-glow" data-text="查询结果">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
            查询结果
          </h3>
          
          {isLoadingState ? (
            <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
              <div className="relative">
                <Loader2 className="h-12 w-12 animate-spin neon-text-purple" />
                <div className="absolute inset-0 h-12 w-12 animate-ping text-purple-400/30">
                  <Loader2 className="h-12 w-12" />
                </div>
              </div>
              <span className="mt-4 neon-text-green text-lg font-medium terminal-style px-4 py-2 rounded-lg">正在获取代币信息...</span>
              <div className="mt-2 flex space-x-1">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce animation-delay-200"></div>
                <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce animation-delay-400"></div>
              </div>
            </div>
          ) : hasTokenInfo ? (
            <div>
              {/* 代币操作按钮 */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                  <span className="text-xl font-bold neon-text-cyan">代币信息</span>
                </div>
                <button
                  onClick={handleToggleFavorite}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                    isCurrentTokenFavorite
                      ? 'neon-border-yellow neon-text-yellow bg-yellow-400/10'
                      : 'neon-border-gray text-gray-400 hover:neon-border-yellow hover:neon-text-yellow hover:bg-yellow-400/10'
                  }`}
                  title={isCurrentTokenFavorite ? '取消收藏' : '添加收藏'}
                >
                  <svg className={`w-4 h-4 ${isCurrentTokenFavorite ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  {isCurrentTokenFavorite ? '已收藏' : '收藏'}
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                {/* 代币符号 */}
                <div className="cyberpunk-card rounded-xl p-6 neon-border-cyan group scan-line">
                  <div className="text-sm neon-text-cyan mb-2 font-medium terminal-style">代币符号</div>
                  <div className="text-2xl font-bold neon-text-cyan group-hover:animate-neon-glow transition-all duration-300">{symbolData}</div>
                </div>

              {/* 代币名称 */}
              {nameData && (
                <div className="cyberpunk-card rounded-xl p-6 neon-border-purple group scan-line">
                  <div className="text-sm neon-text-purple mb-2 font-medium terminal-style">代币名称</div>
                  <div className="text-2xl font-bold neon-text-purple group-hover:animate-neon-purple-glow transition-all duration-300">{nameData}</div>
                </div>
              )}

              {/* 小数位数 */}
              <div className="cyberpunk-card rounded-xl p-6 neon-border-green group scan-line">
                <div className="text-sm neon-text-green mb-2 font-medium terminal-style">小数位数</div>
                <div className="text-2xl font-bold neon-text-green group-hover:animate-neon-green-glow transition-all duration-300">{decimalsData?.toString()}</div>
              </div>

              {/* 总供应量 */}
              <div className="cyberpunk-card rounded-xl p-6 neon-border-pink md:col-span-2 lg:col-span-3 group scan-line animate-neon-border">
                <div className="text-sm neon-text-pink mb-3 font-medium flex items-center gap-2 terminal-style">
                  <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse"></div>
                  总供应量
                </div>
                <div className="text-xl font-bold neon-text-pink font-mono break-all terminal-style p-4 rounded-lg group-hover:animate-neon-pink-glow transition-all duration-300">
                  {formatTokenAmount(totalSupplyData!, decimalsData!)} {symbolData}
                </div>
                <div className="text-sm neon-text-green mt-3 font-mono terminal-style p-2 rounded">
                  原始值: {totalSupplyData?.toString()}
                </div>
              </div>

              {/* 合约地址 */}
              <div className="cyberpunk-card rounded-xl p-6 neon-border-cyan md:col-span-2 lg:col-span-3 group scan-line animate-circuit-pulse">
                <div className="text-sm neon-text-cyan mb-3 font-medium flex items-center gap-2 terminal-style">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                  合约地址
                </div>
                <div className="text-lg font-mono neon-text-cyan break-all terminal-style p-4 rounded-lg group-hover:animate-neon-glow transition-all duration-300">
                  {queryAddress}
                </div>
              </div>
              </div>
              
              {/* 价格信息和图表 */}
              <div className="mt-8 space-y-6">
                <h3 className="text-2xl font-bold neon-text-purple mb-6 flex items-center gap-3 glitch-effect animate-neon-purple-glow" data-text="价格信息">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                  价格信息
                </h3>
                
                {/* 价格展示组件 */}
                <PriceDisplay 
                  contractAddress={queryAddress}
                  className="animate-fade-in"
                  autoRefresh={true}
                  refreshInterval={30000}
                  showCurrencySelector={true}
                />
                
                {/* 价格走势图 */}
                 <PriceChart 
                   contractAddress={queryAddress}
                   className="animate-fade-in"
                   defaultTimeRange="7d"
                   showTimeRangeSelector={true}
                   chartType="area"
                 />
               </div>
               
               {/* 跨链查询 */}
               <div className="mt-8 space-y-6">
                 <h3 className="text-2xl font-bold neon-text-green mb-6 flex items-center gap-3 glitch-effect animate-neon-green-glow" data-text="跨链分析">
                   <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                   跨链分析
                 </h3>
                 
                 <CrossChainQuery 
                   contractAddress={queryAddress}
                   className="animate-fade-in"
                   includeTestnets={false}
                   showPrices={true}
                   showBalances={isConnected}
                 />
               </div>
               
               {/* 钱包余额和持仓概览 */}
               {isConnected && (
                 <div className="mt-8 space-y-6">
                   <h3 className="text-2xl font-bold neon-text-pink mb-6 flex items-center gap-3 glitch-effect animate-neon-pink-glow" data-text="钱包分析">
                     <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse"></div>
                     钱包分析
                   </h3>
                   
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     {/* 钱包余额 */}
                     <WalletBalance 
                       tokenAddresses={[queryAddress]}
                       className="animate-fade-in"
                       showUsdValues={true}
                       autoRefresh={true}
                       refreshInterval={60000}
                     />
                     
                     {/* 持仓概览 */}
                     <PortfolioOverview 
                       tokenAddresses={[queryAddress]}
                       className="animate-fade-in"
                       showChart={true}
                       chartType="pie"
                       autoRefresh={true}
                       refreshInterval={60000}
                     />
                   </div>
                 </div>
               )}
            </div>
          ) : hasContractError ? (
            <div className="text-center py-12 animate-scale-in">
              <div className="w-20 h-20 neon-border-pink rounded-full flex items-center justify-center mx-auto mb-6 animate-neon-pink-glow">
                <AlertCircle className="h-10 w-10 neon-text-pink" />
              </div>
              <p className="neon-text-pink text-lg font-medium glitch-effect" data-text="无法获取代币信息">无法获取代币信息</p>
              <p className="neon-text-green text-sm mt-2 terminal-style px-4 py-1 rounded">请检查合约地址是否正确</p>
            </div>
          ) : null}
        </div>
      )}
      
      {/* 代币选择器 */}
      <TokenSelector
        isVisible={showTokenSelector}
        onSelectToken={handleSelectToken}
        onClose={() => setShowTokenSelector(false)}
        currentChainId={chain?.id}
      />
    </div>
  );
}