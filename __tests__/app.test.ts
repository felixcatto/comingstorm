import originalAxios, { AxiosError } from 'axios';
import { getUrl } from '../lib/sharedUtils';

describe('requests', () => {
  const baseURL = process.env.HTTP_SERVER_URL;
  const axios = originalAxios.create({ baseURL });

  it('GET 200', async () => {
    const res = await axios.get(getUrl('home'));
    expect(res.status).toBe(200);
  });
});
