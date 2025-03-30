
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink, Package, Loader2 } from 'lucide-react';

interface DeploymentOptionsProps {
  processComplete: boolean;
  deploymentUrl: string | null;
  windowsPackageUrl: string | null;
  onDeploy: () => Promise<void>;
  onExportWindows: () => Promise<void>;
}

const DeploymentOptions = ({
  processComplete,
  deploymentUrl,
  windowsPackageUrl,
  onDeploy,
  onExportWindows
}: DeploymentOptionsProps) => {
  const [isDeploying, setIsDeploying] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const handleDeploy = async () => {
    setIsDeploying(true);
    try {
      await onDeploy();
    } finally {
      setIsDeploying(false);
    }
  };
  
  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExportWindows();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-card rounded-lg border p-6">
      <h2 className="text-xl font-semibold mb-4">Deployment Options</h2>
      <p className="text-muted-foreground mb-6">
        Choose how to deploy or package your project with AI integrations:
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-6 hover:border-scottie hover:shadow-md transition-all">
          <h3 className="font-medium text-lg mb-2">Vercel Deployment</h3>
          <p className="text-muted-foreground mb-4">
            Deploy your web application with OWL AI and LangChain integrations directly to Vercel.
          </p>
          
          {deploymentUrl ? (
            <div className="space-y-3">
              <div className="p-3 bg-green-50 text-green-700 rounded-md text-sm">
                Deployment successful! Your AI-enhanced app is live.
              </div>
              <Button 
                className="w-full flex items-center justify-center"
                variant="outline"
                asChild
              >
                <a href={deploymentUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Visit Deployed Site
                </a>
              </Button>
            </div>
          ) : (
            <Button 
              className="w-full bg-black hover:bg-gray-800 text-white"
              disabled={!processComplete || isDeploying}
              onClick={handleDeploy}
            >
              {isDeploying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deploying...
                </>
              ) : (
                "Deploy to Vercel"
              )}
            </Button>
          )}
        </div>
        
        <div className="border rounded-lg p-6 hover:border-scottie hover:shadow-md transition-all">
          <h3 className="font-medium text-lg mb-2">Windows Package</h3>
          <p className="text-muted-foreground mb-4">
            Package your application with AI capabilities as a Windows executable using Electron.
          </p>
          
          {windowsPackageUrl ? (
            <div className="space-y-3">
              <div className="p-3 bg-green-50 text-green-700 rounded-md text-sm">
                Windows package created with OWL AI and LangChain integration!
              </div>
              <Button 
                className="w-full flex items-center justify-center"
                variant="outline"
                asChild
              >
                <a href={windowsPackageUrl} target="_blank" rel="noopener noreferrer">
                  <Package className="mr-2 h-4 w-4" />
                  Download Windows App
                </a>
              </Button>
            </div>
          ) : (
            <Button 
              variant="outline"
              className="w-full"
              disabled={!processComplete || isExporting}
              onClick={handleExport}
            >
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Windows Package...
                </>
              ) : (
                "Create Windows Package"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeploymentOptions;
