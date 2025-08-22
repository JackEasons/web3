'use client';

import React, { useState, useMemo } from 'react';
import { Star, Search, Filter, Trash2, Download, Upload, Edit3, X, Tag, ExternalLink } from 'lucide-react';
import { useFavorites, type FavoriteToken } from '@/hooks/useFavorites';
import { formatAddress } from '@/lib/utils';
import { NETWORK_TOKENS } from '@/data/tokens';

/**
 * 收藏管理器组件属性
 */
interface FavoritesManagerProps {
  isVisible: boolean;
  onClose: () => void;
  onSelectToken?: (address: string, chainId: number) => void;
}

/**
 * 收藏管理器组件
 * 提供收藏代币的完整管理功能，包括查看、编辑、删除、导入导出等
 */
export function FavoritesManager({ 
  isVisible, 
  onClose, 
  onSelectToken 
}: FavoritesManagerProps) {
  const {
    favorites,
    removeFromFavorites,
    updateFavorite,
    searchFavorites,
    getFavoritesByChain,
    getAllTags,
    clearFavorites,
    exportFavorites,
    importFavorites
  } = useFavorites();

  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedChain, setSelectedChain] = useState<number | 'all'>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'addedAt' | 'symbol' | 'name'>('addedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedTokens, setSelectedTokens] = useState<Set<string>>(new Set());
  const [editingToken, setEditingToken] = useState<FavoriteToken | null>(null);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // 获取所有标签
  const allTags = getAllTags();

  /**
   * 过滤和排序收藏列表
   */
  const filteredAndSortedFavorites = useMemo(() => {
    let filtered = favorites;

    // 按搜索关键词过滤
    if (searchKeyword.trim()) {
      filtered = searchFavorites(searchKeyword);
    }

    // 按网络过滤
    if (selectedChain !== 'all') {
      filtered = filtered.filter(fav => fav.chainId === selectedChain);
    }

    // 按标签过滤
    if (selectedTag !== 'all') {
      filtered = filtered.filter(fav => 
        fav.tags.some(tag => tag.toLowerCase() === selectedTag.toLowerCase())
      );
    }

    // 排序
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'symbol':
          comparison = (a.symbol || '').localeCompare(b.symbol || '');
          break;
        case 'name':
          comparison = (a.name || '').localeCompare(b.name || '');
          break;
        case 'addedAt':
        default:
          comparison = a.addedAt - b.addedAt;
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [favorites, searchKeyword, selectedChain, selectedTag, sortBy, sortOrder, searchFavorites]);

  /**
   * 获取网络名称
   */
  const getNetworkName = (chainId: number): string => {
    const network = NETWORK_TOKENS.find(n => n.chainId === chainId);
    return network?.chainName || `Chain ${chainId}`;
  };

  /**
   * 处理选择代币
   */
  const handleSelectToken = (token: FavoriteToken) => {
    if (onSelectToken) {
      onSelectToken(token.address, token.chainId);
      onClose();
    }
  };

  /**
   * 处理批量选择
   */
  const handleToggleSelect = (tokenId: string) => {
    const newSelected = new Set(selectedTokens);
    if (newSelected.has(tokenId)) {
      newSelected.delete(tokenId);
    } else {
      newSelected.add(tokenId);
    }
    setSelectedTokens(newSelected);
  };

  /**
   * 处理全选/取消全选
   */
  const handleToggleSelectAll = () => {
    if (selectedTokens.size === filteredAndSortedFavorites.length) {
      setSelectedTokens(new Set());
    } else {
      setSelectedTokens(new Set(filteredAndSortedFavorites.map(token => token.id)));
    }
  };

  /**
   * 处理批量删除
   */
  const handleBatchDelete = () => {
    selectedTokens.forEach(tokenId => {
      const token = favorites.find(fav => fav.id === tokenId);
      if (token) {
        removeFromFavorites(token.address, token.chainId);
      }
    });
    setSelectedTokens(new Set());
  };

  /**
   * 处理编辑代币
   */
  const handleEditToken = (token: FavoriteToken) => {
    setEditingToken({ ...token });
  };

  /**
   * 保存编辑
   */
  const handleSaveEdit = () => {
    if (!editingToken) return;
    
    updateFavorite(editingToken.address, editingToken.chainId, {
      symbol: editingToken.symbol,
      name: editingToken.name,
      tags: editingToken.tags,
      note: editingToken.note
    });
    
    setEditingToken(null);
  };

  /**
   * 处理导出
   */
  const handleExport = () => {
    const data = exportFavorites();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dapp-favorites-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /**
   * 处理导入
   */
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        const success = importFavorites(data, true); // 合并模式
        if (success) {
          // 显示成功提示
          console.log('导入成功');
        } else {
          // 显示错误提示
          console.error('导入失败');
        }
      } catch (error) {
        console.error('文件格式错误:', error);
      }
    };
    reader.readAsText(file);
    
    // 重置文件输入
    event.target.value = '';
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="cyberpunk-card rounded-2xl neon-border-yellow w-full max-w-6xl max-h-[90vh] overflow-hidden animate-scale-in">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b neon-border-yellow">
          <div className="flex items-center gap-3">
            <div className="p-2 neon-border-yellow rounded-xl animate-circuit-pulse">
              <Star className="h-6 w-6 neon-text-yellow fill-current" />
            </div>
            <div>
              <h2 className="text-2xl font-bold neon-text-yellow glitch-effect" data-text="收藏管理">收藏管理</h2>
              <p className="text-sm neon-text-green mt-1">管理您收藏的代币 ({favorites.length} 个)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 neon-border-yellow rounded-lg hover:bg-yellow-400/10 transition-colors"
          >
            <X className="h-5 w-5 neon-text-yellow" />
          </button>
        </div>

        {/* 工具栏 */}
        <div className="p-6 border-b neon-border-yellow space-y-4">
          {/* 搜索和操作 */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 neon-text-yellow" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="搜索代币符号、名称、地址或标签..."
                className="w-full pl-10 pr-4 py-3 terminal-style neon-border-yellow rounded-xl focus:ring-2 focus:ring-yellow-400"
              />
            </div>
            
            {/* 批量操作 */}
            {selectedTokens.size > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={handleBatchDelete}
                  className="neon-border-pink bg-transparent neon-text-pink px-4 py-3 rounded-xl hover:bg-pink-400/10 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
            
            {/* 导入导出 */}
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                className="neon-border-green bg-transparent neon-text-green px-4 py-3 rounded-xl hover:bg-green-400/10 transition-colors"
                title="导出收藏"
                disabled={favorites.length === 0}
              >
                <Download className="h-4 w-4" />
              </button>
              
              <label className="neon-border-blue bg-transparent neon-text-blue px-4 py-3 rounded-xl hover:bg-blue-400/10 transition-colors cursor-pointer" title="导入收藏">
                <Upload className="h-4 w-4" />
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* 筛选和排序 */}
          <div className="flex gap-4 flex-wrap">
            {/* 网络筛选 */}
            <select
              value={selectedChain}
              onChange={(e) => setSelectedChain(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="px-3 py-2 terminal-style neon-border-yellow rounded-lg focus:ring-2 focus:ring-yellow-400"
            >
              <option value="all">所有网络</option>
              {NETWORK_TOKENS.map(network => (
                <option key={network.chainId} value={network.chainId}>
                  {network.chainName}
                </option>
              ))}
            </select>

            {/* 标签筛选 */}
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="px-3 py-2 terminal-style neon-border-yellow rounded-lg focus:ring-2 focus:ring-yellow-400"
            >
              <option value="all">所有标签</option>
              {allTags.map(({ tag, count }) => (
                <option key={tag} value={tag}>
                  {tag} ({count})
                </option>
              ))}
            </select>

            {/* 排序 */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [by, order] = e.target.value.split('-');
                setSortBy(by as any);
                setSortOrder(order as any);
              }}
              className="px-3 py-2 terminal-style neon-border-yellow rounded-lg focus:ring-2 focus:ring-yellow-400"
            >
              <option value="addedAt-desc">最新添加</option>
              <option value="addedAt-asc">最早添加</option>
              <option value="symbol-asc">符号 A-Z</option>
              <option value="symbol-desc">符号 Z-A</option>
              <option value="name-asc">名称 A-Z</option>
              <option value="name-desc">名称 Z-A</option>
            </select>

            {/* 视图模式 */}
            <div className="flex border neon-border-yellow rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-yellow-400/20 neon-text-yellow'
                    : 'text-gray-400 hover:neon-text-yellow'
                }`}
              >
                网格
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 transition-colors border-l neon-border-yellow ${
                  viewMode === 'list'
                    ? 'bg-yellow-400/20 neon-text-yellow'
                    : 'text-gray-400 hover:neon-text-yellow'
                }`}
              >
                列表
              </button>
            </div>
          </div>

          {/* 批量操作栏 */}
          {filteredAndSortedFavorites.length > 0 && (
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedTokens.size === filteredAndSortedFavorites.length && filteredAndSortedFavorites.length > 0}
                  onChange={handleToggleSelectAll}
                  className="w-4 h-4 text-yellow-400 bg-transparent border-2 neon-border-yellow rounded focus:ring-yellow-400"
                />
                <span className="text-sm neon-text-yellow">
                  全选 ({selectedTokens.size}/{filteredAndSortedFavorites.length})
                </span>
              </label>
              
              {favorites.length > 0 && (
                <button
                  onClick={() => setShowConfirmClear(true)}
                  className="text-sm neon-text-pink hover:bg-pink-400/10 px-3 py-1 rounded transition-colors"
                >
                  清空所有收藏
                </button>
              )}
            </div>
          )}
        </div>

        {/* 收藏列表 */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredAndSortedFavorites.length === 0 ? (
            <div className="text-center py-12">
              <Star className="h-12 w-12 neon-text-yellow mx-auto mb-4 opacity-50" />
              <p className="neon-text-yellow text-lg mb-2">
                {favorites.length === 0 ? '还没有收藏任何代币' : '未找到匹配的收藏'}
              </p>
              <p className="text-gray-500 text-sm">
                {favorites.length === 0 
                  ? '在代币查询页面点击收藏按钮来添加收藏' 
                  : '尝试调整搜索条件或筛选选项'
                }
              </p>
            </div>
          ) : (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
              : 'space-y-3'
            }>
              {filteredAndSortedFavorites.map((token) => (
                <div
                  key={token.id}
                  className={`group cyberpunk-card rounded-xl p-4 transition-all duration-300 hover:neon-border-yellow hover:bg-yellow-400/5 scan-line ${
                    viewMode === 'list' ? 'flex items-center gap-4' : ''
                  }`}
                >
                  {/* 选择框 */}
                  <div className={`flex items-start gap-3 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                    <input
                      type="checkbox"
                      checked={selectedTokens.has(token.id)}
                      onChange={() => handleToggleSelect(token.id)}
                      className="mt-1 w-4 h-4 text-yellow-400 bg-transparent border-2 neon-border-yellow rounded focus:ring-yellow-400"
                    />
                    
                    <div className="flex-1 min-w-0">
                      {/* 代币信息 */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold text-lg neon-text-yellow">
                          {token.symbol || 'Unknown'}
                        </span>
                        <span className="text-xs px-2 py-1 bg-blue-400/20 neon-text-blue rounded-full">
                          {getNetworkName(token.chainId)}
                        </span>
                      </div>
                      
                      {token.name && (
                        <p className="text-sm neon-text-green mb-2 truncate">
                          {token.name}
                        </p>
                      )}
                      
                      <p className="text-xs text-gray-500 font-mono truncate mb-2">
                        {formatAddress(token.address, 8, 6)}
                      </p>
                      
                      {/* 标签 */}
                      {token.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {token.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="text-xs px-2 py-1 bg-purple-400/20 neon-text-purple rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {/* 备注 */}
                      {token.note && (
                        <p className="text-xs text-gray-400 mb-2 line-clamp-2">
                          {token.note}
                        </p>
                      )}
                      
                      <div className="text-xs text-gray-500">
                        添加于 {new Date(token.addedAt).toLocaleDateString('zh-CN')}
                      </div>
                    </div>
                  </div>
                  
                  {/* 操作按钮 */}
                  <div className={`flex gap-1 ${viewMode === 'list' ? '' : 'mt-3 pt-3 border-t border-gray-700'}`}>
                    {onSelectToken && (
                      <button
                        onClick={() => handleSelectToken(token)}
                        className="p-2 neon-border-cyan rounded hover:bg-cyan-400/10 transition-colors"
                        title="选择此代币"
                      >
                        <ExternalLink className="h-4 w-4 neon-text-cyan" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleEditToken(token)}
                      className="p-2 neon-border-green rounded hover:bg-green-400/10 transition-colors"
                      title="编辑"
                    >
                      <Edit3 className="h-4 w-4 neon-text-green" />
                    </button>
                    
                    <button
                      onClick={() => removeFromFavorites(token.address, token.chainId)}
                      className="p-2 neon-border-pink rounded hover:bg-pink-400/10 transition-colors"
                      title="删除"
                    >
                      <Trash2 className="h-4 w-4 neon-text-pink" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 编辑对话框 */}
        {editingToken && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4">
            <div className="cyberpunk-card neon-border-green rounded-xl p-6 max-w-md w-full animate-scale-in">
              <h3 className="text-lg font-bold neon-text-green mb-4">编辑代币信息</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium neon-text-green mb-2">符号</label>
                  <input
                    type="text"
                    value={editingToken.symbol || ''}
                    onChange={(e) => setEditingToken({ ...editingToken, symbol: e.target.value })}
                    className="w-full px-3 py-2 terminal-style neon-border-green rounded-lg focus:ring-2 focus:ring-green-400"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium neon-text-green mb-2">名称</label>
                  <input
                    type="text"
                    value={editingToken.name || ''}
                    onChange={(e) => setEditingToken({ ...editingToken, name: e.target.value })}
                    className="w-full px-3 py-2 terminal-style neon-border-green rounded-lg focus:ring-2 focus:ring-green-400"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium neon-text-green mb-2">标签 (用逗号分隔)</label>
                  <input
                    type="text"
                    value={editingToken.tags.join(', ')}
                    onChange={(e) => setEditingToken({ 
                      ...editingToken, 
                      tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                    })}
                    className="w-full px-3 py-2 terminal-style neon-border-green rounded-lg focus:ring-2 focus:ring-green-400"
                    placeholder="DeFi, 稳定币, 热门"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium neon-text-green mb-2">备注</label>
                  <textarea
                    value={editingToken.note || ''}
                    onChange={(e) => setEditingToken({ ...editingToken, note: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 terminal-style neon-border-green rounded-lg focus:ring-2 focus:ring-green-400 resize-none"
                    placeholder="添加备注信息..."
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setEditingToken(null)}
                  className="flex-1 neon-border-gray bg-transparent text-gray-400 py-2 px-4 rounded-lg hover:neon-border-green hover:neon-text-green transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 neon-border-green bg-transparent neon-text-green py-2 px-4 rounded-lg hover:bg-green-400/10 transition-colors"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 清空确认对话框 */}
        {showConfirmClear && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4">
            <div className="cyberpunk-card neon-border-pink rounded-xl p-6 max-w-sm w-full animate-scale-in">
              <div className="text-center">
                <Trash2 className="h-8 w-8 neon-text-pink mx-auto mb-3" />
                <h3 className="text-lg font-bold neon-text-pink mb-2">确认清空收藏</h3>
                <p className="text-sm neon-text-green mb-6">
                  此操作将删除所有收藏的代币，且无法恢复。建议先导出备份。
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirmClear(false)}
                    className="flex-1 neon-border-cyan bg-transparent neon-text-cyan py-2 px-4 rounded-lg hover:bg-cyan-400/10 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={() => {
                      clearFavorites();
                      setShowConfirmClear(false);
                      setSelectedTokens(new Set());
                    }}
                    className="flex-1 neon-border-pink bg-transparent neon-text-pink py-2 px-4 rounded-lg hover:bg-pink-400/10 transition-colors"
                  >
                    确认清空
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}