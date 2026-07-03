import client from './client';

export const stocksApi = {
  getStocks: (portfolioId) =>
    client.get(`/portfolios/${portfolioId}/stocks`),

  addStock: (portfolioId, data) =>
    client.post(`/portfolios/${portfolioId}/stocks`, data),

  removeStock: (portfolioId, stockId) =>
    client.delete(`/portfolios/${portfolioId}/stocks/${stockId}`),

  searchStocks: (query) =>
    client.get('/stocks/search', { params: { q: query } }),

  getStockPrice: (symbol) =>
    client.get(`/stocks/${symbol}/price`),

  getStockHistory: (symbol, period = '1mo') =>
    client.get(`/stocks/${symbol}/history`, { params: { period } }),

  getStockDetails: (symbol) =>
    client.get(`/stocks/${symbol}`),
};

export default stocksApi;
