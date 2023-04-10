import dotenv from 'dotenv';
import { globSync } from 'glob';
import path from 'path';
import { fileURLToPath } from 'url';

export const dirname = url => fileURLToPath(path.dirname(url));

export const getPagesPaths = () =>
  globSync('pages/**', {
    nodir: true,
    ignore: ['pages/api/**', 'pages/_*.tsx', 'pages/**/*.d.ts', 'pages/**/*.css'],
  });

export const loadEnv = () => {
  const mode = process.env.NODE_ENV || 'development';
  const __dirname = fileURLToPath(path.dirname(import.meta.url));
  const envFilePath = path.resolve(__dirname, `../.env.${mode}`);

  console.log(`Loaded env from ${envFilePath}`);
  dotenv.config({ path: envFilePath });
};
