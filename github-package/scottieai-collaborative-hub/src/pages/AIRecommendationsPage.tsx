import React from 'react';
import { RecommendationProvider } from '../contexts/RecommendationContext';
import { RecommendationPanel } from '../components/features/RecommendationPanel';
import { PageHeader } from '../components/ui/page-header';

export const AIRecommendationsPage: React.FC = () => {
  return (
    <RecommendationProvider>
      <div className="container mx-auto py-8">
        <PageHeader
          title="AI Recommendations"
          description="Review and manage AI-generated recommendations for improving your projects"
        />
        <div className="mt-8">
          <RecommendationPanel />
        </div>
      </div>
    </RecommendationProvider>
  );
};

export default AIRecommendationsPage;
