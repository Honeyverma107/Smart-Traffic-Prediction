import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, User, Sparkles } from 'lucide-react';

const AiChatOverlay = ({ onClose }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: "Hello! I am your AI Traffic Assistant. Ask me anything about traffic congestion, optimal departure times, or road delays in Indore.",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  const suggestedPrompts = [
    "How is traffic near Rajwada Palace?",
    "Recommend a route to Vijay Nagar.",
    "Best time to travel to Bhawarkua?"
  ];

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const generateBotResponse = (userText) => {
    const text = userText.toLowerCase();
    
    if (text.includes('rajwada')) {
      return "📍 **Rajwada Palace Area**: Our forecasting model detects moderate congestion near the historical market gates due to active retail footfalls. Current average speed is **22 km/h**. I recommend taking the **Subhash Marg detour** to bypass Rajwada Square if you are routing towards Palasia.";
    } else if (text.includes('vijay nagar')) {
      return "⚡ **Vijay Nagar Square**: High capacity flows on MR-10 are moving smoothly. However, the LIG crossing is experiencing queue building (approx 4 mins delay). The **Fastest Route** via AB Road remains the most optimal path with 98% prediction confidence.";
    } else if (text.includes('bhawarkua')) {
      return "🏫 **Bhawarkua Square**: Student commute peaks between 4:30 PM and 6:30 PM. Congestion level is currently **Medium**. If traveling south towards Khandwa Road, transit before 4:00 PM to save roughly **12 minutes** of idle emission time.";
    } else if (text.includes('palasia')) {
      return "🛣️ **Palasia Square**: Traffic flow on MG Road is currently **Low** (Green). Average speeds are a healthy **45 km/h**. No major slowdowns reported near Geeta Bhawan either.";
    } else if (text.includes('route') || text.includes('navigate') || text.includes('how to')) {
      return "🗺️ **Route Recommendation Engine**: Specify your source and destination in the floating dashboard input. I will dynamically calculate OSRM coordinates and generate three distinct travel paths: Fastest, Balanced, and Eco.";
    } else if (text.includes('thank') || text.includes('cool') || text.includes('awesome')) {
      return "You're welcome! Safe travels in Indore. Let me know if you need any more routing forecasts!";
    } else {
      return "🤖 **Smart Traffic Assistant**: I've analyzed Indore's main arterial corridors. Overall city traffic load is **Nominal**. If you have a specific destination in mind (e.g., *Treasure Island Mall*, *Khajrana Temple*, or *Airport*), tell me and I will pull up its current traffic density indices!";
    }
  };

  const handleSend = (textToSend) => {
    if (!textToSend.trim()) return;

    // Add User Message
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate AI typing delay
    setTimeout(() => {
      const responseText = generateBotResponse(textToSend);
      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: responseText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <div className="ai-chat-overlay glass-panel">
      {/* Header */}
      <div className="chat-header">
        <div className="bot-info">
          <div className="bot-icon-glow">
            <Bot size={18} color="#60a5fa" />
          </div>
          <div>
            <h3>Smart Traffic Assistant</h3>
            <span className="online-badge"><span className="pulse-dot"></span>Active Predictor</span>
          </div>
        </div>
        <button className="close-chat-btn" onClick={onClose} title="Close Assistant">
          <X size={18} />
        </button>
      </div>

      {/* Message List */}
      <div className="chat-messages-container">
        {messages.map(msg => (
          <div key={msg.id} className={`message-wrapper ${msg.sender === 'user' ? 'user' : 'bot'}`}>
            <div className="message-avatar">
              {msg.sender === 'user' ? <User size={14} /> : <Sparkles size={14} color="#60a5fa" />}
            </div>
            <div className="message-bubble">
              <div className="message-text">
                {msg.text.split('\n').map((para, i) => (
                  <p key={i} style={{ marginBottom: i < msg.text.split('\n').length - 1 ? '8px' : 0 }}>
                    {para}
                  </p>
                ))}
              </div>
              <span className="message-time">{msg.time}</span>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="message-wrapper bot typing">
            <div className="message-avatar">
              <Sparkles size={14} color="#60a5fa" />
            </div>
            <div className="message-bubble typing-bubble">
              <div className="typing-loader">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggested Prompts */}
      <div className="chat-suggestions">
        {suggestedPrompts.map((prompt, index) => (
          <button key={index} className="suggestion-chip" onClick={() => handleSend(prompt)}>
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="chat-input-bar">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
          placeholder="Ask about traffic, delays, detours..."
        />
        <button className="chat-send-btn" onClick={() => handleSend(input)} disabled={!input.trim()}>
          <Send size={16} />
        </button>
      </div>
    </div>
  );
};

export default AiChatOverlay;
