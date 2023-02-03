const articles = require('../__tests__/fixtures/articles').default;

exports.seed = async knex => {
  await knex('articles').delete();
  await knex('articles').insert(articles);
};
