/**
 * 代币信息接口
 */
export interface TokenData {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  category: 'stablecoin' | 'defi' | 'layer1' | 'layer2' | 'meme' | 'gaming' | 'nft' | 'other';
  description?: string;
}

/**
 * 网络代币数据接口
 */
export interface NetworkTokens {
  chainId: number;
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  tokens: TokenData[];
}

/**
 * 以太坊主网代币列表
 */
const ETHEREUM_TOKENS: TokenData[] = [
  // 稳定币
  {
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    category: 'stablecoin',
    description: '最大的稳定币，与美元1:1锚定'
  },
  {
    address: '0xA0b86a33E6441b8C4505B6B8C0E8E0F8E8E8E8E8',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    category: 'stablecoin',
    description: '由Centre发行的美元稳定币'
  },
  {
    address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    decimals: 18,
    category: 'stablecoin',
    description: 'MakerDAO发行的去中心化稳定币'
  },
  {
    address: '0x4Fabb145d64652a948d72533023f6E7A623C7C53',
    symbol: 'BUSD',
    name: 'Binance USD',
    decimals: 18,
    category: 'stablecoin',
    description: 'Binance发行的美元稳定币'
  },
  
  // DeFi代币
  {
    address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    symbol: 'UNI',
    name: 'Uniswap',
    decimals: 18,
    category: 'defi',
    description: 'Uniswap去中心化交易所治理代币'
  },
  {
    address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
    symbol: 'AAVE',
    name: 'Aave Token',
    decimals: 18,
    category: 'defi',
    description: 'Aave借贷协议治理代币'
  },
  {
    address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    symbol: 'WETH',
    name: 'Wrapped Ether',
    decimals: 18,
    category: 'layer1',
    description: '包装以太坊，ERC-20版本的ETH'
  },
  {
    address: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
    symbol: 'LINK',
    name: 'ChainLink Token',
    decimals: 18,
    category: 'defi',
    description: 'Chainlink预言机网络代币'
  },
  {
    address: '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2',
    symbol: 'MKR',
    name: 'Maker',
    decimals: 18,
    category: 'defi',
    description: 'MakerDAO治理代币'
  },
  
  // Layer 2代币
  {
    address: '0x4200000000000000000000000000000000000042',
    symbol: 'OP',
    name: 'Optimism',
    decimals: 18,
    category: 'layer2',
    description: 'Optimism Layer 2治理代币'
  },
  
  // Meme代币
  {
    address: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE',
    symbol: 'SHIB',
    name: 'SHIBA INU',
    decimals: 18,
    category: 'meme',
    description: '柴犬币，以太坊上的meme代币'
  },
  
  // 其他知名代币
  {
    address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    symbol: 'WBTC',
    name: 'Wrapped BTC',
    decimals: 8,
    category: 'layer1',
    description: '包装比特币，以太坊上的比特币'
  }
];

/**
 * BSC代币列表
 */
const BSC_TOKENS: TokenData[] = [
  {
    address: '0x55d398326f99059fF775485246999027B3197955',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 18,
    category: 'stablecoin',
    description: 'BSC上的USDT'
  },
  {
    address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 18,
    category: 'stablecoin',
    description: 'BSC上的USDC'
  },
  {
    address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
    symbol: 'BUSD',
    name: 'Binance USD',
    decimals: 18,
    category: 'stablecoin',
    description: 'BSC原生稳定币'
  },
  {
    address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    symbol: 'WBNB',
    name: 'Wrapped BNB',
    decimals: 18,
    category: 'layer1',
    description: '包装BNB'
  },
  {
    address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
    symbol: 'CAKE',
    name: 'PancakeSwap Token',
    decimals: 18,
    category: 'defi',
    description: 'PancakeSwap DEX治理代币'
  }
];

/**
 * Polygon代币列表
 */
const POLYGON_TOKENS: TokenData[] = [
  {
    address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    category: 'stablecoin',
    description: 'Polygon上的USDT'
  },
  {
    address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    category: 'stablecoin',
    description: 'Polygon上的USDC'
  },
  {
    address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
    symbol: 'WMATIC',
    name: 'Wrapped Matic',
    decimals: 18,
    category: 'layer2',
    description: '包装MATIC'
  },
  {
    address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    decimals: 18,
    category: 'stablecoin',
    description: 'Polygon上的DAI'
  }
];

/**
 * Arbitrum代币列表
 */
const ARBITRUM_TOKENS: TokenData[] = [
  {
    address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    category: 'stablecoin',
    description: 'Arbitrum上的USDT'
  },
  {
    address: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    category: 'stablecoin',
    description: 'Arbitrum上的USDC'
  },
  {
    address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    symbol: 'WETH',
    name: 'Wrapped Ether',
    decimals: 18,
    category: 'layer1',
    description: 'Arbitrum上的WETH'
  },
  {
    address: '0x912CE59144191C1204E64559FE8253a0e49E6548',
    symbol: 'ARB',
    name: 'Arbitrum',
    decimals: 18,
    category: 'layer2',
    description: 'Arbitrum治理代币'
  }
];

