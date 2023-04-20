import withBundleAnalyzer from '@next/bundle-analyzer';
import { withSentryConfig } from '@sentry/nextjs';

const isProduction = process.env.NODE_ENV === 'production';

/** @type {import('next').NextConfig} */
const nextConfigCommon = {
  reactStrictMode: false,
  webpack: (config, { webpack }) => {
    // allow import ".jsx?" files in next app, which are required with "type: module"
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js'],
      '.jsx': ['.ts', '.tsx', '.js'],
    };

    if (isProduction) {
      // reduce Sentry bundle size by 15%
      config.plugins = config.plugins.concat(new webpack.DefinePlugin({ __SENTRY_DEBUG__: false }));
    }

    return config;
  },
};

let config = nextConfigCommon;

if (isProduction) {
  const sentryWebpackPluginOptions = {
    // Additional config options for the Sentry Webpack plugin. Keep in mind that
    // the following options are set automatically, and overriding them is not
    // recommended:
    //   release, url, org, project, authToken, configFile, stripPrefix,
    //   urlPrefix, include, ignore
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options.

    silent: true, // Suppresses all logs
  };

  nextConfigCommon.sentry = { hideSourceMaps: true };
  const prodConfig = withSentryConfig(nextConfigCommon, sentryWebpackPluginOptions);
  config = process.env.ANALYZE ? withBundleAnalyzer({ enabled: true })(prodConfig) : prodConfig;
}

export default config;
