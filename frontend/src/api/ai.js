import client from './client';

export const aiApi = {
  analyzePortfolio: (portfolioId) =>
    client.post('/ai/analyze', { portfolio_id: portfolioId }),

  assessRisk: (portfolioId) =>
    client.post('/ai/risk', { portfolio_id: portfolioId }),

  chat: (portfolioId, message) =>
    client.post('/ai/chat', { portfolio_id: portfolioId, question: message }),

  getInsights: (portfolioId) =>
    client.get(`/ai/insights/${portfolioId}`),

  getRecommendations: (portfolioId) =>
    client.get(`/ai/recommendations/${portfolioId}`),
};

export default aiApi;
