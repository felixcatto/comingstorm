const avatars = require('../__tests__/fixtures/avatars').default;

exports.seed = async knex => {
  await knex('avatars').delete();
  await knex('avatars').insert(avatars);
};
