const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');

module.exports = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: './src/main/main.js',
  // Put your normal webpack config below here
  module: {
    rules: require('./webpack.rules'),
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.join(__dirname, 'src', 'assets'), // 开发目录
          to: path.join(__dirname, '.webpack', 'main', 'assets'), // 打包输出目录
        },
      ],
    }),
    // 根据环境变量决定是否启用分析器
    // ...(process.env.BUNDLE_ANALYZER === 'true' ? [new BundleAnalyzerPlugin({})] : [])
  ].filter(Boolean),
};
