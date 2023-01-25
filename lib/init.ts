import knexConnect from 'knex';
import { Model } from 'objection';
import makeKeygrip from 'keygrip';
import knexConfig from '../knexfile';
import * as models from '../models';

const keys = ['heavy rain', 'hedgehog'];
const keygrip = makeKeygrip(keys);

const mode = process.env.NODE_ENV || 'development';

const knex = knexConnect(knexConfig[mode]);
Model.knex(knex);
const objection = { ...models, knex };

export { objection, keygrip, keys };
