import client from './client';

export const transactionsApi = {
  getTransactions: (portfolioId, params = {}) =>
    client.get(`/portfolios/${portfolioId}/transactions`, { params }),

  addTransaction: (portfolioId, data) =>
    client.post(`/portfolios/${portfolioId}/transactions`, data),

  deleteTransaction: (id) =>
    client.delete(`/transactions/${id}`),

  getTransactionStats: (portfolioId) =>
    client.get(`/portfolios/${portfolioId}/transactions/stats`),
};

export default transactionsApi;
