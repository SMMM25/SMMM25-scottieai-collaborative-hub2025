
import { toast } from 'sonner';
import { DeploymentPlatform } from '@/services/deploymentService';

// Helper function to simulate deployment process with realistic steps
export const simulateDeploymentProcess = async (platform: DeploymentPlatform): Promise<void> => {
  const steps = [
    { message: `Preparing ${platform} deployment environment...`, duration: 800 },
    { message: 'Building project...', duration: 1200 },
    { message: 'Optimizing assets...', duration: 600 },
    { message: 'Running tests...', duration: 500 },
    { message: `Uploading to ${platform}...`, duration: 900 },
    { message: 'Configuring deployment settings...', duration: 700 },
    { message: 'Finalizing deployment...', duration: 500 }
  ];
  
  for (const step of steps) {
    toast.info(step.message);
    await new Promise(resolve => setTimeout(resolve, step.duration));
  }
};

// Helper function to detect framework from technologies
export const detectFramework = (technologies: string[]): string => {
  if (technologies.includes('Next.js')) return 'nextjs';
  if (technologies.includes('React')) return 'react';
  if (technologies.includes('Vue.js')) return 'vue';
  if (technologies.includes('Angular')) return 'angular';
  return 'react'; // Default to React
};

// Helper function to generate a deployment URL
export const generateDeploymentUrl = (
  platform: DeploymentPlatform, 
  projectName: string, 
  projectId: string
): string => {
  const sanitizedName = projectName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  
  switch (platform) {
    case 'vercel':
      return `https://${sanitizedName}-${projectId.substring(0, 8)}.vercel.app`;
    case 'netlify':
      return `https://${sanitizedName}-${projectId.substring(0, 6)}.netlify.app`;
    case 'aws-amplify':
      return `https://${projectId.substring(0, 8)}.amplifyapp.com`;
    case 'github-pages':
      return `https://username.github.io/${sanitizedName}`;
    default:
      return `https://${sanitizedName}.example.com`;
  }
};
