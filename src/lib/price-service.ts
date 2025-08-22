import axios from 'axios';

// CoinGecko API 基础配置
const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';
const REQUEST_TIMEOUT = 10000; // 10秒超时

// 创建axios实例
const apiClient = axios.create({
  baseURL: COINGECKO_API_BASE,
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Accept': 'application/json',
  },
});

// 价格数据接口
export interface TokenPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  last_updated: string;
}

// 历史价格数据接口
export interface HistoricalPrice {
  timestamp: number;
  price: number;
}

// 支持的法币类型
export type SupportedCurrency = 'usd' | 'eur' | 'jpy' | 'gbp' | 'cny' | 'krw';

// 时间范围类型
export type TimeRange = '1h' | '24h' | '7d' | '30d' | '90d' | '1y';

/**
 * 根据合约地址获取代币价格信息
 * @param contractAddress - ERC-20代币合约地址
 * @param currency - 法币类型，默认为USD
 * @returns Promise<TokenPrice | null>
 */
export async function getTokenPriceByContract(
  contractAddress: string,
  currency: SupportedCurrency = 'usd'
): Promise<TokenPrice | null> {
  try {
    const response = await apiClient.get('/simple/token_price/ethereum', {
      params: {
        contract_addresses: contractAddress.toLowerCase(),
        vs_currencies: currency,
        include_market_cap: true,
        include_24hr_vol: true,
        include_24hr_change: true,
        include_last_updated_at: true,
      },
    });

    const data = response.data[contractAddress.toLowerCase()];
    if (!data) {
      return null;
    }

    // 获取详细信息
    const detailResponse = await getTokenDetailsByContract(contractAddress);
    
    return {
      id: detailResponse?.id || contractAddress,
      symbol: detailResponse?.symbol || 'UNKNOWN',
      name: detailResponse?.name || 'Unknown Token',
      current_price: data[currency] || 0,
      price_change_24h: data[`${currency}_24h_change`] || 0,
      price_change_percentage_24h: data[`${currency}_24h_change`] || 0,
      market_cap: data[`${currency}_market_cap`] || 0,
      market_cap_rank: 0,
      total_volume: data[`${currency}_24h_vol`] || 0,
      high_24h: 0,
      low_24h: 0,
      last_updated: new Date(data.last_updated_at * 1000).toISOString(),
    };
  } catch (error) {
    console.error('获取代币价格失败:', error);
    return null;
  }
}

/**
 * 根据代币ID获取价格信息
 * @param tokenId - CoinGecko代币ID
 * @param currency - 法币类型
 * @returns Promise<TokenPrice | null>
 */
export async function getTokenPriceById(
  tokenId: string,
  currency: SupportedCurrency = 'usd'
): Promise<TokenPrice | null> {
  try {
    const response = await apiClient.get('/coins/markets', {
      params: {
        ids: tokenId,
        vs_currency: currency,
        order: 'market_cap_desc',
        per_page: 1,
        page: 1,
        sparkline: false,
        price_change_percentage: '24h',
      },
    });

    const data = response.data[0];
    if (!data) {
      return null;
    }

    return {
      id: data.id,
      symbol: data.symbol,
      name: data.name,
      current_price: data.current_price,
      price_change_24h: data.price_change_24h,
      price_change_percentage_24h: data.price_change_percentage_24h,
      market_cap: data.market_cap,
      market_cap_rank: data.market_cap_rank,
      total_volume: data.total_volume,
      high_24h: data.high_24h,
      low_24h: data.low_24h,
      last_updated: data.last_updated,
    };
  } catch (error) {
    console.error('获取代币价格失败:', error);
    return null;
  }
}

/**
 * 获取代币历史价格数据
 * @param tokenId - CoinGecko代币ID
 * @param timeRange - 时间范围
 * @param currency - 法币类型
 * @returns Promise<HistoricalPrice[]>
 */
