const tags = require('../__tests__/fixtures/tags').default;

exports.seed = async knex => {
  await knex('tags').delete();
  await knex('tags').insert(tags);
};
