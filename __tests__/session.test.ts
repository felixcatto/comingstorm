import originalAxios, { AxiosError } from 'axios';
import { getApiUrl } from '../lib/sharedUtils';
import usersFixture from './fixtures/users';
import { encrypt } from '../lib/secure';
import { objection } from '../lib/init';
import { getLoginCookie } from './fixtures/utils';
import cookie from 'cookie';

describe('session', () => {
  const baseURL = process.env.BASE_URL;
  const axios = originalAxios.create({ baseURL });
  const { User } = objection;

  beforeEach(async () => {
    await User.query().delete();
    await User.query().insertGraph(usersFixture as any);
  });

  it('POST /session', async () => {
    const loginCookie = await getLoginCookie(axios, getApiUrl);
    expect(loginCookie).toEqual(expect.any(String));
  });

  it('DELETE /session', async () => {
    const [user] = usersFixture;
    const res = await axios.delete(getApiUrl('session'));
    const rawCookies = res.headers['set-cookie'];
    if (!rawCookies) throw new Error('no cookies');

    const cookies = rawCookies.map(el => cookie.parse(el));
    const hasLoginCookies =
      cookies.find(el => el.hasOwnProperty('userId')) &&
      cookies.find(el => el.hasOwnProperty('userIdSig'));

    expect(res.status).toBe(201);
    expect(hasLoginCookies).toBeTruthy();
  });

  afterAll(async () => {
    await objection.knex.destroy();
  });
});
