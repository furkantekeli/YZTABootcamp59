import client from './client';

export const authApi = {
  login: (email, password) =>
    client.post('/auth/login', { email, password }),

  register: (data) =>
    client.post('/auth/register', data),

  getMe: () =>
    client.get('/auth/me'),

  refreshToken: () =>
    client.post('/auth/refresh'),

  changePassword: (data) =>
    client.put('/auth/change-password', data),
};

export default authApi;
