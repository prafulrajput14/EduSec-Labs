import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const AIAssistant = () => {
  const { user } = useAuth();
  const [mounted, setMounted] = React.useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedLab, setSelectedLab] = useState('');
  const messagesEndRef = useRef(null);

  const labs = [
    { id: 'dvwa', name: 'DVWA - Web Application' },
    { id: 'juice-shop', name: 'OWASP Juice Shop' },
    { id: 'metasploitable', name: 'Metasploitable' },
    { id: 'general', name: 'General Help' }
  ];

  useEffect(() => {
    // Add welcome message
    setMessages([
      {
        id: 1,
        text: "👋 Hello! I'm your AI Cyber Tutor. I can help you with:\n\n• Tool usage (nmap, metasploit, etc.)\n• Vulnerability explanations\n• Lab-specific hints\n• Methodology guidance\n\nWhat would you like to know about cybersecurity?",
        sender: 'ai',
        timestamp: new Date()
      }
    ]);
  }, []);

  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 40);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await axios.post('/api/ai/assist', {
        message: inputMessage,
        labId: selectedLab,
        context: {
          userLevel: user?.level,
          currentLab: selectedLab
        }
      });

      const aiMessage = {
        id: Date.now() + 1,
        text: response.data.response,
        sender: 'ai',
        hints: response.data.hints || null,
        usedModel: response.data.usedModel,
        usedKB: response.data.usedKB,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        text: "❌ Sorry, I'm having trouble responding right now. Please try again later or check your connection.",
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { 
      text: "How do I use nmap?", 
      lab: "general",
      icon: "🔍"
    },
    { 
      text: "What is SQL injection?", 
      lab: "dvwa",
      icon: "💉"
    },
    { 
      text: "Metasploit basic commands", 
      lab: "metasploitable",
      icon: "⚡"
    },
    { 
      text: "Help with brute force attacks", 
      lab: "general",
      icon: "🔑"
    },
    { 
      text: "XSS attack examples", 
      lab: "juice-shop",
      icon: "🎯"
    },
    { 
      text: "Network scanning methodology", 
      lab: "general",
      icon: "🌐"
    }
  ];

  const handleQuickAction = (action) => {
    setInputMessage(action.text);
    setSelectedLab(action.lab);
    // Auto-send the message
    const userMessage = {
      id: Date.now(),
      text: action.text,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);
    
    // Send to API
    axios.post('/api/ai/assist', {
      message: action.text,
      labId: action.lab,
      context: {
        userLevel: user?.level,
        currentLab: action.lab
      }
    })
    .then(response => {
      const aiMessage = {
        id: Date.now() + 1,
        text: response.data.response,
        sender: 'ai',
        hints: response.data.hints || null,
        usedModel: response.data.usedModel,
        usedKB: response.data.usedKB,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    })
    .catch(error => {
      const errorMessage = {
        id: Date.now() + 1,
        text: "❌ Sorry, I'm having trouble responding right now. Please try again later or check your connection.",
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    })
    .finally(() => setLoading(false));
  };

  const clearChat = () => {
    setMessages([
      {
        id: Date.now(),
        text: "Chat cleared! How can I help you with cybersecurity today?",
        sender: 'ai',
        timestamp: new Date()
      }
    ]);
  };

  return (
    <div className={mounted ? 'mounted' : ''}>
      <div className="row">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="bi bi-robot me-2"></i>
                AI Cyber Tutor
              </h5>
              <button 
                className="btn btn-outline-secondary btn-sm"
                onClick={clearChat}
              >
                <i className="bi bi-trash me-1"></i>
                Clear Chat
              </button>
            </div>
            
            <div className="card-body p-0">
              {/* Chat messages */}
              <div 
                className="chat-messages p-3" 
                style={{ height: '400px', overflowY: 'auto' }}
              >
                {messages.map(message => (
                  <div
                    key={message.id}
                    className={`d-flex mb-3 ${message.sender === 'user' ? 'justify-content-end' : 'justify-content-start'}`}
                  >
                    <div
                      className={`rounded p-3 ${message.sender === 'user' ? 'bg-primary text-white' : 'bg-light border'}`}
                      style={{ maxWidth: '70%' }}
                    >
                      <div className="message-text" style={{ whiteSpace: 'pre-wrap' }}>
                        {message.text}
                      </div>
                      
                      {message.hints && Array.isArray(message.hints) && message.sender === 'ai' && (
                        <div className="mt-3 p-2 bg-white rounded border">
                          <small className="text-muted fw-bold">💡 Suggested Steps:</small>
                          <ul className="small mt-1 mb-0">
                            {message.hints.map((hint, index) => (
                              <li key={index}>{hint}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {message.usedModel && (
                        <small className="text-success d-block mt-2">
                          <i className="bi bi-stars me-1"></i>
                          Powered by {message.usedModel}
                        </small>
                      )}
                      
                      <small className="text-muted d-block mt-2">
                        <i className="bi bi-clock me-1"></i>
                        {message.timestamp.toLocaleTimeString()}
                      </small>
                    </div>
                  </div>
                ))}
                
                {loading && (
                  <div className="d-flex justify-content-start mb-3">
                    <div className="bg-light rounded p-3 border">
                      <div className="spinner-border spinner-border-sm me-2 text-primary"></div>
                      <span className="text-muted">AI Tutor is thinking...</span>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Quick actions */}
              <div className="p-3 border-top">
                <small className="text-muted fw-bold">
                  <i className="bi bi-lightning me-1"></i>
                  Quick questions:
                </small>
                <div className="d-flex flex-wrap gap-2 mt-2">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => handleQuickAction(action)}
                    >
                      {action.icon} {action.text}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message input */}
              <div className="p-3 border-top bg-light">
                <form onSubmit={sendMessage}>
                  <div className="row g-2">
                    <div className="col-md-3">
                      <select
                        className="form-select"
                        value={selectedLab}
                        onChange={(e) => setSelectedLab(e.target.value)}
                      >
                        <option value="">Select Lab Context</option>
                        {labs.map(lab => (
                          <option key={lab.id} value={lab.id}>
                            {lab.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="col-md-7">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ask about tools, techniques, or get hints for labs..."
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                    
                    <div className="col-md-2">
                      <button
                        type="submit"
                        className="btn btn-primary w-100"
                        disabled={loading || !inputMessage.trim()}
                      >
                        {loading ? (
                          <span className="spinner-border spinner-border-sm"></span>
                        ) : (
                          <i className="bi bi-send"></i>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Tool Reference Sidebar */}
        <div className="col-md-4">
          <div className="card">
            <div className="card-header">
              <h6 className="mb-0">
                <i className="bi bi-tools me-2"></i>
                Tool Reference
              </h6>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <strong>🔍 nmap - Network Scanning</strong>
                <small className="d-block text-muted mb-1">Network discovery and security auditing</small>
                <code className="small d-block bg-dark text-light p-2 rounded">
                  nmap -sS -sV -O target_ip<br/>
                  nmap -p- -sC target_ip<br/>
                  nmap --script vuln target_ip
                </code>
              </div>
              
              <div className="mb-3">
                <strong>💉 sqlmap - SQL Injection</strong>
                <small className="d-block text-muted mb-1">Automatic SQL injection tool</small>
                <code className="small d-block bg-dark text-light p-2 rounded">
                  sqlmap -u "http://site.com/page?id=1"<br/>
                  sqlmap -u "http://site.com" --forms<br/>
                  sqlmap -u URL --dbs
                </code>
              </div>
              
              <div className="mb-3">
                <strong>⚡ metasploit - Exploitation</strong>
                <small className="d-block text-muted mb-1">Penetration testing framework</small>
                <code className="small d-block bg-dark text-light p-2 rounded">
                  msfconsole<br/>
                  search [vulnerability]<br/>
                  use exploit/[path]<br/>
                  set RHOSTS target_ip<br/>
                  exploit
                </code>
              </div>
              
              <div>
                <strong>📁 gobuster - Directory Busting</strong>
                <small className="d-block text-muted mb-1">Directory/file & DNS busting tool</small>
                <code className="small d-block bg-dark text-light p-2 rounded">
                  gobuster dir -u http://site.com -w wordlist.txt<br/>
                  gobuster dns -d domain.com -w wordlist.txt
                </code>
              </div>
            </div>
          </div>

          {/* Methodology Guide */}
          <div className="card mt-3">
            <div className="card-header">
              <h6 className="mb-0">
                <i className="bi bi-diagram-3 me-2"></i>
                Methodology
              </h6>
            </div>
            <div className="card-body">
              <ol className="small mb-0">
                <li className="mb-2"><strong>Reconnaissance</strong> - Gather information</li>
                <li className="mb-2"><strong>Scanning</strong> - Discover services & ports</li>
                <li className="mb-2"><strong>Enumeration</strong> - Gather detailed info</li>
                <li className="mb-2"><strong>Exploitation</strong> - Gain access</li>
                <li className="mb-2"><strong>Post-Exploitation</strong> - Maintain access</li>
                <li><strong>Reporting</strong> - Document findings</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
