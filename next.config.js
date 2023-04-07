import bundleAnalyzer from '@next/bundle-analyzer';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  webpack: config => {
    // allow import ".jsx?" files in next app, which are required with "type: module"
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js'],
      '.jsx': ['.ts', '.tsx', '.js'],
    };
    return config;
  },
};

const config = process.env.ANALYZE ? bundleAnalyzer({ enabled: true })(nextConfig) : nextConfig;

export default config;
