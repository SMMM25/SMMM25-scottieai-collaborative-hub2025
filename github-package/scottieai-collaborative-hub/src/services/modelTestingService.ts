import * as tf from '@tensorflow/tfjs';
import { loadModelById } from './aiModelService';
import { AIModelConfig } from '@/utils/modelUtils';

export interface ModelTestCase {
  id: string;
  name: string;
  description: string;
  input: number[][];
  expectedOutput?: number[][];
  category: 'performance' | 'accuracy' | 'edge-case';
}

export interface ModelTestResult {
  id: string;
  modelId: string;
  testCaseId: string;
  passed: boolean;
  timeTaken: number; // in milliseconds
  error?: string;
  outputTensor?: number[][];
  expectedTensor?: number[][];
  metrics?: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1Score?: number;
  };
}

export interface BenchmarkResult {
  modelId: string;
  averageInferenceTime: number;
  memoryUsage: number;
  passRate: number;
  results: ModelTestResult[];
}

/**
 * Test cases for different model types
 */
const testCases: Record<string, ModelTestCase[]> = {
  'tensorflow': [
    {
      id: 'basic-inference-1',
      name: 'Basic Inference Test 1',
      description: 'Tests the model with a simple input pattern',
      input: [[0.1, 0.2, 0.3, 0.4, 0.5]],
      category: 'accuracy'
    },
    {
      id: 'performance-test-1',
      name: 'Performance Test - Single Inference',
      description: 'Tests the model performance with a single inference',
      input: [[0.5, 0.5, 0.5, 0.5, 0.5]],
      category: 'performance'
    },
    {
      id: 'edge-case-zeros',
      name: 'Edge Case - All Zeros',
      description: 'Tests the model with all zero inputs',
      input: [[0, 0, 0, 0, 0]],
      category: 'edge-case'
    }
  ],
  'onnx': [
    {
      id: 'onnx-basic-test',
      name: 'ONNX Basic Test',
      description: 'Basic test for ONNX models',
      input: [[0.1, 0.2, 0.3, 0.4, 0.5]],
      category: 'accuracy'
    }
  ],
  'transformers': [
    {
      id: 'transformer-sequence',
      name: 'Transformer Sequence Test',
      description: 'Tests the transformer model with a sequence',
      input: [[1, 2, 3, 4, 5]],
      category: 'accuracy'
    }
  ]
};

/**
 * Run a single test case on a model
 */
