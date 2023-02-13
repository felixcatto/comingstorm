import { spawn } from 'child_process';
import { deleteAsync } from 'del';
import dotenv from 'dotenv';
import gulp from 'gulp';
import path from 'path';
import { fileURLToPath } from 'url';
import waitOn from 'wait-on';
import webpack from 'webpack';
import webpackConfig from './webpack.config.js';

const __dirname = fileURLToPath(path.dirname(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env.development') });

const { series, parallel } = gulp;

let server;
let isWaitonListening = false;
const startServer = async () => {
  server = spawn('node', ['dist/services/webSocketServer/bin.js'], { stdio: 'inherit' });

  if (!isWaitonListening) {
    isWaitonListening = true;
    await waitOn({
      resources: [`http-get://localhost:${process.env.WSS_PORT}`],
      delay: 500,
      interval: 1000,
      validateStatus: status => status !== 503,
    });
    isWaitonListening = false;
  }
};

const restartServer = async () => {
  server.kill();
  await startServer();
};
process.on('exit', () => server && server.kill());

const compiler = webpack(webpackConfig);
compiler.hooks.done.tap('done', async () => {
  if (server) {
    console.log(`[${new Date().toTimeString().slice(0, 8)}] Starting 'startServer'...`);
    const start = performance.now();
    await restartServer();
    const end = performance.now();
    const time = Math.round((Math.round(end - start) / 1000) * 100) / 100;
    console.log(`[${new Date().toTimeString().slice(0, 8)}] Finished 'startServer' after ${time}s`);
  }
});
const startWebpack = done => compiler.watch({}, done);

const clean = async () => deleteAsync(['dist']);

const startWsServer = series(clean, startWebpack, startServer);

export { startWsServer };
