import React, { createContext, useContext, useState, useEffect } from 'react';
import { LLMServiceFactory } from '@/services/llmService';
import { 
  ChatSettings, 
  defaultChatSettings, 
  ChatState, 
  ChatContextType, 
  ChatContextData,
  contextSystemPrompts
} from '@/types/chat';
import { ChatMessage, ChatCompletionRequest, LLMProvider } from '@/types/llm';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { toast } from 'sonner';

interface ChatContextProps {
  chatState: ChatState;
  sendMessage: (message: string, contextData?: ChatContextData) => Promise<void>;
  clearChat: () => void;
  setProvider: (provider: LLMProvider) => void;
  updateSettings: (settings: Partial<ChatSettings>) => void;
  isProviderConfigured: (provider: LLMProvider) => boolean;
}

const ChatContext = createContext<ChatContextProps | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load settings from local storage or use defaults
  const [settings, setSettings] = useLocalStorage<ChatSettings>('chat-settings', defaultChatSettings);
  
  // Initialize chat state
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null,
    currentProvider: settings.defaultProvider,
    settings
  });

  // Update chat state when settings change
  useEffect(() => {
    setChatState(prev => ({
      ...prev,
      settings
    }));
  }, [settings]);

  // Check if a provider is properly configured
  const isProviderConfigured = (provider: LLMProvider): boolean => {
    const providerConfig = settings.providers.find(p => p.provider === provider);
    return !!providerConfig && !!providerConfig.apiKey;
  };

  // Set the active provider
  const setProvider = (provider: LLMProvider) => {
    if (!isProviderConfigured(provider)) {
      toast.error(`${provider} API key is not configured. Please add it in settings.`);
      return;
    }
    
    setChatState(prev => ({
      ...prev,
      currentProvider: provider
    }));
    
    // Also update default provider in settings
    updateSettings({ defaultProvider: provider });
  };

  // Update chat settings
  const updateSettings = (newSettings: Partial<ChatSettings>) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings
    }));
  };

  // Clear chat history
  const clearChat = () => {
    setChatState(prev => ({
      ...prev,
      messages: []
    }));
  };

  // Send a message to the LLM
  const sendMessage = async (content: string, contextData?: ChatContextData) => {
    try {
      // Don't send empty messages
      if (!content.trim()) return;
      
      // Check if provider is configured
      if (!isProviderConfigured(chatState.currentProvider)) {
        toast.error(`${chatState.currentProvider} API key is not configured. Please add it in settings.`);
        return;
      }
      
      // Add user message to chat
      const userMessage: ChatMessage = {
        role: 'user',
        content
      };
      
      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, userMessage],
        isLoading: true,
        error: null
      }));
      
      // Get provider configuration
      const providerConfig = settings.providers.find(p => p.provider === chatState.currentProvider);
      if (!providerConfig) {
        throw new Error(`Provider ${chatState.currentProvider} not found in settings`);
      }
      
      // Create LLM service
      const llmService = LLMServiceFactory.createService(chatState.currentProvider, {
        apiKey: providerConfig.apiKey,
        model: providerConfig.model,
        temperature: providerConfig.temperature,
        maxTokens: providerConfig.maxTokens
      });
      
      // Prepare messages for the request
      const contextType = contextData?.type || 'general';
      const systemPrompt = contextSystemPrompts[contextType];
      
      // Add context data if available
      let enhancedSystemPrompt = systemPrompt;
      if (contextData?.data) {
        enhancedSystemPrompt += `\n\nContext information: ${JSON.stringify(contextData.data)}`;
      }
      
      const messages: ChatMessage[] = [
        { role: 'system', content: enhancedSystemPrompt },
        ...chatState.messages,
        userMessage
      ];
      
      // Limit history length if needed
      const limitedMessages = messages.slice(-settings.maxHistoryLength);
      
      // Prepare request
      const request: ChatCompletionRequest = {
        messages: limitedMessages,
        temperature: providerConfig.temperature,
        maxTokens: providerConfig.maxTokens,
        stream: settings.enableStreaming
      };
      
      if (settings.enableStreaming) {
        // For streaming responses
        let streamedContent = '';
        
        // Create a placeholder message
        const placeholderMessage: ChatMessage = {
          role: 'assistant',
          content: ''
        };
        
        setChatState(prev => ({
          ...prev,
          messages: [...prev.messages, placeholderMessage]
        }));
        
        // Stream the response
        await llmService.streamChatCompletion(
          request,
          (chunk) => {
            streamedContent += chunk;
            setChatState(prev => {
              const updatedMessages = [...prev.messages];
              updatedMessages[updatedMessages.length - 1] = {
                ...updatedMessages[updatedMessages.length - 1],
                content: streamedContent
              };
              return {
                ...prev,
                messages: updatedMessages
              };
            });
          },
          (fullResponse) => {
            setChatState(prev => {
              const updatedMessages = [...prev.messages];
              updatedMessages[updatedMessages.length - 1] = {
                role: 'assistant',
                content: fullResponse.message.content
              };
              return {
                ...prev,
                messages: updatedMessages,
                isLoading: false
              };
            });
          },
          (error) => {
            setChatState(prev => ({
              ...prev,
              error: error.message,
              isLoading: false
            }));
            toast.error(`Error: ${error.message}`);
          }
        );
      } else {
        // For non-streaming responses
        const response = await llmService.getChatCompletion(request);
        
        setChatState(prev => ({
          ...prev,
          messages: [...prev.messages, response.message],
          isLoading: false
        }));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setChatState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false
      }));
      toast.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        chatState,
        sendMessage,
        clearChat,
        setProvider,
        updateSettings,
        isProviderConfigured
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextProps => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
