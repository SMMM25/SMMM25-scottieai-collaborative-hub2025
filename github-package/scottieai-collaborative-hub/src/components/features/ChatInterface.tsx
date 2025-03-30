import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, Send, X, Minimize, Maximize, Bot, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatInterfaceProps {
  initialPrompt?: string;
  contextType?: 'code' | 'project' | 'deployment' | 'general';
  contextData?: any;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  initialPrompt,
  contextType = 'general',
  contextData
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage = {
      id: 'welcome',
      content: `Hello${user ? ` ${user.email?.split('@')[0]}` : ''}! I'm your ScottieAI assistant. How can I help you with your project today?`,
      role: 'assistant' as const,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, [user]);

  // Add initial prompt if provided
  useEffect(() => {
    if (initialPrompt && isOpen) {
      handleSendMessage(initialPrompt, true);
    }
  }, [initialPrompt, isOpen]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (messageContent = input, isSystemPrompt = false) => {
    if (!messageContent.trim()) return;
    
    // Add user message to chat
    if (!isSystemPrompt) {
      const userMessage: Message = {
        id: Date.now().toString(),
        content: messageContent,
        role: 'user',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);
    }
    
    setInput('');
    setIsLoading(true);
    
    try {
      // Prepare context for the AI
      const context = prepareContext(contextType, contextData);
      
      // In a real implementation, this would call an LLM API
      // For now, we'll simulate a response
      const response = await simulateAIResponse(messageContent, context);
      
      // Add AI response to chat
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        role: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      toast.error('Failed to get a response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const prepareContext = (type: string, data: any) => {
    switch (type) {
      case 'code':
        return `The user is working with code: ${JSON.stringify(data)}`;
      case 'project':
        return `The user is working on project: ${JSON.stringify(data)}`;
      case 'deployment':
        return `The user is working on deployment: ${JSON.stringify(data)}`;
      default:
        return '';
    }
  };

  // Simulate AI response (would be replaced with actual API call)
  const simulateAIResponse = async (message: string, context: string): Promise<string> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simple response logic based on message content
    if (message.toLowerCase().includes('hello') || message.toLowerCase().includes('hi')) {
      return "Hello! I'm your AI assistant. How can I help you with your project today?";
    }
    
    if (message.toLowerCase().includes('help')) {
      return "I can help you with code analysis, project management, AI model selection, and deployment. What specifically do you need assistance with?";
    }
    
    if (message.toLowerCase().includes('code') || message.toLowerCase().includes('programming')) {
      return "I can analyze your code, suggest improvements, and help you implement new features. Would you like me to look at a specific part of your codebase?";
    }
    
    if (message.toLowerCase().includes('deploy') || message.toLowerCase().includes('deployment')) {
      return "I can help you deploy your application to various platforms like Vercel, Netlify, or GitHub Pages. Which platform are you interested in?";
    }
    
    if (message.toLowerCase().includes('ai') || message.toLowerCase().includes('model')) {
      return "I can recommend AI models based on your project needs and help you integrate them. What kind of AI functionality are you looking to add?";
    }
    
    return "I understand you're asking about " + message + ". Could you provide more details so I can assist you better?";
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setIsMinimized(false);
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Chat button */}
      {!isOpen && (
        <Button 
          onClick={toggleChat} 
          className="rounded-full h-14 w-14 bg-scottie hover:bg-scottie-secondary shadow-lg"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}
      
      {/* Chat interface */}
      {isOpen && (
        <Card className={`w-80 sm:w-96 shadow-xl transition-all duration-300 ${isMinimized ? 'h-16' : 'h-[500px]'}`}>
          {/* Chat header */}
          <div className="bg-scottie text-white p-3 rounded-t-lg flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Bot className="h-5 w-5" />
              <h3 className="font-medium">ScottieAI Assistant</h3>
            </div>
            <div className="flex space-x-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 text-white hover:bg-scottie-secondary rounded-full"
                onClick={toggleMinimize}
              >
                {isMinimized ? <Maximize className="h-4 w-4" /> : <Minimize className="h-4 w-4" />}
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 text-white hover:bg-scottie-secondary rounded-full"
                onClick={toggleChat}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Chat content */}
          {!isMinimized && (
            <>
              <CardContent className="p-0 flex flex-col h-[calc(100%-110px)]">
                {/* Messages area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <div 
                      key={message.id} 
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-start max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <Avatar className={`h-8 w-8 ${message.role === 'user' ? 'ml-2' : 'mr-2'}`}>
                          {message.role === 'user' ? (
                            user?.email ? (
                              <AvatarFallback>{user.email.substring(0, 2).toUpperCase()}</AvatarFallback>
                            ) : (
                              <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                            )
                          ) : (
                            <>
                              <AvatarImage src="/scottie-logo.png" alt="ScottieAI" />
                              <AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback>
                            </>
                          )}
                        </Avatar>
                        <div 
                          className={`rounded-lg p-3 ${
                            message.role === 'user' 
                              ? 'bg-scottie text-white' 
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="flex items-start max-w-[80%]">
                        <Avatar className="h-8 w-8 mr-2">
                          <AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback>
                        </Avatar>
                        <div className="rounded-lg p-3 bg-muted">
                          <div className="flex space-x-1">
                            <div className="h-2 w-2 bg-scottie rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="h-2 w-2 bg-scottie rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            <div className="h-2 w-2 bg-scottie rounded-full animate-bounce" style={{ animationDelay: '600ms' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
                
                {/* Input area */}
                <div className="p-3 border-t">
                  <div className="flex space-x-2">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Type a message..."
                      className="flex-1"
                      disabled={isLoading}
                    />
                    <Button 
                      onClick={() => handleSendMessage()} 
                      size="icon" 
                      className="bg-scottie hover:bg-scottie-secondary"
                      disabled={isLoading || !input.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      )}
    </div>
  );
};

export default ChatInterface;
