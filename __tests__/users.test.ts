import originalAxios, { AxiosError } from 'axios';
import { omit } from 'lodash-es';
import { getApiUrl, getUrl } from '../lib/utils.js';
import usersFixture from './fixtures/users.js';
import { encrypt } from '../lib/secure.js';
import { objection } from '../lib/init.js';
import { getLoginCookie } from './fixtures/utils.js';
import avatarsFixture from './fixtures/avatars.js';

describe('users', () => {
  const baseURL = process.env.HTTP_SERVER_URL;
  const axios = originalAxios.create({ baseURL });
  const { User, Avatar } = objection;
  let loginOptions;

  beforeAll(async () => {
    const [admin] = usersFixture;
    await Avatar.query().delete();
    await Avatar.query().insertGraph(avatarsFixture);
    await User.query().delete();
    await User.query().insert(admin as any);
    const loginCookie = await getLoginCookie(axios, getApiUrl);
    loginOptions = { headers: { Cookie: loginCookie } };
  });

  beforeEach(async () => {
    await User.query().delete();
    await User.query().insertGraph(usersFixture as any);
  });

  it('GET /users', async () => {
    const res = await axios.get(getUrl('users'));
    expect(res.status).toBe(200);
  });

  it('GET /api/users/:id/edit', async () => {
    const [user] = usersFixture;
    const res = await axios.get(getApiUrl('user', { id: user.id }));
    expect(res.status).toBe(200);
    expect(res.data).toMatchObject(omit(user, 'password'));
  });

  it('POST /api/users without admin rights', async () => {
    expect.assertions(1);
    try {
      await axios.post(getApiUrl('users'), { vasa: 'eto boroda' });
    } catch (e) {
      expect((e as AxiosError).response?.status).toBe(403);
    }
  });

  it('POST /api/users', async () => {
    const user = {
      name: 'boris',
      role: 'admin',
      email: 'boris@yandex.ru',
      password: '1',
    };

    const res = await axios.post(getApiUrl('users'), user, loginOptions);

    const userFromDb = await User.query().findOne('name', user.name);
    const expectedUser = {
      ...omit(user, 'password'),
      password_digest: encrypt(user.password),
    };

    expect(res.status).toBe(201);
    expect(userFromDb).toMatchObject(expectedUser);
  });

  it('POST /api/users (unique email)', async () => {
    expect.assertions(1);
    try {
      const user = omit(usersFixture[0], 'id');
      const res = await axios.post(getApiUrl('users'), user, loginOptions);
    } catch (e) {
      expect((e as AxiosError).response?.status).toBe(400);
    }
  });

  it('PUT /api/users/:id', async () => {
    const user = {
      ...usersFixture[0],
      role: 'guest',
    };
    const res = await axios.put(getApiUrl('user', { id: user.id }), user, loginOptions);

    const userFromDb = await User.query().findOne('name', user.name);
    const expectedUser = omit(user, 'password');
    expect(res.status).toBe(201);
    expect(userFromDb).toMatchObject(expectedUser);
  });

  it('DELETE /api/users/:id', async () => {
    const [user] = usersFixture;
    const res = await axios.delete(getApiUrl('user', { id: user.id }), loginOptions);

    const userFromDb = await User.query().findById(user.id);
    expect(res.status).toBe(201);
    expect(userFromDb).toBeFalsy();
  });

  afterAll(async () => {
    await objection.knex.destroy();
  });
});
