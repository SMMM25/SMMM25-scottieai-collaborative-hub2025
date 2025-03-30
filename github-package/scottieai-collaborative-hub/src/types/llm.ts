import { LLMProvider } from './chat';

// Define the types of LLM providers supported
export type LLMProvider = 'openai' | 'anthropic' | 'cohere' | 'local';

// Chat message interface
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Chat completion request interface
export interface ChatCompletionRequest {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

// Chat completion response interface
export interface ChatCompletionResponse {
  id: string;
  message: ChatMessage;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// Code update recommendation interface
export interface CodeUpdateRecommendation {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  category: 'dependency' | 'security' | 'performance' | 'best-practice' | 'new-technology';
  currentCode?: string;
  suggestedCode?: string;
  filePath?: string;
  lineNumbers?: [number, number]; // [start, end]
  estimatedEffort: 'minimal' | 'moderate' | 'significant';
  benefits: string[];
  risks: string[];
  createdAt: Date;
}

// Code analysis result interface
export interface CodeAnalysisResult {
  recommendations: CodeUpdateRecommendation[];
  summary: {
    totalIssues: number;
    criticalIssues: number;
    outdatedDependencies: number;
    securityVulnerabilities: number;
    performanceIssues: number;
    codeQualityScore: number; // 0-100
  };
  analyzedFiles: number;
  analyzedLines: number;
  timestamp: Date;
}

// Technology update interface
export interface TechnologyUpdate {
  id: string;
  name: string;
  currentVersion?: string;
  latestVersion?: string;
  releaseDate: Date;
  category: 'framework' | 'library' | 'language' | 'tool' | 'platform';
  description: string;
  benefits: string[];
  breakingChanges: boolean;
  migrationDifficulty: 'easy' | 'moderate' | 'difficult';
  recommendedAction: 'update' | 'evaluate' | 'monitor';
  links: {
    documentation?: string;
    releaseNotes?: string;
    migrationGuide?: string;
  };
}

// Auto-update settings interface
export interface AutoUpdateSettings {
  enabled: boolean;
  scanFrequency: 'daily' | 'weekly' | 'monthly' | 'manual';
  autoApplyMinorUpdates: boolean;
  notifyOnMajorUpdates: boolean;
  excludedDirectories: string[];
  excludedFiles: string[];
  excludedDependencies: string[];
  lastScanDate?: Date;
  nextScanDate?: Date;
}
