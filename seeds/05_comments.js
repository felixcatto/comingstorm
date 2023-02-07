const comments = require('../__tests__/fixtures/comments').default;

exports.seed = async knex => {
  await knex('comments').delete();
  await knex('comments').insert(comments);
};
