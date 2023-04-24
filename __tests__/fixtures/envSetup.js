import * as dotenv from 'dotenv';
dotenv.config({ path: `.env.test` });

global.ResizeObserver = function () {
  return {
    observe: () => {},
    unobserve: () => {},
    disconnect: () => {},
  };
};
