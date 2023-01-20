const { omit } = require('lodash');
const encrypt = require('../lib/secure.ts').default;
const users = require('../__tests__/fixtures/users').default;

exports.seed = async knex => {
  const newUsers = users
    .map(user => ({ ...user, password_digest: encrypt(user.password) }))
    .map(user => omit(user, 'password'));
  await knex('users').delete();
  await knex('users').insert(newUsers);
};
