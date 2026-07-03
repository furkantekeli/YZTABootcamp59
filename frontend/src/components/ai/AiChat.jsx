import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import { Send, Bot, User as UserIcon } from 'lucide-react';
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
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

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

    try {
      const response = await aiApi.chat(portfolioId, userText);
      const aiResponse = response.data;

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: 'ai',
          text: aiResponse.response
        }
      ]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: 'ai',
          text: 'Yapay zeka asistanı şu anda yanıt veremiyor. Lütfen API anahtarınızı (GEMINI_API_KEY) kontrol edin veya daha sonra tekrar deneyin.'
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="ai-chat-card glassmorphism">
      <div className="chat-header">
        <Bot size={20} className="chat-bot-icon" />
        <div>
          <h3 className="chat-title">Yapay Zekâ ile Portföy Sohbeti</h3>
          <span className="chat-subtitle">Sorularınızı portföy verilerinizi analiz ederek yanıtlar</span>
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
                <Markdown className="markdown-content">{msg.text}</Markdown>
              ) : (
                <p className="plain-text">{msg.text}</p>
              )}
            </div>
          </div>
        ))}
        {isSending && (
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
        <Button type="submit" variant="primary" disabled={!inputValue.trim() || isSending}>
          <Send size={16} />
        </Button>
      </form>
    </div>
  );
}
