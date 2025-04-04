import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-screen w-full bg-white">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg font-medium">Loading...</p>
      </div>
    </div>
  );
};
