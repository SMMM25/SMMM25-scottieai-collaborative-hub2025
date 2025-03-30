import { LLMProvider } from '@/types/llm';

// Interface for LLM API configuration
export interface LLMConfig {
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  baseUrl?: string;
  headers?: Record<string, string>;
}

// Interface for chat message
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Interface for chat completion request
export interface ChatCompletionRequest {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

// Interface for chat completion response
export interface ChatCompletionResponse {
  id: string;
  message: ChatMessage;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// Abstract class for LLM service providers
export abstract class LLMService {
  protected config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = {
      temperature: 0.7,
      maxTokens: 1000,
      ...config
    };
  }

  abstract getProvider(): LLMProvider;
  abstract getChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;
  abstract streamChatCompletion(
    request: ChatCompletionRequest, 
    onChunk: (chunk: string) => void,
    onComplete: (fullResponse: ChatCompletionResponse) => void,
    onError: (error: Error) => void
  ): Promise<void>;
}

// OpenAI implementation
export class OpenAIService extends LLMService {
  constructor(config: LLMConfig) {
    super({
      model: 'gpt-4',
      ...config
    });
  }

  getProvider(): LLMProvider {
    return 'openai';
  }

  async getChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          ...this.config.headers
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: request.messages,
          temperature: request.temperature || this.config.temperature,
          max_tokens: request.maxTokens || this.config.maxTokens
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();
      
      return {
        id: data.id,
        message: {
          role: 'assistant',
          content: data.choices[0].message.content
        },
        usage: {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens
        }
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw error;
    }
  }

  async streamChatCompletion(
    request: ChatCompletionRequest,
    onChunk: (chunk: string) => void,
    onComplete: (fullResponse: ChatCompletionResponse) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          ...this.config.headers
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: request.messages,
          temperature: request.temperature || this.config.temperature,
          max_tokens: request.maxTokens || this.config.maxTokens,
          stream: true
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      let fullContent = '';
      let responseId = '';

      const decoder = new TextDecoder('utf-8');
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(data);
              if (!responseId && parsed.id) {
                responseId = parsed.id;
              }
              
              if (parsed.choices && parsed.choices[0].delta && parsed.choices[0].delta.content) {
                const content = parsed.choices[0].delta.content;
                fullContent += content;
                onChunk(content);
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }

      onComplete({
        id: responseId,
        message: {
          role: 'assistant',
          content: fullContent
        },
        usage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0
        }
      });
    } catch (error) {
      console.error('OpenAI streaming error:', error);
      onError(error instanceof Error ? error : new Error(String(error)));
    }
  }
}

// Anthropic implementation
export class AnthropicService extends LLMService {
  constructor(config: LLMConfig) {
    super({
      model: 'claude-3-opus-20240229',
      ...config
    });
  }

  getProvider(): LLMProvider {
    return 'anthropic';
  }

  async getChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    try {
      // Convert messages to Anthropic format
      const messages = request.messages.map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      }));

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey || '',
          'anthropic-version': '2023-06-01',
          ...this.config.headers
        },
        body: JSON.stringify({
          model: this.config.model,
          messages,
          max_tokens: request.maxTokens || this.config.maxTokens,
          temperature: request.temperature || this.config.temperature
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Anthropic API error: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();
      
      return {
        id: data.id,
        message: {
          role: 'assistant',
          content: data.content[0].text
        },
        usage: {
          promptTokens: data.usage?.input_tokens || 0,
          completionTokens: data.usage?.output_tokens || 0,
          totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
        }
      };
    } catch (error) {
      console.error('Anthropic API error:', error);
      throw error;
    }
  }

  async streamChatCompletion(
    request: ChatCompletionRequest,
    onChunk: (chunk: string) => void,
    onComplete: (fullResponse: ChatCompletionResponse) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      // Convert messages to Anthropic format
      const messages = request.messages.map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      }));

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey || '',
          'anthropic-version': '2023-06-01',
          ...this.config.headers
        },
        body: JSON.stringify({
          model: this.config.model,
          messages,
          max_tokens: request.maxTokens || this.config.maxTokens,
          temperature: request.temperature || this.config.temperature,
          stream: true
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Anthropic API error: ${error.error?.message || response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      let fullContent = '';
      let responseId = '';
      let inputTokens = 0;
      let outputTokens = 0;

      const decoder = new TextDecoder('utf-8');
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(data);
              
              if (!responseId && parsed.message?.id) {
                responseId = parsed.message.id;
              }
              
              if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                const content = parsed.delta.text;
                fullContent += content;
                onChunk(content);
              }
              
              if (parsed.type === 'message_stop') {
                inputTokens = parsed.usage?.input_tokens || 0;
                outputTokens = parsed.usage?.output_tokens || 0;
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }

      onComplete({
        id: responseId,
        message: {
          role: 'assistant',
          content: fullContent
        },
        usage: {
          promptTokens: inputTokens,
          completionTokens: outputTokens,
          totalTokens: inputTokens + outputTokens
        }
      });
    } catch (error) {
      console.error('Anthropic streaming error:', error);
      onError(error instanceof Error ? error : new Error(String(error)));
    }
  }
}

