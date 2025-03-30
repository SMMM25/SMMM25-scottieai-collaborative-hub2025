
import React from 'react';
import { Brain, LineChart, Shield, Zap, BarChart } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { LearningMetrics, LearningInsight } from '@/types/learning';

interface SelfLearningCapabilitiesProps {
  learningMetrics?: LearningMetrics;
  recentInsights?: LearningInsight[];
  isLearning: boolean;
}

const SelfLearningCapabilities: React.FC<SelfLearningCapabilitiesProps> = ({
  learningMetrics,
  recentInsights = [],
  isLearning
}) => {
  const defaultMetrics: LearningMetrics = {
    accuracyScore: 60,
    adaptationRate: 1.0,
    patternRecognitionScore: 55,
    codeQualityImprovements: 0,
    totalLearningIterations: 0
  };

  const metrics = learningMetrics || defaultMetrics;
  
  // Helper to get color based on score
  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-rose-500';
  };
  
  return (
    <Card className="bg-card border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center">
          <Brain className="mr-2 h-5 w-5 text-scottie" />
          Self-Learning Capabilities
        </CardTitle>
        <CardDescription>
          ScottieAI learns from code patterns and improves over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Learning Metrics */}
        <div className="space-y-4 mb-6">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm">Accuracy Score</span>
              <span className={`text-sm font-medium ${getScoreColor(metrics.accuracyScore)}`}>
                {Math.round(metrics.accuracyScore)}%
              </span>
            </div>
            <Progress value={metrics.accuracyScore} className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm">Pattern Recognition</span>
              <span className={`text-sm font-medium ${getScoreColor(metrics.patternRecognitionScore)}`}>
                {Math.round(metrics.patternRecognitionScore)}%
              </span>
            </div>
            <Progress value={metrics.patternRecognitionScore} className="h-2" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col border rounded-md p-3">
              <span className="text-xs text-muted-foreground">Adaptation Rate</span>
              <div className="flex items-center mt-1">
                <Zap className="h-4 w-4 text-scottie mr-1" />
                <span className="font-medium">{metrics.adaptationRate.toFixed(1)}x</span>
              </div>
            </div>
            
            <div className="flex flex-col border rounded-md p-3">
              <span className="text-xs text-muted-foreground">Learning Iterations</span>
              <div className="flex items-center mt-1">
                <BarChart className="h-4 w-4 text-scottie mr-1" />
                <span className="font-medium">{metrics.totalLearningIterations}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Recent Insights */}
        {recentInsights.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2">Recent AI Insights</h3>
            <div className="space-y-2">
              {recentInsights.slice(0, 3).map(insight => (
                <div key={insight.id} className="border rounded-md p-3">
                  <div className="flex items-start">
                    {insight.type === 'pattern' && <Brain className="h-4 w-4 text-scottie mt-0.5 mr-2 flex-shrink-0" />}
                    {insight.type === 'optimization' && <Zap className="h-4 w-4 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />}
                    {insight.type === 'performance' && <LineChart className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />}
                    {insight.type === 'security' && <Shield className="h-4 w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />}
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">
                          {insight.type.charAt(0).toUpperCase() + insight.type.slice(1)} Insight
                        </span>
                        <span className="text-xs">
                          {Math.round(insight.confidence * 100)}% confident
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Show placeholder when no insights or learning in progress */}
        {recentInsights.length === 0 && (
          <div className={`border rounded-md p-4 ${isLearning ? 'bg-scottie-light/10' : ''}`}>
            {isLearning ? (
              <div className="text-center">
                <Brain className="h-6 w-6 mx-auto mb-2 text-scottie animate-pulse" />
                <p className="text-sm font-medium text-scottie">Learning in Progress</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Analyzing code patterns and building intelligence...
                </p>
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <Brain className="h-6 w-6 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Process code to start learning</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SelfLearningCapabilities;
