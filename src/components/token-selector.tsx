'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, Filter, X, Coins, Star, Copy } from 'lucide-react';
import { NETWORK_TOKENS, TOKEN_CATEGORIES, type TokenData } from '@/data/tokens';
import { useFavorites } from '@/hooks/useFavorites';
import { useAccount } from 'wagmi';

/**
 * 代币选择器组件属性
 */
interface TokenSelectorProps {
  onSelectToken: (address: string, tokenInfo?: { symbol: string; name: string; decimals: number }) => void;
  isVisible: boolean;
  onClose: () => void;
  currentChainId?: number;
}

/**
 * 代币选择器组件
 * 提供快捷选择常见代币的功能，支持搜索、筛选和收藏
 */
export function TokenSelector({ 
  onSelectToken, 
  isVisible, 
  onClose, 
  currentChainId 
}: TokenSelectorProps) {
  const { chain } = useAccount();
  const { favorites, isFavorite, toggleFavorite } = useFavorites();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedChain, setSelectedChain] = useState<number>(currentChainId || chain?.id || 1);
  const [activeTab, setActiveTab] = useState<'popular' | 'favorites' | 'all'>('popular');
  const containerRef = useRef<HTMLDivElement>(null);

  // 获取当前选中网络的代币
  const currentNetwork = NETWORK_TOKENS.find(n => n.chainId === selectedChain);
  const networkTokens = currentNetwork?.tokens || [];

  // 获取收藏的代币（当前网络）
  const favoriteTokens = favorites
    .filter(fav => fav.chainId === selectedChain)
    .map(fav => ({
      address: fav.address,
      symbol: fav.symbol || 'Unknown',
      name: fav.name || 'Unknown Token',
      decimals: fav.decimals || 18,
      category: 'other' as const,
      description: fav.note
    }));

  /**
   * 过滤代币列表
   */
  const getFilteredTokens = (): TokenData[] => {
    let tokens: TokenData[] = [];
    
    switch (activeTab) {
      case 'popular':
        // 显示热门代币（稳定币和主流DeFi代币）
        tokens = networkTokens.filter(token => 
          ['stablecoin', 'defi', 'layer1'].includes(token.category)
        );
        break;
      case 'favorites':
        tokens = favoriteTokens;
        break;
      case 'all':
        tokens = networkTokens;
        break;
    }

    // 按分类筛选
    if (selectedCategory !== 'all') {
      tokens = tokens.filter(token => token.category === selectedCategory);
    }

    // 按关键词搜索
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase();
      tokens = tokens.filter(token => 
        token.symbol.toLowerCase().includes(keyword) ||
        token.name.toLowerCase().includes(keyword) ||
        token.address.toLowerCase().includes(keyword)
      );
    }

    return tokens;
  };

  const filteredTokens = getFilteredTokens();

  /**
   * 处理选择代币
   */
  const handleSelectToken = (token: TokenData) => {
    onSelectToken(token.address, {
      symbol: token.symbol,
      name: token.name,
      decimals: token.decimals
    });
    onClose();
  };

  /**
   * 处理收藏切换
   */
  const handleToggleFavorite = (e: React.MouseEvent, token: TokenData) => {
    e.stopPropagation();
    toggleFavorite({
      address: token.address,
      chainId: selectedChain,
      symbol: token.symbol,
      name: token.name,
      decimals: token.decimals
    });
  };

  /**
   * 复制地址到剪贴板
   */
  const handleCopyAddress = async (e: React.MouseEvent, address: string) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(address);
      // 这里可以添加复制成功的提示
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  /**
   * 获取分类颜色类名
   */
  const getCategoryColorClass = (category: string) => {
    const categoryInfo = TOKEN_CATEGORIES[category as keyof typeof TOKEN_CATEGORIES];
    if (!categoryInfo) return 'neon-text-gray';
    
    switch (categoryInfo.color) {
      case 'green': return 'neon-text-green';
      case 'blue': return 'text-blue-400';
      case 'purple': return 'neon-text-purple';
      case 'cyan': return 'neon-text-cyan';
      case 'pink': return 'neon-text-pink';
      case 'yellow': return 'text-yellow-400';
      case 'orange': return 'text-orange-400';
      default: return 'text-gray-400';
    }
  };

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isVisible, onClose]);

  // 监听链变化
  useEffect(() => {
    if (currentChainId && currentChainId !== selectedChain) {
      setSelectedChain(currentChainId);
    }
  }, [currentChainId, selectedChain]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div 
        ref={containerRef}
        className="cyberpunk-card rounded-2xl neon-border-cyan w-full max-w-4xl max-h-[80vh] overflow-hidden animate-scale-in"
      >
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b neon-border-cyan">
          <div className="flex items-center gap-3">
            <div className="p-2 neon-border-cyan rounded-xl animate-neon-glow">
              <Coins className="h-6 w-6 neon-text-cyan" />
            </div>
            <div>
              <h2 className="text-2xl font-bold neon-text-cyan glitch-effect" data-text="选择代币">选择代币</h2>
              <p className="text-sm neon-text-green mt-1">快速选择常见代币合约地址</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 neon-border-cyan rounded-lg hover:bg-cyan-400/10 transition-colors"
          >
            <X className="h-5 w-5 neon-text-cyan" />
          </button>
        </div>

        {/* 搜索和筛选 */}
        <div className="p-6 border-b neon-border-cyan space-y-4">
          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 neon-text-cyan" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="搜索代币符号、名称或地址..."
              className="w-full pl-10 pr-4 py-3 terminal-style neon-border-cyan rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all duration-300"
            />
          </div>

          {/* 标签页 */}
          <div className="flex gap-2">
            {[
              { key: 'popular', label: '热门', icon: '🔥' },
              { key: 'favorites', label: '收藏', icon: '⭐' },
              { key: 'all', label: '全部', icon: '📋' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  activeTab === tab.key
                    ? 'neon-border-cyan neon-text-cyan bg-cyan-400/10'
                    : 'border border-gray-600 text-gray-400 hover:border-cyan-400 hover:text-cyan-400'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
                {tab.key === 'favorites' && favoriteTokens.length > 0 && (
                  <span className="ml-2 px-2 py-1 bg-cyan-400/20 rounded-full text-xs">
                    {favoriteTokens.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* 网络和分类筛选 */}
          <div className="flex gap-4">
            {/* 网络选择 */}
            <div className="flex-1">
              <label className="block text-sm font-medium neon-text-cyan mb-2">网络</label>
              <select
                value={selectedChain}
                onChange={(e) => setSelectedChain(Number(e.target.value))}
                className="w-full px-3 py-2 terminal-style neon-border-cyan rounded-lg focus:ring-2 focus:ring-cyan-400"
              >
                {NETWORK_TOKENS.map(network => (
                  <option key={network.chainId} value={network.chainId}>
                    {network.chainName}
                  </option>
                ))}
              </select>
            </div>

            {/* 分类筛选 */}
            <div className="flex-1">
              <label className="block text-sm font-medium neon-text-cyan mb-2">分类</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 terminal-style neon-border-cyan rounded-lg focus:ring-2 focus:ring-cyan-400"
              >
                <option value="all">全部分类</option>
                {Object.entries(TOKEN_CATEGORIES).map(([key, category]) => (
                  <option key={key} value={key}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 代币列表 */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredTokens.length === 0 ? (
            <div className="text-center py-12">
              <Coins className="h-12 w-12 neon-text-green mx-auto mb-4 opacity-50" />
              <p className="neon-text-green text-lg mb-2">未找到匹配的代币</p>
              <p className="text-gray-500 text-sm">
                {activeTab === 'favorites' 
                  ? '您还没有收藏任何代币' 
                  : '尝试调整搜索条件或选择其他网络'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTokens.map((token) => {
                const isTokenFavorite = isFavorite(token.address, selectedChain);
                
                return (
                  <div
                    key={`${selectedChain}-${token.address}`}
                    onClick={() => handleSelectToken(token)}
                    className="group cyberpunk-card rounded-xl p-4 cursor-pointer transition-all duration-300 hover:neon-border-cyan hover:bg-cyan-400/5 scan-line"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-lg neon-text-cyan group-hover:animate-neon-glow">
                            {token.symbol}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            getCategoryColorClass(token.category)
                          } bg-current/10`}>
                            {TOKEN_CATEGORIES[token.category]?.label || '其他'}
                          </span>
                        </div>
                        <p className="text-sm neon-text-green truncate mb-2">
                          {token.name}
                        </p>
                        <p className="text-xs text-gray-500 font-mono truncate">
                          {token.address}
                        </p>
                      </div>
                      
                      <div className="flex flex-col gap-1 ml-2">
                        <button
                          onClick={(e) => handleToggleFavorite(e, token)}
                          className={`p-1 rounded transition-colors ${
                            isTokenFavorite
                              ? 'neon-text-yellow bg-yellow-400/10'
                              : 'text-gray-500 hover:neon-text-yellow hover:bg-yellow-400/10'
                          }`}
                          title={isTokenFavorite ? '取消收藏' : '添加收藏'}
                        >
                          <Star className={`h-4 w-4 ${isTokenFavorite ? 'fill-current' : ''}`} />
                        </button>
                        
                        <button
                          onClick={(e) => handleCopyAddress(e, token.address)}
                          className="p-1 rounded text-gray-500 hover:neon-text-cyan hover:bg-cyan-400/10 transition-colors"
                          title="复制地址"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    {token.description && (
                      <p className="text-xs text-gray-400 leading-relaxed">
                        {token.description}
                      </p>
                    )}
                    
                    <div className="mt-3 pt-3 border-t border-gray-700 flex items-center justify-between text-xs text-gray-500">
                      <span>小数位: {token.decimals}</span>
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity neon-text-cyan">
                        点击选择 →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 底部信息 */}
        <div className="p-4 border-t neon-border-cyan bg-gray-900/50">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>
              当前网络: <span className="neon-text-cyan">{currentNetwork?.chainName || '未知'}</span>
            </span>
            <span>
              显示 {filteredTokens.length} 个代币
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}