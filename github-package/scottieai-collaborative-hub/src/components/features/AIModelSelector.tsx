import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Cpu, Sparkles, Brain, Zap, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { 
  getAvailableModels, 
  getModelLoadingStatus, 
  loadModelById,
  getUserModels,
  loadUserModel,
  deleteUserModel,
  getModelRecommendations
} from '@/services/aiModelService';
import { AIModelConfig } from '@/utils/modelUtils';
import { SupportedLanguage } from '@/utils/i18nUtils';

interface AIModelSelectorProps {
  aiModels: string[];
  onModelSelected: (modelId: string) => void;
  projectTechnologies?: string[];
}

const AIModelSelector: React.FC<AIModelSelectorProps> = ({ 
  aiModels, 
  onModelSelected,
  projectTechnologies = []
}) => {
  const [availableModels, setAvailableModels] = useState<AIModelConfig[]>([]);
  const [userModels, setUserModels] = useState<{id: string, language: SupportedLanguage, created_at: string}[]>([]);
  const [loadingStates, setLoadingStates] = useState<Record<string, {loading: boolean, progress: number}>>({});
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('en');
  const [recommendedModels, setRecommendedModels] = useState<AIModelConfig[]>([]);
  const [activeTab, setActiveTab] = useState('recommended');

  useEffect(() => {
    // Get available models
    const models = getAvailableModels();
    setAvailableModels(models);
    
    // Get recommended models based on project technologies
    if (projectTechnologies.length > 0) {
      const recommendations = getModelRecommendations(projectTechnologies);
      setRecommendedModels(recommendations);
    } else {
      // Default recommendations if no technologies specified
      setRecommendedModels(models.slice(0, 2));
    }
    
    // Initialize loading states
    const initialLoadingStates: Record<string, {loading: boolean, progress: number}> = {};
    models.forEach(model => {
      initialLoadingStates[model.id] = { loading: false, progress: 0 };
    });
    setLoadingStates(initialLoadingStates);
    
    // Get user's custom models
    fetchUserModels();
  }, [projectTechnologies]);
  
  const fetchUserModels = async () => {
    const models = await getUserModels();
    setUserModels(models);
  };

  const handleLoadModel = async (modelId: string) => {
    try {
      // Update loading state
      setLoadingStates(prev => ({
        ...prev,
        [modelId]: { loading: true, progress: 0 }
      }));
      
      // Load the model
      const model = await loadModelById(modelId, selectedLanguage);
      
      if (model) {
        // Update loading state
        setLoadingStates(prev => ({
          ...prev,
          [modelId]: { loading: false, progress: 100 }
        }));
        
        // Notify parent component
        onModelSelected(modelId);
        
        toast.success(`Model ${modelId} loaded successfully`);
      } else {
        throw new Error(`Failed to load model ${modelId}`);
      }
    } catch (error) {
      console.error(`Error loading model ${modelId}:`, error);
      
      // Update loading state
      setLoadingStates(prev => ({
        ...prev,
        [modelId]: { loading: false, progress: 0 }
      }));
      
      toast.error(`Failed to load model: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  const handleLoadUserModel = async (modelId: string, language: SupportedLanguage) => {
    try {
      // Update loading state
      setLoadingStates(prev => ({
        ...prev,
        [modelId]: { loading: true, progress: 0 }
      }));
      
      // Load the user model
      const model = await loadUserModel(modelId, language);
      
      if (model) {
        // Update loading state
        setLoadingStates(prev => ({
          ...prev,
          [modelId]: { loading: false, progress: 100 }
        }));
        
        // Notify parent component
        onModelSelected(modelId);
        
        toast.success(`Custom model loaded successfully`);
      } else {
        throw new Error(`Failed to load custom model`);
      }
    } catch (error) {
      console.error(`Error loading user model ${modelId}:`, error);
      
      // Update loading state
      setLoadingStates(prev => ({
        ...prev,
        [modelId]: { loading: false, progress: 0 }
      }));
      
      toast.error(`Failed to load custom model: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  const handleDeleteUserModel = async (modelId: string, language: SupportedLanguage) => {
    if (confirm('Are you sure you want to delete this custom model? This action cannot be undone.')) {
      const success = await deleteUserModel(modelId, language);
      if (success) {
        // Refresh user models
        fetchUserModels();
      }
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">AI Models</h2>
          <p className="text-muted-foreground">
            Select and manage AI models for your project
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Language:</span>
          <select 
            className="border rounded p-1 text-sm"
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value as SupportedLanguage)}
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="zh">Chinese</option>
            <option value="ja">Japanese</option>
          </select>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="recommended" className="flex items-center">
            <Sparkles className="mr-2 h-4 w-4" />
            Recommended
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center">
            <Cpu className="mr-2 h-4 w-4" />
            All Models
          </TabsTrigger>
          <TabsTrigger value="custom" className="flex items-center">
            <Brain className="mr-2 h-4 w-4" />
            Custom Models
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="recommended">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recommendedModels.map(model => (
              <ModelCard
                key={model.id}
                model={model}
                isLoading={loadingStates[model.id]?.loading || false}
                progress={loadingStates[model.id]?.progress || 0}
                isActive={aiModels.includes(model.id)}
                language={selectedLanguage}
                onLoad={() => handleLoadModel(model.id)}
              />
            ))}
            
            {recommendedModels.length === 0 && (
              <div className="col-span-2 text-center py-12 border border-dashed rounded-lg">
                <Info className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No recommended models</h3>
                <p className="text-muted-foreground">
                  Process a project first to get AI model recommendations
                </p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="all">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {availableModels.map(model => (
              <ModelCard
                key={model.id}
                model={model}
                isLoading={loadingStates[model.id]?.loading || false}
                progress={loadingStates[model.id]?.progress || 0}
                isActive={aiModels.includes(model.id)}
                language={selectedLanguage}
                onLoad={() => handleLoadModel(model.id)}
              />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="custom">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {userModels.map(model => (
              <Card key={model.id} className={`overflow-hidden`}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center">
                        <Brain className="mr-2 h-5 w-5 text-scottie" />
                        Custom Model
                      </CardTitle>
                      <CardDescription>
                        Created: {formatDate(model.created_at)}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="ml-2">
                      {model.language.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="secondary">Custom</Badge>
                    <Badge variant="secondary">Project-specific</Badge>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteUserModel(model.id, model.language)}
                  >
                    Delete
                  </Button>
                  <Button 
                    className="bg-scottie hover:bg-scottie-secondary"
                    size="sm"
                    onClick={() => handleLoadUserModel(model.id, model.language)}
                  >
                    Load Model
                  </Button>
                </CardFooter>
              </Card>
            ))}
            
            {userModels.length === 0 && (
              <div className="col-span-2 text-center py-12 border border-dashed rounded-lg">
                <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No custom models found</h3>
                <p className="text-muted-foreground">
                  Train custom models for your specific project needs
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface ModelCardProps {
  model: AIModelConfig;
  isLoading: boolean;
  progress: number;
  isActive: boolean;
  language: SupportedLanguage;
  onLoad: () => void;
}

const ModelCard: React.FC<ModelCardProps> = ({ 
  model, 
  isLoading, 
  progress, 
  isActive,
  language,
  onLoad 
}) => {
  // Check if model supports the selected language
  const supportsLanguage = !model.supportedLanguages || model.supportedLanguages.includes(language);
  
  return (
    <Card className={`overflow-hidden ${isActive ? 'border-scottie' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center">
              <Cpu className="mr-2 h-5 w-5 text-scottie" />
              {model.name}
            </CardTitle>
            <CardDescription>
              {model.description}
            </CardDescription>
          </div>
          <Badge variant="outline" className="ml-2">
            {model.size}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex flex-wrap gap-2 mb-4">
          {model.capabilities.map((capability, index) => (
            <Badge key={index} variant="secondary">{capability}</Badge>
          ))}
        </div>
        
        {!supportsLanguage && (
          <div className="flex items-center text-amber-500 text-sm mb-4">
            <AlertTriangle className="h-4 w-4 mr-2" />
            <span>This model doesn't support {language}. Will use English instead.</span>
          </div>
        )}
        
        {isActive && (
          <div className="flex items-center text-green-500 text-sm mb-4">
            <CheckCircle className="h-4 w-4 mr-2" />
            <span>Model is active and ready to use</span>
          </div>
        )}
        
        {isLoading && (
          <div className="space-y-2 mb-4">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-center text-muted-foreground">
              Loading... {progress}%
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full bg-scottie hover:bg-scottie-secondary"
          disabled={isLoading}
          onClick={onLoad}
        >
          {isActive ? 'Reload Model' : 'Load Model'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AIModelSelector;
