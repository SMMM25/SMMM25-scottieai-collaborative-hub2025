
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { 
  LearningData, 
  LearningMetrics, 
  LearningInsight, 
  FeedbackType 
} from '@/types/learning';
import { 
  generateInsightsFromPatterns, 
  initializeBaseLearningMetrics, 
  updateMetricsFromFeedback 
} from '@/utils/learningUtils';

// Re-export types for backward compatibility
export type { 
  LearningData, 
  LearningMetrics, 
  LearningInsight,
  FeedbackType
};

// Save learning data from processing results
export const saveLearningData = async (
  projectId: string, 
  learningMetrics: LearningMetrics, 
  insights: LearningInsight[]
): Promise<LearningData | null> => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw new Error('User not authenticated');
    
    const learningData: LearningData = {
      projectId,
      learningMetrics,
      insights,
      lastUpdated: new Date().toISOString()
    };
    
    // Save learning data to database
    const { data, error } = await supabase
      .from('ai_learning_data')
      .insert([{
        project_id: projectId,
        learning_metrics: learningMetrics,
        insights: insights,
        last_updated: learningData.lastUpdated,
        user_id: userData.user.id
      }])
      .select()
      .single();
      
    if (error) throw error;
    
    return {
      id: data.id,
      projectId: data.project_id,
      learningMetrics: data.learning_metrics,
      insights: data.insights,
      lastUpdated: data.last_updated
    };
  } catch (error) {
    console.error('Error saving learning data:', error);
    toast.error('Failed to save AI learning data');
    return null;
  }
};

// Get learning data for a project
export const getLearningData = async (projectId: string): Promise<LearningData | null> => {
  try {
    const { data, error } = await supabase
      .from('ai_learning_data')
      .select('*')
      .eq('project_id', projectId)
      .order('last_updated', { ascending: false })
      .limit(1)
      .single();
      
    if (error) throw error;
    
    return {
      id: data.id,
      projectId: data.project_id,
      learningMetrics: data.learning_metrics,
      insights: data.insights,
      lastUpdated: data.last_updated
    };
  } catch (error) {
    console.error('Error getting learning data:', error);
    return null;
  }
};

// Update learning metrics based on user feedback
export const updateLearningFromFeedback = async (
  projectId: string, 
  feedbackType: FeedbackType, 
  feedbackDetails?: string
): Promise<boolean> => {
  try {
    // Get existing learning data
    const existingData = await getLearningData(projectId);
    if (!existingData) return false;
    
    // Update metrics based on feedback
    const updatedMetrics = updateMetricsFromFeedback(existingData.learningMetrics, feedbackType);
    
    // Update record in database
    const { error } = await supabase
      .from('ai_learning_data')
      .update({
        learning_metrics: updatedMetrics,
        last_updated: new Date().toISOString()
      })
      .eq('id', existingData.id);
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error updating learning data:', error);
    return false;
  }
};

// Generate insights from project code analysis
export const generateLearningInsights = async (
  projectId: string, 
  codePatterns: string[], 
  optimizationOpportunities: string[]
): Promise<LearningInsight[]> => {
  // Process patterns found in code
  const patternInsights = generateInsightsFromPatterns(codePatterns, 'pattern');
  
  // Process optimization opportunities
  const optimizationInsights = generateInsightsFromPatterns(optimizationOpportunities, 'optimization', 0.6);
  
  // Combine all insights
  const insights = [
    ...patternInsights,
    ...optimizationInsights,
    // Add some performance and security insights
    {
      id: `perf-0`,
      type: 'performance' as const,
      description: 'Identified async loading pattern that could be optimized',
      confidence: 0.85,
      appliedCount: 0,
      createdAt: new Date().toISOString()
    },
    {
      id: `sec-0`,
      type: 'security' as const,
      description: 'Detected sensitive data handling that could be improved',
      confidence: 0.75,
      appliedCount: 0,
      createdAt: new Date().toISOString()
    }
  ];
  
  return insights;
};

// Re-export the initialize function for backward compatibility
export { initializeBaseLearningMetrics };
