import client from './client';

export const watchlistApi = {
  getWatchlist: () => client.get('/watchlist/'),
  
  addToWatchlist: (itemData) => client.post('/watchlist/', itemData),
  
  removeFromWatchlist: (itemId) => client.delete(`/watchlist/${itemId}`)
};

export default watchlistApi;
