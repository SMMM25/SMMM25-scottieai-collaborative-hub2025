
import React from 'react';
import { toast } from "sonner";
import { Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FileUploader from '@/components/features/FileUploader';
import { Progress } from '@/components/ui/progress';

interface UploadSectionProps {
  uploadedFile: File | null;
  isProcessing: boolean;
  processComplete: boolean;
  processingProgress: number;
  onFileUpload: (file: File) => void;
  onProcess: () => void;
  onViewProject: () => void;
}

const UploadSection = ({
  uploadedFile,
  isProcessing,
  processComplete,
  processingProgress,
  onFileUpload,
  onProcess,
  onViewProject
}: UploadSectionProps) => {
  return (
    <div className="bg-card rounded-lg border p-6">
      <h2 className="text-xl font-semibold mb-4">Upload Code Package</h2>
      <FileUploader onFileUpload={onFileUpload} />
      
      {uploadedFile && !processComplete && (
        <div className="mt-6">
          {isProcessing ? (
            <div className="space-y-3">
              <Progress value={processingProgress} className="h-2" />
              <div className="text-center text-sm text-muted-foreground">
                {processingProgress < 30 && "Analyzing code structure..."}
                {processingProgress >= 30 && processingProgress < 60 && "Initializing OWL AI analysis..."}
                {processingProgress >= 60 && processingProgress < 80 && "Setting up LangChain agents..."}
                {processingProgress >= 80 && "Applying AI enhancements..."}
              </div>
            </div>
          ) : (
            <Button 
              onClick={onProcess} 
              className="w-full bg-scottie hover:bg-scottie-secondary"
            >
              <Zap className="mr-2 h-4 w-4" />
              Process with ScottieAI
            </Button>
          )}
        </div>
      )}
      
      {processComplete && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="text-green-700 font-medium">Processing Complete!</h3>
          <p className="text-green-600 text-sm mt-1">
            ScottieAI has successfully analyzed your code and created a new project with OWL AI and LangChain enhancements.
          </p>
          <div className="flex flex-wrap gap-3 mt-4">
            <Button 
              className="bg-scottie hover:bg-scottie-secondary"
              onClick={onViewProject}
            >
              <Zap className="mr-2 h-4 w-4" />
              View Project
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => window.location.href = '/integrations'}
            >
              <Zap className="mr-2 h-4 w-4" />
              Add More AI Features
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadSection;
