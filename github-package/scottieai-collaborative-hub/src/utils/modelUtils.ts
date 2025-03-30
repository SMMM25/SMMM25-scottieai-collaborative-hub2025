import * as tf from '@tensorflow/tfjs';
import { SupportedLanguage } from './i18nUtils';

export interface ModelLoadingStatus {
  loaded: boolean;
  progress: number;
  error?: string;
}

export interface AIModelConfig {
  id: string;
  name: string;
  description: string;
  type: string;
  path: string;
  size: string;
  capabilities: string[];
  supportedLanguages?: SupportedLanguage[];
}

/**
 * Initialize TensorFlow.js with better error handling and performance optimization
 */
export const initializeTensorFlow = async (): Promise<boolean> => {
  try {
    // Wait for TensorFlow to be ready
    await tf.ready();
    
    // Get available backends
    const backends = Object.keys(tf.engine().registry);
    console.log('Available TensorFlow.js backends:', backends);
    
    // Try to use WebGL if available, fall back to CPU
    if (backends.includes('webgl')) {
      await tf.setBackend('webgl');
      
      // Configure WebGL for better performance if possible
      // Check if the backend is WebGL and if we can access the WebGL context
      const backend = tf.backend();
      if (backend && 'getGPUContext' in backend) {
        // This is a safer way to check if the backend has WebGL capabilities
        try {
          // Basic WebGL optimization - Note: we don't directly use getGLContext
          // as it's not guaranteed to be available on all KernelBackend implementations
          console.log('Optimizing WebGL settings for better performance');
          // The optimization is now handled by the TensorFlow.js library itself
        } catch (err) {
          console.warn('Unable to optimize WebGL settings:', err);
        }
      }
    } else if (backends.includes('cpu')) {
      console.warn('WebGL backend not available, using CPU backend');
      await tf.setBackend('cpu');
    } else {
      console.warn('Neither WebGL nor CPU backends available, using default backend');
    }
    
    // Log initialization success
    console.log('TensorFlow.js initialized successfully');
    console.log('Using backend:', tf.getBackend());
    console.log('Memory stats:', tf.memory());
    
    return true;
  } catch (error) {
    console.error('Failed to initialize TensorFlow.js:', error);
    return false;
  }
};

// Cache for loaded models to avoid reloading
const modelCache = new Map<string, tf.LayersModel>();

/**
 * Generate a cache key that includes language
 */
export const getModelCacheKey = (modelId: string, language?: SupportedLanguage): string => {
  return language ? `${modelId}_${language}` : modelId;
};

/**
 * Load a TensorFlow.js model with improved caching and error handling
 * Now supports language-specific model variants
 */
export const loadTensorFlowModel = async (
  modelConfig: AIModelConfig,
  options?: {
    onProgress?: (progress: number) => void;
    language?: SupportedLanguage;
  }
): Promise<tf.LayersModel | null> => {
  try {
    const modelId = modelConfig.id;
    const language = options?.language || 'en';
    const onProgress = options?.onProgress;
    
    // Create cache key that includes language
    const cacheKey = getModelCacheKey(modelId, language);
    
    // First check our in-memory cache
    if (modelCache.has(cacheKey)) {
      console.log(`Model ${modelConfig.name} (${language}) retrieved from in-memory cache`);
      const model = modelCache.get(cacheKey)!;
      onProgress?.(100);
      return model;
    }
    
    // Check if the model supports the requested language
    if (
      language !== 'en' && 
      modelConfig.supportedLanguages && 
      !modelConfig.supportedLanguages.includes(language)
    ) {
      console.warn(`Model ${modelConfig.name} does not support ${language}, falling back to English`);
    }
    
    // Determine the path - use language-specific path if available
    let modelPath = `${modelConfig.path}/model.json`;
    if (
      language !== 'en' && 
      modelConfig.supportedLanguages && 
      modelConfig.supportedLanguages.includes(language)
    ) {
      modelPath = `${modelConfig.path}/${language}/model.json`;
    }
    
    // Check if model is already in IndexedDB cache
    const cachedModels = await tf.io.listModels();
    
    if (cachedModels[modelPath]) {
      console.log(`Model ${modelConfig.name} (${language}) found in IndexedDB, loading...`);
      try {
        const model = await tf.loadLayersModel(modelPath);
        // Store in our in-memory cache for faster access next time
        modelCache.set(cacheKey, model);
        onProgress?.(100);
        return model;
      } catch (cacheError) {
        console.warn(`Error loading cached model, will reload from source:`, cacheError);
        // If loading from cache fails, continue to load from source
      }
    }
    
    // Load the model with progress tracking
    console.log(`Loading model ${modelConfig.name} (${language}) from source...`);
    const model = await tf.loadLayersModel(modelPath, {
      onProgress: (fraction: number) => {
        const progress = Math.round(fraction * 100);
        onProgress?.(progress);
        console.log(`Loading model ${modelConfig.name} (${language}): ${progress}%`);
      }
    });
    
    // Save model to in-memory cache
    modelCache.set(cacheKey, model);
    
    // Also save to IndexedDB for persistence across sessions
    try {
      await model.save(`indexeddb://${modelPath}`);
      console.log(`Model ${modelConfig.name} (${language}) saved to IndexedDB`);
    } catch (saveError) {
      console.warn(`Could not save model to IndexedDB:`, saveError);
    }
    
    // Warm up the model with a dummy prediction
    // This helps with first inference latency
    try {
      const inputShape = model.inputs[0].shape;
      // Create a dummy tensor that matches the input shape
      if (inputShape) {
        // Remove null/undefined dimensions (batch size)
        const shape = inputShape
          .filter((dim) => dim !== null && dim !== undefined)
          .map((dim) => dim || 1);
        
        if (shape.length > 0) {
          const warmupTensor = tf.zeros(shape);
          model.predict(warmupTensor);
          warmupTensor.dispose();
          console.log(`Model ${modelConfig.name} (${language}) warmed up successfully`);
        }
      }
    } catch (warmupError) {
      console.warn(`Could not warm up model ${modelConfig.name}:`, warmupError);
    }
    
    // Log model load success
    console.log(`Model ${modelConfig.name} (${language}) loaded successfully`);
    
    return model;
  } catch (error) {
    console.error(`Failed to load model ${modelConfig.name}:`, error);
    return null;
  }
};

