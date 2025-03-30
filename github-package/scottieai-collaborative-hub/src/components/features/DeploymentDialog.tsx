import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Rocket, Github, ExternalLink, Server, Globe, Code, CheckCircle } from 'lucide-react';
import { deployToVercel, deployToNetlify, deployToGitHubPages, DeploymentOptions } from '@/services/deploymentService';

interface DeploymentDialogProps {
  projectId: string;
  projectName: string;
  technologies: string[];
  onDeploymentComplete: (url: string) => void;
  trigger?: React.ReactNode;
}

const DeploymentDialog: React.FC<DeploymentDialogProps> = ({
  projectId,
  projectName,
  technologies,
  onDeploymentComplete,
  trigger
}) => {
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<'vercel' | 'netlify' | 'github-pages' | 'custom'>('vercel');
  const [customDomain, setCustomDomain] = useState('');
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentProgress, setDeploymentProgress] = useState(0);
  const [deploymentUrl, setDeploymentUrl] = useState('');
  const [deploymentSuccess, setDeploymentSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('platform');
  const [deploymentOptions, setDeploymentOptions] = useState<DeploymentOptions>({
    buildCommand: 'npm run build',
    outputDirectory: 'dist',
    environmentVariables: {},
    framework: 'react'
  });

  const handleDeploy = async () => {
    setIsDeploying(true);
    setDeploymentProgress(0);
    setDeploymentSuccess(false);
    
    const progressInterval = setInterval(() => {
      setDeploymentProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 1000);
    
    try {
      let result;
      
      switch (platform) {
        case 'vercel':
          result = await deployToVercel(projectId, deploymentOptions);
          break;
        case 'netlify':
          result = await deployToNetlify(projectId, deploymentOptions);
          break;
        case 'github-pages':
          result = await deployToGitHubPages(projectId, deploymentOptions);
          break;
        case 'custom':
          // For custom deployment, we'd typically generate deployment files
          // and provide instructions, but for now we'll simulate success
          result = { 
            success: true, 
            deploymentUrl: customDomain || `https://${projectName.toLowerCase().replace(/\s+/g, '-')}.example.com` 
          };
          break;
      }
      
      clearInterval(progressInterval);
      
      if (result.success) {
        setDeploymentProgress(100);
        setDeploymentUrl(result.deploymentUrl);
        setDeploymentSuccess(true);
        onDeploymentComplete(result.deploymentUrl);
        toast.success(`Deployment to ${getPlatformName(platform)} successful!`);
      } else {
        throw new Error(result.error || 'Deployment failed');
      }
    } catch (error) {
      clearInterval(progressInterval);
      setDeploymentProgress(0);
      toast.error(`Deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDeploying(false);
    }
  };
  
  const getPlatformName = (platform: string): string => {
    switch (platform) {
      case 'vercel': return 'Vercel';
      case 'netlify': return 'Netlify';
      case 'github-pages': return 'GitHub Pages';
      case 'custom': return 'Custom Domain';
      default: return platform;
    }
  };
  
  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'vercel': return <Rocket className="h-5 w-5" />;
      case 'netlify': return <Globe className="h-5 w-5" />;
      case 'github-pages': return <Github className="h-5 w-5" />;
      case 'custom': return <Server className="h-5 w-5" />;
      default: return <Code className="h-5 w-5" />;
    }
  };
  
  const handleUpdateOptions = (key: keyof DeploymentOptions, value: any) => {
    setDeploymentOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  const handleAddEnvVar = (key: string, value: string) => {
    setDeploymentOptions(prev => ({
      ...prev,
      environmentVariables: {
        ...prev.environmentVariables,
        [key]: value
      }
    }));
  };
  
  const handleRemoveEnvVar = (key: string) => {
    setDeploymentOptions(prev => {
      const newEnvVars = { ...prev.environmentVariables };
      delete newEnvVars[key];
      return {
        ...prev,
        environmentVariables: newEnvVars
      };
    });
  };
  
  const handleFrameworkChange = (framework: string) => {
    // Update build command and output directory based on framework
    let buildCommand = 'npm run build';
    let outputDirectory = 'dist';
    
    switch (framework) {
      case 'react':
        buildCommand = 'npm run build';
        outputDirectory = 'dist';
        break;
      case 'next':
        buildCommand = 'npm run build';
        outputDirectory = '.next';
        break;
      case 'vue':
        buildCommand = 'npm run build';
        outputDirectory = 'dist';
        break;
      case 'angular':
        buildCommand = 'ng build --prod';
        outputDirectory = 'dist';
        break;
      case 'svelte':
        buildCommand = 'npm run build';
        outputDirectory = 'public/build';
        break;
    }
    
    setDeploymentOptions(prev => ({
      ...prev,
      framework,
      buildCommand,
      outputDirectory
    }));
  };
  
  // Detect recommended platform based on technologies
  const getRecommendedPlatform = (): string => {
    const techLower = technologies.map(t => t.toLowerCase());
    
    if (techLower.includes('next.js') || techLower.includes('nextjs')) {
      return 'Vercel is recommended for Next.js projects';
    } else if (techLower.includes('react')) {
      return 'Vercel or Netlify are both great for React projects';
    } else if (techLower.includes('vue')) {
      return 'Netlify is recommended for Vue projects';
    } else if (techLower.includes('angular')) {
      return 'Vercel or GitHub Pages work well for Angular projects';
    } else if (techLower.includes('static') || techLower.includes('html')) {
      return 'GitHub Pages is perfect for static websites';
    }
    
    return 'All platforms support your project technologies';
  };
  
  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)}>{trigger}</div>
      ) : (
        <Button 
          onClick={() => setOpen(true)} 
          className="w-full mt-4 bg-scottie hover:bg-scottie-secondary"
        >
          <Rocket className="mr-2 h-4 w-4" />
          Deploy Project
        </Button>
      )}
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Deploy Project</DialogTitle>
            <DialogDescription>
              Deploy your project to a hosting platform or custom domain.
            </DialogDescription>
          </DialogHeader>
          
          {!deploymentSuccess ? (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="platform">Platform</TabsTrigger>
                <TabsTrigger value="options">Options</TabsTrigger>
                <TabsTrigger value="environment">Environment</TabsTrigger>
              </TabsList>
              
              <TabsContent value="platform" className="space-y-4">
                <div className="text-sm text-muted-foreground mb-4">
                  {getRecommendedPlatform()}
                </div>
                
                <RadioGroup value={platform} onValueChange={(value: any) => setPlatform(value)}>
                  <div className="flex items-center space-x-2 mb-3">
                    <RadioGroupItem value="vercel" id="vercel" />
                    <Label htmlFor="vercel" className="flex items-center">
                      <Rocket className="mr-2 h-4 w-4" />
                      Vercel
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 mb-3">
                    <RadioGroupItem value="netlify" id="netlify" />
                    <Label htmlFor="netlify" className="flex items-center">
                      <Globe className="mr-2 h-4 w-4" />
                      Netlify
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 mb-3">
                    <RadioGroupItem value="github-pages" id="github-pages" />
                    <Label htmlFor="github-pages" className="flex items-center">
                      <Github className="mr-2 h-4 w-4" />
                      GitHub Pages
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="custom" id="custom" />
                    <Label htmlFor="custom" className="flex items-center">
                      <Server className="mr-2 h-4 w-4" />
                      Custom Domain
                    </Label>
                  </div>
                </RadioGroup>
                
                {platform === 'custom' && (
                  <div className="mt-4">
                    <Label htmlFor="custom-domain">Custom Domain</Label>
                    <Input
                      id="custom-domain"
                      placeholder="https://example.com"
                      value={customDomain}
                      onChange={(e) => setCustomDomain(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="options" className="space-y-4">
                <div>
                  <Label htmlFor="framework">Framework</Label>
                  <select
                    id="framework"
                    className="w-full p-2 border rounded mt-1"
                    value={deploymentOptions.framework}
                    onChange={(e) => handleFrameworkChange(e.target.value)}
                  >
                    <option value="react">React</option>
                    <option value="next">Next.js</option>
                    <option value="vue">Vue.js</option>
                    <option value="angular">Angular</option>
                    <option value="svelte">Svelte</option>
                    <option value="static">Static HTML</option>
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="build-command">Build Command</Label>
                  <Input
                    id="build-command"
                    value={deploymentOptions.buildCommand}
                    onChange={(e) => handleUpdateOptions('buildCommand', e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="output-dir">Output Directory</Label>
                  <Input
                    id="output-dir"
                    value={deploymentOptions.outputDirectory}
                    onChange={(e) => handleUpdateOptions('outputDirectory', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="environment" className="space-y-4">
                <div className="text-sm text-muted-foreground mb-4">
                  Add environment variables for your deployment
                </div>
                
                {Object.entries(deploymentOptions.environmentVariables || {}).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Input
                      value={key}
                      disabled
                      className="flex-1"
                    />
                    <Input
                      value={value}
                      onChange={(e) => handleAddEnvVar(key, e.target.value)}
                      className="flex-1"
                      type="password"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveEnvVar(key)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="KEY"
                    id="env-key"
                    className="flex-1"
                  />
                  <Input
                    placeholder="VALUE"
                    id="env-value"
                    className="flex-1"
                    type="password"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const key = (document.getElementById('env-key') as HTMLInputElement).value;
                      const value = (document.getElementById('env-value') as HTMLInputElement).value;
                      if (key && value) {
                        handleAddEnvVar(key, value);
                        (document.getElementById('env-key') as HTMLInputElement).value = '';
                        (document.getElementById('env-value') as HTMLInputElement).value = '';
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>
              </TabsContent>
              
              <DialogFooter className="mt-6">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleDeploy} 
                  disabled={isDeploying}
                  className="bg-scottie hover:bg-scottie-secondary"
                >
                  {isDeploying ? 'Deploying...' : 'Deploy to ' + getPlatformName(platform)}
                </Button>
              </DialogFooter>
              
              {isDeploying && (
                <div className="mt-4 space-y-2">
                  <Progress value={deploymentProgress} className="h-2" />
                  <p className="text-xs text-center text-muted-foreground">
                    Deploying to {getPlatformName(platform)}... {deploymentProgress}%
                  </p>
                </div>
              )}
            </Tabs>
          ) : (
            <div className="py-6 space-y-6">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="rounded-full bg-green-100 p-3 mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Deployment Successful!</h3>
                <p className="text-muted-foreground mb-4">
                  Your project has been successfully deployed to {getPlatformName(platform)}.
                </p>
                
                <div className="flex items-center justify-center space-x-2 bg-muted p-3 rounded-md w-full">
                  <span className="text-muted-foreground">{deploymentUrl}</span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(deploymentUrl);
                      toast.success('URL copied to clipboard');
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </div>
              
              <div className="flex justify-center space-x-4">
                <Button 
                  variant="outline" 
                  onClick={() => setOpen(false)}
                >
                  Close
                </Button>
                <Button 
                  className="bg-scottie hover:bg-scottie-secondary"
                  onClick={() => window.open(deploymentUrl, '_blank')}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Visit Site
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DeploymentDialog;
