import originalAxios from 'axios';
import { objection } from '../lib/init';
import { getApiUrl, getUrl } from '../lib/sharedUtils';
import tagsFixture from './fixtures/tags';
import usersFixture from './fixtures/users';
import { getLoginCookie } from './fixtures/utils';

describe('tags', () => {
  const baseURL = process.env.BASE_URL;
  const axios = originalAxios.create({ baseURL });
  const { User, Tag } = objection;
  let loginOptions;

  beforeAll(async () => {
    await User.query().delete();
    await User.query().insertGraph(usersFixture as any);
    const loginCookie = await getLoginCookie(axios, getApiUrl);
    loginOptions = { headers: { Cookie: loginCookie } };
  });

  beforeEach(async () => {
    await Tag.query().delete();
    await Tag.query().insertGraph(tagsFixture as any);
  });

  it('GET /tags', async () => {
    const res = await axios.get(getUrl('tags'));
    expect(res.status).toBe(200);
  });

  it('GET /tags/:id/edit', async () => {
    const [tag] = tagsFixture;
    const res = await axios.get(getUrl('editTag', { id: tag.id }));
    expect(res.status).toBe(200);
  });

  it('GET /api/tags', async () => {
    const res = await axios.get(getApiUrl('tags'));
    const tagsFromDb = await Tag.query();
    expect(res.status).toBe(200);
    expect(tagsFromDb).toMatchObject(res.data);
  });

  it('GET /api/tags/:id/edit', async () => {
    const [tag] = tagsFixture;
    const res = await axios.get(getApiUrl('tag', { id: tag.id }));
    expect(res.status).toBe(200);
    expect(res.data).toMatchObject(tag);
  });

  it('POST /api/tags', async () => {
    const tag = { name: 'test' };
    const res = await axios.post(getApiUrl('tags'), tag, loginOptions);
    const tagFromDb = await Tag.query().findOne('name', tag.name);
    expect(res.status).toBe(201);
    expect(tagFromDb).toMatchObject(tag);
  });

  it('PUT /api/tags/:id', async () => {
    const tag = {
      ...tagsFixture[0],
      name: '(edited)',
    };
    const res = await axios.put(getApiUrl('tag', { id: tag.id }), tag, loginOptions);
    const tagFromDb = await Tag.query().findById(tag.id);
    expect(res.status).toBe(201);
    expect(tagFromDb).toMatchObject(tag);
  });

  it('DELETE /api/tags/:id', async () => {
    const [tag] = tagsFixture;
    const res = await axios.delete(getApiUrl('tag', { id: tag.id }), loginOptions);
    const tagFromDb = await Tag.query().findById(tag.id);
    expect(res.status).toBe(201);
    expect(tagFromDb).toBeFalsy();
  });

  afterAll(async () => {
    await objection.knex.destroy();
  });
});