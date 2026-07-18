import client from './client';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const aiApi = {
  analyzePortfolio: (portfolioId) =>
    client.post('/ai/analyze', { portfolio_id: portfolioId }),

  assessRisk: (portfolioId) =>
    client.post('/ai/risk', { portfolio_id: portfolioId }),

  chat: (portfolioId, message) =>
    client.post('/ai/chat', { portfolio_id: portfolioId, question: message }),

  /**
   * Streaming chat using Server-Sent Events (SSE).
   * Delivers AI response token-by-token for a ChatGPT-like experience.
   *
   * @param {number} portfolioId - The portfolio ID to analyze
   * @param {string} message - The user's question
   * @param {function} onChunk - Callback fired for each text chunk received
   * @param {function} onDone - Callback fired when streaming is complete
   * @param {function} onError - Callback fired on error
   * @returns {AbortController} - Can be used to cancel the stream
   */
  chatStream: (portfolioId, message, { onChunk, onDone, onError }) => {
    const controller = new AbortController();
    const token = localStorage.getItem('auth_token');

    fetch(`${API_BASE_URL}/ai/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ portfolio_id: portfolioId, question: message }),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || `HTTP ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Parse SSE lines
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6); // Remove 'data: ' prefix
              if (data === '[DONE]') {
                onDone?.();
                return;
              }
              onChunk?.(data);
            }
          }
        }

        onDone?.();
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          onError?.(err);
        }
      });

    return controller;
  },

  getInsights: (portfolioId) =>
    client.get(`/ai/insights/${portfolioId}`),

  getRecommendations: (portfolioId) =>
    client.get(`/ai/recommendations/${portfolioId}`),
};

export default aiApi;
