import { spawn } from 'child_process';
import { deleteAsync } from 'del';
import dotenv from 'dotenv';
import gulp from 'gulp';
import swc from 'gulp-swc';
import path from 'path';
import waitOn from 'wait-on';
import webpack from 'webpack';
import { dirname } from './lib/devUtils.js';
import webpackConfig from './webpack.config.js';

const __dirname = dirname(import.meta.url);
dotenv.config({ path: path.resolve(__dirname, '.env.development') });

const { series } = gulp;

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

const compiler = webpack(webpackConfig);
const makeCssModulesTypings = done => compiler.watch({}, () => done());

const transpileServerJs = () =>
  gulp
    .src(paths.serverJs.src, { base: '.', since: gulp.lastRun(transpileServerJs) })
    .pipe(swc({ jsc: { target: 'es2022' } }))
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

export { startWsServer, makeCssModulesTypings };
