import { useState, useRef, useEffect } from 'react';
import { 
  Plus, Send, Bot, User, Trash2, Github, 
  Terminal, PenTool, Lightbulb, Compass,
  Clipboard, RefreshCw, PanelLeft, PanelLeftClose,
  MoreHorizontal
} from 'lucide-react';
import './index.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [chatHistory, setChatHistory] = useState([
    { id: 1, title: 'How to use local Ollama', date: 'Today' },
    { id: 2, title: 'React design patterns', date: 'Yesterday' },
  ]);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSubmit = async (e, customInput) => {
    if (e) e.preventDefault();
    const textToSubmit = customInput || input;
    if (!textToSubmit.trim() || isLoading) return;

    const userMessage = { role: 'user', content: textToSubmit };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen3:4b',
          messages: [...messages, userMessage],
          stream: true,
        }),
      });

      if (!response.ok) throw new Error('Failed to connect to Ollama');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const json = JSON.parse(line);
            if (json.message?.content) {
              assistantContent += json.message.content;
              setMessages((prev) => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1].content = assistantContent;
                return newMessages;
              });
            }
          } catch (e) {
            console.error('Error parsing chunk', e);
          }
        }
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Error: Could not reach Ollama. Make sure it is running locally and CORS is configured if needed.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
  };

  const suggestionCards = [
    { title: 'Explain a concept', desc: 'like "how stars are born"', icon: <Compass size={18} /> },
    { title: 'Write a story', desc: 'about a futuristic city', icon: <PenTool size={18} /> },
    { title: 'Code a project', desc: 'simple Python script', icon: <Terminal size={18} /> },
    { title: 'Brainstorm ideas', desc: 'for a new hobby', icon: <Lightbulb size={18} /> },
  ];

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? '' : 'closed'}`} style={{ width: isSidebarOpen ? 'var(--sidebar-width)' : '0', padding: isSidebarOpen ? '12px' : '0', overflow: 'hidden' }}>
        <div className="new-chat-container">
          <button className="new-chat-btn" onClick={() => setMessages([])}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="avatar" style={{ width: 24, height: 24, background: 'transparent', border: '1px solid var(--border-subtle)' }}>
                <Bot size={14} />
              </div>
              <span>New Chat</span>
            </div>
            <PenTool size={14} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div className="history-group">
            <div className="history-label">Previous 7 Days</div>
            {chatHistory.map((chat) => (
              <div key={chat.id} className="history-item">
                {chat.title}
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: '12px 0', borderTop: '1px solid var(--border-subtle)' }}>
          <div className="new-chat-btn">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="avatar user" style={{ width: 24, height: 24 }}>
                <User size={14} />
              </div>
              <span>Local User</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="chat-main">
        {/* Top Header */}
        <header style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="icon-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            <PanelLeft size={20} />
          </button>
          <div style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
            Qwen3 <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>4B</span>
          </div>
        </header>

        {messages.length === 0 ? (
          <div className="welcome-screen">
            <div className="logo-large">
              <Bot size={32} />
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>What can I help with?</h1>
            
            <div className="suggestions-grid">
              {suggestionCards.map((card, i) => (
                <button key={i} className="suggestion-card" onClick={() => handleSubmit(null, card.title)}>
                  <div style={{ color: '#10a37f', marginBottom: '8px' }}>{card.icon}</div>
                  <div className="suggestion-title">{card.title}</div>
                  <div className="suggestion-desc">{card.desc}</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="messages-container">
            {messages.map((msg, i) => (
              <div key={i} className="message-wrapper" style={{ background: msg.role === 'assistant' ? 'transparent' : 'transparent' }}>
                <div className="message-content">
                  <div className={`avatar ${msg.role === 'user' ? 'user' : ''}`}>
                    {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                  </div>
                  <div className="message-inner">
                    <div style={{ fontWeight: 600, marginBottom: '4px', fontSize: '0.9rem' }}>
                      {msg.role === 'user' ? 'You' : 'Qwen'}
                    </div>
                    <div className="message-text">
                      {msg.content}
                    </div>
                    {msg.role === 'assistant' && !isLoading && (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                        <button className="icon-btn" onClick={() => handleCopy(msg.content)} title="Copy">
                          <Clipboard size={14} />
                        </button>
                        <button className="icon-btn" onClick={() => handleSubmit(null, messages[i-1].content)} title="Regenerate">
                          <RefreshCw size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Floating Input */}
        <div className="input-container">
          <div className="input-wrapper">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message Qwen3..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <div className="input-controls">
              <button 
                type="button" 
                className={`icon-btn ${input.trim() ? 'send-btn' : ''}`}
                disabled={!input.trim() || isLoading}
                onClick={(e) => handleSubmit(e)}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
          <div className="disclaimer">
            Local Ollama can make mistakes. Check important info.
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
