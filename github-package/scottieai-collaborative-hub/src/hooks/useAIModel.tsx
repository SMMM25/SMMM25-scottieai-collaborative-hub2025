
import { useState, useEffect, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import { 
  initializeAIModelService, 
  loadModelById,
  getModelLoadingStatus,
} from '@/services/aiModelService';
import { 
  availableModels, 
  AIModelConfig, 
  preloadModels,
  unloadModels
} from '@/utils/modelUtils';
import { SupportedLanguage, useTranslation } from '@/utils/i18nUtils';
import { safeInference } from '@/utils/tensorflowUtils';

interface UseAIModelResult {
  isInitialized: boolean;
  isLoading: boolean;
  loadingProgress: number;
  error: string | null;
  model: tf.LayersModel | null;
  loadModel: (modelId: string, language?: SupportedLanguage) => Promise<tf.LayersModel | null>;
  runInference: (input: tf.Tensor | number[][]) => Promise<tf.Tensor | null>;
  testModelAccuracy: (testData: number[][], expectedOutputs: number[][]) => Promise<number>;
  availableModels: AIModelConfig[];
  preloadModels: (modelIds: string[]) => Promise<void>;
  unloadModel: () => Promise<void>;
  currentLanguage: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
  supportedLanguages: SupportedLanguage[];
}

/**
 * Hook for using AI models in React components with language support
 */
export const useAIModel = (): UseAIModelResult => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [model, setModel] = useState<tf.LayersModel | null>(null);
  const [modelId, setModelId] = useState<string | null>(null);
  const { language: currentLanguage, setLanguage } = useTranslation();
  const [supportedLanguages, setSupportedLanguages] = useState<SupportedLanguage[]>(['en']);
  
  // Initialize the AI model service
  useEffect(() => {
    const initialize = async () => {
      try {
        const initialized = await initializeAIModelService();
        setIsInitialized(initialized);
        if (!initialized) {
          setError('Failed to initialize AI model service');
        } else {
          console.log('AI model service initialized successfully');
        }
      } catch (err) {
        console.error('Error initializing AI model service:', err);
        setError('Error initializing AI model service');
        setIsInitialized(false);
      }
    };
    
    initialize();
    
    // Cleanup function for TensorFlow resources
    return () => {
      if (modelId) {
        // Clean up the current model when the component unmounts
        unloadModels([modelId]).catch(err => {
          console.warn('Error cleaning up model resources:', err);
        });
      }
    };
  }, []);
  
  // Update loading progress when model ID changes
  useEffect(() => {
    if (!modelId) return;
    
    const interval = setInterval(() => {
      const status = getModelLoadingStatus(modelId);
      setLoadingProgress(status.progress);
      
      if (status.error) {
        setError(status.error);
        setIsLoading(false);
        clearInterval(interval);
      }
      
      if (status.loaded) {
        setIsLoading(false);
        clearInterval(interval);
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [modelId]);
  
  // Load a model by ID with language support
  const loadModel = useCallback(async (id: string, language?: SupportedLanguage) => {
    try {
      setModelId(id);
      setIsLoading(true);
      setError(null);
      
      // Use current language if not specified
      const modelLanguage = language || currentLanguage;
      
      // Find model config to check supported languages
      const modelConfig = availableModels.find(model => model.id === id);
      if (modelConfig?.supportedLanguages) {
        setSupportedLanguages(modelConfig.supportedLanguages);
      } else {
        setSupportedLanguages(['en']);
      }
      
      const loadedModel = await loadModelById(id, modelLanguage) as tf.LayersModel;
      if (!loadedModel) {
        throw new Error(`Failed to load model with ID: ${id} for language: ${modelLanguage}`);
      }
      
      setModel(loadedModel);
      return loadedModel;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error loading model';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentLanguage]);
  
  // Run inference with the loaded model and language support
  const runInference = useCallback(async (input: tf.Tensor | number[][]): Promise<tf.Tensor | null> => {
    try {
      if (!model) {
        throw new Error('No model loaded');
      }
      
      // Explicitly cast the result to tf.Tensor | null to match the expected return type
      const result = await safeInference<tf.Tensor>(model, input, currentLanguage);
      return result;
    } catch (error) {
      console.error('Inference error:', error);
      setError(error instanceof Error ? error.message : 'Unknown inference error');
      return null;
    }
  }, [model, currentLanguage]);
  
  // Test model accuracy with test data
  const testModelAccuracy = useCallback(async (
    testData: number[][], 
    expectedOutputs: number[][]
  ): Promise<number> => {
    try {
      if (!model) {
        throw new Error('No model loaded');
      }
      
      // Convert test data to tensor
      const inputTensor = tf.tensor(testData);
      const expectedTensor = tf.tensor(expectedOutputs);
      
      // Run predictions
      const outputTensor = model.predict(inputTensor) as tf.Tensor;
      
      // Calculate accuracy (simplified - would be more sophisticated in real usage)
      const predictions = await outputTensor.array() as number[][];
      const expected = await expectedTensor.array() as number[][];
      
      // Compare predictions with expected outputs
      let correct = 0;
      for (let i = 0; i < predictions.length; i++) {
        let match = true;
        for (let j = 0; j < predictions[i].length; j++) {
          // Consider a match if within 0.1 (simplified)
          if (Math.abs(predictions[i][j] - expected[i][j]) > 0.1) {
            match = false;
            break;
          }
        }
        if (match) correct++;
      }
      
      // Calculate accuracy
      const accuracy = correct / predictions.length;
      
      // Clean up tensors
      tf.dispose([inputTensor, expectedTensor, outputTensor]);
      
      return accuracy;
    } catch (error) {
      console.error('Test accuracy error:', error);
      setError(error instanceof Error ? error.message : 'Unknown test error');
      return 0;
    }
  }, [model]);
  
  // Preload multiple models for better user experience
  const preloadMultipleModels = useCallback(async (modelIds: string[]) => {
    try {
      await preloadModels(modelIds);
    } catch (error) {
      console.error('Error preloading models:', error);
    }
  }, []);
  
  // Unload the current model to free up memory
  const unloadModel = useCallback(async () => {
    if (modelId) {
      try {
        await unloadModels([modelId]);
        setModel(null);
        setModelId(null);
      } catch (error) {
        console.error('Error unloading model:', error);
      }
    }
  }, [modelId]);
  
  return {
    isInitialized,
    isLoading,
    loadingProgress,
    error,
    model,
    loadModel,
    runInference,
    testModelAccuracy,
    availableModels,
    preloadModels: preloadMultipleModels,
    unloadModel,
    currentLanguage,
    setLanguage,
    supportedLanguages
  };
};
