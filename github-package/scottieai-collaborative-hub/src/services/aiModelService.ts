import * as tf from '@tensorflow/tfjs';
import { toast } from 'sonner';
import { 
  initializeTensorFlow, 
  loadTensorFlowModel, 
  availableModels,
  ModelLoadingStatus,
  AIModelConfig,
  getModelCacheKey,
  preloadModels,
  unloadModels
} from '@/utils/modelUtils';
import { SupportedLanguage } from '@/utils/i18nUtils';
import { supabase } from '@/lib/supabase';

// Service initialization status
let isInitialized = false;
const loadingStatus: Record<string, ModelLoadingStatus> = {};

/**
 * Initialize the AI model service
 */
export const initializeAIModelService = async (): Promise<boolean> => {
  if (isInitialized) return true;
  
  console.log('Initializing AI model service...');
  
  try {
    // Initialize TensorFlow.js
    const tfInitialized = await initializeTensorFlow();
    if (!tfInitialized) {
      console.error('Failed to initialize TensorFlow.js');
      return false;
    }
    
    // Preload essential models in the background
    preloadModels(['code-pattern', 'selflearn-core']);
    
    // Set service as initialized
    isInitialized = true;
    console.log('AI model service initialized successfully');
    
    return true;
  } catch (error) {
    console.error('Error initializing AI model service:', error);
    toast.error('Failed to initialize AI models. Some features may not work properly.');
    return false;
  }
};

/**
 * Get available models for the application
 */
export const getAvailableModels = (): AIModelConfig[] => {
  return availableModels;
};

/**
 * Get loading status for a model
 */
export const getModelLoadingStatus = (modelId: string): ModelLoadingStatus => {
  return loadingStatus[modelId] || { loaded: false, progress: 0 };
};

/**
 * Load a specific model by ID with language support
 */
