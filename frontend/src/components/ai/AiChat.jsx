import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import { Send, Bot, User as UserIcon, StopCircle } from 'lucide-react';
import { aiApi } from '../../api/ai';
import Button from '../common/Button';
import './AiChat.css';

export default function AiChat({ portfolioId }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: 'Merhaba! Ben yapay zeka yatırım asistanınız. Seçili portföyünüzle ilgili risk durumu, hisse dağılımı, kâr/zarar analizi veya piyasa beklentileri hakkında ne öğrenmek istersiniz? Bana dilediğiniz finansal soruyu sorabilirsiniz.'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);
  const streamingMsgIdRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending, isStreaming]);

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    // Mark the streaming message as done so cursor-blink disappears
    if (streamingMsgIdRef.current) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === streamingMsgIdRef.current
            ? { ...msg, isStreaming: false }
            : msg
        )
      );
      streamingMsgIdRef.current = null;
    }
    setIsStreaming(false);
    setIsSending(false);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isSending) return;

    const userText = inputValue;
    setInputValue('');

    // Add user message
    const userMsgId = Date.now();
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, sender: 'user', text: userText }
    ]);

    setIsSending(true);

    // Create a placeholder AI message for streaming
    const aiMsgId = Date.now() + 1;
    streamingMsgIdRef.current = aiMsgId;

    setMessages((prev) => [
      ...prev,
      { id: aiMsgId, sender: 'ai', text: '', isStreaming: true }
    ]);

    setIsStreaming(true);

    try {
      abortControllerRef.current = aiApi.chatStream(portfolioId, userText, {
        onChunk: (chunk) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMsgId
                ? { ...msg, text: msg.text + chunk }
                : msg
            )
          );
        },
        onDone: () => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMsgId
                ? { ...msg, isStreaming: false }
                : msg
            )
          );
          setIsStreaming(false);
          setIsSending(false);
          abortControllerRef.current = null;
          streamingMsgIdRef.current = null;
        },
        onError: (error) => {
          console.error('Stream error:', error);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMsgId
                ? {
                    ...msg,
                    text: msg.text || 'Yapay zeka asistanı şu anda yanıt veremiyor. Lütfen API anahtarınızı (GEMINI_API_KEY) kontrol edin veya daha sonra tekrar deneyin.',
                    isStreaming: false,
                  }
                : msg
            )
          );
          setIsStreaming(false);
          setIsSending(false);
          abortControllerRef.current = null;
          streamingMsgIdRef.current = null;
        },
      });
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMsgId
            ? {
                ...msg,
                text: 'Yapay zeka asistanı şu anda yanıt veremiyor. Lütfen daha sonra tekrar deneyin.',
                isStreaming: false,
              }
            : msg
        )
      );
      setIsStreaming(false);
      setIsSending(false);
    }
  };

  return (
    <div className="ai-chat-card glassmorphism">
      <div className="chat-header">
        <Bot size={20} className="chat-bot-icon" />
        <div>
          <h3 className="chat-title">Yapay Zekâ ile Portföy Sohbeti</h3>
          <span className="chat-subtitle">
            {isStreaming ? (
              <span className="streaming-indicator">
                <span className="streaming-dot"></span>
                Yanıt yazılıyor...
              </span>
            ) : (
              'Sorularınızı portföy verilerinizi analiz ederek yanıtlar'
            )}
          </span>
        </div>
      </div>

      <div className="chat-messages-container">
        {messages.map((msg) => (
          <div key={msg.id} className={`message-bubble-wrapper ${msg.sender}-msg`}>
            <div className="message-avatar">
              {msg.sender === 'ai' ? <Bot size={16} /> : <UserIcon size={16} />}
            </div>
            <div className="message-bubble">
              {msg.sender === 'ai' ? (
                <div className="ai-response-content">
                  <Markdown className="markdown-content">{msg.text}</Markdown>
                  {msg.isStreaming && <span className="cursor-blink">▊</span>}
                </div>
              ) : (
                <p className="plain-text">{msg.text}</p>
              )}
            </div>
          </div>
        ))}
        {isSending && !isStreaming && (
          <div className="message-bubble-wrapper ai-msg">
            <div className="message-avatar">
              <Bot size={16} />
            </div>
            <div className="message-bubble typing-bubble">
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="chat-input-area">
        <input
          type="text"
          placeholder="Portföyümün risk seviyesi nasıl? Dengeli hale getirmek için ne yapmalıyım?..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={isSending}
          className="chat-input"
        />
        {isStreaming ? (
          <Button type="button" variant="danger" onClick={handleStopStreaming} title="Yanıtı durdur">
            <StopCircle size={16} />
          </Button>
        ) : (
          <Button type="submit" variant="primary" disabled={!inputValue.trim() || isSending}>
            <Send size={16} />
          </Button>
        )}
      </form>
    </div>
  );
}
