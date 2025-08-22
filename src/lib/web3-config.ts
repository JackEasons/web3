import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { createConfig, http } from 'wagmi';
import { 
  mainnet, 
  sepolia, 
  polygon, 
  optimism, 
  arbitrum, 
  base,
  bsc,
  avalanche,
  fantom,
  polygonMumbai,
  goerli,
  arbitrumGoerli,
  optimismGoerli
} from 'wagmi/chains';
import { walletConnect, injected, coinbaseWallet, metaMask } from 'wagmi/connectors';

/**
 * Web3配置
 * 配置支持的区块链网络和钱包连接
 */
// 主网配置
export const mainnetChains = [
  mainnet,
  polygon,
  optimism,
  arbitrum,
  base,
  bsc,
  avalanche,
  fantom,
];

// 测试网配置
export const testnetChains = [
  sepolia,
  goerli,
  polygonMumbai,
  arbitrumGoerli,
  optimismGoerli,
];

// 所有支持的链
export const allChains = [...mainnetChains, ...testnetChains];



/**
 * Web3配置
 * 根据环境变量决定是否包含测试网，并确保SSR兼容性
 */
const chains = process.env.NODE_ENV === 'development' ? allChains : mainnetChains;

export const config = createConfig({
  chains: chains as any,
  connectors: [
    injected(),
    metaMask(),
    coinbaseWallet({ appName: 'DApp Token Info' }),
    ...(typeof window !== 'undefined' ? [walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'your-project-id',
    })] : []),
  ],
  transports: Object.fromEntries(
    chains.map(chain => [chain.id, http()])
  ) as any,
  ssr: true,
});

/**
 * ERC-20标准ABI
 * 用于与代币合约交互
 */
export const erc20Abi = [
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

/**
 * 代币信息接口
 */
export interface TokenInfo {
  symbol: string;
  totalSupply: bigint;
  decimals: number;
  name?: string;
  contractAddress: string;
}

/**
 * 查询状态接口
 */
export interface QueryState {
  isLoading: boolean;
  error?: string;
  data?: TokenInfo;
}

/**
 * 链信息接口
 */
export interface ChainInfo {
  id: number;
  name: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: {
    default: {
      http: string[];
    };
  };
  blockExplorers: {
    default: {
      name: string;
      url: string;
    };
  };
  testnet?: boolean;
}

/**
 * 获取链信息
 */
export const getChainInfo = (chainId: number): ChainInfo | undefined => {
  const chain = allChains.find(c => c.id === chainId);
  return chain as ChainInfo | undefined;
};

/**
 * 获取链的区块浏览器URL
 */
export const getBlockExplorerUrl = (chainId: number, address: string): string => {
  const chain = getChainInfo(chainId);
  if (!chain) return '';
  
  return `${chain.blockExplorers.default.url}/address/${address}`;
};

/**
 * 检查是否为测试网
 */
export const isTestnet = (chainId: number): boolean => {
  return testnetChains.some(chain => chain.id === chainId);
};

/**
 * 获取链的原生代币符号
 */
export const getNativeTokenSymbol = (chainId: number): string => {
  const chain = getChainInfo(chainId);
  return chain?.nativeCurrency.symbol || 'ETH';
};

/**
 * 支持的网络映射
 */
export const SUPPORTED_CHAINS = {
  // 主网
  [mainnet.id]: 'Ethereum',
  [polygon.id]: 'Polygon',
  [optimism.id]: 'Optimism',
  [arbitrum.id]: 'Arbitrum',
  [base.id]: 'Base',
  [bsc.id]: 'BSC',
  [avalanche.id]: 'Avalanche',
  [fantom.id]: 'Fantom',
  // 测试网
  [sepolia.id]: 'Sepolia',
  [goerli.id]: 'Goerli',
  [polygonMumbai.id]: 'Mumbai',
  [arbitrumGoerli.id]: 'Arbitrum Goerli',
  [optimismGoerli.id]: 'Optimism Goerli',
} as const;

/**
 * 获取链名称
 */
export const getChainName = (chainId: number): string => {
  return SUPPORTED_CHAINS[chainId as keyof typeof SUPPORTED_CHAINS] || `Chain ${chainId}`;
};

/**
 * RPC端点配置
 */
export const RPC_URLS = {
  [mainnet.id]: ['https://eth.llamarpc.com', 'https://rpc.ankr.com/eth'],
  [polygon.id]: ['https://polygon.llamarpc.com', 'https://rpc.ankr.com/polygon'],
  [bsc.id]: ['https://bsc.llamarpc.com', 'https://rpc.ankr.com/bsc'],
  [avalanche.id]: ['https://avalanche.llamarpc.com', 'https://rpc.ankr.com/avalanche'],
  [fantom.id]: ['https://fantom.llamarpc.com', 'https://rpc.ankr.com/fantom'],
  [arbitrum.id]: ['https://arbitrum.llamarpc.com', 'https://rpc.ankr.com/arbitrum'],
  [optimism.id]: ['https://optimism.llamarpc.com', 'https://rpc.ankr.com/optimism'],
  [base.id]: ['https://base.llamarpc.com', 'https://rpc.ankr.com/base'],
} as const;