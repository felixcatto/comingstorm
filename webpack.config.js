import path from 'path';
import nodeExternals from 'webpack-node-externals';
import { dirname, getPagesPaths } from './lib/devUtils.js';

const __dirname = dirname(import.meta.url);

const config = {
  mode: 'development',
  devtool: false,
  target: 'node',
  externals: [nodeExternals()],
  entry: { index: getPagesPaths().map(el => path.resolve(__dirname, el)) },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    extensionAlias: { '.js': ['.ts', '.tsx', '.js'] },
  },
  module: {
    rules: [
      {
        test: /(\.js$|\.ts$|\.tsx)/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: { presets: ['@babel/preset-react', '@babel/preset-typescript'] },
        },
      },
      {
        test: /\.css$/,
        use: [
          { loader: 'css-modules-typescript-loader' },
          {
            loader: 'css-loader',
            options: { url: false, modules: { auto: true } },
          },
          { loader: 'postcss-loader' },
        ],
      },
    ],
  },
  stats: { warnings: false, children: false, modules: false },
};

export default config;
