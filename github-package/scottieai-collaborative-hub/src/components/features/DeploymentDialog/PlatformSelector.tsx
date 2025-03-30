
import React from 'react';
import { Server, Globe, Zap, Github } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { DeploymentPlatform } from '@/services/deploymentService';

interface PlatformSelectorProps {
  selectedPlatform: DeploymentPlatform;
  onSelectPlatform: (platform: DeploymentPlatform) => void;
}

const PlatformSelector: React.FC<PlatformSelectorProps> = ({
  selectedPlatform,
  onSelectPlatform
}) => {
  const platforms = [
    {
      id: 'vercel' as DeploymentPlatform,
      name: 'Vercel',
      description: 'Deploy with a single click to Vercel for the best frontend experience.',
      icon: <Server className="h-6 w-6" />,
      isRecommended: true
    },
    {
      id: 'netlify' as DeploymentPlatform,
      name: 'Netlify',
      description: 'Deploy to Netlify for a seamless CI/CD workflow and edge functions.',
      icon: <Globe className="h-6 w-6" />
    },
    {
      id: 'aws-amplify' as DeploymentPlatform,
      name: 'AWS Amplify',
      description: 'Deploy to AWS Amplify for scalable and secure cloud hosting.',
      icon: <Zap className="h-6 w-6" />
    },
    {
      id: 'github-pages' as DeploymentPlatform,
      name: 'GitHub Pages',
      description: 'Deploy to GitHub Pages for simple static site hosting.',
      icon: <Github className="h-6 w-6" />
    }
  ];

  return (
    <div className="grid gap-4">
      {platforms.map((platform) => (
        <Card 
          key={platform.id} 
          className={`cursor-pointer transition-all border-2 ${
            selectedPlatform === platform.id 
              ? 'border-scottie' 
              : 'border-transparent hover:border-scottie/30'
          }`}
          onClick={() => onSelectPlatform(platform.id)}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center">
              <div className="mr-3">
                {platform.icon}
              </div>
              <div>
                <CardTitle>{platform.name}</CardTitle>
              </div>
            </div>
            {platform.isRecommended && (
              <Badge variant="outline" className="bg-scottie-light/30">
                Recommended
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            <CardDescription>{platform.description}</CardDescription>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default PlatformSelector;
