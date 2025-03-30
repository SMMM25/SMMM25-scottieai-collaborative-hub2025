import { LLMProvider } from '@/types/llm';
import { ChatMessage } from '@/services/llmService';

// Context types for the chat
export type ChatContextType = 'code' | 'project' | 'deployment' | 'general';

// Chat context data interface
export interface ChatContextData {
  type: ChatContextType;
  data: any;
}

// Chat provider configuration
export interface ChatProviderConfig {
  provider: LLMProvider;
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

// Chat settings interface
export interface ChatSettings {
  providers: ChatProviderConfig[];
  defaultProvider: LLMProvider;
  enableStreaming: boolean;
  enableHistory: boolean;
  maxHistoryLength: number;
  systemPrompt: string;
}

// Chat state interface
export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  currentProvider: LLMProvider;
  settings: ChatSettings;
}

// Default chat settings
export const defaultChatSettings: ChatSettings = {
  providers: [
    {
      provider: 'openai',
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 1000
    },
    {
      provider: 'anthropic',
      model: 'claude-3-opus-20240229',
      temperature: 0.7,
      maxTokens: 1000
    },
    {
      provider: 'cohere',
      model: 'command-r-plus',
      temperature: 0.7,
      maxTokens: 1000
    }
  ],
  defaultProvider: 'openai',
  enableStreaming: true,
  enableHistory: true,
  maxHistoryLength: 50,
  systemPrompt: `You are an AI assistant for the ScottieAI Collaborative Hub, a platform that helps users enhance their projects with AI capabilities. 
  
Your role is to assist users with:
1. Code analysis and improvement suggestions
2. AI model selection and integration
3. Project management and organization
4. Deployment options and configuration
5. General technical questions

Be helpful, concise, and provide specific actionable advice when possible. If you need more information to provide a good answer, ask clarifying questions.`
};

// Default system messages for different context types
export const contextSystemPrompts: Record<ChatContextType, string> = {
  code: `You are analyzing code for the user. Focus on:
- Identifying bugs or issues
- Suggesting improvements for readability and performance
- Explaining complex sections
- Recommending best practices`,

  project: `You are helping with project management. Focus on:
- Organization and structure suggestions
- Feature prioritization
- Development workflow recommendations
- Integration strategies`,

  deployment: `You are assisting with deployment. Focus on:
- Platform-specific configuration
- Environment setup
- Performance optimization
- Security considerations`,

  general: defaultChatSettings.systemPrompt
};
