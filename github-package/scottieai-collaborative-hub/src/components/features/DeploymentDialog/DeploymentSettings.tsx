
import React from 'react';
import { Code2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface DeploymentSettingsProps {
  advancedSettings: {
    buildCommand: string;
    outputDirectory: string;
    environmentVariables: string;
  };
  setAdvancedSettings: React.Dispatch<React.SetStateAction<{
    buildCommand: string;
    outputDirectory: string;
    environmentVariables: string;
  }>>;
  technologies: string[];
}

const DeploymentSettings: React.FC<DeploymentSettingsProps> = ({
  advancedSettings,
  setAdvancedSettings,
  technologies
}) => {
  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="buildCommand">Build Command</Label>
        <Input
          id="buildCommand"
          value={advancedSettings.buildCommand}
          onChange={(e) => setAdvancedSettings({
            ...advancedSettings,
            buildCommand: e.target.value
          })}
        />
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="outputDirectory">Output Directory</Label>
        <Input
          id="outputDirectory"
          value={advancedSettings.outputDirectory}
          onChange={(e) => setAdvancedSettings({
            ...advancedSettings,
            outputDirectory: e.target.value
          })}
        />
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="envVars">Environment Variables (one per line, KEY=VALUE)</Label>
        <textarea
          id="envVars"
          className="flex h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="API_KEY=your_api_key_here&#10;DATABASE_URL=your_database_url_here"
          value={advancedSettings.environmentVariables}
          onChange={(e) => setAdvancedSettings({
            ...advancedSettings,
            environmentVariables: e.target.value
          })}
        />
      </div>
      
      <div className="rounded-md bg-blue-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <Code2 className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Detected Technologies
            </h3>
            <div className="mt-2 text-sm text-blue-700 flex flex-wrap gap-2">
              {technologies.map((tech, index) => (
                <Badge key={index} variant="outline" className="bg-blue-100">
                  {tech}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeploymentSettings;
