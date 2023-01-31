import usersFixture from './users';
import { AxiosInstance } from 'axios';
import { IGetApiUrl } from '../../lib/sharedUtils';
import cookie from 'cookie';

export const getLoginCookie = async (axios: AxiosInstance, getApiUrl: IGetApiUrl) => {
  const [admin] = usersFixture;
  const res = await axios.post(getApiUrl('session'), admin);

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
