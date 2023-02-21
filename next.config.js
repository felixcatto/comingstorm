const bundleAnalyzer = require('@next/bundle-analyzer');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  webpack: (config, { webpack }) => {
    config.plugins = [
      ...config.plugins,
      new webpack.DefinePlugin({ __REACT_DEVTOOLS_GLOBAL_HOOK__: '({ isDisabled: true })' }),
    ];
    return config;
  },
};

if (process.env.ANALYZE) {
  module.exports = bundleAnalyzer({ enabled: true })(nextConfig);
} else {
  module.exports = nextConfig;
}
