import usersFixture from './users';
import { AxiosInstance } from 'axios';
import { IGetApiUrl } from '../../lib/sharedUtils';
import cookie from 'cookie';

const [admin] = usersFixture;
export const getLoginCookie = async (axios: AxiosInstance, getApiUrl: IGetApiUrl, user = admin) => {
  const res = await axios.post(getApiUrl('session'), user);

  const rawCookies = res.headers['set-cookie'];
  if (!rawCookies) throw new Error('no cookies from server');

  const cookies = rawCookies.map(el => cookie.parse(el));
  const userIdValue = cookies.find(el => el.userId)?.userId;
  const userIdSigValue = cookies.find(el => el.userIdSig)?.userIdSig;
  if (!userIdValue || !userIdSigValue) throw new Error('no login cookies from server');

  const userIdCookie = cookie.serialize('userId', userIdValue);
  const userIdSigCookie = cookie.serialize('userIdSig', userIdSigValue);
  return `${userIdCookie}; ${userIdSigCookie}`;
};

export const getLoginOptions = async (
  axios: AxiosInstance,
  getApiUrl: IGetApiUrl,
  user = admin
) => {
  const loginCookie = await getLoginCookie(axios, getApiUrl, user);
  return { headers: { Cookie: loginCookie } };
};
