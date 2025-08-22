/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  // 启用实验性功能
  experimental: {
    // 启用优化的包导入
    optimizePackageImports: ['lucide-react'],
  },
  
  // Webpack配置
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // 忽略pino-pretty模块以避免警告
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'pino-pretty': false,
    };
    
    // 忽略可选依赖以减少警告
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^pino-pretty$/,
      })
    );
    
    // 生产环境优化
    if (!dev) {
      // 启用更激进的代码分割
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: -10,
            chunks: 'all',
          },
          // React相关库单独打包
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: 'react',
            priority: 20,
            chunks: 'all',
          },
          // Web3相关库单独打包
          web3: {
            test: /[\\/]node_modules[\\/](wagmi|viem|@rainbow-me)[\\/]/,
            name: 'web3',
            priority: 15,
            chunks: 'all',
          },
          // UI库单独打包
          ui: {
            test: /[\\/]node_modules[\\/](lucide-react|@tanstack)[\\/]/,
            name: 'ui',
            priority: 10,
            chunks: 'all',
          },
        },
      };
    }

    // Bundle分析配置
    if (process.env.BUNDLE_ANALYZE) {
      const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
      
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: true,
          reportFilename: isServer
            ? '../analyze/server.html'
            : './analyze/client.html',
        })
      );
    }

    // 配置文件监听选项以避免Watchpack错误
    if (dev) {
      config.watchOptions = {
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/System Volume Information/**',
          '**/D:/System Volume Information/**',
          '**/C:/System Volume Information/**',
          '**/$RECYCLE.BIN/**',
        ],
      };
    }

    return config;
  },
  
  // 编译器选项
  compiler: {
    // 生产环境移除console.log
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  
  // 性能优化
  poweredByHeader: false,
  compress: true,
  
  // 图片优化
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30天
  },
  
  // 输出配置
  output: 'standalone',
};

module.exports = withBundleAnalyzer(nextConfig);