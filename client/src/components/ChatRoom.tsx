import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Users, MessageSquare, Minimize2, Maximize2, Hash } from 'lucide-react';
import { useUserPermissions } from '@/hooks/useUserPermissions';

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: Date;
  isSystem?: boolean;
  userColor?: string;
}

interface ChatRoomProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize: () => void;
  isMinimized: boolean;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ isOpen, onClose, onMinimize, isMinimized }) => {
  const { permissions, isAuthenticated } = useUserPermissions();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      username: 'DHR System',
      message: 'Welcome to DHR Live Chat! 🎵 Share your thoughts about the music, connect with fellow deep house lovers, and enjoy the vibes!',
      timestamp: new Date(),
      isSystem: true
    },
    {
      id: '2',
      username: 'DeepHouseFan92',
      message: 'This track is absolutely incredible! Anyone know the ID?',
      timestamp: new Date(Date.now() - 300000),
      userColor: '#f97316'
    },
    {
      id: '3',
      username: 'VinylCollector',
      message: 'DHR always delivers the best selection 🔥',
      timestamp: new Date(Date.now() - 600000),
      userColor: '#ea580c'
    },
    {
      id: '4',
      username: 'MelodicVibes',
      message: 'Perfect soundtrack for my Sunday morning ☕',
      timestamp: new Date(Date.now() - 900000),
      userColor: '#fb923c'
    }
  ]);
  
  const [inputMessage, setInputMessage] = useState('');
  const [username, setUsername] = useState('');
  const [isUsernameSet, setIsUsernameSet] = useState(false);
  const [onlineUsers] = useState(47); // Simulated online user count
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const userColors = ['#f97316', '#ea580c', '#fb923c', '#fdba74', '#fed7aa'];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-sign-in subscribers with chat privileges
  useEffect(() => {
    if (isAuthenticated && permissions.canAutoSignInChat && !isUsernameSet) {
      setUsername(`Subscriber${Math.floor(Math.random() * 1000)}`);
      setIsUsernameSet(true);
      
      // Add welcome message for auto-signed-in subscribers
      const welcomeMessage: ChatMessage = {
        id: `auto-${Date.now()}`,
        username: 'DHR System',
        message: '🎵 Welcome back, subscriber! You have been automatically signed into the chat. Enjoy the deep house vibes!',
        timestamp: new Date(),
        isSystem: true
      };
      setMessages(prev => [...prev, welcomeMessage]);
    }
  }, [isAuthenticated, permissions.canAutoSignInChat, isUsernameSet]);

  // Simulate incoming messages from other users
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      const randomMessages = [
        'This mix is fire! 🔥',
        'Anyone going to the festival next weekend?',
        'Love this deep house vibe',
        'Perfect music for coding',
        'DHR never disappoints',
        'What\'s the track ID for this one?',
        'Greetings from Berlin! 🇩🇪',
        'Sunday vibes are strong with this one',
        'This is why I love deep house',
        'Anyone else getting goosebumps?',
        'The bassline in this track is insane!',
        'Perfect for my morning workout',
        'DHR keeping me company while working',
        'This artist is incredible, need more!',
        'Loving the progressive build in this one',
        'Anyone know where I can find this mix?',
        'Deep house is life ❤️',
        'These beats are hypnotic',
        'Shoutout to DHR for the amazing curation!'
      ];

      const randomUsernames = [
        'HouseMusicLover', 'BerlinVibes', 'DeepSoulFan', 'MelodicMind', 
        'GrooveSeeker', 'VinylDigger', 'DanceFloorKing', 'SunsetSessions',
        'UndergroundFan', 'ProgressiveHead', 'TechnoTraveler', 'IbizaDreamer',
        'WaxCollector', 'BasslineJunkie', 'MidnightGrooves', 'SoulfulBeats'
      ];

      if (Math.random() < 0.3) { // 30% chance every interval
        const newMessage: ChatMessage = {
          id: Date.now().toString(),
          username: randomUsernames[Math.floor(Math.random() * randomUsernames.length)],
          message: randomMessages[Math.floor(Math.random() * randomMessages.length)],
          timestamp: new Date(),
          userColor: userColors[Math.floor(Math.random() * userColors.length)]
        };
        
        setMessages(prev => [...prev.slice(-49), newMessage]); // Keep last 50 messages
      }
    }, 15000); // Check every 15 seconds

    return () => clearInterval(interval);
  }, [isOpen]);

  const handleSetUsername = () => {
    if (username.trim()) {
      setIsUsernameSet(true);
      const welcomeMessage: ChatMessage = {
        id: Date.now().toString(),
        username: 'DHR System',
        message: `Welcome to the chat, ${username}! 🎵`,
        timestamp: new Date(),
        isSystem: true
      };
      setMessages(prev => [...prev, welcomeMessage]);
    }
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !isUsernameSet) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      username: username,
      message: inputMessage,
      timestamp: new Date(),
      userColor: userColors[Math.floor(Math.random() * userColors.length)]
    };

    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');

    // Simulate typing indicator
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (isUsernameSet) {
        handleSendMessage();
      } else {
        handleSetUsername();
      }
    }
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed bottom-4 right-4 z-50 bg-gray-800/95 backdrop-blur-xl rounded-2xl border border-orange-400/30 shadow-2xl transition-all duration-300 ${
      isMinimized ? 'w-80 h-16' : 'w-96 h-[500px]'
    } flex flex-col`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-orange-400/20">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <MessageSquare className="h-5 w-5 text-orange-400" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-400 rounded-full animate-pulse"></div>
          </div>
          <div>
            <span className="font-semibold text-white">DHR Live Chat</span>
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <Users className="h-3 w-3" />
              <span>{onlineUsers} online</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={onMinimize}
            className="p-1 rounded-lg hover:bg-orange-500/20 text-gray-400 hover:text-orange-300 transition-colors"
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-orange-500/20 text-gray-400 hover:text-orange-300 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Username Setup */}
          {!isUsernameSet && (
            <div className="p-4 bg-orange-500/10 border-b border-orange-400/20">
              <div className="text-sm text-orange-200 mb-2">Choose a username to join the chat:</div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter username..."
                  maxLength={20}
                  className="flex-1 bg-gray-700/50 border border-gray-600/30 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-orange-400/50 focus:ring-1 focus:ring-orange-400/50"
                />
                <button
                  onClick={handleSetUsername}
                  disabled={!username.trim()}
                  className="px-3 py-2 bg-orange-500/20 hover:bg-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg border border-orange-400/30 text-orange-300 hover:text-orange-200 transition-colors text-sm"
                >
                  Join
                </button>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {messages.map((message) => (
              <div key={message.id} className="group">
                <div className={`flex items-start space-x-2 ${
                  message.username === username ? 'flex-row-reverse space-x-reverse' : ''
                }`}>
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                    message.isSystem 
                      ? 'bg-orange-500/20 border border-orange-400/30 text-orange-300' 
                      : message.username === username
                      ? 'bg-orange-500/30 border border-orange-400/40 text-orange-200'
                      : 'bg-gray-700/50 border border-gray-600/30 text-gray-300'
                  }`} style={{
                    backgroundColor: !message.isSystem && message.username !== username ? `${message.userColor}20` : undefined,
                    borderColor: !message.isSystem && message.username !== username ? `${message.userColor}40` : undefined
                  }}>
                    {message.isSystem ? <Hash className="h-3 w-3" /> : message.username.charAt(0).toUpperCase()}
                  </div>
                  
                  <div className={`flex-1 min-w-0 ${
                    message.username === username ? 'text-right' : 'text-left'
                  }`}>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`text-xs font-medium ${
                        message.isSystem 
                          ? 'text-orange-300' 
                          : message.username === username
                          ? 'text-orange-200'
                          : 'text-gray-300'
                      }`} style={{
                        color: !message.isSystem && message.username !== username ? message.userColor : undefined
                      }}>
                        {message.username}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                    <div className={`inline-block p-2 rounded-lg text-sm max-w-xs break-words ${
                      message.isSystem
                        ? 'bg-orange-500/10 text-orange-200 border border-orange-400/20'
                        : message.username === username
                        ? 'bg-orange-500/20 text-orange-100 border border-orange-400/30'
                        : 'bg-gray-700/50 text-gray-200 border border-gray-600/30'
                    }`}>
                      {message.message}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex items-start space-x-2">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-700/50 border border-gray-600/30 flex items-center justify-center">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                </div>
                <div className="bg-gray-700/50 border border-gray-600/30 rounded-lg p-2">
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          {isUsernameSet && (
            <div className="p-4 border-t border-orange-400/20">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  maxLength={200}
                  className="flex-1 bg-gray-700/50 border border-gray-600/30 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-orange-400/50 focus:ring-1 focus:ring-orange-400/50"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim()}
                  className="p-2 bg-orange-500/20 hover:bg-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg border border-orange-400/30 text-orange-300 hover:text-orange-200 transition-colors"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {inputMessage.length}/200 characters
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ChatRoom;