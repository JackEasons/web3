'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * 收藏代币信息接口
 */
export interface FavoriteToken {
  id: string;
  address: string;
  chainId: number;
  symbol?: string;
  name?: string;
  decimals?: number;
  tags: string[];
  note?: string;
  addedAt: number;
  lastUpdated: number;
}

/**
 * 收藏代币管理Hook
 * 提供代币收藏的增删改查功能，使用localStorage持久化存储
 */
export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteToken[]>([]);
  const STORAGE_KEY = 'dapp-favorite-tokens';

  /**
   * 从localStorage加载收藏列表
   */
  const loadFavorites = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedFavorites = JSON.parse(stored) as FavoriteToken[];
        // 按添加时间倒序排列
        const sortedFavorites = parsedFavorites.sort((a, b) => b.addedAt - a.addedAt);
        setFavorites(sortedFavorites);
      }
    } catch (error) {
      console.error('加载收藏列表失败:', error);
      setFavorites([]);
    }
  }, []);

  /**
   * 保存收藏列表到localStorage
   */
  const saveFavorites = useCallback((newFavorites: FavoriteToken[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newFavorites));
      setFavorites(newFavorites);
    } catch (error) {
      console.error('保存收藏列表失败:', error);
    }
  }, []);

  /**
   * 检查代币是否已收藏
   * @param address - 代币合约地址
   * @param chainId - 链ID
   * @returns 是否已收藏
   */
  const isFavorite = useCallback((address: string, chainId: number): boolean => {
    return favorites.some(fav => 
      fav.address.toLowerCase() === address.toLowerCase() && fav.chainId === chainId
    );
  }, [favorites]);

  /**
   * 添加代币到收藏
   * @param tokenData - 代币信息
   */
  const addToFavorites = useCallback((tokenData: {
    address: string;
    chainId: number;
    symbol?: string;
    name?: string;
    decimals?: number;
    tags?: string[];
    note?: string;
  }) => {
    const { address, chainId, symbol, name, decimals, tags = [], note } = tokenData;
    
    if (!address || !chainId) {
      console.error('添加收藏失败：缺少必要参数');
      return false;
    }

    // 检查是否已存在
    if (isFavorite(address, chainId)) {
      console.warn('代币已在收藏列表中');
      return false;
    }

    const newFavorite: FavoriteToken = {
      id: `${chainId}-${address.toLowerCase()}-${Date.now()}`,
      address: address.toLowerCase(),
      chainId,
      symbol,
      name,
      decimals,
      tags,
      note,
      addedAt: Date.now(),
      lastUpdated: Date.now()
    };

    const newFavorites = [newFavorite, ...favorites];
    saveFavorites(newFavorites);
    return true;
  }, [favorites, isFavorite, saveFavorites]);

  /**
   * 从收藏中移除代币
   * @param address - 代币合约地址
   * @param chainId - 链ID
   */
  const removeFromFavorites = useCallback((address: string, chainId: number) => {
    const newFavorites = favorites.filter(fav => 
      !(fav.address.toLowerCase() === address.toLowerCase() && fav.chainId === chainId)
    );
    saveFavorites(newFavorites);
  }, [favorites, saveFavorites]);

  /**
   * 切换收藏状态
   * @param tokenData - 代币信息
   * @returns 操作后的收藏状态
   */
  const toggleFavorite = useCallback((tokenData: {
    address: string;
    chainId: number;
    symbol?: string;
    name?: string;
    decimals?: number;
    tags?: string[];
    note?: string;
  }): boolean => {
    const { address, chainId } = tokenData;
    
    if (isFavorite(address, chainId)) {
      removeFromFavorites(address, chainId);
      return false;
    } else {
      addToFavorites(tokenData);
      return true;
    }
  }, [isFavorite, addToFavorites, removeFromFavorites]);

  /**
   * 更新收藏代币信息
   * @param address - 代币合约地址
   * @param chainId - 链ID
   * @param updates - 更新的字段
   */
  const updateFavorite = useCallback((address: string, chainId: number, updates: Partial<{
    symbol: string;
    name: string;
    decimals: number;
    tags: string[];
    note: string;
  }>) => {
    const newFavorites = favorites.map(fav => {
      if (fav.address.toLowerCase() === address.toLowerCase() && fav.chainId === chainId) {
        return {
          ...fav,
          ...updates,
          lastUpdated: Date.now()
        };
      }
      return fav;
    });
    
    saveFavorites(newFavorites);
  }, [favorites, saveFavorites]);

  /**
   * 根据关键词搜索收藏
   * @param keyword - 搜索关键词
   * @returns 匹配的收藏列表
   */
  const searchFavorites = useCallback((keyword: string): FavoriteToken[] => {
    if (!keyword.trim()) return favorites;

    const lowerKeyword = keyword.toLowerCase();
    return favorites.filter(fav => 
      fav.address.toLowerCase().includes(lowerKeyword) ||
      fav.symbol?.toLowerCase().includes(lowerKeyword) ||
      fav.name?.toLowerCase().includes(lowerKeyword) ||
      fav.tags.some(tag => tag.toLowerCase().includes(lowerKeyword)) ||
      fav.note?.toLowerCase().includes(lowerKeyword)
    );
  }, [favorites]);

  /**
   * 按标签筛选收藏
   * @param tag - 标签名称
   * @returns 包含该标签的收藏列表
   */
  const getFavoritesByTag = useCallback((tag: string): FavoriteToken[] => {
    return favorites.filter(fav => 
      fav.tags.some(t => t.toLowerCase() === tag.toLowerCase())
    );
  }, [favorites]);

  /**
   * 按链ID筛选收藏
   * @param chainId - 链ID
   * @returns 该链上的收藏列表
   */
  const getFavoritesByChain = useCallback((chainId: number): FavoriteToken[] => {
    return favorites.filter(fav => fav.chainId === chainId);
  }, [favorites]);

  /**
   * 获取所有使用的标签
   * @returns 标签列表及使用次数
   */
  const getAllTags = useCallback((): { tag: string; count: number }[] => {
    const tagCounts = new Map<string, number>();
    
    favorites.forEach(fav => {
      fav.tags.forEach(tag => {
        const lowerTag = tag.toLowerCase();
        tagCounts.set(lowerTag, (tagCounts.get(lowerTag) || 0) + 1);
      });
    });
    
    return Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }, [favorites]);

  /**
   * 清空所有收藏
   */
  const clearFavorites = useCallback(() => {
    saveFavorites([]);
  }, [saveFavorites]);

  /**
   * 导出收藏列表
   * @returns JSON格式的收藏数据
   */
  const exportFavorites = useCallback(() => {
    return {
      version: '1.0',
      exportTime: Date.now(),
      favorites: favorites
    };
  }, [favorites]);

  /**
   * 导入收藏列表
   * @param data - 导入的数据
   * @param merge - 是否与现有收藏合并
   */
  const importFavorites = useCallback((data: any, merge: boolean = false) => {
    try {
      if (!data.favorites || !Array.isArray(data.favorites)) {
        throw new Error('无效的导入数据格式');
      }

      const importedFavorites = data.favorites as FavoriteToken[];
      
      if (merge) {
        // 合并模式：去重后合并
        const existingKeys = new Set(
          favorites.map(fav => `${fav.chainId}-${fav.address.toLowerCase()}`)
        );
        
        const newFavorites = importedFavorites.filter(fav => 
          !existingKeys.has(`${fav.chainId}-${fav.address.toLowerCase()}`)
        );
        
        saveFavorites([...favorites, ...newFavorites]);
      } else {
        // 替换模式：完全替换
        saveFavorites(importedFavorites);
      }
      
      return true;
    } catch (error) {
      console.error('导入收藏列表失败:', error);
      return false;
    }
  }, [favorites, saveFavorites]);

  // 组件挂载时加载收藏列表
  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  return {
    favorites,
    isFavorite,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    updateFavorite,
    searchFavorites,
    getFavoritesByTag,
    getFavoritesByChain,
    getAllTags,
    clearFavorites,
    exportFavorites,
    importFavorites,
    favoritesCount: favorites.length
  };
}