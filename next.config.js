import bundleAnalyzer from '@next/bundle-analyzer';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  webpack: (config, { webpack }) => {
    // allow import ".js" files in next app, which are required with "type: module"
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js'],
    };

    // disable react devtools warning
    config.plugins = [
      ...config.plugins,
      new webpack.DefinePlugin({ __REACT_DEVTOOLS_GLOBAL_HOOK__: '({ isDisabled: true })' }),
    ];
    return config;
  },
};

const config = process.env.ANALYZE ? bundleAnalyzer({ enabled: true })(nextConfig) : nextConfig;

export default config;
