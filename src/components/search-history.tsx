'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Clock, X, Trash2, Search } from 'lucide-react';
import { useSearchHistory, type SearchHistoryItem } from '@/hooks/useSearchHistory';
import { formatAddress } from '@/lib/utils';

/**
 * 搜索历史组件属性
 */
interface SearchHistoryProps {
  onSelectAddress: (address: string) => void;
  isVisible: boolean;
  onClose: () => void;
  searchKeyword?: string;
}

/**
 * 搜索历史组件
 * 显示用户的搜索历史记录，支持选择、删除和搜索功能
 */
export function SearchHistory({ 
  onSelectAddress, 
  isVisible, 
  onClose, 
  searchKeyword = '' 
}: SearchHistoryProps) {
  const { 
    history, 
    removeFromHistory, 
    clearHistory, 
    searchHistory 
  } = useSearchHistory();
  
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 根据搜索关键词过滤历史记录
  const filteredHistory = searchKeyword ? searchHistory(searchKeyword) : history;

  /**
   * 处理选择历史记录
   */
  const handleSelectItem = (item: SearchHistoryItem) => {
    onSelectAddress(item.address);
    onClose();
  };

  /**
   * 处理删除单条记录
   */
  const handleRemoveItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    removeFromHistory(id);
  };

  /**
   * 处理清空所有历史记录
   */
  const handleClearAll = () => {
    clearHistory();
    setShowConfirmClear(false);
    onClose();
  };

  /**
   * 格式化时间显示
   */
  const formatTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    
    return new Date(timestamp).toLocaleDateString('zh-CN');
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

  if (!isVisible) return null;

  return (
    <div 
      ref={containerRef}
      className="absolute top-full left-0 right-0 mt-2 cyberpunk-card rounded-xl neon-border-cyan z-50 max-h-96 overflow-hidden animate-scale-in"
    >
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b neon-border-cyan">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 neon-text-cyan" />
          <span className="text-sm font-medium neon-text-cyan">
            搜索历史 ({filteredHistory.length})
          </span>
        </div>
        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <button
              onClick={() => setShowConfirmClear(true)}
              className="p-1 neon-border-pink rounded hover:bg-pink-400/10 transition-colors"
              title="清空历史"
            >
              <Trash2 className="h-4 w-4 neon-text-pink" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 neon-border-cyan rounded hover:bg-cyan-400/10 transition-colors"
            title="关闭"
          >
            <X className="h-4 w-4 neon-text-cyan" />
          </button>
        </div>
      </div>

      {/* 历史记录列表 */}
      <div className="max-h-80 overflow-y-auto">
        {filteredHistory.length === 0 ? (
          <div className="p-8 text-center">
            {searchKeyword ? (
              <div>
                <Search className="h-8 w-8 neon-text-green mx-auto mb-3 opacity-50" />
                <p className="neon-text-green text-sm">未找到匹配的搜索记录</p>
                <p className="text-xs text-gray-500 mt-1">尝试使用其他关键词搜索</p>
              </div>
            ) : (
              <div>
                <Clock className="h-8 w-8 neon-text-green mx-auto mb-3 opacity-50" />
                <p className="neon-text-green text-sm">暂无搜索历史</p>
                <p className="text-xs text-gray-500 mt-1">查询代币后会自动保存到这里</p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-2">
            {filteredHistory.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelectItem(item)}
                className="group flex items-center justify-between p-3 rounded-lg hover:bg-cyan-400/5 cursor-pointer transition-all duration-200 border border-transparent hover:neon-border-cyan"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {item.tokenInfo?.symbol && (
                          <span className="text-sm font-bold neon-text-purple">
                            {item.tokenInfo.symbol}
                          </span>
                        )}
                        {item.tokenInfo?.name && (
                          <span className="text-xs neon-text-green truncate">
                            {item.tokenInfo.name}
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-sm neon-text-cyan truncate">
                        {formatAddress(item.address, 8, 6)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatTime(item.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={(e) => handleRemoveItem(e, item.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 neon-border-pink rounded hover:bg-pink-400/10 transition-all duration-200 flex-shrink-0 ml-2"
                  title="删除记录"
                >
                  <X className="h-3 w-3 neon-text-pink" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 清空确认对话框 */}
      {showConfirmClear && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4 rounded-xl">
          <div className="cyberpunk-card neon-border-pink rounded-lg p-6 max-w-sm w-full animate-scale-in">
            <div className="text-center">
              <Trash2 className="h-8 w-8 neon-text-pink mx-auto mb-3" />
              <h3 className="text-lg font-bold neon-text-pink mb-2">确认清空历史</h3>
              <p className="text-sm neon-text-green mb-6">
                此操作将删除所有搜索历史记录，且无法恢复。
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmClear(false)}
                  className="flex-1 neon-border-cyan bg-transparent neon-text-cyan py-2 px-4 rounded-lg hover:bg-cyan-400/10 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleClearAll}
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
  );
}