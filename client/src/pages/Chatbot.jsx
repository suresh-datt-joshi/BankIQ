import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const SUGGESTED_QUERIES = [
  'How to open a savings account?',
  'What are the current interest rates?',
  'How to close my account?',
  'What documents are required for KYC?',
  'How to apply for a home loan?',
  'How to block my debit card?',
];

const COMMON_QUERY_CATEGORIES = [
  {
    title: 'Accounts',
    description: 'Savings, Current, Account opening & closure',
    query:
      'What are the requirements for opening and closing savings and current accounts?',
    icon: 'accounts',
    color: '#2563eb',
    bg: '#eff6ff',
  },
  {
    title: 'KYC & Verification',
    description: 'Required documents and process',
    query: 'What documents are required for KYC verification?',
    icon: 'kyc',
    color: '#16a34a',
    bg: '#ecfdf5',
  },
  {
    title: 'Interest Rates',
    description: 'Latest rates for deposits and loans',
    query: 'What are the current interest rates for deposits and loans?',
    icon: 'rates',
    color: '#9333ea',
    bg: '#faf5ff',
  },
  {
    title: 'Loans',
    description: 'Personal, Home, Car Loans and eligibility',
    query:
      'What are the eligibility criteria for personal, home, and car loans?',
    icon: 'loans',
    color: '#d97706',
    bg: '#fffbeb',
  },
  {
    title: 'Cards & Payments',
    description: 'Debit/Credit cards, UPI, net banking',
    query: 'How do I use debit cards, UPI, and net banking services?',
    icon: 'cards',
    color: '#e11d48',
    bg: '#fff1f2',
  },
  {
    title: 'Customer Support',
    description: 'Grievances, complaints and more',
    query: 'How can I register a grievance or complaint with customer support?',
    icon: 'support',
    color: '#0d9488',
    bg: '#f0fdfa',
  },
];

const BOT_GREETING_MESSAGES = [
  "Hi! I'm BankQI 👋",
  'Ask me about accounts.',
  'Need help with KYC?',
  'I can explain loan options.',
  'Let’s find the right answer.',
];

function BankLogo({ variant = 'header' }) {
  const isFooter = variant === 'footer';

  return (
    <div className={`bankqi-logo ${isFooter ? 'bankqi-logo-footer' : ''}`}>
      <svg
        viewBox="0 0 44 44"
        fill="none"
        aria-hidden="true"
        className="bankqi-logo-mark"
      >
        <rect x="6" y="20" width="32" height="18" rx="2" fill="#0a3d7a" />
        <path
          d="M8 20 L22 9 L36 20"
          stroke="#0a3d7a"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
        <rect x="12" y="24" width="5" height="11" rx="1" fill="white" />
        <rect x="19.5" y="24" width="5" height="11" rx="1" fill="white" />
        <rect x="27" y="24" width="5" height="11" rx="1" fill="white" />
      </svg>
      <div className="bankqi-logo-text">
        <span className="bankqi-brand">BankQI</span>
        {!isFooter && (
          <span className="bankqi-tagline">
            Your Banking Questions, Our Smart Answers.
          </span>
        )}
      </div>
    </div>
  );
}

function CategoryIcon({ type, color }) {
  const icons = {
    accounts: (
      <path
        d="M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zm8 1.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM5.5 18.5a5.5 5.5 0 0 1 11 0v.75h-11v-.75zm11.5 0a4.5 4.5 0 0 1 9 0v.75h-9v-.75z"
        fill={color}
      />
    ),
    kyc: (
      <path
        d="M7 3.5h10.5a1.75 1.75 0 0 1 1.75 1.75V22l-7-3.5-7 3.5V5.25A1.75 1.75 0 0 1 7 3.5zm1.75 3.5h7v1.75h-7V7zm0 3.5h7v1.75h-7V10.5z"
        fill={color}
      />
    ),
    rates: (
      <path
        d="M12 2.25A9.75 9.75 0 1 0 21.75 12 9.76 9.76 0 0 0 12 2.25zm.875 14.625h-1.75v-1.75h1.75v1.75zm0-3.5h-1.75V7.875h1.75v5.625z"
        fill={color}
      />
    ),
    loans: (
      <path
        d="M12 2.25c-3.17 0-5.75 2.58-5.75 5.75 0 4.59 5.75 11.5 5.75 11.5s5.75-6.91 5.75-11.5c0-3.17-2.58-5.75-5.75-5.75zm0 7.875A2.125 2.125 0 1 1 14.125 8 2.125 2.125 0 0 1 12 10.125z"
        fill={color}
      />
    ),
    cards: (
      <path
        d="M2.25 5.625A1.875 1.875 0 0 1 4.125 3.75h15.75A1.875 1.875 0 0 1 21.75 5.625v11.25A1.875 1.875 0 0 1 19.875 18.75H4.125A1.875 1.875 0 0 1 2.25 16.875V5.625zm1.875 1.875v1.875h15.75V7.5H4.125zm0 3.75v5.625h15.75v-5.625H4.125z"
        fill={color}
      />
    ),
    support: (
      <path
        d="M12 2.25a7.75 7.75 0 0 0-7.75 7.75v2.875a2.875 2.875 0 0 0 2.875 2.875h.875v-5.75H5.5a4.875 4.875 0 0 1 9.75 0h-2.875v5.75h.875a2.875 2.875 0 0 0 2.875-2.875V10A7.75 7.75 0 0 0 12 2.25z"
        fill={color}
      />
    ),
  };

  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      {icons[type]}
    </svg>
  );
}

