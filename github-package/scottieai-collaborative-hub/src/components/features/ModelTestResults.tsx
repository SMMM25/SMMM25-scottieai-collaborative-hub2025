
import React, { useMemo } from 'react';
import { Check, X, AlertCircle, BarChart, Zap, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ModelTestResult, BenchmarkResult } from '@/services/modelTestingService';

interface ModelTestResultsProps {
  benchmarkResult?: BenchmarkResult;
  isLoading?: boolean;
  className?: string;
}

// Utility functions moved outside component for better performance
const formatTime = (ms: number): string => {
  if (ms < 1) return '<1 ms';
  if (ms < 1000) return `${ms.toFixed(2)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
};

const formatMemory = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const ModelTestResults: React.FC<ModelTestResultsProps> = ({
  benchmarkResult,
  isLoading = false,
  className = ''
}) => {
  // Memoize grouped results to avoid recalculation on every render
  const groupedResults = useMemo(() => {
    if (!benchmarkResult?.results?.length) return {};
    
    return benchmarkResult.results.reduce((acc, result) => {
      // Find the test case ID to determine category
      const testCaseId = result.testCaseId;
      let category = 'unknown';
      
      if (testCaseId.includes('performance')) category = 'performance';
      else if (testCaseId.includes('edge-case')) category = 'edge-case';
      else category = 'accuracy';
      
      if (!acc[category]) acc[category] = [];
      acc[category].push(result);
      return acc;
    }, {} as Record<string, ModelTestResult[]>);
  }, [benchmarkResult?.results]);
  
  // Badge variant helper function
  const getPassRateBadgeVariant = (passRate: number) => {
    if (passRate >= 0.8) return "success";
    if (passRate >= 0.6) return "warning";
    return "destructive";
  };
  
  const getPassRateBadgeClass = (passRate: number) => {
    if (passRate >= 0.8) return "bg-green-500 hover:bg-green-600";
    if (passRate >= 0.6) return "bg-amber-500 hover:bg-amber-600";
    return "";
  };
  
  return (
    <Card className={`bg-card border ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center">
          <BarChart className="mr-2 h-5 w-5 text-scottie" />
          Model Test Results
        </CardTitle>
        <CardDescription>
          Performance and accuracy metrics for the AI model
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Zap className="h-8 w-8 text-scottie animate-pulse mb-4" />
            <p>Running tests...</p>
          </div>
        ) : !benchmarkResult ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>Run a model test to see results</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/50 p-4 rounded-md">
                <div className="text-xs text-muted-foreground mb-1">Pass Rate</div>
                <div className="flex items-end justify-between">
                  <div className="text-2xl font-semibold">
                    {(benchmarkResult.passRate * 100).toFixed(0)}%
                  </div>
                  <Badge 
                    variant={benchmarkResult.passRate >= 0.8 ? "default" : "destructive"}
                    className={getPassRateBadgeClass(benchmarkResult.passRate)}
                  >
                    {benchmarkResult.passRate >= 0.8 ? "Good" : benchmarkResult.passRate >= 0.6 ? "Fair" : "Needs Improvement"}
                  </Badge>
                </div>
                <Progress 
                  value={benchmarkResult.passRate * 100} 
                  className={`h-1 mt-2 ${benchmarkResult.passRate >= 0.8 ? "bg-green-500" : benchmarkResult.passRate >= 0.6 ? "bg-amber-500" : "bg-red-500"}`}
                />
              </div>
              
              <div className="bg-muted/50 p-4 rounded-md">
                <div className="text-xs text-muted-foreground mb-1">Avg. Inference Time</div>
                <div className="flex items-end justify-between">
                  <div className="text-2xl font-semibold">
                    {formatTime(benchmarkResult.averageInferenceTime)}
                  </div>
                  <Badge 
                    variant={benchmarkResult.averageInferenceTime < 50 ? "default" : "outline"}
                    className={benchmarkResult.averageInferenceTime < 50 ? "bg-green-500 hover:bg-green-600" : ""}
                  >
                    {benchmarkResult.averageInferenceTime < 50 ? "Fast" : "Normal"}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Memory: {formatMemory(benchmarkResult.memoryUsage)}
                </div>
              </div>
            </div>
            
            {/* Test Results by Category */}
            <div className="space-y-4">
              {Object.entries(groupedResults).map(([category, results]) => (
                <div key={category} className="border rounded-md overflow-hidden">
                  <div className="bg-muted/50 px-4 py-2 font-medium capitalize flex items-center">
                    {category === 'performance' && <Clock className="h-4 w-4 mr-2 text-scottie" />}
                    {category === 'accuracy' && <Check className="h-4 w-4 mr-2 text-green-500" />}
                    {category === 'edge-case' && <AlertCircle className="h-4 w-4 mr-2 text-amber-500" />}
                    {category} Tests
                  </div>
                  <div className="divide-y">
                    {results.map((result) => (
                      <div key={result.id} className="px-4 py-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            {result.passed ? (
                              <Check className="h-4 w-4 text-green-500 mr-2" />
                            ) : (
                              <X className="h-4 w-4 text-red-500 mr-2" />
                            )}
                            <span>{result.testCaseId.replace(/-/g, ' ')}</span>
                          </div>
                          <Badge variant={result.passed ? "outline" : "destructive"} className="text-xs">
                            {result.passed ? `${formatTime(result.timeTaken)}` : 'Failed'}
                          </Badge>
                        </div>
                        
                        {result.error && (
                          <div className="mt-1 text-xs text-red-500">
                            Error: {result.error}
                          </div>
                        )}
                        
                        {result.metrics && (
                          <div className="mt-2 grid grid-cols-4 gap-2 text-xs">
                            <div>
                              <span className="text-muted-foreground">Accuracy:</span>{' '}
                              {(result.metrics.accuracy * 100).toFixed(1)}%
                            </div>
                            <div>
                              <span className="text-muted-foreground">Precision:</span>{' '}
                              {(result.metrics.precision * 100).toFixed(1)}%
                            </div>
                            <div>
                              <span className="text-muted-foreground">Recall:</span>{' '}
                              {(result.metrics.recall * 100).toFixed(1)}%
                            </div>
                            <div>
                              <span className="text-muted-foreground">F1:</span>{' '}
                              {(result.metrics.f1Score * 100).toFixed(1)}%
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      
      {benchmarkResult && (
        <CardFooter className="border-t bg-muted/50 px-6 py-4">
          <div className="w-full">
            <h4 className="text-sm font-medium mb-1">Test Summary</h4>
            <p className="text-xs text-muted-foreground">
              {benchmarkResult.results.length} tests run with a {(benchmarkResult.passRate * 100).toFixed(0)}% pass rate.
              Average inference time: {formatTime(benchmarkResult.averageInferenceTime)}.
            </p>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default ModelTestResults;
