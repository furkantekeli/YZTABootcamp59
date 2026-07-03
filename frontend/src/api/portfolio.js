import client from './client';

export const portfolioApi = {
  getPortfolios: () =>
    client.get('/portfolios'),

  createPortfolio: (data) =>
    client.post('/portfolios', data),

  getPortfolio: (id) =>
    client.get(`/portfolios/${id}`),

  updatePortfolio: (id, data) =>
    client.put(`/portfolios/${id}`, data),

  deletePortfolio: (id) =>
    client.delete(`/portfolios/${id}`),

  getPortfolioSummary: (id) =>
    client.get(`/portfolios/${id}/summary`),
};

export default portfolioApi;
