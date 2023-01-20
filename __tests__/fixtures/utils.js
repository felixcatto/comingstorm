import usersFixture from './users';

export const getLoginCookie = async (server, getApiUrl) => {
  const [admin] = usersFixture;
  const response = await server.inject({
    method: 'post',
    url: getApiUrl('session'),
    payload: admin,
  });

  const [cookie] = response.cookies;
  return { [cookie.name]: cookie.value };
};
