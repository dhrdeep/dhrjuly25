import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatBoxProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatBox: React.FC<ChatBoxProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Welcome to DHR Chat! I\'m your AI assistant. Ask me about deep house music, upcoming events, or anything DHR related!',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateBotResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return 'Hey there! Welcome to DHR - Deep House Radio! How can I help you today?';
    }
    
    if (lowerMessage.includes('deep house') || lowerMessage.includes('music')) {
      return 'Deep house is all about those smooth, soulful vibes! Check out our DHR1 and DHR2 premium channels for the best curated deep house tracks. What\'s your favorite deep house artist?';
    }
    
    if (lowerMessage.includes('event') || lowerMessage.includes('gig') || lowerMessage.includes('festival')) {
      return 'There are some amazing deep house events coming up! Check our forum for the latest festival announcements and underground gigs. Are you looking for events in a specific city?';
    }
    
    if (lowerMessage.includes('vip') || lowerMessage.includes('download')) {
      return 'Our VIP section has over 1TB of exclusive deep house mixes! Subscribers get access to high-quality downloads and exclusive content. Want to know more about VIP membership?';
    }
    
    if (lowerMessage.includes('track') || lowerMessage.includes('identify')) {
      return 'Use our Track Identifier to discover what\'s playing on DHR! It uses advanced audio recognition to identify tracks in real-time. Pretty cool, right?';
    }
    
    if (lowerMessage.includes('forum')) {
      return 'Our forum is buzzing with the latest electronic music news, artist updates, and community discussions. Join the conversation and connect with fellow deep house lovers!';
    }
    
    if (lowerMessage.includes('upload') || lowerMessage.includes('dj') || lowerMessage.includes('mix')) {
      return 'Are you a DJ or producer? Upload your deep house mixes through our submission page! We review all submissions and feature the best ones on our channels.';
    }
    
    if (lowerMessage.includes('patreon') || lowerMessage.includes('support') || lowerMessage.includes('donate')) {
      return 'Support DHR through Patreon or Buy Me a Coffee! Your support helps us keep the music flowing and maintain our premium services. Every contribution matters!';
    }
    
    return 'That\'s a great question! I\'m here to help with anything DHR related - from music recommendations to technical support. What would you like to know more about?';
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate bot typing delay
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: generateBotResponse(inputText),
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 h-96 bg-gray-800/95 backdrop-blur-xl rounded-2xl border border-orange-400/30 shadow-2xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-orange-400/20">
        <div className="flex items-center space-x-2">
          <Bot className="h-5 w-5 text-orange-400" />
          <span className="font-semibold text-white">DHR Chat</span>
          <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-orange-500/20 text-gray-400 hover:text-orange-300 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start space-x-2 ${
              message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}
          >
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              message.sender === 'user' 
                ? 'bg-orange-500/20 border border-orange-400/30' 
                : 'bg-gray-700/50 border border-gray-600/30'
            }`}>
              {message.sender === 'user' ? (
                <User className="h-4 w-4 text-orange-300" />
              ) : (
                <Bot className="h-4 w-4 text-gray-300" />
              )}
            </div>
            <div className={`flex-1 max-w-xs ${
              message.sender === 'user' ? 'text-right' : 'text-left'
            }`}>
              <div className={`inline-block p-3 rounded-lg text-sm ${
                message.sender === 'user'
                  ? 'bg-orange-500/20 text-orange-100 border border-orange-400/30'
                  : 'bg-gray-700/50 text-gray-200 border border-gray-600/30'
              }`}>
                {message.text}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex items-start space-x-2">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700/50 border border-gray-600/30 flex items-center justify-center">
              <Bot className="h-4 w-4 text-gray-300" />
            </div>
            <div className="bg-gray-700/50 border border-gray-600/30 rounded-lg p-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-orange-400/20">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about DHR..."
            className="flex-1 bg-gray-700/50 border border-gray-600/30 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-orange-400/50 focus:ring-1 focus:ring-orange-400/50"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim()}
            className="p-2 bg-orange-500/20 hover:bg-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg border border-orange-400/30 text-orange-300 hover:text-orange-200 transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;