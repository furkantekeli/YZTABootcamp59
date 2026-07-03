import client from './client';

export const newsApi = {
  getNews: (params = {}) =>
    client.get('/news', { params }),

  getStockNews: (symbol) =>
    client.get(`/news/stock/${symbol}`),

  analyzeNews: (newsId) =>
    client.post(`/ai/analyze-news/${newsId}`),
};

export default newsApi;
