import path from 'path';
import { spawn } from 'child_process';
import { deleteAsync } from 'del';
import dotenv from 'dotenv';
import gulp from 'gulp';
import waitOn from 'wait-on';
import { dirname } from './lib/devUtils.js';
import babel from 'gulp-babel';
import babelConfig from './babelconfig.js';

const __dirname = dirname(import.meta.url);
dotenv.config({ path: path.resolve(__dirname, '.env.development') });

const { series, parallel } = gulp;

const paths = {
  serverJs: {
    src: ['services/webSocketServer/**', 'lib/utils.ts', 'lib/sharedUtils.ts', 'lib/avatars.js'],
    dest: 'dist',
  },
};

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

const clean = async () => deleteAsync(['dist']);

const transpileServerJs = () =>
  gulp
    .src(paths.serverJs.src, { base: '.', since: gulp.lastRun(transpileServerJs) })
    .pipe(babel(babelConfig.server))
    .pipe(gulp.dest(paths.serverJs.dest));

const trackChangesInDist = () => {
  const watcher = gulp.watch('dist/**/*');
  watcher
    .on('add', pathname => console.log(`File ${pathname} was added`))
    .on('change', pathname => console.log(`File ${pathname} was changed`))
    .on('unlink', pathname => console.log(`File ${pathname} was removed`));
};

const watch = async () => {
  gulp.watch(paths.serverJs.src, series(transpileServerJs, restartServer));
  trackChangesInDist();
};

const startWsServer = series(clean, transpileServerJs, startServer, watch);

export { startWsServer };