function Chatbot() {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [asking, setAsking] = useState(false);
  const [greetingIndex, setGreetingIndex] = useState(0);
  const messagesEndRef = useRef(null);

  const hasConversation = messages.length > 0;

  useEffect(() => {
    const greetingTimer = window.setInterval(() => {
      setGreetingIndex(
        (currentIndex) => (currentIndex + 1) % BOT_GREETING_MESSAGES.length,
      );
    }, 3000);

    return () => window.clearInterval(greetingTimer);
  }, []);

  useEffect(() => {
    if (hasConversation) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, asking, hasConversation]);

  const handleClearChat = () => {
    setMessages([]);
  };

  const handleAskQuestion = async (questionText) => {
    const currentQuestion = (questionText ?? question).trim();

    if (!currentQuestion || asking) {
      return;
    }

    setMessages((prev) => [
      ...prev,
      { role: 'user', content: currentQuestion },
    ]);

    setQuestion('');
    setAsking(true);

    try {
      const response = await axios.post(`${API_URL}/chat`, {
        question: currentQuestion,
        history: messages.slice(-4).map((message) => ({
          role: message.role,
          content: message.content || message.text || '',
        })),
      });

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            response.data.answer ||
            "I couldn't find this information in the available banking documents.",
          sources: response.data.sources || [],
        },
      ]);
    } catch (error) {
      console.error('Chat error:', error);

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'Sorry, something went wrong while processing your question.',
          sources: [],
          error: true,
        },
      ]);
    } finally {
      setAsking(false);
    }
  };

  const handleSuggestedClick = (query) => {
    handleAskQuestion(query);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleAskQuestion();
    }
  };

  return (
    <div className={`bankqi-app ${hasConversation ? 'bankqi-app-chat' : ''}`}>
      <header className="bankqi-header">
        <BankLogo />

        <div className="bankqi-header-actions">
          <nav className="bankqi-nav">
            <a href="/" className="bankqi-nav-link active">
              Home
            </a>
          </nav>

          <Link to="/admin" className="bankqi-signin-btn">
            ADMIN
          </Link>
        </div>
      </header>

      <main className="bankqi-main">
        {!hasConversation ? (
          <>
            <section className="bankqi-hero-panel">
              <div className="bankqi-hero-building" aria-hidden="true" />

              <div className="bankqi-hero-inner">
                <div className="bankqi-hero-copy">
                  <h1 className="bankqi-hero-title">
                    Welcome to <span className="bankqi-highlight">BankQI</span>
                  </h1>
                  <p className="bankqi-hero-heading">
                    Your Smart Banking Assistant
                  </p>

                  <p className="bankqi-hero-subtitle">
                    Get instant answers to your banking queries based on our
                    official policies and documents.
                  </p>

                  <div className="bankqi-features">
                    <div className="bankqi-feature">
                      <span className="bankqi-feature-icon">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
                        </svg>
                      </span>
                      Accurate Information
                    </div>
                    <div className="bankqi-feature">
                      <span className="bankqi-feature-icon">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z" />
                        </svg>
                      </span>
                      Powered by Bank Documents
                    </div>
                    <div className="bankqi-feature">
                      <span className="bankqi-feature-icon">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" />
                        </svg>
                      </span>
                      Available 24/7
                    </div>
                  </div>
                </div>

                <div className="bankqi-hero-visual">
                  <div className="bankqi-speech-bubble">
                    <span
                      key={greetingIndex}
                      className="bankqi-speech-text"
                      aria-live="polite"
                    >
                      {BOT_GREETING_MESSAGES[greetingIndex]}
                    </span>
                  </div>
                  <img
                    src="/bot.png"
                    alt="BankQI assistant mascot"
                    className="bankqi-mascot"
                  />
                  <div className="bankqi-hero-slogan">
                    <span>People. Progress. Together.</span>
                  </div>
                </div>
              </div>

              <div className="bankqi-search-wrap">
                <div className="bankqi-search-bar">
                  <span className="bankqi-search-icon" aria-hidden="true">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="11" cy="11" r="7" />
                      <path d="M20 20l-4-4" strokeLinecap="round" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your question here..."
                    disabled={asking}
                    aria-label="Ask a banking question"
                  />
                  <button
                    className="bankqi-send-btn"
                    onClick={() => handleAskQuestion()}
                    disabled={!question.trim() || asking}
                    type="button"
                    aria-label="Send question"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                  </button>
                </div>

                <div className="bankqi-suggestions">
                  {SUGGESTED_QUERIES.map((query) => (
                    <button
                      key={query}
                      className="bankqi-suggestion-pill"
                      onClick={() => handleSuggestedClick(query)}
                      disabled={asking}
                      type="button"
                    >
                      {query}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className="bankqi-queries-section" id="help">
              <div className="bankqi-queries-header">
                <h2>Common Queries</h2>
                <p>Click on a topic to get started</p>
              </div>

              <div className="bankqi-queries-grid">
                {COMMON_QUERY_CATEGORIES.map((category) => (
                  <button
                    key={category.title}
                    className="bankqi-query-card"
                    onClick={() => handleSuggestedClick(category.query)}
                    disabled={asking}
                    type="button"
                  >
                    <div
                      className="bankqi-query-icon"
                      style={{ backgroundColor: category.bg }}
                    >
                      <CategoryIcon
                        type={category.icon}
                        color={category.color}
                      />
                    </div>
                    <h3>{category.title}</h3>
                    <p>{category.description}</p>
                  </button>
                ))}
              </div>
            </section>
          </>
        ) : (
          <>
            <section className="bankqi-chat-section">
              <div className="bankqi-chat-header">
                <h2>Conversation</h2>
                <button
                  className="bankqi-clear-btn"
                  onClick={handleClearChat}
                  disabled={asking}
                  type="button"
                >
                  Clear Chat
                </button>
              </div>

              <div className="bankqi-messages">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`bankqi-message-row ${message.role}`}
                  >
                    {message.role === 'assistant' && (
                      <img
                        src="/bot.png"
                        alt=""
                        className="bankqi-message-avatar"
                        aria-hidden="true"
                      />
                    )}
                    <div
                      className={`bankqi-message ${message.error ? 'bankqi-message-error' : ''}`}
                    >
                      <p>{message.content}</p>

                      {message.role === 'assistant' &&
                        message.sources?.length > 0 && (
                          <div className="bankqi-sources">
                            <strong>Sources</strong>
                            {message.sources.map((source, sourceIndex) => (
                              <div className="bankqi-source" key={sourceIndex}>
                                📄 {source.document}
                                {source.chunkIndex !== undefined &&
                                  ` — Chunk ${source.chunkIndex + 1}`}
                                {source.score !== undefined &&
                                  ` — Score: ${Number(source.score).toFixed(2)}`}
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                  </div>
                ))}

                {asking && (
                  <div className="bankqi-message-row assistant">
                    <img
                      src="/bot.png"
                      alt=""
                      className="bankqi-message-avatar"
                      aria-hidden="true"
                    />
                    <div className="bankqi-message bankqi-typing">
                      <span className="bankqi-typing-dots">
                        <span />
                        <span />
                        <span />
                      </span>
                      BankQI is thinking...
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </section>

            <div className="bankqi-search-wrap bankqi-search-wrap-chat">
              <div className="bankqi-search-bar">
                <span className="bankqi-search-icon" aria-hidden="true">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="M20 20l-4-4" strokeLinecap="round" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your question here..."
                  disabled={asking}
                  aria-label="Ask a banking question"
                />
                <button
                  className="bankqi-send-btn"
                  onClick={() => handleAskQuestion()}
                  disabled={!question.trim() || asking}
                  type="button"
                  aria-label="Send question"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        )}
      </main>

      <footer className="bankqi-footer" id="about">
        <div className="bankqi-footer-left">
          <BankLogo variant="footer" />
          <span className="bankqi-footer-tagline">
            A smarter way to stay informed.
          </span>
        </div>

        <div className="bankqi-footer-links">
          <a href="#privacy">Privacy Policy</a>
          <span className="bankqi-footer-divider">|</span>
          <a href="#terms">Terms of Use</a>
          <span className="bankqi-footer-divider">|</span>
          <a href="#contact">Contact Us</a>
        </div>
      </footer>
    </div>
  );
}

export default Chatbot;
