import { create } from 'zustand';
import { portfolioApi } from '../api/portfolio';
import { stocksApi } from '../api/stocks';
import { transactionsApi } from '../api/transactions';

export const usePortfolioStore = create((set, get) => ({
  portfolios: [],
  currentPortfolio: null,
  stocks: [],
  transactions: [],
  summary: null,
  isLoading: false,
  isStocksLoading: false,
  isTransactionsLoading: false,
  error: null,

  fetchPortfolios: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await portfolioApi.getPortfolios();
      const portfolios = response.data;

      set({ portfolios, isLoading: false });

      // Auto-select first portfolio if none selected
      if (!get().currentPortfolio && portfolios.length > 0) {
        get().setCurrentPortfolio(portfolios[0]);
      }

      return portfolios;
    } catch (error) {
      set({ isLoading: false, error: error.message });
      return [];
    }
  },

  setCurrentPortfolio: async (portfolio) => {
    set({ currentPortfolio: portfolio });
    if (portfolio?.id) {
      await Promise.all([
        get().fetchStocks(portfolio.id),
        get().fetchTransactions(portfolio.id),
        get().fetchSummary(portfolio.id),
      ]);
    }
  },

  createPortfolio: async (data) => {
    try {
      const response = await portfolioApi.createPortfolio(data);
      const newPortfolio = response.data;

      set((state) => ({
        portfolios: [...state.portfolios, newPortfolio],
      }));

      if (!get().currentPortfolio) {
        get().setCurrentPortfolio(newPortfolio);
      }

      return { success: true, portfolio: newPortfolio };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  deletePortfolio: async (id) => {
    try {
      await portfolioApi.deletePortfolio(id);

      set((state) => ({
        portfolios: state.portfolios.filter((p) => p.id !== id),
        currentPortfolio:
          state.currentPortfolio?.id === id ? null : state.currentPortfolio,
      }));

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  fetchStocks: async (portfolioId) => {
    set({ isStocksLoading: true });
    try {
      const response = await stocksApi.getStocks(portfolioId);
      set({ stocks: response.data, isStocksLoading: false });
      return response.data;
    } catch (error) {
      set({ isStocksLoading: false, error: error.message });
      return [];
    }
  },

  addStock: async (portfolioId, data) => {
    try {
      const response = await stocksApi.addStock(portfolioId, data);
      const newStock = response.data;

      set((state) => ({
        stocks: [...state.stocks, newStock],
      }));

      // Refresh summary after adding stock
      get().fetchSummary(portfolioId);

      return { success: true, stock: newStock };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  removeStock: async (portfolioId, stockId) => {
    try {
      await stocksApi.removeStock(portfolioId, stockId);

      set((state) => ({
        stocks: state.stocks.filter((s) => s.id !== stockId),
      }));

      get().fetchSummary(portfolioId);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  fetchTransactions: async (portfolioId, params = {}) => {
    set({ isTransactionsLoading: true });
    try {
      const response = await transactionsApi.getTransactions(portfolioId, params);
      set({ transactions: response.data, isTransactionsLoading: false });
      return response.data;
    } catch (error) {
      set({ isTransactionsLoading: false, error: error.message });
      return [];
    }
  },

  addTransaction: async (portfolioId, data) => {
    try {
      const response = await transactionsApi.addTransaction(portfolioId, data);
      const newTransaction = response.data;

      set((state) => ({
        transactions: [newTransaction, ...state.transactions],
      }));

      // Refresh stocks and summary
      await Promise.all([
        get().fetchStocks(portfolioId),
        get().fetchSummary(portfolioId),
      ]);

      return { success: true, transaction: newTransaction };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  fetchSummary: async (portfolioId) => {
    try {
      const response = await portfolioApi.getPortfolioSummary(portfolioId);
      set({ summary: response.data });
      return response.data;
    } catch (error) {
      set({ error: error.message });
      return null;
    }
  },

  clearError: () => set({ error: null }),
}));

export default usePortfolioStore;
