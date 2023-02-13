const path = require('path');
const nodeExternals = require('webpack-node-externals');
const babelConfig = require('./babelconfig');

const isProduction = process.env.NODE_ENV === 'production';
const common = {
  target: 'node',
  externalsPresets: { node: true },
  externals: [nodeExternals()],
  devtool: 'eval-cheap-module-source-map',
  entry: {
    bin: path.resolve(__dirname, 'services/webSocketServer/bin.js'),
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist/services/webSocketServer'),
  },
  resolve: { extensions: ['.tsx', '.ts', '.js'] },
  module: {
    rules: [
      {
        test: /(\.js$|\.ts$|\.tsx)/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: babelConfig.server,
        },
      },
    ],
  },
  stats: { warnings: false, children: false, modules: false },
};

if (isProduction) {
  module.exports = { ...common, mode: 'production' };
} else {
  module.exports = { ...common, mode: 'development' };
}
