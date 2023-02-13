import originalAxios, { AxiosError } from 'axios';
import { objection } from '../lib/init';
import { getApiUrl } from '../lib/sharedUtils';
import articlesFixture from './fixtures/articles';
import commentsFixture from './fixtures/comments';
import usersFixture from './fixtures/users';
import { getLoginOptions } from './fixtures/utils';

describe('articles', () => {
  const baseURL = process.env.HTTP_SERVER_URL;
  const axios = originalAxios.create({ baseURL });
  const { User, Comment, Article, knex } = objection;
  let loginOptions;

  beforeAll(async () => {
    await User.query().delete();
    await Article.query().delete();
    await User.query().insertGraph(usersFixture as any);
    await Article.query().insertGraph(articlesFixture as any);
    loginOptions = await getLoginOptions(axios, getApiUrl);
  });

  beforeEach(async () => {
    await Comment.query().delete();
    await Comment.query().insertGraph(commentsFixture);
  });

  it('GET /api/articles/:id/comments/:id', async () => {
    const [comment] = commentsFixture;
    const res = await axios.get(
      getApiUrl('comment', { id: comment.article_id, commentId: comment.id })
    );
    const commentFromDb = await Comment.query().findById(comment.id);
    expect(res.status).toBe(200);
    expect(commentFromDb).toMatchObject(comment);
  });

  it('POST /api/articles/:id/comments', async () => {
    const comment = {
      guest_name: 'guest_name',
      text: 'text',
    };
    const articleId = -1;
    const res = await axios.post(getApiUrl('comments', { id: articleId }), comment);
    const commentFromDb = await Comment.query()
      .findOne('guest_name', comment.guest_name)
      .withGraphFetched('article');

    expect(res.status).toBe(201);
    expect(commentFromDb).toMatchObject(comment);
    expect(commentFromDb?.article?.id).toBe(articleId);
  });

  it('PUT /api/articles/:id/comments/:id - comment does not belong to user', async () => {
    expect.assertions(1);
    const vasaComment = {
      ...commentsFixture[0],
      text: '(edited)',
    };
    const [, tomUser] = usersFixture;
    const tomLoginOptions = await getLoginOptions(axios, getApiUrl, tomUser);
    try {
      const res = await axios.put(
        getApiUrl('comment', { id: vasaComment.article_id, commentId: vasaComment.id }),
        vasaComment,
        tomLoginOptions
      );
    } catch (e) {
      expect((e as AxiosError).response?.status).toBe(403);
    }
  });

  it('PUT /api/articles/:id/comments/:commentId', async () => {
    const comment = {
      ...commentsFixture[0],
      text: '(edited)',
    };
    const res = await axios.put(
      getApiUrl('comment', { id: comment.article_id, commentId: comment.id }),
      comment,
      loginOptions
    );

    const commentFromDb = await Comment.query().findById(comment.id);
    expect(res.status).toBe(201);
    expect(commentFromDb).toMatchObject(comment);
  });

  it('DELETE /api/articles/:id/comments/:id - comment does not belong to user', async () => {
    expect.assertions(1);
    const [vasaComment] = commentsFixture;
    const [, tomUser] = usersFixture;
    const tomLoginOptions = await getLoginOptions(axios, getApiUrl, tomUser);
    try {
      const res = await axios.delete(
        getApiUrl('comment', { id: vasaComment.article_id, commentId: vasaComment.id }),
        tomLoginOptions
      );
    } catch (e) {
      expect((e as AxiosError).response?.status).toBe(403);
    }
  });

  it('DELETE /api/articles/:id/comments/:id', async () => {
    const [comment] = commentsFixture;
    const res = await axios.delete(
      getApiUrl('comment', { id: comment.article_id, commentId: comment.id }),
      loginOptions
    );

    const commentFromDb = await Comment.query().findById(comment.id);
    expect(res.status).toBe(201);
    expect(commentFromDb).toBeFalsy();
  });

  afterAll(async () => {
    await objection.knex.destroy();
  });
});
