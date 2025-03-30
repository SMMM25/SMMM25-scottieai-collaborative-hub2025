
import React from 'react';
import { Brain, Zap, Cog, Package } from 'lucide-react';

const AIFeatures = () => {
  return (
    <div className="bg-card rounded-lg border p-6">
      <h2 className="text-xl font-semibold mb-2">ScottieAI Features</h2>
      <p className="text-muted-foreground mb-4">
        Our AI enhances your code with:
      </p>
      <ul className="space-y-2">
        <li className="flex items-center">
          <Brain className="h-4 w-4 text-scottie mr-2" />
          <span>OWL AI Multi-Modal Analysis</span>
        </li>
        <li className="flex items-center">
          <Zap className="h-4 w-4 text-scottie mr-2" />
          <span>LangChain Agent Integration</span>
        </li>
        <li className="flex items-center">
          <Cog className="h-4 w-4 text-scottie mr-2" />
          <span>Code Optimization & Self-Healing</span>
        </li>
        <li className="flex items-center">
          <Package className="h-4 w-4 text-scottie mr-2" />
          <span>Automated Deployment</span>
        </li>
      </ul>
    </div>
  );
};

export default AIFeatures;
