
import { LearningInsight, LearningMetrics } from '@/types/learning';

// Helper function to generate learning insights
export const generateInsightsFromPatterns = (
  patterns: string[],
  type: LearningInsight['type'],
  baseConfidence: number = 0.7
): LearningInsight[] => {
  return patterns.map((pattern, index) => ({
    id: `${type}-${index}`,
    type,
    description: `${type === 'pattern' ? 'Identified code pattern' : 'Optimization opportunity'}: ${pattern}`,
    confidence: baseConfidence + (Math.random() * (1 - baseConfidence)), // Random confidence between baseConfidence-100%
    appliedCount: 0,
    createdAt: new Date().toISOString()
  }));
};

// Initialize base learning metrics for a new project
export const initializeBaseLearningMetrics = (): LearningMetrics => {
  return {
    accuracyScore: 65, // Starting baseline
    adaptationRate: 1.0,
    patternRecognitionScore: 60,
    codeQualityImprovements: 0,
    totalLearningIterations: 0
  };
};

// Update metrics based on feedback type
export const updateMetricsFromFeedback = (
  metrics: LearningMetrics,
  feedbackType: 'positive' | 'negative'
): LearningMetrics => {
  const updatedMetrics = { ...metrics };
  
  if (feedbackType === 'positive') {
    // Increase accuracy and adaptation rate on positive feedback
    updatedMetrics.accuracyScore = Math.min(100, updatedMetrics.accuracyScore + 2);
    updatedMetrics.adaptationRate += 0.1;
  } else {
    // Adjust metrics based on negative feedback
    updatedMetrics.accuracyScore = Math.max(0, updatedMetrics.accuracyScore - 1);
    updatedMetrics.adaptationRate += 0.15; // Increase adaptation rate to learn from mistakes
  }
  
  // Always increment total learning iterations
  updatedMetrics.totalLearningIterations += 1;
  
  return updatedMetrics;
};
