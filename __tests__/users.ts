import originalAxios, { AxiosError } from 'axios';
import omit from 'lodash/omit';
import { getApiUrl } from '../lib/sharedUtils';
import usersFixture from './fixtures/users';
import { encrypt } from '../lib/secure';
import { objection } from '../lib/init';
import { getLoginCookie } from './fixtures/utils';

describe('users', () => {
  const baseURL = process.env.BASE_URL;
  const axios = originalAxios.create({ baseURL });
  const { User } = objection;
  let loginHeader;

  beforeAll(async () => {
    const [admin] = usersFixture;
    await User.query().delete();
    await User.query().insert(admin as any);
    const loginCookie = await getLoginCookie(axios, getApiUrl);
    loginHeader = { headers: { Cookie: loginCookie } };
  });

  beforeEach(async () => {
    await objection.User.query().delete();
    await objection.User.query().insertGraph(usersFixture as any);
  });

  it('GET /users', async () => {
    const expectedUsers = usersFixture.map(user => omit(user, 'password'));
    const res = await axios.get(getApiUrl('users'));
    expect(res.status).toBe(200);
    expect(res.data).toMatchObject(expectedUsers);
  });

  it('POST /users without admin rights', async () => {
    expect.assertions(1);
    try {
      await axios.post(getApiUrl('users'), { vasa: 'eto boroda' });
    } catch (e) {
      expect((e as AxiosError).response?.status).toBe(403);
    }
  });

  it('POST /users', async () => {
    const user = {
      name: 'boris',
      role: 'admin',
      email: 'boris@yandex.ru',
      password: '1',
    };

    const res = await axios.post(getApiUrl('users'), user, loginHeader);

    const userFromDb = await User.query().findOne('name', user.name);
    const expectedUser = {
      ...omit(user, 'password'),
      password_digest: encrypt(user.password),
    };

    expect(res.status).toBe(201);
    expect(userFromDb).toMatchObject(expectedUser);
  });

  it('POST /users (unique email)', async () => {
    expect.assertions(1);
    try {
      const user = omit(usersFixture[0], 'id');
      const res = await axios.post(getApiUrl('users'), user, loginHeader);
    } catch (e) {
      expect((e as AxiosError).response?.status).toBe(400);
    }
  });

  it('PUT /users/:id', async () => {
    const user = {
      ...usersFixture[0],
      role: 'guest',
    };
    const res = await axios.put(getApiUrl('user', { id: user.id }), user, loginHeader);

    const userFromDb = await User.query().findOne('name', user.name);
    const expectedUser = omit(user, 'password');
    expect(res.status).toBe(201);
    expect(userFromDb).toMatchObject(expectedUser);
  });

  it('DELETE /users/:id', async () => {
    const [user] = usersFixture;
    const res = await axios.delete(getApiUrl('user', { id: user.id }), loginHeader);

    const userFromDb = await User.query().findById(user.id);
    expect(res.status).toBe(201);
    expect(userFromDb).toBeFalsy();
  });
});
