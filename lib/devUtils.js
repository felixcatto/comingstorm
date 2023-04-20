import dotenv from 'dotenv';
import { globSync } from 'glob';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'node:fs';

export const dirname = url => fileURLToPath(path.dirname(url));

export const getPagesPaths = () =>
  globSync('pages/**', {
    nodir: true,
    ignore: ['pages/api/**', 'pages/_*.tsx', 'pages/**/*.d.ts', 'pages/**/*.css'],
  });

  export const loadEnv = () => {
    const mode = process.env.NODE_ENV || 'development';
    const __dirname = fileURLToPath(path.dirname(import.meta.url));
    const envLocalFilePath = path.resolve(__dirname, `../.env.local`);
    const envModeFilePath = path.resolve(__dirname, `../.env.${mode}`);
    const isEnvLocalFileExists = existsSync(envLocalFilePath);
    const isEnvModeFileExists = existsSync(envModeFilePath);

    if (isEnvLocalFileExists) {
      console.log(`Loaded env from ${envLocalFilePath}`);
      dotenv.config({ path: envLocalFilePath });
    }

    if (isEnvModeFileExists) {
      console.log(`Loaded env from ${envModeFilePath}`);
      dotenv.config({ path: envModeFilePath });
    }

    if (!isEnvLocalFileExists && !isEnvModeFileExists) {
      console.log(`No env files found :(`);
    }
  };
