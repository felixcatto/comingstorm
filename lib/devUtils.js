import path from 'path';
import { fileURLToPath } from 'url';
import { globSync } from 'glob';

export const dirname = url => fileURLToPath(path.dirname(url));

export const getPagesPaths = () =>
  globSync('pages/**', {
    nodir: true,
    ignore: ['pages/api/**', 'pages/_*.tsx', 'pages/**/*.d.ts', 'pages/**/*.css'],
  });
