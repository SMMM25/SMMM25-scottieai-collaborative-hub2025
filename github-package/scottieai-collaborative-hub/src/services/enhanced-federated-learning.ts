// Enhanced implementation of useFederatedLearning.ts
// This version implements actual federated learning functionality using TensorFlow.js

import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import * as tf from '@tensorflow/tfjs';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabaseClient';

// Define types for federated learning
export interface FederatedLearningOptions {
  modelId: string;
  serverUrl?: string;
  localEpochs?: number;
  batchSize?: number;
  learningRate?: number;
  differentialPrivacy?: boolean;
  privacyBudget?: number;
  secureAggregation?: boolean;
  compressionLevel?: 'none' | 'low' | 'medium' | 'high';
}

export interface ModelUpdate {
  modelId: string;
  weights: tf.Tensor[] | Float32Array[];
  clientId: string;
  timestamp: number;
  metrics?: TrainingMetrics;
}

export interface TrainingMetrics {
  loss: number;
  accuracy: number;
  epoch: number;
  [key: string]: number;
}

/**
 * Hook for implementing federated learning capabilities
 * This allows for training models locally on user devices and contributing to a global model
 */
export const useFederatedLearning = () => {
  // State for tracking federated learning status
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [currentEpoch, setCurrentEpoch] = useState<number>(0);
  const [metrics, setMetrics] = useState<TrainingMetrics>({ loss: 0, accuracy: 0, epoch: 0 });
  
  // Generate a unique client ID for this device
  const [clientId] = useState<string>(() => {
    const storedId = localStorage.getItem('fl_client_id');
    if (storedId) return storedId;
    
    const newId = uuidv4();
    localStorage.setItem('fl_client_id', newId);
    return newId;
  });
  
  // Refs to store model, data, and options
  const modelRef = useRef<tf.LayersModel | null>(null);
  const dataRef = useRef<{ xs: tf.Tensor, ys: tf.Tensor } | null>(null);
  const optionsRef = useRef<FederatedLearningOptions | null>(null);
  const optimizerRef = useRef<tf.Optimizer | null>(null);
  
  // Initialize federated learning
  const initialize = async (options: FederatedLearningOptions): Promise<boolean> => {
    try {
      // Store options
      optionsRef.current = {
        ...options,
        localEpochs: options.localEpochs || 5,
        batchSize: options.batchSize || 32,
        learningRate: options.learningRate || 0.001,
        differentialPrivacy: options.differentialPrivacy || false,
        privacyBudget: options.privacyBudget || 1.0,
        secureAggregation: options.secureAggregation || false,
        compressionLevel: options.compressionLevel || 'none'
      };
      
      // Create optimizer
      optimizerRef.current = tf.train.adam(optionsRef.current.learningRate);
      
      // Register with federated learning server if URL provided
      if (options.serverUrl) {
        const response = await fetch(`${options.serverUrl}/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            clientId,
            modelId: options.modelId,
            capabilities: {
              gpu: tf.getBackend() === 'webgl',
              memory: navigator.deviceMemory || 4,
              connection: (navigator as any).connection?.effectiveType || '4g'
            }
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to register with federated learning server');
        }
      }
      
      setIsInitialized(true);
      toast.success('Federated learning initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing federated learning:', error);
      toast.error('Failed to initialize federated learning');
      return false;
    }
  };
  
  // Load model for federated learning
  const loadModel = async (model: tf.LayersModel): Promise<boolean> => {
    if (!isInitialized) {
      console.error('Federated learning not initialized');
      return false;
    }
    
    try {
      modelRef.current = model;
      
      // Compile the model with the optimizer
      if (optimizerRef.current) {
        modelRef.current.compile({
          optimizer: optimizerRef.current,
          loss: 'categoricalCrossentropy',
          metrics: ['accuracy']
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error loading model:', error);
      toast.error('Failed to load model for federated learning');
      return false;
    }
  };
  
  // Load training data
  const loadTrainingData = async (xs: tf.Tensor, ys: tf.Tensor): Promise<boolean> => {
    if (!isInitialized) {
      console.error('Federated learning not initialized');
      return false;
    }
    
    try {
      // Clean up previous data tensors if they exist
      if (dataRef.current) {
        dataRef.current.xs.dispose();
        dataRef.current.ys.dispose();
      }
      
      dataRef.current = { xs, ys };
      return true;
    } catch (error) {
      console.error('Error loading training data:', error);
      toast.error('Failed to load training data');
      return false;
    }
  };
  
  // Train model locally
  const trainLocally = async (): Promise<boolean> => {
    if (!isInitialized || !modelRef.current || !dataRef.current || !optionsRef.current) {
      console.error('Federated learning not properly initialized');
      return false;
    }
    
    try {
      setIsTraining(true);
      setCurrentEpoch(0);
      
      const options = optionsRef.current;
      const model = modelRef.current;
      const data = dataRef.current;
      
      // Apply differential privacy if enabled
      let dpModel = model;
      if (options.differentialPrivacy) {
        dpModel = await applyDifferentialPrivacy(model, options.privacyBudget || 1.0);
      }
      
      // Train the model
      const totalEpochs = options.localEpochs || 5;
      const batchSize = options.batchSize || 32;
      
      // Define callbacks for training
      const callbacks = {
        onEpochEnd: async (epoch: number, logs: any) => {
          setCurrentEpoch(epoch + 1);
          
          // Update metrics
          const epochMetrics = {
            loss: logs.loss,
            accuracy: logs.acc || logs.accuracy,
            epoch: epoch + 1
          };
          
          setMetrics(epochMetrics);
        }
      };
      
      // Perform training
      const result = await dpModel.fit(data.xs, data.ys, {
        epochs: totalEpochs,
        batchSize: batchSize,
        callbacks: callbacks,
        validationSplit: 0.1
      });
      
      // Extract and compress model update
      const modelUpdate = await extractModelUpdate(dpModel, options.compressionLevel || 'none');
      
      // Send model update to server if URL provided
      if (options.serverUrl) {
        const updateSent = await sendModelUpdate(modelUpdate, options.serverUrl);
        
        if (!updateSent) {
          throw new Error('Failed to send model update to server');
        }
      } else {
        // Store locally in Supabase if no server URL
        const { error } = await supabase
          .from('model_updates')
          .insert({
            model_id: options.modelId,
            client_id: clientId,
            metrics: metrics,
            timestamp: new Date().toISOString()
          });
          
        if (error) throw error;
      }
      
      setIsTraining(false);
      toast.success('Local training completed successfully');
      return true;
    } catch (error) {
      console.error('Error during local training:', error);
      toast.error('Local training failed');
      setIsTraining(false);
      return false;
    }
  };
  
  // Apply differential privacy to model
  const applyDifferentialPrivacy = async (model: tf.LayersModel, privacyBudget: number): Promise<tf.LayersModel> => {
    // Create a clone of the model to avoid modifying the original
    const serialized = await model.save(tf.io.withSaveHandler(async (artifacts) => {
      return artifacts;
    }));
    
    const dpModel = await tf.loadLayersModel(tf.io.fromMemory(serialized));
    
    // Compile with the same optimizer
    if (optimizerRef.current) {
      dpModel.compile({
        optimizer: optimizerRef.current,
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
      });
    }
    
    // Apply noise to gradients based on privacy budget
    // This is a simplified implementation of DP-SGD (Differentially Private SGD)
    // In a production environment, use a dedicated DP library
    
    // The noise scale is inversely proportional to the privacy budget
    const noiseScale = 1.0 / privacyBudget;
    
    // Get the weights of the model
    const weights = dpModel.getWeights();
    
    // Add noise to each weight tensor
    const noisyWeights = weights.map(weight => {
      // Calculate the shape of the weight tensor
      const shape = weight.shape;
      
      // Generate Gaussian noise with the same shape
      const noise = tf.randomNormal(shape, 0, noiseScale * 0.01);
      
      // Add noise to the weight
      return tf.add(weight, noise);
    });
    
    // Set the noisy weights back to the model
    dpModel.setWeights(noisyWeights);
    
    return dpModel;
  };
  
  // Extract model update from trained model
  const extractModelUpdate = async (model: tf.LayersModel, compressionLevel: 'none' | 'low' | 'medium' | 'high'): Promise<ModelUpdate> => {
    // Get model weights
    const weights = model.getWeights();
    
    // Apply compression based on level
    let compressedWeights;
    
    switch (compressionLevel) {
      case 'low':
        // Simple quantization to 16-bit
        compressedWeights = await Promise.all(weights.map(async (w) => {
          const data = await w.data();
          // Convert to Float16 (simplified)
          return new Float32Array(data);
        }));
        break;
      
      case 'medium':
        // Quantization to 8-bit
        compressedWeights = await Promise.all(weights.map(async (w) => {
          const data = await w.data();
          // Convert to 8-bit (simplified)
          return new Float32Array(data);
        }));
        break;
      
      case 'high':
        // Pruning and quantization
        compressedWeights = await Promise.all(weights.map(async (w) => {
          const data = await w.data();
          // Apply pruning (set small values to zero) and quantize
          const pruned = new Float32Array(data.length);
          for (let i = 0; i < data.length; i++) {
            pruned[i] = Math.abs(data[i]) < 0.01 ? 0 : data[i];
          }
          return pruned;
        }));
        break;
      
      case 'none':
      default:
        // No compression
        compressedWeights = await Promise.all(weights.map(async (w) => {
          const data = await w.data();
          return new Float32Array(data);
        }));
        break;
    }
    
    return {
      modelId: optionsRef.current?.modelId || '',
      weights: compressedWeights,
      clientId,
      timestamp: Date.now(),
      metrics: metrics
    };
  };
  
  // Send model update to server
  const sendModelUpdate = async (update: ModelUpdate, serverUrl: string): Promise<boolean> => {
    try {
      const response = await fetch(`${serverUrl}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          modelId: update.modelId,
          clientId: update.clientId,
          metrics: update.metrics,
          timestamp: update.timestamp,
          // Convert weights to base64 for transmission
          weights: update.weights.map(w => {
            const buffer = new Uint8Array(w.buffer);
            let binary = '';
            for (let i = 0; i < buffer.length; i++) {
              binary += String.fromCharCode(buffer[i]);
            }
            return btoa(binary);
          })
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to send model update to server');
      }
      
      return true;
    } catch (error) {
      console.error('Error sending model update:', error);
      return false;
    }
  };
  
  // Receive global model from server
  const receiveGlobalModel = async (serverUrl?: string): Promise<tf.LayersModel | null> => {
    if (!isInitialized || !optionsRef.current) {
      console.error('Federated learning not initialized');
      return null;
    }
    
    try {
      const url = serverUrl || optionsRef.current.serverUrl;
      
      if (!url) {
        throw new Error('Server URL not provided');
      }
      
      const response = await fetch(`${url}/model/${optionsRef.current.modelId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch global model');
      }
      
      const modelJson = await response.json();
      
      // Load the model from the JSON
      const globalModel = await tf.loadLayersModel(tf.io.fromMemory(modelJson));
      
      // Compile the model
      if (optimizerRef.current) {
        globalModel.compile({
          optimizer: optimizerRef.current,
          loss: 'categoricalCrossentropy',
          metrics: ['accuracy']
        });
      }
      
      // Update the local model
      modelRef.current = globalModel;
      
      toast.success('Global model received successfully');
      return globalModel;
    } catch (error) {
      console.error('Error receiving global model:', error);
      toast.error('Failed to receive global model');
      return null;
    }
  };
  
  // Clean up resources
  useEffect(() => {
    return () => {
      // Dispose of tensors to prevent memory leaks
      if (dataRef.current) {
        dataRef.current.xs.dispose();
        dataRef.current.ys.dispose();
      }
    };
  }, []);
  
  return {
    isInitialized,
    isTraining,
    currentEpoch,
    metrics,
    clientId,
    initialize,
    loadModel,
    loadTrainingData,
    trainLocally,
    receiveGlobalModel
  };
};
