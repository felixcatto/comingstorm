const messages = require('../__tests__/fixtures/messages').default;

exports.seed = async knex => {
  await knex('messages').delete();
  await knex('messages').insert(messages);
};
