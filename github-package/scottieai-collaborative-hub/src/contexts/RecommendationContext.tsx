import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { toast } from 'sonner';
import { 
  Recommendation, 
  runFullAnalysis, 
  scheduleRegularAnalysis 
} from '../services/continuousImprovementService';

// Context type definitions
interface RecommendationContextType {
  recommendations: Recommendation[];
  pendingRecommendations: Recommendation[];
  approvedRecommendations: Recommendation[];
  rejectedRecommendations: Recommendation[];
  implementedRecommendations: Recommendation[];
  loadingRecommendations: boolean;
  refreshRecommendations: () => Promise<void>;
  approveRecommendation: (id: string, schedule?: Date) => void;
  rejectRecommendation: (id: string, reason?: string) => void;
  implementRecommendation: (id: string) => Promise<boolean>;
  getRecommendationById: (id: string) => Recommendation | undefined;
  getRecommendationsByCategory: (category: string) => Recommendation[];
  getRecommendationsByPriority: (priority: string) => Recommendation[];
}

// Create context with default values
const RecommendationContext = createContext<RecommendationContextType>({
  recommendations: [],
  pendingRecommendations: [],
  approvedRecommendations: [],
  rejectedRecommendations: [],
  implementedRecommendations: [],
  loadingRecommendations: false,
  refreshRecommendations: async () => {},
  approveRecommendation: () => {},
  rejectRecommendation: () => {},
  implementRecommendation: async () => false,
  getRecommendationById: () => undefined,
  getRecommendationsByCategory: () => [],
  getRecommendationsByPriority: () => []
});

// Provider component
export const RecommendationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState<boolean>(false);
  
  // Filtered recommendation lists
  const pendingRecommendations = recommendations.filter(rec => rec.status === 'pending');
  const approvedRecommendations = recommendations.filter(rec => rec.status === 'approved' || rec.status === 'scheduled');
  const rejectedRecommendations = recommendations.filter(rec => rec.status === 'rejected');
  const implementedRecommendations = recommendations.filter(rec => rec.status === 'implemented');
  
  // Load initial recommendations
  useEffect(() => {
    refreshRecommendations();
    
    // Schedule regular analysis
    const cancelScheduledAnalysis = scheduleRegularAnalysis(24); // Run every 24 hours
    
    return () => {
      cancelScheduledAnalysis();
    };
  }, []);
  
  // Refresh recommendations
  const refreshRecommendations = async () => {
    setLoadingRecommendations(true);
    try {
      const newRecommendations = await runFullAnalysis();
      
      // Merge with existing recommendations to preserve status
      const mergedRecommendations = mergeRecommendations(recommendations, newRecommendations);
      setRecommendations(mergedRecommendations);
      
      // Notify if there are new pending recommendations
      const newPendingCount = mergedRecommendations.filter(rec => 
        rec.status === 'pending' && 
        !recommendations.some(oldRec => oldRec.id === rec.id && oldRec.status === 'pending')
      ).length;
      
      if (newPendingCount > 0) {
        toast.info(`${newPendingCount} new improvement recommendations available`);
      }
    } catch (error) {
      console.error('Error refreshing recommendations:', error);
      toast.error('Failed to refresh recommendations');
    } finally {
      setLoadingRecommendations(false);
    }
  };
  
  // Helper to merge recommendations preserving status
  const mergeRecommendations = (oldRecs: Recommendation[], newRecs: Recommendation[]): Recommendation[] => {
    const result = [...oldRecs];
    
    // Add new recommendations
    for (const newRec of newRecs) {
      const existingIndex = result.findIndex(rec => rec.id === newRec.id);
      
      if (existingIndex === -1) {
        // This is a new recommendation
        result.push(newRec);
      } else {
        // Update existing recommendation but preserve status
        const existingRec = result[existingIndex];
        result[existingIndex] = {
          ...newRec,
          status: existingRec.status,
          scheduledFor: existingRec.scheduledFor
        };
      }
    }
    
    return result;
  };
  
  // Approve a recommendation
  const approveRecommendation = (id: string, schedule?: Date) => {
    setRecommendations(prevRecs => 
      prevRecs.map(rec => {
        if (rec.id === id) {
          return {
            ...rec,
            status: schedule ? 'scheduled' : 'approved',
            scheduledFor: schedule ? schedule.getTime() : undefined
          };
        }
        return rec;
      })
    );
    
    toast.success(`Recommendation approved${schedule ? ' and scheduled' : ''}`);
  };
  
  // Reject a recommendation
  const rejectRecommendation = (id: string, reason?: string) => {
    setRecommendations(prevRecs => 
      prevRecs.map(rec => {
        if (rec.id === id) {
          return {
            ...rec,
            status: 'rejected'
          };
        }
        return rec;
      })
    );
    
    toast.info('Recommendation rejected');
  };
  
  // Implement a recommendation
  const implementRecommendation = async (id: string): Promise<boolean> => {
    const recommendation = recommendations.find(rec => rec.id === id);
    if (!recommendation) return false;
    
    // In a real implementation, this would actually apply the changes
    // For now, we'll just simulate implementation
    
    toast.info(`Implementing: ${recommendation.title}`);
    
    try {
      // Simulate implementation delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Update recommendation status
      setRecommendations(prevRecs => 
        prevRecs.map(rec => {
          if (rec.id === id) {
            return {
              ...rec,
              status: 'implemented'
            };
          }
          return rec;
        })
      );
      
      toast.success(`Successfully implemented: ${recommendation.title}`);
      return true;
    } catch (error) {
      console.error('Error implementing recommendation:', error);
      toast.error(`Failed to implement: ${recommendation.title}`);
      return false;
    }
  };
  
  // Get recommendation by ID
  const getRecommendationById = (id: string): Recommendation | undefined => {
    return recommendations.find(rec => rec.id === id);
  };
  
  // Get recommendations by category
  const getRecommendationsByCategory = (category: string): Recommendation[] => {
    return recommendations.filter(rec => rec.category === category);
  };
  
  // Get recommendations by priority
  const getRecommendationsByPriority = (priority: string): Recommendation[] => {
    return recommendations.filter(rec => rec.priority === priority);
  };
  
  // Context value
  const contextValue: RecommendationContextType = {
    recommendations,
    pendingRecommendations,
    approvedRecommendations,
    rejectedRecommendations,
    implementedRecommendations,
    loadingRecommendations,
    refreshRecommendations,
    approveRecommendation,
    rejectRecommendation,
    implementRecommendation,
    getRecommendationById,
    getRecommendationsByCategory,
    getRecommendationsByPriority
  };
  
  return (
    <RecommendationContext.Provider value={contextValue}>
      {children}
    </RecommendationContext.Provider>
  );
};

// Custom hook for using the recommendation context
export const useRecommendations = () => useContext(RecommendationContext);

// Export the context for direct usage
export { RecommendationContext };
