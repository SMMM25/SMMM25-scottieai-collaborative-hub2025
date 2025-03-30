import React, { useState } from 'react';
import { Zap, BarChart, Play, Clock, Laptop, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { testModel, benchmarkModel, BenchmarkResult } from '@/services/modelTestingService';
import { useAIModel } from '@/hooks/useAIModel';
import ModelTestResults from './ModelTestResults';

interface ModelTesterProps {
  className?: string;
}

const ModelTester: React.FC<ModelTesterProps> = ({ className = '' }) => {
  const { availableModels, model, loadModel } = useAIModel();
  
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [benchmarkLoading, setBenchmarkLoading] = useState(false);
  const [benchmarkResults, setBenchmarkResults] = useState<BenchmarkResult | undefined>(undefined);
  const [benchmarkProgress, setBenchmarkProgress] = useState(0);
  const [performanceBenchmark, setPerformanceBenchmark] = useState<{
    averageTime: number;
    minTime: number;
    maxTime: number;
    memoryUsage: number;
  } | undefined>(undefined);
  const [iterations, setIterations] = useState(10);
  
  const handleSelectModel = async (modelId: string) => {
    setSelectedModelId(modelId);
    setBenchmarkResults(undefined);
    setPerformanceBenchmark(undefined);
  };
  
  const handleRunTests = async () => {
    if (!selectedModelId) return;
    
    setIsLoading(true);
    setBenchmarkResults(undefined);
    
    try {
      if (!model) {
        await loadModel(selectedModelId);
      }
      
      const results = await testModel(selectedModelId);
      setBenchmarkResults(results);
    } catch (error) {
      console.error('Error running tests:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRunBenchmark = async () => {
    if (!selectedModelId) return;
    
    setBenchmarkLoading(true);
    setPerformanceBenchmark(undefined);
    
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += 100 / iterations;
      if (progress > 95) progress = 95;
      setBenchmarkProgress(progress);
    }, 100);
    
    try {
      if (!model) {
        await loadModel(selectedModelId);
      }
      
      const benchmark = await benchmarkModel(selectedModelId, iterations);
      setPerformanceBenchmark(benchmark);
      setBenchmarkProgress(100);
    } catch (error) {
      console.error('Error running benchmark:', error);
    } finally {
      clearInterval(progressInterval);
      setBenchmarkLoading(false);
    }
  };
  
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
  
  return (
    <Card className={`${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Zap className="mr-2 h-5 w-5 text-scottie" />
          Model Testing & Benchmarking
        </CardTitle>
        <CardDescription>
          Run tests and benchmarks on your AI models to evaluate performance and accuracy
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Select Model</label>
            <Select 
              value={selectedModelId || ''} 
              onValueChange={handleSelectModel}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a model to test" />
              </SelectTrigger>
              <SelectContent>
                {availableModels.map((aiModel) => (
                  <SelectItem key={aiModel.id} value={aiModel.id}>
                    {aiModel.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              variant="default"
              onClick={handleRunTests}
              disabled={!selectedModelId || isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <Zap className="mr-2 h-4 w-4 animate-spin" />
                  Running Tests...
                </span>
              ) : (
                <span className="flex items-center">
                  <Play className="mr-2 h-4 w-4" />
                  Run Tests
                </span>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={handleRunBenchmark}
              disabled={!selectedModelId || benchmarkLoading}
              className="flex-1"
            >
              {benchmarkLoading ? (
                <span className="flex items-center">
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Benchmarking...
                </span>
              ) : (
                <span className="flex items-center">
                  <BarChart className="mr-2 h-4 w-4" />
                  Benchmark
                </span>
              )}
            </Button>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Benchmark Iterations: {iterations}
            </label>
            <Slider 
              value={[iterations]} 
              min={1}
              max={50}
              step={1}
              onValueChange={(values) => setIterations(values[0])}
              disabled={benchmarkLoading}
              className="mb-2"
            />
            <p className="text-xs text-muted-foreground">
              More iterations provide more accurate benchmark results but take longer to complete.
            </p>
          </div>
          
          <Tabs defaultValue="tests" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="tests" className="flex items-center">
                <Play className="mr-2 h-4 w-4" />
                Test Results
              </TabsTrigger>
              <TabsTrigger value="benchmark" className="flex items-center">
                <BarChart className="mr-2 h-4 w-4" />
                Performance
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="tests">
              <ModelTestResults 
                benchmarkResult={benchmarkResults}
                isLoading={isLoading}
              />
            </TabsContent>
            
            <TabsContent value="benchmark">
              <Card>
                <CardContent className="py-6">
                  {benchmarkLoading ? (
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Benchmarking...</span>
                        <span className="text-sm font-medium">{Math.round(benchmarkProgress)}%</span>
                      </div>
                      <Progress value={benchmarkProgress} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-2">
                        Running {iterations} iterations to measure model performance.
                      </p>
                    </div>
                  ) : performanceBenchmark ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-muted/50 p-4 rounded-md">
                          <div className="text-xs text-muted-foreground mb-1">Average Inference Time</div>
                          <div className="flex items-end justify-between">
                            <div className="text-2xl font-semibold">
                              {formatTime(performanceBenchmark.averageTime)}
                            </div>
                            <Badge 
                              variant={performanceBenchmark.averageTime < 50 ? "default" : "outline"}
                              className={performanceBenchmark.averageTime < 50 ? "bg-green-500 hover:bg-green-600" : ""}
                            >
                              {performanceBenchmark.averageTime < 50 ? "Fast" : "Normal"}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="bg-muted/50 p-4 rounded-md">
                          <div className="text-xs text-muted-foreground mb-1">Memory Usage</div>
                          <div className="flex items-end justify-between">
                            <div className="text-2xl font-semibold">
                              {formatMemory(performanceBenchmark.memoryUsage)}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-muted/50 p-4 rounded-md">
                        <h3 className="text-sm font-medium mb-2">Performance Details</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-muted-foreground">Minimum Time</div>
                            <div className="text-sm">{formatTime(performanceBenchmark.minTime)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Maximum Time</div>
                            <div className="text-sm">{formatTime(performanceBenchmark.maxTime)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Iterations</div>
                            <div className="text-sm">{iterations}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Variance</div>
                            <div className="text-sm">
                              {formatTime(performanceBenchmark.maxTime - performanceBenchmark.minTime)}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border rounded-md overflow-hidden">
                        <div className="bg-muted/50 px-4 py-2 font-medium flex items-center">
                          <Laptop className="h-4 w-4 mr-2 text-scottie" />
                          System Information
                        </div>
                        <div className="p-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="text-xs text-muted-foreground">Backend</div>
                              <div>{window.navigator.userAgent.includes('WebKit') ? 'WebGL' : 'CPU'}</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Browser</div>
                              <div>
                                {window.navigator.userAgent.includes('Chrome') ? 'Chrome' : 
                                  window.navigator.userAgent.includes('Firefox') ? 'Firefox' : 
                                  window.navigator.userAgent.includes('Safari') ? 'Safari' : 'Other'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <BarChart className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p>Run a benchmark to see performance results</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
      
      <CardFooter className="border-t bg-muted/50 px-6 py-4 flex flex-col items-start">
        <h4 className="text-sm font-medium mb-1">Why Test Your Models?</h4>
        <p className="text-xs text-muted-foreground mb-2">
          Testing and benchmarking help identify performance bottlenecks, accuracy issues, and edge cases in your AI models.
        </p>
        <div className="flex items-center text-xs text-amber-500 mt-1">
          <AlertCircle className="h-3 w-3 mr-1" />
          For production use, run more comprehensive tests with larger datasets.
        </div>
      </CardFooter>
    </Card>
  );
};

export default ModelTester;
