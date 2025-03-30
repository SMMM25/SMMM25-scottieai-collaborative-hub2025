
export interface LearningData {
  id?: string;
  projectId: string;
  learningMetrics: LearningMetrics;
  insights: LearningInsight[];
  lastUpdated: string;
}

export interface LearningMetrics {
  accuracyScore: number;
  adaptationRate: number;
  patternRecognitionScore: number;
  codeQualityImprovements: number;
  totalLearningIterations: number;
}

export interface LearningInsight {
  id: string;
  type: 'pattern' | 'optimization' | 'style' | 'security' | 'performance';
  description: string;
  confidence: number;
  appliedCount: number;
  createdAt: string;
}

export type FeedbackType = 'positive' | 'negative';
