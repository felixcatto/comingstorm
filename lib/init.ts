import knexConnect from 'knex';
import { Model } from 'objection';
import makeKeygrip from 'keygrip';
import knexConfig from '../knexfile';
import * as models from '../models';

if (!process.env.INODE_ENV) {
  console.warn('*** Using default NODE_ENV for configuring database connection ***');
}

const mode = process.env.INODE_ENV || process.env.NODE_ENV;
export const keys = ['heavy rain', 'hedgehog'];
export const keygrip = makeKeygrip(keys);

const knex = knexConnect(knexConfig[mode]);
Model.knex(knex);
export const objection = { ...models, knex };
export type IObjection = typeof objection;
