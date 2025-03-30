import React from 'react';
import { ExternalLink, Plug, Package, Brain, Cpu, BarChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface Integration {
  id: string;
  name: string;
  description: string;
  category: 'AI' | 'Framework' | 'Deployment' | 'Tools' | 'Models';
  status: 'available' | 'coming-soon';
  icon?: React.ElementType;
  docsUrl?: string;
}

const integrations: Integration[] = [
  {
    id: 'langchain',
    name: 'LangChain',
    description: 'Connect and orchestrate language models for complex AI applications.',
    category: 'AI',
    status: 'available',
    icon: BarChart,
    docsUrl: 'https://js.langchain.com/docs/'
  },
  {
    id: 'owl',
    name: 'OWL AI',
    description: 'Advanced multi-modal AI system for understanding text, code, and images.',
    category: 'AI',
    status: 'available',
    icon: Brain,
    docsUrl: 'https://github.com/huggingface/transformers'
  },
  {
    id: 'huggingface',
    name: 'Hugging Face',
    description: 'Access thousands of state-of-the-art machine learning models.',
    category: 'AI',
    status: 'available',
    icon: Brain,
    docsUrl: 'https://huggingface.co/docs'
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'Integrate GPT models for advanced natural language capabilities.',
    category: 'AI',
    status: 'available',
    icon: Brain,
    docsUrl: 'https://platform.openai.com/docs'
  },
  {
    id: 'onnx',
    name: 'ONNX Runtime',
    description: 'Run optimized ML models locally for faster performance.',
    category: 'AI',
    status: 'available',
    icon: Cpu,
    docsUrl: 'https://onnxruntime.ai/'
  },
  {
    id: 'vercel',
    name: 'Vercel',
    description: 'Deploy projects automatically to Vercel hosting with one click.',
    category: 'Deployment',
    status: 'available',
    docsUrl: 'https://vercel.com/docs'
  },
  {
    id: 'docker',
    name: 'Docker',
    description: 'Package applications into containers for consistent deployment.',
    category: 'Deployment',
    status: 'coming-soon'
  },
  {
    id: 'electronjs',
    name: 'Electron.js',
    description: 'Build cross-platform desktop apps with web technologies.',
    category: 'Framework',
    status: 'coming-soon'
  },
  
  {
    id: 'tensorflow',
    name: 'TensorFlow.js',
    description: 'Run machine learning models directly in the browser.',
    category: 'Models',
    status: 'available',
    icon: Brain,
    docsUrl: 'https://www.tensorflow.org/js'
  },
  {
    id: 'transformers',
    name: 'Transformers.js',
    description: 'State-of-the-art NLP models running in the browser.',
    category: 'Models',
    status: 'available',
    icon: BarChart,
    docsUrl: 'https://huggingface.co/docs/transformers.js/en/index'
  },
  {
    id: 'onnx-models',
    name: 'ONNX Models',
    description: 'Open Neural Network Exchange models for cross-platform ML.',
    category: 'Models',
    status: 'available',
    icon: Cpu,
    docsUrl: 'https://onnx.ai/'
  },
  {
    id: 'selflearn',
    name: 'SelfLearn AI',
    description: 'Self-learning capabilities for code pattern recognition.',
    category: 'Models',
    status: 'available',
    icon: Brain
  }
];

interface IntegrationCardsProps {
  filter?: string[];
  className?: string;
  onConnect?: (integration: Integration) => void;
}

const IntegrationCards: React.FC<IntegrationCardsProps> = ({ 
  filter,
  className = "",
  onConnect
}) => {
  const navigate = useNavigate();
  
  const filteredIntegrations = filter 
    ? integrations.filter(integration => filter.includes(integration.category))
    : integrations;

  const handleConnect = (integration: Integration) => {
    if (onConnect) {
      onConnect(integration);
    } else {
      toast.success(`Connected to ${integration.name}`);
      
      if (integration.category === 'Models' || integration.category === 'AI') {
        navigate('/upload');
      }
    }
  };

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ${className}`}>
      {filteredIntegrations.map((integration) => (
        <Card key={integration.id} className="scottie-card">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg flex items-center">
                {integration.icon ? (
                  <integration.icon className="h-4 w-4 text-scottie mr-2" />
                ) : null}
                {integration.name}
              </CardTitle>
              <Badge variant={integration.status === 'available' ? 'default' : 'outline'}>
                {integration.status === 'available' ? 'Available' : 'Coming Soon'}
              </Badge>
            </div>
            <CardDescription>{integration.description}</CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <Badge variant="outline" className="bg-scottie-light/30">
              {integration.category}
            </Badge>
          </CardContent>
          <CardFooter>
            {integration.status === 'available' ? (
              <div className="flex gap-2 w-full">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => handleConnect(integration)}
                >
                  <Plug className="mr-2 h-4 w-4" />
                  Connect
                </Button>
                {integration.docsUrl && (
                  <Button 
                    variant="ghost" 
                    size="icon"
                    asChild
                  >
                    <a href={integration.docsUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            ) : (
              <Button variant="outline" disabled className="w-full">
                <Package className="mr-2 h-4 w-4" />
                Coming Soon
              </Button>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default IntegrationCards;