// Cohere implementation
export class CohereService extends LLMService {
  constructor(config: LLMConfig) {
    super({
      model: 'command-r-plus',
      ...config
    });
  }

  getProvider(): LLMProvider {
    return 'cohere';
  }

  async getChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    try {
      // Convert messages to Cohere format
      const messages = request.messages.map(msg => ({
        role: msg.role,
        message: msg.content
      }));

      const response = await fetch('https://api.cohere.ai/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          ...this.config.headers
        },
        body: JSON.stringify({
          model: this.config.model,
          chat_history: messages,
          max_tokens: request.maxTokens || this.config.maxTokens,
          temperature: request.temperature || this.config.temperature
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Cohere API error: ${error.message || response.statusText}`);
      }

      const data = await response.json();
      
      return {
        id: data.generation_id,
        message: {
          role: 'assistant',
          content: data.text
        },
        usage: {
          promptTokens: data.meta?.prompt_tokens || 0,
          completionTokens: data.meta?.response_tokens || 0,
          totalTokens: (data.meta?.prompt_tokens || 0) + (data.meta?.response_tokens || 0)
        }
      };
    } catch (error) {
      console.error('Cohere API error:', error);
      throw error;
    }
  }

  async streamChatCompletion(
    request: ChatCompletionRequest,
    onChunk: (chunk: string) => void,
    onComplete: (fullResponse: ChatCompletionResponse) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      // Convert messages to Cohere format
      const messages = request.messages.map(msg => ({
        role: msg.role,
        message: msg.content
      }));

      const response = await fetch('https://api.cohere.ai/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          ...this.config.headers
        },
        body: JSON.stringify({
          model: this.config.model,
          chat_history: messages,
          max_tokens: request.maxTokens || this.config.maxTokens,
          temperature: request.temperature || this.config.temperature,
          stream: true
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Cohere API error: ${error.message || response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      let fullContent = '';
      let responseId = '';
      let promptTokens = 0;
      let responseTokens = 0;

      const decoder = new TextDecoder('utf-8');
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(data);
              
              if (!responseId && parsed.generation_id) {
                responseId = parsed.generation_id;
              }
              
              if (parsed.text) {
                fullContent += parsed.text;
                onChunk(parsed.text);
              }
              
              if (parsed.is_finished && parsed.meta) {
                promptTokens = parsed.meta.prompt_tokens || 0;
                responseTokens = parsed.meta.response_tokens || 0;
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }

      onComplete({
        id: responseId,
        message: {
          role: 'assistant',
          content: fullContent
        },
        usage: {
          promptTokens: promptTokens,
          completionTokens: responseTokens,
          totalTokens: promptTokens + responseTokens
        }
      });
    } catch (error) {
      console.error('Cohere streaming error:', error);
      onError(error instanceof Error ? error : new Error(String(error)));
    }
  }
}

// Factory to create LLM service based on provider
export class LLMServiceFactory {
  static createService(provider: LLMProvider, config: LLMConfig): LLMService {
    switch (provider) {
      case 'openai':
        return new OpenAIService(config);
      case 'anthropic':
        return new AnthropicService(config);
      case 'cohere':
        return new CohereService(config);
      default:
        throw new Error(`Unsupported LLM provider: ${provider}`);
    }
  }
}
