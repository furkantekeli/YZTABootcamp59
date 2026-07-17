import client from './client';

export const analysisApi = {
  getPerformance: (portfolioId, period = '1mo') =>
    client.get(`/portfolios/${portfolioId}/analysis/performance`, { params: { period } }),

  getAllocation: (portfolioId) =>
    client.get(`/portfolios/${portfolioId}/analysis/allocation`),

  getRisk: (portfolioId) =>
    client.get(`/portfolios/${portfolioId}/analysis/risk`),

  getBenchmark: (portfolioId, benchmark = 'XU100.IS') =>
    client.get(`/portfolios/${portfolioId}/analysis/benchmark`, { params: { benchmark } }),

  getMetrics: (portfolioId) =>
    client.get(`/portfolios/${portfolioId}/analysis/metrics`),

  getProfitLoss: (portfolioId) =>
    client.get(`/portfolios/${portfolioId}/analysis/profit-loss`),

  getSnapshots: (portfolioId) =>
    client.get(`/portfolios/${portfolioId}/analysis/snapshots`),
};

export default analysisApi;