export async function getTokenHistoricalPrices(
  tokenId: string,
  timeRange: TimeRange = '7d',
  currency: SupportedCurrency = 'usd'
): Promise<HistoricalPrice[]> {
  try {
    const days = getTimeRangeDays(timeRange);
    const response = await apiClient.get(`/coins/${tokenId}/market_chart`, {
      params: {
        vs_currency: currency,
        days: days,
        interval: getInterval(timeRange),
      },
    });

    const prices = response.data.prices || [];
    return prices.map(([timestamp, price]: [number, number]) => ({
      timestamp,
      price,
    }));
  } catch (error) {
    console.error('获取历史价格失败:', error);
    return [];
  }
}

/**
 * 根据合约地址获取代币详细信息
 * @param contractAddress - 合约地址
 * @returns Promise<{id: string, symbol: string, name: string} | null>
 */
export async function getTokenDetailsByContract(
  contractAddress: string
): Promise<{id: string; symbol: string; name: string} | null> {
  try {
    const response = await apiClient.get(`/coins/ethereum/contract/${contractAddress.toLowerCase()}`);
    const data = response.data;
    
    return {
      id: data.id,
      symbol: data.symbol,
      name: data.name,
    };
  } catch (error) {
    console.error('获取代币详细信息失败:', error);
    return null;
  }
}

/**
 * 搜索代币
 * @param query - 搜索关键词
 * @returns Promise<Array<{id: string, symbol: string, name: string}>>
 */
export async function searchTokens(
  query: string
): Promise<Array<{id: string; symbol: string; name: string}>> {
  try {
    const response = await apiClient.get('/search', {
      params: {
        query: query.trim(),
      },
    });

    const coins = response.data.coins || [];
    return coins.slice(0, 10).map((coin: any) => ({
      id: coin.id,
      symbol: coin.symbol,
      name: coin.name,
    }));
  } catch (error) {
    console.error('搜索代币失败:', error);
    return [];
  }
}

/**
 * 获取热门代币列表
 * @param currency - 法币类型
 * @param limit - 返回数量限制
 * @returns Promise<TokenPrice[]>
 */
export async function getTrendingTokens(
  currency: SupportedCurrency = 'usd',
  limit: number = 10
): Promise<TokenPrice[]> {
  try {
    const response = await apiClient.get('/coins/markets', {
      params: {
        vs_currency: currency,
        order: 'market_cap_desc',
        per_page: limit,
        page: 1,
        sparkline: false,
        price_change_percentage: '24h',
      },
    });

    return response.data.map((coin: any) => ({
      id: coin.id,
      symbol: coin.symbol,
      name: coin.name,
      current_price: coin.current_price,
      price_change_24h: coin.price_change_24h,
      price_change_percentage_24h: coin.price_change_percentage_24h,
      market_cap: coin.market_cap,
      market_cap_rank: coin.market_cap_rank,
      total_volume: coin.total_volume,
      high_24h: coin.high_24h,
      low_24h: coin.low_24h,
      last_updated: coin.last_updated,
    }));
  } catch (error) {
    console.error('获取热门代币失败:', error);
    return [];
  }
}

// 辅助函数：将时间范围转换为天数
function getTimeRangeDays(timeRange: TimeRange): number {
  switch (timeRange) {
    case '1h':
      return 1;
    case '24h':
      return 1;
    case '7d':
      return 7;
    case '30d':
      return 30;
    case '90d':
      return 90;
    case '1y':
      return 365;
    default:
      return 7;
  }
}

// 辅助函数：获取数据间隔
function getInterval(timeRange: TimeRange): string {
  switch (timeRange) {
    case '1h':
      return 'minutely';
    case '24h':
      return 'hourly';
    case '7d':
      return 'hourly';
    case '30d':
      return 'daily';
    case '90d':
      return 'daily';
    case '1y':
      return 'daily';
    default:
      return 'hourly';
  }
}

// API限制处理
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1秒最小间隔

// 请求拦截器：处理API限制
apiClient.interceptors.request.use(async (config) => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => 
      setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
    );
  }
  
  lastRequestTime = Date.now();
  return config;
});

// 响应拦截器：处理错误
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 429) {
      console.warn('API请求频率限制，请稍后重试');
    } else if (error.response?.status >= 500) {
      console.error('CoinGecko API服务器错误');
    } else if (error.code === 'ECONNABORTED') {
      console.error('API请求超时');
    }
    return Promise.reject(error);
  }
);