export const loadModelById = async (
  modelId: string, 
  language: SupportedLanguage = 'en'
): Promise<any> => {
  try {
    if (!isInitialized) {
      const initialized = await initializeAIModelService();
      if (!initialized) throw new Error('AI model service not initialized');
    }
    
    // Find the model configuration
    const modelConfig = availableModels.find(model => model.id === modelId);
    if (!modelConfig) throw new Error(`Model with ID ${modelId} not found`);
    
    // Initialize loading status
    loadingStatus[modelId] = { loaded: false, progress: 0 };
    
    // Check if model supports the requested language
    const modelSupportsLanguage = 
      !modelConfig.supportedLanguages || 
      modelConfig.supportedLanguages.includes(language);
    
    // Use fallback language if needed
    const effectiveLanguage = modelSupportsLanguage ? language : 'en';
    
    if (!modelSupportsLanguage) {
      console.warn(`Model ${modelConfig.name} does not support ${language}, falling back to English`);
      toast.warning(`Model ${modelConfig.name} does not support ${language}, using English instead`);
    }
    
    // Load the model with progress tracking
    const model = await loadTensorFlowModel(
      modelConfig,
      {
        onProgress: (progress) => {
          loadingStatus[modelId] = { 
            loaded: progress === 100, 
            progress 
          };
        },
        language: effectiveLanguage
      }
    );
    
    if (!model) throw new Error(`Failed to load model ${modelConfig.name}`);
    
    // Update loading status
    loadingStatus[modelId] = { loaded: true, progress: 100 };
    
    // Log model usage for analytics
    logModelUsage(modelId, effectiveLanguage);
    
    return model;
  } catch (error) {
    console.error(`Error loading model ${modelId}:`, error);
    
    // Update loading status with error
    loadingStatus[modelId] = { 
      loaded: false, 
      progress: 0, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
    
    toast.error(`Failed to load AI model: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return null;
  }
};

/**
 * Log model usage for analytics
 */
const logModelUsage = async (modelId: string, language: SupportedLanguage): Promise<void> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    
    await supabase.from('model_usage_logs').insert({
      user_id: userData.user.id,
      model_id: modelId,
      language: language,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error logging model usage:', error);
  }
};

/**
 * Load the code pattern recognition model
 */
export const loadCodePatternModel = async (): Promise<tf.LayersModel | null> => {
  return loadModelById('code-pattern') as Promise<tf.LayersModel | null>;
};

/**
 * Load the OWL vision model
 */
export const loadOWLVisionModel = async (): Promise<tf.LayersModel | null> => {
  return loadModelById('owl-vision') as Promise<tf.LayersModel | null>;
};

/**
 * Load the self-learning core model
 */
export const loadSelfLearnModel = async (): Promise<tf.LayersModel | null> => {
  return loadModelById('selflearn-core') as Promise<tf.LayersModel | null>;
};

/**
 * Load the LangChain agent model
 */
export const loadLangChainModel = async (): Promise<tf.LayersModel | null> => {
  return loadModelById('langchain-agent') as Promise<tf.LayersModel | null>;
};

/**
 * Analyze code patterns using TensorFlow.js with language support
 */
export const analyzeCodePatterns = async (
  code: string,
  options?: { 
    threshold?: number;
    language?: SupportedLanguage;
  }
): Promise<{ patterns: string[]; confidence: number[] }> => {
  try {
    const language = options?.language || 'en';
    
    // Load the code pattern model
    const model = await loadModelById('code-pattern', language);
    if (!model) throw new Error('Failed to load code pattern model');
    
    // Simple feature extraction from code (in a real app, this would be more sophisticated)
    const features = extractCodeFeatures(code);
    
    // Convert features to tensor
    const inputTensor = tf.tensor2d([features]);
    
    // Run inference
    const prediction = model.predict(inputTensor) as tf.Tensor;
    const confidenceValues = await prediction.data();
    
    // Cleanup tensors
    tf.dispose([inputTensor, prediction]);
    
    // Threshold for pattern detection
    const threshold = options?.threshold || 0.5;
    
    // Get localized pattern names based on language
    const patternLibrary = getLocalizedPatterns(language);
    
    // Filter patterns by confidence threshold
    const detectedPatterns: string[] = [];
    const confidenceScores: number[] = [];
    
    Array.from(confidenceValues).forEach((confidence, index) => {
      if (confidence >= threshold && index < patternLibrary.length) {
        detectedPatterns.push(patternLibrary[index]);
        confidenceScores.push(confidence);
      }
    });
    
    return {
      patterns: detectedPatterns,
      confidence: confidenceScores
    };
  } catch (error) {
    console.error('Error analyzing code patterns:', error);
    toast.error('Error analyzing code patterns. Please try again.');
    return { patterns: [], confidence: [] };
  }
};

/**
 * Get localized pattern names based on language
 */
const getLocalizedPatterns = (language: SupportedLanguage): string[] => {
  // This would be more sophisticated in a real app
  switch (language) {
    case 'es':
      return [
        'Patrón de reutilización de componentes',
        'Patrón de gestión de estado',
        'Patrón de manejo de errores',
        'Patrón de obtención de datos asíncronos',
        'Patrón de renderizado condicional',
        'Patrón de validación de formularios',
        'Patrón de optimización de rendimiento',
        'Patrón de memoización'
      ];
    case 'fr':
      return [
        'Modèle de réutilisation des composants',
        'Modèle de gestion d\'état',
        'Modèle de gestion des erreurs',
        'Modèle de récupération de données asynchrones',
        'Modèle de rendu conditionnel',
        'Modèle de validation de formulaire',
        'Modèle d\'optimisation des performances',
        'Modèle de mémoisation'
      ];
    case 'de':
      return [
        'Komponenten-Wiederverwendungsmuster',
        'Zustandsverwaltungsmuster',
        'Fehlerbehandlungsmuster',
        'Asynchrones Datenabrufmuster',
        'Bedingtes Rendering-Muster',
        'Formularvalidierungsmuster',
        'Leistungsoptimierungsmuster',
        'Memoization-Muster'
      ];
    case 'zh':
      return [
        '组件复用模式',
        '状态管理模式',
        '错误处理模式',
        '异步数据获取模式',
        '条件渲染模式',
        '表单验证模式',
        '性能优化模式',
        '记忆化模式'
      ];
    case 'ja':
      return [
        'コンポーネント再利用パターン',
        '状態管理パターン',
        'エラー処理パターン',
        '非同期データ取得パターン',
        '条件付きレンダリングパターン',
        'フォーム検証パターン',
        'パフォーマンス最適化パターン',
        'メモ化パターン'
      ];
    case 'en':
    default:
      return [
        'Component reuse pattern',
        'State management pattern',
        'Error handling pattern',
        'Async data fetching pattern',
        'Conditional rendering pattern',
        'Form validation pattern',
        'Performance optimization pattern',
        'Memoization pattern'
      ];
  }
};

/**
 * Extract code features for model input (simplified for demo)
 */
const extractCodeFeatures = (code: string): number[] => {
  // In a real application, this would use sophisticated code analysis
  // Here we're just demonstrating the concept with simple metrics
  
  // Calculate some basic code metrics
  const lineCount = code.split('\n').length;
  const functionCount = (code.match(/function/g) || []).length;
  const classCount = (code.match(/class/g) || []).length;
  const importCount = (code.match(/import/g) || []).length;
  const exportCount = (code.match(/export/g) || []).length;
  
  // Normalize values between 0-1 for model input
  const normalizedLineCount = Math.min(lineCount / 1000, 1);
  const normalizedFunctionCount = Math.min(functionCount / 50, 1);
  const normalizedClassCount = Math.min(classCount / 20, 1);
  const normalizedImportCount = Math.min(importCount / 30, 1);
  const normalizedExportCount = Math.min(exportCount / 30, 1);
  
  // Return feature vector
  return [
    normalizedLineCount,
    normalizedFunctionCount,
    normalizedClassCount,
    normalizedImportCount,
    normalizedExportCount
  ];
};

/**
 * Create and train a custom model for project-specific patterns
 * Now with language support
 */
export const trainCustomPatternModel = async (
  trainingData: { code: string; labels: number[] }[],
  options?: {
    progressCallback?: (progress: number) => void;
    language?: SupportedLanguage;
  }
): Promise<{ success: boolean; model?: tf.LayersModel }> => {
  try {
    // Create a sequential model
    const model = tf.sequential();
    
    // Add layers
    model.add(tf.layers.dense({
      units: 16,
      activation: 'relu',
      inputShape: [5] // Match the feature extraction dimensions
    }));
    
    model.add(tf.layers.dense({
      units: 8,
      activation: 'relu'
    }));
    
    model.add(tf.layers.dense({
      units: 8,
      activation: 'sigmoid'
    }));
    
    // Compile the model
    model.compile({
      optimizer: 'adam',
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });
    
    // Prepare training data
    const features = trainingData.map(item => extractCodeFeatures(item.code));
    const labels = trainingData.map(item => item.labels);
    
    const xs = tf.tensor2d(features);
    const ys = tf.tensor2d(labels);
    
    // Train the model
    await model.fit(xs, ys, {
      epochs: 50,
      batchSize: 4,
      shuffle: true,
      validationSplit: 0.2,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          const progress = Math.round(((epoch + 1) / 50) * 100);
          console.log(`Training epoch ${epoch + 1}/50: loss = ${logs?.loss.toFixed(4)}, accuracy = ${logs?.acc.toFixed(4)}`);
          if (options?.progressCallback) options.progressCallback(progress);
        }
      }
    });
    
    // Clean up tensors
    tf.dispose([xs, ys]);
    
    console.log('Custom pattern model trained successfully');
    
    // Save model with language awareness
    const language = options?.language || 'en';
    const modelId = `custom_pattern_model`;
    await saveModelToStorage(model, modelId, language);
    
    return { success: true, model };
  } catch (error) {
    console.error('Error training custom pattern model:', error);
    toast.error('Error training custom model. Please try again.');
    return { success: false };
  }
};

/**
 * Save model to local storage (IndexedDB) with language support
 */
export const saveModelToStorage = async (
  model: tf.LayersModel, 
  modelId: string,
  language: SupportedLanguage = 'en'
): Promise<boolean> => {
  try {
    const cacheKey = getModelCacheKey(modelId, language);
    const saveResult = await model.save(`indexeddb://${cacheKey}`);
    console.log(`Model saved to IndexedDB with key ${cacheKey}:`, saveResult);
    
    // Log model creation
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      await supabase.from('user_models').insert({
        user_id: userData.user.id,
        model_id: modelId,
        language: language,
        created_at: new Date().toISOString(),
        model_type: 'custom'
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error saving model to IndexedDB:', error);
    return false;
  }
};

/**
 * Get user's custom models
 */
export const getUserModels = async (): Promise<{id: string, language: SupportedLanguage, created_at: string}[]> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return [];
    
    const { data, error } = await supabase
      .from('user_models')
      .select('model_id, language, created_at')
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    return data.map(item => ({
      id: item.model_id,
      language: item.language as SupportedLanguage,
      created_at: item.created_at
    }));
  } catch (error) {
    console.error('Error fetching user models:', error);
    return [];
  }
};

/**
 * Load a user's custom model
 */
export const loadUserModel = async (
  modelId: string,
  language: SupportedLanguage = 'en'
): Promise<tf.LayersModel | null> => {
  try {
    const cacheKey = getModelCacheKey(modelId, language);
    const model = await tf.loadLayersModel(`indexeddb://${cacheKey}`);
    return model;
  } catch (error) {
    console.error(`Error loading user model ${modelId}:`, error);
    toast.error('Error loading custom model. It may have been deleted or corrupted.');
    return null;
  }
};

/**
 * Delete a user's custom model
 */
export const deleteUserModel = async (
  modelId: string,
  language: SupportedLanguage = 'en'
): Promise<boolean> => {
  try {
    const cacheKey = getModelCacheKey(modelId, language);
    
    // Delete from IndexedDB
    await tf.io.removeModel(`indexeddb://${cacheKey}`);
    
    // Delete from database
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      await supabase
        .from('user_models')
        .delete()
        .eq('user_id', userData.user.id)
        .eq('model_id', modelId)
        .eq('language', language);
    }
    
    toast.success('Custom model deleted successfully');
    return true;
  } catch (error) {
    console.error(`Error deleting user model ${modelId}:`, error);
    toast.error('Error deleting custom model');
    return false;
  }
};

/**
 * Clean up AI model resources
 */
export const cleanupAIModelResources = async (): Promise<void> => {
  try {
    // Unload all models to free memory
    const modelIds = availableModels.map(model => model.id);
    await unloadModels(modelIds);
    
    // Reset service state
    isInitialized = false;
    
    console.log('AI model resources cleaned up successfully');
  } catch (error) {
    console.error('Error cleaning up AI model resources:', error);
  }
};

/**
 * Get model recommendations based on project technologies
 */
export const getModelRecommendations = (technologies: string[]): AIModelConfig[] => {
  const recommendations: AIModelConfig[] = [];
  
  // Always recommend the core models
  recommendations.push(
    availableModels.find(model => model.id === 'code-pattern')!,
    availableModels.find(model => model.id === 'selflearn-core')!
  );
  
  // Add technology-specific recommendations
  if (technologies.includes('React') || 
      technologies.includes('Vue.js') || 
      technologies.includes('Angular')) {
    // Frontend frameworks benefit from OWL Vision for UI analysis
    const owlVision = availableModels.find(model => model.id === 'owl-vision');
    if (owlVision && !recommendations.includes(owlVision)) {
      recommendations.push(owlVision);
    }
  }
  
  if (technologies.includes('Node.js') || 
      technologies.includes('Express') || 
      technologies.includes('NestJS')) {
    // Backend frameworks benefit from LangChain for API generation
    const langChain = availableModels.find(model => model.id === 'langchain-agent');
    if (langChain && !recommendations.includes(langChain)) {
      recommendations.push(langChain);
    }
  }
  
  return recommendations;
};
