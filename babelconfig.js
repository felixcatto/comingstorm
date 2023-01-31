module.exports = {
  server: {
    presets: [
      [
        '@babel/env',
        {
          targets: {
            node: true,
          },
        },
      ],
      '@babel/preset-typescript',
    ],
  },
};
