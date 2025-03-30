
import React from 'react';
import { 
  Brain, 
  Code, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  Zap,
  Cpu,
  LineChart,
  Sparkles
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ProcessingStep {
  id: string;
  name: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  progress: number;
  details?: string;
}

interface AIProcessingDetailsProps {
  processingSteps?: ProcessingStep[];
  aiModels?: string[];
  isProcessing: boolean;
  isLearning?: boolean;
  className?: string;
}

const AIProcessingDetails: React.FC<AIProcessingDetailsProps> = ({
  processingSteps = [],
  aiModels = [],
  isProcessing,
  isLearning = false,
  className = ""
}) => {
  // Calculate overall progress
  const calculateOverallProgress = (): number => {
    if (processingSteps.length === 0) return 0;
    
    const total = processingSteps.reduce((sum, step) => sum + step.progress, 0);
    return Math.round(total / processingSteps.length);
  };
  
  return (
    <Card className={`bg-card border ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center">
          <Brain className="mr-2 h-5 w-5 text-scottie" />
          AI Processing
        </CardTitle>
        <CardDescription>
          ScottieAI is using these models to analyze and enhance your code
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Overall Progress */}
        {isProcessing && processingSteps.length > 0 && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm">{calculateOverallProgress()}%</span>
            </div>
            <Progress value={calculateOverallProgress()} className="h-2" />
          </div>
        )}
      
        {/* AI Models being used */}
        {aiModels.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-2">AI Models</h3>
            <div className="flex flex-wrap gap-2">
              {aiModels.map((model, index) => (
                <TooltipProvider key={index}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge key={index} variant="outline" className="bg-scottie-light/20">
                        {model.includes('OWL') ? (
                          <Brain className="mr-1 h-3 w-3 text-scottie" />
                        ) : model.includes('LangChain') ? (
                          <Zap className="mr-1 h-3 w-3 text-scottie" />
                        ) : model.includes('TensorFlow') ? (
                          <Cpu className="mr-1 h-3 w-3 text-scottie" />
                        ) : model.includes('CodeBERT') ? (
                          <Code className="mr-1 h-3 w-3 text-scottie" />
                        ) : model.includes('Analyzer') ? (
                          <LineChart className="mr-1 h-3 w-3 text-scottie" />
                        ) : model.includes('SelfLearn') ? (
                          <Sparkles className="mr-1 h-3 w-3 text-scottie" />
                        ) : (
                          <Zap className="mr-1 h-3 w-3 text-scottie" />
                        )}
                        {model}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Using {model} for code analysis and enhancements</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>
        )}
        
        {/* Processing Steps */}
        {processingSteps.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2">Processing Steps</h3>
            <div className="space-y-3">
              {processingSteps.map((step) => (
                <div key={step.id} className="border-b pb-2 last:border-b-0 last:pb-0">
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center">
                      {step.status === 'pending' && (
                        <Code className="mr-2 h-4 w-4 text-muted-foreground" />
                      )}
                      {step.status === 'in-progress' && (
                        <Loader2 className="mr-2 h-4 w-4 text-scottie animate-spin" />
                      )}
                      {step.status === 'completed' && (
                        <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                      )}
                      {step.status === 'failed' && (
                        <AlertCircle className="mr-2 h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm">
                        {step.name}
                      </span>
                    </div>
                    <Badge 
                      variant={step.status === 'completed' ? 'default' : 'outline'}
                      className={
                        step.status === 'completed' ? 'bg-green-500 hover:bg-green-500' : 
                        step.status === 'in-progress' ? 'text-scottie border-scottie' : 
                        step.status === 'failed' ? 'text-red-500 border-red-500' : ''
                      }
                    >
                      {step.status === 'pending' && 'Pending'}
                      {step.status === 'in-progress' && 'Processing'}
                      {step.status === 'completed' && 'Complete'}
                      {step.status === 'failed' && 'Failed'}
                    </Badge>
                  </div>
                  {(step.status === 'in-progress' || step.status === 'completed') && (
                    <Progress value={step.progress} className="h-1" />
                  )}
                  {step.details && (
                    <p className="text-xs text-muted-foreground mt-1">{step.details}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Real-time AI insights */}
        {isProcessing && processingSteps.some(step => step.status === 'in-progress' || step.status === 'completed') && (
          <div className="mt-4 p-3 bg-scottie-light/10 rounded-md border border-scottie/20">
            <h4 className="text-sm font-medium flex items-center text-scottie">
              <Brain className="mr-1 h-3 w-3" />
              Real-time AI Insights
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              TensorFlow.js models are analyzing your code structure and patterns...
            </p>
          </div>
        )}
        
        {/* Self-learning status */}
        {isLearning && (
          <div className="mt-4 p-3 bg-scottie-light/10 rounded-md border border-scottie/20">
            <h4 className="text-sm font-medium flex items-center text-scottie">
              <Sparkles className="mr-1 h-3 w-3" />
              Self-Learning in Progress
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              ScottieAI is identifying patterns in your code and learning to improve recommendations...
            </p>
          </div>
        )}
        
        {/* Show placeholder if no processing is happening */}
        {!isProcessing && processingSteps.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <Code className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>Upload and process a code package to see AI analysis in action</p>
          </div>
        )}
      </CardContent>
      
      {processingSteps.length > 0 && processingSteps.every(step => step.status === 'completed') && (
        <CardFooter className="border-t bg-muted/50 px-6 py-4">
          <div className="w-full">
            <h4 className="text-sm font-medium mb-1">AI Analysis Complete</h4>
            <p className="text-xs text-muted-foreground">
              TensorFlow.js has analyzed your code and identified optimization opportunities. LangChain agents have been configured for your project.
              {isLearning && ' Self-learning capabilities have been initialized.'}
            </p>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default AIProcessingDetails;
