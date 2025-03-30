import React, { useState, useEffect } from 'react';
import { toast } from "sonner";
import { ArrowLeft, Code2, Zap, Brain, Cog, Sparkles, Cpu, BarChart, Download } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { useAuth } from '../contexts/AuthContext';

export const UploadPage = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLearning, setIsLearning] = useState(false);
  const [processComplete, setProcessComplete] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  const [processingSteps, setProcessingSteps] = useState([]);
  const [aiModels, setAIModels] = useState<string[]>([]);
  const [deploymentUrl, setDeploymentUrl] = useState<string | null>(null);
  const [windowsPackageUrl, setWindowsPackageUrl] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('upload');
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);
  
  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
    
    setProcessComplete(false);
    setProcessingProgress(0);
    setProcessingSteps([]);
    setAIModels([]);
    setDeploymentUrl(null);
    setWindowsPackageUrl(null);
    setDownloadUrl(null);
  };
  
  const handleProcess = async () => {
    if (!uploadedFile) {
      return;
    }
    
    setIsProcessing(true);
    setIsLearning(true);
    setProcessingProgress(0);
    
    const progressInterval = setInterval(() => {
      setProcessingProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 500);
    
    try {
      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      clearInterval(progressInterval);
      setProcessingProgress(100);
      setIsProcessing(false);
      setProcessComplete(true);
      
      // Automatically switch to AI Process tab after completion
      setActiveTab('ai-process');
      
      setTimeout(() => {
        setIsLearning(false);
      }, 2000);
      
    } catch (error) {
      clearInterval(progressInterval);
      setIsProcessing(false);
      setIsLearning(false);
      console.error("Processing error:", error);
    }
  };
  
  const handleViewProject = () => {
    if (createdProjectId) {
      navigate('/projects');
    }
  };
  
  const tabTriggers = [
    { id: 'upload', label: 'Upload', icon: Code2 },
    { id: 'ai-process', label: 'AI Process', icon: Brain },
    { id: 'ai-models', label: 'AI Models', icon: Cpu },
    { id: 'self-learning', label: 'Self-Learning', icon: Sparkles },
    { id: 'testing', label: 'Testing', icon: BarChart },
    { id: 'integrations', label: 'AI Integrations', icon: Zap },
    { id: 'deploy', label: 'Deploy', icon: Cog }
  ];
  
  return (
    <div className="min-h-screen flex flex-col">
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link to="/" className="flex items-center text-muted-foreground hover:text-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Upload & Process Code</h1>
          <p className="text-muted-foreground mb-8">
            Upload your code package and let ScottieAI analyze and enhance your project.
          </p>
          
          {!user && (
            <Alert variant="destructive" className="mb-6">
              <AlertTitle>Authentication Required</AlertTitle>
              <AlertDescription>
                Please <Link to="/auth" className="font-medium underline">sign in</Link> to upload and process files.
              </AlertDescription>
            </Alert>
          )}
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6">
              {tabTriggers.map(trigger => (
                <TabsTrigger key={trigger.id} value={trigger.id} className="flex items-center">
                  <trigger.icon className="mr-2 h-4 w-4" />
                  {trigger.label}
                </TabsTrigger>
              ))}
            </TabsList>
            
            <TabsContent value="upload" className="space-y-6">
              <div className="bg-card rounded-lg border p-6">
                <h2 className="text-xl font-semibold mb-4">Upload Your Code Package</h2>
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <div className="mb-4">
                    <Code2 className="h-12 w-12 mx-auto text-muted-foreground" />
                  </div>
                  <p className="mb-4">Drag and drop your code package here, or click to browse</p>
                  <Button>Select File</Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="ai-process" className="space-y-6">
              <div className="bg-card rounded-lg border p-6">
                <h2 className="text-xl font-semibold mb-4">AI Processing</h2>
                <p>AI processing details would appear here</p>
              </div>
            </TabsContent>
            
            <TabsContent value="ai-models" className="space-y-6">
              <div className="bg-card rounded-lg border p-6">
                <h2 className="text-xl font-semibold mb-4">AI Models</h2>
                <p>AI model selection would appear here</p>
              </div>
            </TabsContent>
            
            <TabsContent value="self-learning" className="space-y-6">
              <div className="bg-card rounded-lg border p-6">
                <h2 className="text-xl font-semibold mb-4">Self-Learning Capabilities</h2>
                <p>Self-learning features would appear here</p>
              </div>
            </TabsContent>
            
            <TabsContent value="testing" className="space-y-6">
              <div className="bg-card rounded-lg border p-6">
                <h2 className="text-xl font-semibold mb-4">Testing</h2>
                <p>Testing features would appear here</p>
              </div>
            </TabsContent>
            
            <TabsContent value="integrations" className="space-y-6">
              <div className="bg-card rounded-lg border p-6">
                <h2 className="text-xl font-semibold mb-4">AI Integrations</h2>
                <p>Integration options would appear here</p>
              </div>
            </TabsContent>
            
            <TabsContent value="deploy" className="space-y-6">
              <div className="bg-card rounded-lg border p-6">
                <h2 className="text-xl font-semibold mb-4">Deployment Options</h2>
                <p>Deployment options would appear here</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
