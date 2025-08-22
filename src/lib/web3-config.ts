import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, sepolia, polygon, optimism, arbitrum, base } from 'wagmi/chains';

/**
 * Web3配置
 * 配置支持的区块链网络和钱包连接
 */
export const config = getDefaultConfig({
  appName: 'DApp Token Info',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'your-project-id',
  chains: [
    mainnet,
    sepolia,
    polygon,
    optimism,
    arbitrum,
    base,
  ],
  ssr: true, // 如果你的dApp使用服务端渲染（SSR）
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