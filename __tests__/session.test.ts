import originalAxios from 'axios';
import cookie from 'cookie';
import { keygrip, objection } from '../lib/init';
import { getApiUrl } from '../lib/sharedUtils';
import { makeSignature } from '../lib/utils';
import usersFixture from './fixtures/users';
import { getLoginCookie, getLoginOptions } from './fixtures/utils';

describe('session', () => {
  const baseURL = process.env.HTTP_SERVER_URL;
  const axios = originalAxios.create({ baseURL });
  const { User } = objection;

  beforeEach(async () => {
    await User.query().delete();
    await User.query().insertGraph(usersFixture as any);
  });

  it('GET /api/session', async () => {
    const [admin] = usersFixture;
    const loginOptions = await getLoginOptions(axios, getApiUrl);
    const res = await axios.get(getApiUrl('session'), loginOptions);
    const cookieName = 'userId';
    const cookieValue = admin.id;
    const signature = makeSignature(keygrip, cookieName, cookieValue);
    expect(res.data).toMatchObject({ cookieName, cookieValue, signature });
  });

  it('POST /api/session', async () => {
    const loginCookie = await getLoginCookie(axios, getApiUrl);
    expect(loginCookie).toEqual(expect.any(String));
  });

  it('DELETE /api/session', async () => {
    const [user] = usersFixture;
    const loginOptions = await getLoginOptions(axios, getApiUrl);
    const res = await axios.delete(getApiUrl('session'), loginOptions);
    const rawCookies = res.headers['set-cookie'];
    if (!rawCookies) throw new Error('no cookies');

    const cookies = rawCookies.map(el => cookie.parse(el));
    const hasLoginCookies =
      cookies.find(el => el.hasOwnProperty('userId')) &&
      cookies.find(el => el.hasOwnProperty('userIdSig'));

    expect(res.status).toBe(201);
    expect(hasLoginCookies).toBeTruthy();
    expect(res.data.signOutUserId).toEqual(user.id);
  });

  afterAll(async () => {
    await objection.knex.destroy();
  });
});
