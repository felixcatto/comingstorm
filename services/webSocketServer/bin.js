import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { startServer } from './main.js';

const __dirname = fileURLToPath(path.dirname(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env.development') });

startServer();
