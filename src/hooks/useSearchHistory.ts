'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * 搜索历史记录接口
 */
export interface SearchHistoryItem {
  id: string;
  address: string;
  timestamp: number;
  tokenInfo?: {
    symbol?: string;
    name?: string;
  };
}

/**
 * 搜索历史管理Hook
 * 提供搜索历史的增删改查功能，使用localStorage持久化存储
 */
export function useSearchHistory() {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const STORAGE_KEY = 'dapp-search-history';
  const MAX_HISTORY_SIZE = 20;

  /**
   * 从localStorage加载搜索历史
   */
  const loadHistory = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedHistory = JSON.parse(stored) as SearchHistoryItem[];
        // 按时间戳倒序排列
        const sortedHistory = parsedHistory.sort((a, b) => b.timestamp - a.timestamp);
        setHistory(sortedHistory);
      }
    } catch (error) {
      console.error('加载搜索历史失败:', error);
      setHistory([]);
    }
  }, []);

  /**
   * 保存搜索历史到localStorage
   */
  const saveHistory = useCallback((newHistory: SearchHistoryItem[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
      setHistory(newHistory);
    } catch (error) {
      console.error('保存搜索历史失败:', error);
    }
  }, []);

  /**
   * 添加新的搜索记录
   * @param address - 代币合约地址
   * @param tokenInfo - 可选的代币信息
   */
  const addToHistory = useCallback((address: string, tokenInfo?: { symbol?: string; name?: string }) => {
    if (!address || !address.trim()) return;

    const normalizedAddress = address.toLowerCase().trim();
    
    // 检查是否已存在相同地址的记录
    const existingIndex = history.findIndex(item => 
      item.address.toLowerCase() === normalizedAddress
    );

    let newHistory: SearchHistoryItem[];
    
    if (existingIndex >= 0) {
      // 如果已存在，更新时间戳和代币信息，并移到最前面
      const existingItem = history[existingIndex];
      const updatedItem: SearchHistoryItem = {
        ...existingItem,
        timestamp: Date.now(),
        tokenInfo: tokenInfo || existingItem.tokenInfo
      };
      
      newHistory = [
        updatedItem,
        ...history.filter((_, index) => index !== existingIndex)
      ];
    } else {
      // 如果不存在，创建新记录
      const newItem: SearchHistoryItem = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        address: normalizedAddress,
        timestamp: Date.now(),
        tokenInfo
      };
      
      newHistory = [newItem, ...history];
    }

    // 限制历史记录数量
    if (newHistory.length > MAX_HISTORY_SIZE) {
      newHistory = newHistory.slice(0, MAX_HISTORY_SIZE);
    }

    saveHistory(newHistory);
  }, [history, saveHistory]);

  /**
   * 删除指定的搜索记录
   * @param id - 记录ID
   */
  const removeFromHistory = useCallback((id: string) => {
    const newHistory = history.filter(item => item.id !== id);
    saveHistory(newHistory);
  }, [history, saveHistory]);

  /**
   * 清空所有搜索历史
   */
  const clearHistory = useCallback(() => {
    saveHistory([]);
  }, [saveHistory]);

  /**
   * 根据关键词搜索历史记录
   * @param keyword - 搜索关键词
   * @returns 匹配的历史记录
   */
  const searchHistory = useCallback((keyword: string): SearchHistoryItem[] => {
    if (!keyword.trim()) return history;

    const lowerKeyword = keyword.toLowerCase();
    return history.filter(item => 
      item.address.toLowerCase().includes(lowerKeyword) ||
      item.tokenInfo?.symbol?.toLowerCase().includes(lowerKeyword) ||
      item.tokenInfo?.name?.toLowerCase().includes(lowerKeyword)
    );
  }, [history]);

  /**
   * 获取最近的搜索记录
   * @param count - 返回的记录数量
   * @returns 最近的搜索记录
   */
  const getRecentHistory = useCallback((count: number = 5): SearchHistoryItem[] => {
    return history.slice(0, count);
  }, [history]);

  // 组件挂载时加载历史记录
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
    searchHistory,
    getRecentHistory,
    historyCount: history.length
  };
}