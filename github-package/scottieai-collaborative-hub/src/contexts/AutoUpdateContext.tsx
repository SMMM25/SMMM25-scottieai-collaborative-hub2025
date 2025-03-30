import { createContext, useContext, useState, useEffect } from 'react';
import { AutoUpdateSettings, CodeAnalysisResult, TechnologyUpdate } from '@/types/llm';
import { 
  useAutoUpdate, 
  defaultAutoUpdateSettings, 
  analyzeProjectCode, 
  getTechnologyUpdates 
} from '@/services/autoUpdateService';
import { toast } from 'sonner';
import CryptoJS from 'crypto-js';

// Secret key for encryption (in a real app, this would be stored securely)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'scottieai-secure-key-2025';

interface AutoUpdateContextProps {
  settings: AutoUpdateSettings;
  updateSettings: (newSettings: Partial<AutoUpdateSettings>) => Promise<AutoUpdateSettings>;
  isLoading: boolean;
  analysisResult: CodeAnalysisResult | null;
  technologyUpdates: TechnologyUpdate[];
  runAnalysis: () => Promise<CodeAnalysisResult | null>;
  applyUpdates: (recommendationIds: string[]) => Promise<boolean>;
  encryptData: (data: any) => string;
  decryptData: (encryptedData: string) => any;
}

const AutoUpdateContext = createContext<AutoUpdateContextProps | undefined>(undefined);

export const AutoUpdateProvider: React.FC<{ 
  children: React.ReactNode;
  projectId?: string;
}> = ({ children, projectId }) => {
  const {
    settings,
    updateSettings,
    isLoading,
    analysisResult,
    technologyUpdates,
    runAnalysis,
    applyUpdates
  } = useAutoUpdate(projectId || '');

  // Encryption function using AES
  const encryptData = (data: any): string => {
    try {
      const jsonString = JSON.stringify(data);
      return CryptoJS.AES.encrypt(jsonString, ENCRYPTION_KEY).toString();
    } catch (error) {
      console.error('Encryption error:', error);
      toast.error('Failed to encrypt data');
      return '';
    }
  };

  // Decryption function using AES
  const decryptData = (encryptedData: string): any => {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
      const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
      return JSON.parse(decryptedString);
    } catch (error) {
      console.error('Decryption error:', error);
      toast.error('Failed to decrypt data');
      return null;
    }
  };

  // Check for scheduled analysis on mount
  useEffect(() => {
    if (!projectId) return;

    const checkScheduledAnalysis = async () => {
      // Only check if auto-updates are enabled
      if (!settings.enabled) return;
      
      // Check if it's time for a scheduled scan
      const now = new Date();
      const nextScanDate = settings.nextScanDate ? new Date(settings.nextScanDate) : null;
      
      if (nextScanDate && now >= nextScanDate) {
        toast.info('Running scheduled code analysis...');
        await runAnalysis();
      }
    };

    checkScheduledAnalysis();
  }, [projectId, settings]);

  return (
    <AutoUpdateContext.Provider
      value={{
        settings,
        updateSettings,
        isLoading,
        analysisResult,
        technologyUpdates,
        runAnalysis,
        applyUpdates,
        encryptData,
        decryptData
      }}
    >
      {children}
    </AutoUpdateContext.Provider>
  );
};

export const useAutoUpdateContext = (): AutoUpdateContextProps => {
  const context = useContext(AutoUpdateContext);
  if (!context) {
    throw new Error('useAutoUpdateContext must be used within an AutoUpdateProvider');
  }
  return context;
};
