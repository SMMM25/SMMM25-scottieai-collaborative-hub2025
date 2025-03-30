
import React, { useState } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { deployToProvider, DeploymentPlatform } from '@/services/deploymentService';
import PlatformSelector from './PlatformSelector';
import DeploymentSettings from './DeploymentSettings';

interface DeploymentDialogProps {
  projectId: string;
  projectName: string;
  technologies: string[];
  trigger?: React.ReactNode;
  onDeploymentComplete?: (url: string) => void;
}

const DeploymentDialog: React.FC<DeploymentDialogProps> = ({
  projectId,
  projectName,
  technologies,
  trigger,
  onDeploymentComplete
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<DeploymentPlatform>('vercel');
  const [isDeploying, setIsDeploying] = useState(false);
  const [advancedSettings, setAdvancedSettings] = useState({
    buildCommand: 'npm run build',
    outputDirectory: 'dist',
    environmentVariables: ''
  });

  const handleDeploy = async () => {
    setIsDeploying(true);
    
    try {
      // Parse environment variables
      const envVars = {};
      if (advancedSettings.environmentVariables) {
        advancedSettings.environmentVariables.split('\n').forEach(line => {
          const [key, value] = line.split('=');
          if (key && value) {
            envVars[key.trim()] = value.trim();
          }
        });
      }
      
      // Deploy to selected platform
      const deployFn = deployToProvider(selectedPlatform);
      const result = await deployFn(projectId, {
        platform: selectedPlatform,
        buildCommand: advancedSettings.buildCommand,
        outputDirectory: advancedSettings.outputDirectory,
        environmentVariables: envVars
      });
      
      if (result.success && result.deploymentUrl) {
        if (onDeploymentComplete) {
          onDeploymentComplete(result.deploymentUrl);
        }
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Deployment error:', error);
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="w-full bg-scottie hover:bg-scottie-secondary">
            Deploy Project
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Deploy Project</DialogTitle>
          <DialogDescription>
            Choose a hosting platform to deploy <span className="font-medium">{projectName}</span>
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="platform" className="mt-6">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="platform">Platform</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="platform" className="space-y-4 mt-4">
            <PlatformSelector 
              selectedPlatform={selectedPlatform} 
              onSelectPlatform={setSelectedPlatform} 
            />
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-4 mt-4">
            <DeploymentSettings
              advancedSettings={advancedSettings}
              setAdvancedSettings={setAdvancedSettings}
              technologies={technologies}
            />
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="mt-6 flex gap-3">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeploy} 
            className="bg-scottie hover:bg-scottie-secondary"
            disabled={isDeploying}
          >
            {isDeploying ? 'Deploying...' : `Deploy to ${selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeploymentDialog;
