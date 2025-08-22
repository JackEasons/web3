'use client';

import { useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { Search, AlertCircle, Coins, Loader2 } from 'lucide-react';
import { erc20Abi, type TokenInfo } from '@/lib/web3-config';
import { formatTokenAmount } from '@/lib/utils';
import { isAddress } from 'viem';

/**
 * 代币查询组件
 * 提供代币合约地址输入和信息查询功能
 */
export function TokenQuery() {
  const { isConnected } = useAccount();
  const [contractAddress, setContractAddress] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const [queryAddress, setQueryAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 查询代币符号
  const {
    data: symbol,
    isLoading: symbolLoading,
    error: symbolError,
  } = useReadContract({
    address: queryAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: 'symbol',
    query: {
      enabled: !!queryAddress && isAddress(queryAddress),
    },
  });

  // 查询代币总供应量
  const {
    data: totalSupply,
    isLoading: totalSupplyLoading,
    error: totalSupplyError,
  } = useReadContract({
    address: queryAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: 'totalSupply',
    query: {
      enabled: !!queryAddress && isAddress(queryAddress),
    },
  });

  // 查询代币小数位数
  const {
    data: decimals,
    isLoading: decimalsLoading,
    error: decimalsError,
  } = useReadContract({
    address: queryAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: 'decimals',
    query: {
      enabled: !!queryAddress && isAddress(queryAddress),
    },
  });

  // 查询代币名称（可选）
  const {
    data: name,
    isLoading: nameLoading,
  } = useReadContract({
    address: queryAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: 'name',
    query: {
      enabled: !!queryAddress && isAddress(queryAddress),
    },
  });

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
   * 处理回车键查询
   */
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleQuery();
    }
  };

  // 检查是否有任何加载状态
  const isLoading = symbolLoading || totalSupplyLoading || decimalsLoading || nameLoading || isQuerying;
  
  // 检查是否有任何错误
  const hasContractError = symbolError || totalSupplyError || decimalsError;
  
  // 检查是否有完整的代币信息
  const hasTokenInfo = symbol && totalSupply !== undefined && decimals !== undefined;

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
          <div className="flex gap-4">
            <input
              id="contract-address"
              type="text"
              value={contractAddress}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="0x..."
              className="flex-1 px-6 py-4 terminal-style neon-border-cyan rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all duration-300 font-mono text-lg neon-text-cyan placeholder-gray-500 hover:bg-cyan-400/5 scan-line"
              disabled={isLoading}
            />
            <button
              onClick={handleQuery}
              disabled={isLoading || !contractAddress.trim()}
              className="neon-button font-bold py-4 px-8 rounded-xl flex items-center gap-3 min-w-[140px] justify-center transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none animate-neon-purple-glow"
            >
              {isLoading ? (
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
          
          {isLoading ? (
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
              {/* 代币符号 */}
              <div className="cyberpunk-card rounded-xl p-6 neon-border-cyan group scan-line">
                <div className="text-sm neon-text-cyan mb-2 font-medium terminal-style">代币符号</div>
                <div className="text-2xl font-bold neon-text-cyan group-hover:animate-neon-glow transition-all duration-300">{symbol}</div>
              </div>

              {/* 代币名称 */}
              {name && (
                <div className="cyberpunk-card rounded-xl p-6 neon-border-purple group scan-line">
                  <div className="text-sm neon-text-purple mb-2 font-medium terminal-style">代币名称</div>
                  <div className="text-2xl font-bold neon-text-purple group-hover:animate-neon-purple-glow transition-all duration-300">{name}</div>
                </div>
              )}

              {/* 小数位数 */}
              <div className="cyberpunk-card rounded-xl p-6 neon-border-green group scan-line">
                <div className="text-sm neon-text-green mb-2 font-medium terminal-style">小数位数</div>
                <div className="text-2xl font-bold neon-text-green group-hover:animate-neon-green-glow transition-all duration-300">{decimals?.toString()}</div>
              </div>

              {/* 总供应量 */}
              <div className="cyberpunk-card rounded-xl p-6 neon-border-pink md:col-span-2 lg:col-span-3 group scan-line animate-neon-border">
                <div className="text-sm neon-text-pink mb-3 font-medium flex items-center gap-2 terminal-style">
                  <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse"></div>
                  总供应量
                </div>
                <div className="text-xl font-bold neon-text-pink font-mono break-all terminal-style p-4 rounded-lg group-hover:animate-neon-pink-glow transition-all duration-300">
                  {formatTokenAmount(totalSupply!, decimals!)} {symbol}
                </div>
                <div className="text-sm neon-text-green mt-3 font-mono terminal-style p-2 rounded">
                  原始值: {totalSupply?.toString()}
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
    </div>
  );
}