export const runTestCase = async (
  model: tf.LayersModel, 
  testCase: ModelTestCase
): Promise<ModelTestResult> => {
  try {
    const startTime = performance.now();
    
    // Convert input to tensor
    const inputTensor = tf.tensor(testCase.input);
    
    // Run prediction
    const outputTensor = model.predict(inputTensor) as tf.Tensor;
    const outputArray = await outputTensor.array() as number[][];
    
    // Measure time taken
    const endTime = performance.now();
    const timeTaken = endTime - startTime;
    
    // Clean up tensors
    tf.dispose([inputTensor, outputTensor]);
    
    // Create result
    const result: ModelTestResult = {
      id: `result-${testCase.id}-${Date.now()}`,
      modelId: '', // Will be filled in by the calling function
      testCaseId: testCase.id,
      passed: true, // Basic pass if no errors
      timeTaken,
      outputTensor: outputArray
    };
    
    // If expected output is provided, check accuracy
    if (testCase.expectedOutput) {
      result.expectedTensor = testCase.expectedOutput;
      
      // Check if output matches expected (with tolerance)
      const matches = compareOutputs(outputArray, testCase.expectedOutput);
      result.passed = matches;
      
      // Calculate metrics
      result.metrics = calculateMetrics(outputArray, testCase.expectedOutput);
    }
    
    return result;
  } catch (error) {
    console.error(`Test case ${testCase.id} failed:`, error);
    return {
      id: `result-${testCase.id}-${Date.now()}`,
      modelId: '',
      testCaseId: testCase.id,
      passed: false,
      timeTaken: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Run all test cases for a specific model
 */
export const testModel = async (
  modelId: string
): Promise<BenchmarkResult> => {
  try {
    // Load the model
    const model = await loadModelById(modelId) as tf.LayersModel;
    if (!model) {
      throw new Error(`Failed to load model with ID ${modelId}`);
    }
    
    // Determine model type
    const modelConfig = findModelConfig(modelId);
    if (!modelConfig) {
      throw new Error(`Model configuration not found for ${modelId}`);
    }
    
    // Get test cases for this model type
    const modelTestCases = testCases[modelConfig.type] || testCases['tensorflow'];
    
    // Run all test cases
    const results: ModelTestResult[] = [];
    
    for (const testCase of modelTestCases) {
      // Run the test case
      const result = await runTestCase(model, testCase);
      result.modelId = modelId;
      results.push(result);
    }
    
    // Calculate summary metrics
    const passedTests = results.filter(r => r.passed);
    const passRate = results.length > 0 ? passedTests.length / results.length : 0;
    const averageTime = results.reduce((sum, r) => sum + r.timeTaken, 0) / results.length;
    
    // Get memory usage
    let memoryUsage = 0;
    try {
      const memoryInfo = await tf.memory();
      memoryUsage = memoryInfo.numBytes;
    } catch (e) {
      console.warn('Could not get memory usage', e);
    }
    
    return {
      modelId,
      averageInferenceTime: averageTime,
      memoryUsage,
      passRate,
      results
    };
  } catch (error) {
    console.error(`Testing model ${modelId} failed:`, error);
    return {
      modelId,
      averageInferenceTime: 0,
      memoryUsage: 0,
      passRate: 0,
      results: [{
        id: `error-${Date.now()}`,
        modelId,
        testCaseId: 'error',
        passed: false,
        timeTaken: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }]
    };
  }
};

/**
 * Run performance benchmark with multiple iterations
 */
export const benchmarkModel = async (
  modelId: string,
  iterations: number = 10
): Promise<{
  averageTime: number;
  minTime: number;
  maxTime: number;
  memoryUsage: number;
}> => {
  try {
    // Load the model
    const model = await loadModelById(modelId) as tf.LayersModel;
    if (!model) {
      throw new Error(`Failed to load model with ID ${modelId}`);
    }
    
    // Determine model type
    const modelConfig = findModelConfig(modelId);
    if (!modelConfig) {
      throw new Error(`Model configuration not found for ${modelId}`);
    }
    
    // Get a test case
    const modelTestCases = testCases[modelConfig.type] || testCases['tensorflow'];
    const testCase = modelTestCases.find(tc => tc.category === 'performance') || modelTestCases[0];
    
    // Run multiple iterations
    const times: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      
      // Convert input to tensor
      const inputTensor = tf.tensor(testCase.input);
      
      // Run prediction
      const outputTensor = model.predict(inputTensor) as tf.Tensor;
      await outputTensor.data(); // Ensure execution has completed
      
      // Measure time
      const endTime = performance.now();
      times.push(endTime - startTime);
      
      // Clean up tensors
      tf.dispose([inputTensor, outputTensor]);
    }
    
    // Calculate statistics
    const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    // Get memory usage
    let memoryUsage = 0;
    try {
      const memoryInfo = await tf.memory();
      memoryUsage = memoryInfo.numBytes;
    } catch (e) {
      console.warn('Could not get memory usage', e);
    }
    
    return {
      averageTime,
      minTime,
      maxTime,
      memoryUsage
    };
  } catch (error) {
    console.error(`Benchmarking model ${modelId} failed:`, error);
    throw error;
  }
};

/**
 * Helper function to find model configuration by ID
 */
const findModelConfig = (modelId: string): AIModelConfig | undefined => {
  const { availableModels } = require('@/utils/modelUtils');
  return availableModels.find((model: AIModelConfig) => model.id === modelId);
};

/**
 * Compare expected and actual outputs with tolerance
 */
const compareOutputs = (
  actual: number[][],
  expected: number[][],
  tolerance: number = 1e-4
): boolean => {
  if (actual.length !== expected.length) return false;
  
  for (let i = 0; i < actual.length; i++) {
    if (actual[i].length !== expected[i].length) return false;
    
    for (let j = 0; j < actual[i].length; j++) {
      if (Math.abs(actual[i][j] - expected[i][j]) > tolerance) {
        return false;
      }
    }
  }
  
  return true;
};

/**
 * Calculate metrics between expected and actual outputs
 */
const calculateMetrics = (
  actual: number[][],
  expected: number[][]
): { accuracy: number; precision: number; recall: number; f1Score: number } => {
  // This is a simplified version - in a real application, these calculations would be more sophisticated
  
  // Flatten arrays for easier comparison
  const actualFlat = actual.flat();
  const expectedFlat = expected.flat();
  
  // Binary classification metrics (simplified)
  let truePositives = 0;
  let falsePositives = 0;
  let falseNegatives = 0;
  let trueNegatives = 0;
  
  const threshold = 0.5; // For binary classification
  
  for (let i = 0; i < actualFlat.length; i++) {
    const actualValue = actualFlat[i] >= threshold ? 1 : 0;
    const expectedValue = expectedFlat[i] >= threshold ? 1 : 0;
    
    if (actualValue === 1 && expectedValue === 1) truePositives++;
    if (actualValue === 1 && expectedValue === 0) falsePositives++;
    if (actualValue === 0 && expectedValue === 1) falseNegatives++;
    if (actualValue === 0 && expectedValue === 0) trueNegatives++;
  }
  
  // Calculate metrics
  const accuracy = (truePositives + trueNegatives) / actualFlat.length;
  const precision = truePositives / (truePositives + falsePositives) || 0;
  const recall = truePositives / (truePositives + falseNegatives) || 0;
  const f1Score = 2 * precision * recall / (precision + recall) || 0;
  
  return {
    accuracy,
    precision,
    recall,
    f1Score
  };
};

/**
 * Generate test cases for a given model
 */
export const generateTestCases = (modelType: string): ModelTestCase[] => {
  return testCases[modelType] || testCases['tensorflow'];
};
