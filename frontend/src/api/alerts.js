import client from './client';

export const alertsApi = {
  getAlerts: () => client.get('/alerts/'),
  
  createAlert: (alertData) => client.post('/alerts/', alertData),
  
  deleteAlert: (alertId) => client.delete(`/alerts/${alertId}`),
  
  checkAlerts: () => client.post('/alerts/check')
};

export default alertsApi;