/**
 * Preload models in the background to improve user experience
 * @param modelIds List of model IDs to preload
 */
export const preloadModels = async (modelIds: string[]): Promise<void> => {
  const modelsToLoad = availableModels.filter(model => modelIds.includes(model.id));
  
  console.log(`Preloading ${modelsToLoad.length} models in the background...`);
  
  // Load models sequentially to avoid overwhelming the browser
  for (const model of modelsToLoad) {
    try {
      await loadTensorFlowModel(model);
      console.log(`Preloaded model: ${model.name}`);
    } catch (error) {
      console.warn(`Failed to preload model ${model.name}:`, error);
    }
  }
};

/**
 * Unload models to free up memory
 * @param modelIds List of model IDs to unload
 */
export const unloadModels = async (modelIds: string[]): Promise<void> => {
  for (const modelId of modelIds) {
    if (modelCache.has(modelId)) {
      try {
        const model = modelCache.get(modelId)!;
        model.dispose();
        modelCache.delete(modelId);
        console.log(`Unloaded model: ${modelId}`);
      } catch (error) {
        console.warn(`Error unloading model ${modelId}:`, error);
      }
    }
  }
  
  // Run garbage collection
  try {
    tf.disposeVariables();
    console.log('Disposed of unused TensorFlow variables');
    console.log('Updated memory stats:', tf.memory());
  } catch (error) {
    console.warn('Error during TensorFlow garbage collection:', error);
  }
};

/**
 * Available AI models with updated language support information
 */
export const availableModels: AIModelConfig[] = [
  {
    id: 'code-pattern',
    name: 'Code Pattern Analyzer',
    description: 'Analyzes code for common patterns and potential improvements',
    type: 'tensorflow',
    path: '/models/code-pattern',
    size: '15MB',
    capabilities: ['Code Analysis', 'Pattern Detection'],
    supportedLanguages: ['en']
  },
  {
    id: 'owl-vision',
    name: 'OWL Vision Model',
    description: 'Vision model for object detection and image analysis',
    type: 'tensorflow',
    path: '/models/owl-vision',
    size: '42MB',
    capabilities: ['Object Detection', 'Image Analysis'],
    supportedLanguages: ['en', 'es', 'fr', 'de', 'zh', 'ja']
  },
  {
    id: 'selflearn-core',
    name: 'Self-Learning Core',
    description: 'Core model for self-learning capabilities',
    type: 'tensorflow',
    path: '/models/selflearn-core',
    size: '26MB',
    capabilities: ['Self-Learning', 'Adaptive Learning'],
    supportedLanguages: ['en', 'es', 'fr', 'de']
  },
  {
    id: 'langchain-agent',
    name: 'LangChain Agent',
    description: 'Agent for natural language processing and code generation',
    type: 'transformers',
    path: '/models/langchain-agent',
    size: '88MB',
    capabilities: ['NLP', 'Code Generation'],
    supportedLanguages: ['en', 'es', 'fr', 'de', 'zh', 'ja']
  }
];
