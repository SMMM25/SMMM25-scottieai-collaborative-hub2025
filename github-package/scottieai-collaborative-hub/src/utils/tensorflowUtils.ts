import * as tf from '@tensorflow/tfjs';
import { SupportedLanguage } from './i18nUtils';

/**
 * Utility functions for TensorFlow.js operations
 */

/**
 * Creates a tensor from various input types with proper error handling
 */
export const createTensor = (
  input: number[] | number[][] | number[][][] | tf.Tensor
): tf.Tensor => {
  try {
    if (input instanceof tf.Tensor) {
      return input;
    }
    return tf.tensor(input);
  } catch (error) {
    console.error('Error creating tensor:', error);
    throw new Error('Failed to create tensor from input data');
  }
};

/**
 * Safely disposes of tensors to prevent memory leaks
 */
export const disposeTensors = (tensors: (tf.Tensor | null | undefined)[]): void => {
  tensors.forEach(tensor => {
    if (tensor && tensor instanceof tf.Tensor) {
      try {
        tensor.dispose();
      } catch (error) {
        console.warn('Error disposing tensor:', error);
      }
    }
  });
};

/**
 * Runs inference with proper error handling and tensor cleanup
 */
export const safeInference = async <T>(
  model: tf.LayersModel | null,
  input: number[] | number[][] | tf.Tensor,
  language?: SupportedLanguage
): Promise<T | null> => {
  if (!model) {
    console.error('No model provided for inference');
    return null;
  }
  
  let inputTensor: tf.Tensor | null = null;
  let outputTensor: tf.Tensor | null = null;
  
  try {
    // Create input tensor if needed
    inputTensor = input instanceof tf.Tensor ? input : createTensor(input);
    
    // Apply language-specific preprocessing if applicable
    if (language && language !== 'en') {
      inputTensor = applyLanguagePreprocessing(inputTensor, language);
    }
    
    // Run prediction
    outputTensor = model.predict(inputTensor) as tf.Tensor;
    
    // Apply language-specific postprocessing if applicable
    if (language && language !== 'en') {
      outputTensor = applyLanguagePostprocessing(outputTensor, language);
    }
    
    // Check if we're expecting a tensor return type using type checking approach
    const isTensorType = {} as T instanceof tf.Tensor;
    
    // For Tensor requests, return the tensor directly if it seems the expected return type is a Tensor
    if (isTensorType) {
      // Create a copy of the tensor to return (since we'll dispose the original)
      const resultTensor = outputTensor.clone();
      return resultTensor as unknown as T;
    }
    
    // For other types (like arrays), convert to the desired format
    const output = await outputTensor.array() as T;
    return output;
  } catch (error) {
    console.error('Error during model inference:', error);
    return null;
  } finally {
    // Clean up tensors
    disposeTensors([
      // Only dispose input tensor if we created it
      input instanceof tf.Tensor ? null : inputTensor,
      outputTensor
    ]);
  }
};

/**
 * Apply language-specific preprocessing to input tensor
 * This function would implement any language-specific transformations
 * needed before running the model
 */
const applyLanguagePreprocessing = (
  tensor: tf.Tensor, 
  language: SupportedLanguage
): tf.Tensor => {
  // This would be implemented with actual language-specific 
  // transformations in a production system
  console.log(`Applying ${language} preprocessing`);
  return tensor;
};

/**
 * Apply language-specific postprocessing to output tensor
 * This function would implement any language-specific transformations
 * needed after running the model
 */
const applyLanguagePostprocessing = (
  tensor: tf.Tensor, 
  language: SupportedLanguage
): tf.Tensor => {
  // This would be implemented with actual language-specific 
  // transformations in a production system
  console.log(`Applying ${language} postprocessing`);
  return tensor;
};

/**
 * Get TensorFlow.js memory information in a more readable format
 */
export const getMemoryInfo = (): Record<string, string | number | boolean> => {
  try {
    const memory = tf.memory();
    return {
      numTensors: memory.numTensors,
      numDataBuffers: memory.numDataBuffers,
      memoryUsage: `${(memory.numBytes / (1024 * 1024)).toFixed(2)} MB`,
      unreliable: memory.unreliable,
      reasons: memory.reasons?.join(', ') || 'none'
    };
  } catch (error) {
    console.error('Error getting memory info:', error);
    return { error: 'Failed to get memory information' };
  }
};

/**
 * Print memory usage to console for debugging
 */
export const logMemoryUsage = (): void => {
  console.log('TensorFlow.js Memory Usage:', getMemoryInfo());
};

/**
 * Creates a tokenizer for text-based models with language support
 */
export const createMultilingualTokenizer = (
  language: SupportedLanguage = 'en',
  vocabSize: number = 10000
): { encode: (text: string) => number[]; decode: (tokens: number[]) => string } => {
  // This is a simplified tokenization implementation
  // In a real application, you'd use a proper tokenizer for each language
  
  const languageSpecificTokenize = (text: string): string[] => {
    // Apply language-specific tokenization logic
    switch (language) {
      case 'zh':
      case 'ja':
        // Character-level tokenization for languages without spaces
        return text.split('');
      case 'en':
      case 'es':
      case 'fr':
      case 'de':
      default:
        // Simple space-based tokenization for European languages
        return text.toLowerCase().split(/\s+/);
    }
  };
  
  // Simple encode function
  const encode = (text: string): number[] => {
    const tokens = languageSpecificTokenize(text);
    // This would use a real vocabulary in production
    return tokens.map(token => Math.abs(hashString(token)) % vocabSize);
  };
  
  // Simple decode function (very simplified)
  const decode = (tokens: number[]): string => {
    // In a real implementation, this would map back to actual tokens
    return tokens.join(' ');
  };
  
  return { encode, decode };
};

// Helper function to hash strings
const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
};