/**
 * 所有网络的代币数据
 */
export const NETWORK_TOKENS: NetworkTokens[] = [
  {
    chainId: 1,
    chainName: 'Ethereum',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    tokens: ETHEREUM_TOKENS
  },
  {
    chainId: 56,
    chainName: 'BSC',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18
    },
    tokens: BSC_TOKENS
  },
  {
    chainId: 137,
    chainName: 'Polygon',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18
    },
    tokens: POLYGON_TOKENS
  },
  {
    chainId: 42161,
    chainName: 'Arbitrum One',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    tokens: ARBITRUM_TOKENS
  },
  {
    chainId: 10,
    chainName: 'Optimism',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    tokens: [
      {
        address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
        symbol: 'USDT',
        name: 'Tether USD',
        decimals: 6,
        category: 'stablecoin',
        description: 'Optimism上的USDT'
      },
      {
        address: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        category: 'stablecoin',
        description: 'Optimism上的USDC'
      },
      {
        address: '0x4200000000000000000000000000000000000006',
        symbol: 'WETH',
        name: 'Wrapped Ether',
        decimals: 18,
        category: 'layer1',
        description: 'Optimism上的WETH'
      },
      {
        address: '0x4200000000000000000000000000000000000042',
        symbol: 'OP',
        name: 'Optimism',
        decimals: 18,
        category: 'layer2',
        description: 'Optimism治理代币'
      }
    ]
  }
];

/**
 * 代币分类标签
 */
export const TOKEN_CATEGORIES = {
  stablecoin: { label: '稳定币', color: 'green' },
  defi: { label: 'DeFi', color: 'blue' },
  layer1: { label: 'Layer 1', color: 'purple' },
  layer2: { label: 'Layer 2', color: 'cyan' },
  meme: { label: 'Meme', color: 'pink' },
  gaming: { label: '游戏', color: 'yellow' },
  nft: { label: 'NFT', color: 'orange' },
  other: { label: '其他', color: 'gray' }
} as const;

/**
 * 根据链ID获取代币列表
 * @param chainId - 链ID
 * @returns 该链的代币列表
 */
export function getTokensByChain(chainId: number): TokenData[] {
  const network = NETWORK_TOKENS.find(n => n.chainId === chainId);
  return network?.tokens || [];
}

/**
 * 根据符号搜索代币
 * @param symbol - 代币符号
 * @param chainId - 可选的链ID
 * @returns 匹配的代币列表
 */
export function searchTokensBySymbol(symbol: string, chainId?: number): TokenData[] {
  const networks = chainId 
    ? NETWORK_TOKENS.filter(n => n.chainId === chainId)
    : NETWORK_TOKENS;
  
  const results: TokenData[] = [];
  const lowerSymbol = symbol.toLowerCase();
  
  networks.forEach(network => {
    network.tokens.forEach(token => {
      if (token.symbol.toLowerCase().includes(lowerSymbol)) {
        results.push(token);
      }
    });
  });
  
  return results;
}

/**
 * 根据名称搜索代币
 * @param name - 代币名称
 * @param chainId - 可选的链ID
 * @returns 匹配的代币列表
 */
export function searchTokensByName(name: string, chainId?: number): TokenData[] {
  const networks = chainId 
    ? NETWORK_TOKENS.filter(n => n.chainId === chainId)
    : NETWORK_TOKENS;
  
  const results: TokenData[] = [];
  const lowerName = name.toLowerCase();
  
  networks.forEach(network => {
    network.tokens.forEach(token => {
      if (token.name.toLowerCase().includes(lowerName)) {
        results.push(token);
      }
    });
  });
  
  return results;
}

/**
 * 根据分类获取代币
 * @param category - 代币分类
 * @param chainId - 可选的链ID
 * @returns 该分类的代币列表
 */
export function getTokensByCategory(category: TokenData['category'], chainId?: number): TokenData[] {
  const networks = chainId 
    ? NETWORK_TOKENS.filter(n => n.chainId === chainId)
    : NETWORK_TOKENS;
  
  const results: TokenData[] = [];
  
  networks.forEach(network => {
    network.tokens.forEach(token => {
      if (token.category === category) {
        results.push(token);
      }
    });
  });
  
  return results;
}

/**
 * 获取所有支持的网络
 * @returns 网络列表
 */
export function getSupportedNetworks(): { chainId: number; chainName: string }[] {
  return NETWORK_TOKENS.map(network => ({
    chainId: network.chainId,
    chainName: network.chainName
  }));
}