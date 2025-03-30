// Enhanced implementation of Self-Learning Service
// This version implements actual self-learning capabilities

import { useState, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import { toast } from 'sonner';
import { supabase } from '../lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

// Define types for self-learning
export interface SelfLearningOptions {
  modelId: string;
  learningRate: number;
  batchSize: number;
  epochs: number;
  validationSplit: number;
  earlyStoppingPatience: number;
  adaptiveThreshold: number;
  continuousLearning: boolean;
  feedbackIncorporation: boolean;
  anomalyDetection: boolean;
  conceptDriftDetection: boolean;
}

export interface LearningEvent {
  id: string;
  modelId: string;
  eventType: 'training' | 'adaptation' | 'feedback' | 'anomaly' | 'drift';
  timestamp: number;
  metrics: { [key: string]: number };
  description: string;
}

export interface ModelState {
  modelId: string;
  version: number;
  timestamp: number;
  metrics: { [key: string]: number };
  weights?: Float32Array[];
}

/**
 * Service for implementing self-learning capabilities
 * This allows the AI to continuously improve based on new data and feedback
 */
export class SelfLearningService {
  private static instance: SelfLearningService;
  private options: SelfLearningOptions | null = null;
  private model: tf.LayersModel | null = null;
  private isInitialized: boolean = false;
  private isLearning: boolean = false;
  private events: LearningEvent[] = [];
  private modelState: ModelState | null = null;
  private driftDetector: ConceptDriftDetector | null = null;
  private anomalyDetector: AnomalyDetector | null = null;
  
  // Private constructor for singleton pattern
  private constructor() {}
  
  // Get singleton instance
  public static getInstance(): SelfLearningService {
    if (!SelfLearningService.instance) {
      SelfLearningService.instance = new SelfLearningService();
    }
    return SelfLearningService.instance;
  }
  
  // Initialize self-learning
  public async initialize(options: Partial<SelfLearningOptions> = {}): Promise<boolean> {
    try {
      // Set default options
      this.options = {
        modelId: options.modelId || uuidv4(),
        learningRate: options.learningRate || 0.001,
        batchSize: options.batchSize || 32,
        epochs: options.epochs || 10,
        validationSplit: options.validationSplit || 0.2,
        earlyStoppingPatience: options.earlyStoppingPatience || 3,
        adaptiveThreshold: options.adaptiveThreshold || 0.05,
        continuousLearning: options.continuousLearning !== undefined ? options.continuousLearning : true,
        feedbackIncorporation: options.feedbackIncorporation !== undefined ? options.feedbackIncorporation : true,
        anomalyDetection: options.anomalyDetection !== undefined ? options.anomalyDetection : true,
        conceptDriftDetection: options.conceptDriftDetection !== undefined ? options.conceptDriftDetection : true
      };
      
      // Initialize concept drift detector if enabled
      if (this.options.conceptDriftDetection) {
        this.driftDetector = new ConceptDriftDetector({
          windowSize: 100,
          threshold: this.options.adaptiveThreshold
        });
      }
      
      // Initialize anomaly detector if enabled
      if (this.options.anomalyDetection) {
        this.anomalyDetector = new AnomalyDetector({
          threshold: 3.0, // Standard deviations
          minSamples: 50
        });
      }
      
      // Try to load existing model state from storage
      const existingState = await this.loadModelState(this.options.modelId);
      
      if (existingState) {
        this.modelState = existingState;
        console.log(`Loaded existing model state (version ${existingState.version})`);
      } else {
        // Initialize new model state
        this.modelState = {
          modelId: this.options.modelId,
          version: 1,
          timestamp: Date.now(),
          metrics: {}
        };
      }
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Error initializing self-learning:', error);
      return false;
    }
  }
  
  // Load model
  public async loadModel(model: tf.LayersModel): Promise<boolean> {
    if (!this.isInitialized) {
      console.error('Self-learning not initialized');
      return false;
    }
    
    try {
      this.model = model;
      
      // If we have weights in the model state, apply them
      if (this.modelState?.weights) {
        const tensors = this.modelState.weights.map(w => tf.tensor(w));
        this.model.setWeights(tensors);
        
        // Clean up tensors
        tensors.forEach(t => t.dispose());
      }
      
      return true;
    } catch (error) {
      console.error('Error loading model:', error);
      return false;
    }
  }
  
  // Train model with new data
  public async train(
    xs: tf.Tensor,
    ys: tf.Tensor,
    validationData?: [tf.Tensor, tf.Tensor]
  ): Promise<{ success: boolean, metrics?: { [key: string]: number } }> {
    if (!this.isInitialized || !this.model || !this.options) {
      console.error('Self-learning not properly initialized');
      return { success: false };
    }
    
    if (this.isLearning) {
      console.error('Learning already in progress');
      return { success: false };
    }
    
    try {
      this.isLearning = true;
      
      // Check for concept drift if enabled
      if (this.options.conceptDriftDetection && this.driftDetector && this.modelState) {
        const predictions = this.model.predict(xs) as tf.Tensor;
        const predictionValues = await predictions.array();
        const actualValues = await ys.array();
        
        // Check for drift
        const driftDetected = this.driftDetector.detectDrift(predictionValues, actualValues);
        
        if (driftDetected) {
          console.log('Concept drift detected, adapting model...');
          
          // Log drift event
          this.logEvent({
            id: uuidv4(),
            modelId: this.options.modelId,
            eventType: 'drift',
            timestamp: Date.now(),
            metrics: { driftMagnitude: this.driftDetector.getDriftMagnitude() },
            description: 'Concept drift detected, adapting model'
          });
          
          // Adjust learning rate based on drift magnitude
          const driftMagnitude = this.driftDetector.getDriftMagnitude();
          const adjustedLearningRate = this.options.learningRate * (1 + driftMagnitude);
          
          // Create new optimizer with adjusted learning rate
          const optimizer = tf.train.adam(adjustedLearningRate);
          
          // Recompile model with new optimizer
          this.model.compile({
            optimizer: optimizer,
            loss: this.model.loss as string,
            metrics: this.model.metrics as string[]
          });
        }
        
        // Clean up
        predictions.dispose();
      }
      
      // Check for anomalies if enabled
      if (this.options.anomalyDetection && this.anomalyDetector) {
        const xValues = await xs.array();
        const anomalies = this.anomalyDetector.detectAnomalies(xValues);
        
        if (anomalies.length > 0) {
          console.log(`Detected ${anomalies.length} anomalies in training data`);
          
          // Log anomaly event
          this.logEvent({
            id: uuidv4(),
            modelId: this.options.modelId,
            eventType: 'anomaly',
            timestamp: Date.now(),
            metrics: { anomalyCount: anomalies.length },
            description: `Detected ${anomalies.length} anomalies in training data`
          });
          
          // Filter out anomalies if there are too many
          if (anomalies.length < xValues.length * 0.3) { // Only filter if less than 30% are anomalies
            // Create mask for non-anomalous data
            const mask = Array(xValues.length).fill(true);
            anomalies.forEach(idx => mask[idx] = false);
            
            // Filter data
            const filteredXs = tf.tensor(xValues.filter((_, i) => mask[i]));
            const filteredYs = tf.tensor(await ys.array().then(y => y.filter((_, i) => mask[i])));
            
            // Replace original tensors
            xs.dispose();
            ys.dispose();
            xs = filteredXs;
            ys = filteredYs;
          }
        }
      }
      
      // Configure training
      const options = {
        epochs: this.options.epochs,
        batchSize: this.options.batchSize,
        validationSplit: validationData ? 0 : this.options.validationSplit,
        validationData: validationData,
        callbacks: {
          onEpochEnd: (epoch: number, logs: any) => {
            console.log(`Epoch ${epoch + 1}/${this.options.epochs}, loss: ${logs.loss.toFixed(4)}`);
          }
        }
      };
      
      // Add early stopping if specified
      if (this.options.earlyStoppingPatience > 0) {
        const earlyStoppingCallback = tf.callbacks.earlyStopping({
          monitor: 'val_loss',
          patience: this.options.earlyStoppingPatience
        });
        
        options.callbacks = {
          ...options.callbacks,
          callbacks: [earlyStoppingCallback]
        };
      }
      
      // Train the model
      const result = await this.model.fit(xs, ys, options);
      
      // Get final metrics
      const finalEpoch = result.history.loss.length - 1;
      const metrics: { [key: string]: number } = {
        loss: result.history.loss[finalEpoch]
      };
      
      // Add accuracy if available
      if (result.history.acc) {
        metrics.accuracy = result.history.acc[finalEpoch];
      } else if (result.history.accuracy) {
        metrics.accuracy = result.history.accuracy[finalEpoch];
      }
      
      // Add validation metrics if available
      if (result.history.val_loss) {
        metrics.val_loss = result.history.val_loss[finalEpoch];
      }
      
      if (result.history.val_acc) {
        metrics.val_accuracy = result.history.val_acc[finalEpoch];
      } else if (result.history.val_accuracy) {
        metrics.val_accuracy = result.history.val_accuracy[finalEpoch];
      }
      
      // Update model state
      if (this.modelState) {
        this.modelState.version += 1;
        this.modelState.timestamp = Date.now();
        this.modelState.metrics = metrics;
        
        // Save weights
        const weights = this.model.getWeights();
        this.modelState.weights = await Promise.all(
          weights.map(async w => new Float32Array(await w.data()))
        );
        
        // Save model state
        await this.saveModelState(this.modelState);
      }
      
      // Log training event
      this.logEvent({
        id: uuidv4(),
        modelId: this.options.modelId,
        eventType: 'training',
        timestamp: Date.now(),
        metrics: metrics,
        description: `Trained model for ${result.history.loss.length} epochs`
      });
      
      this.isLearning = false;
      return { success: true, metrics };
    } catch (error) {
      console.error('Error during training:', error);
      this.isLearning = false;
      return { success: false };
    }
  }
  
  // Incorporate feedback
  public async incorporateFeedback(
    feedback: { input: any, expected: any, importance?: number }[]
  ): Promise<boolean> {
    if (!this.isInitialized || !this.model || !this.options || !this.options.feedbackIncorporation) {
      console.error('Feedback incorporation not properly initialized or disabled');
      return false;
    }
    
    if (this.isLearning) {
      console.error('Learning already in progress');
      return false;
    }
    
    try {
      this.isLearning = true;
      
      // Convert feedback to tensors
      const inputs = feedback.map(f => f.input);
      const expected = feedback.map(f => f.expected);
      
      // Create importance weights if provided
      const sampleWeights = feedback.some(f => f.importance !== undefined)
        ? tf.tensor1d(feedback.map(f => f.importance || 1.0))
        : undefined;
      
      // Create tensors
      const xs = tf.tensor(inputs);
      const ys = tf.tensor(expected);
      
      // Configure training with higher learning rate for feedback
      const feedbackLearningRate = this.options.learningRate * 2;
      const optimizer = tf.train.adam(feedbackLearningRate);
      
      // Recompile model with new optimizer
      this.model.compile({
        optimizer: optimizer,
        loss: this.model.loss as string,
        metrics: this.model.metrics as string[]
      });
      
      // Train on feedback with more epochs to emphasize it
      const result = await this.model.fit(xs, ys, {
        epochs: this.options.epochs * 2,
        batchSize: Math.max(1, Math.min(this.options.batchSize, feedback.length)),
        sampleWeight: sampleWeights
      });
      
      // Get final metrics
      const finalEpoch = result.history.loss.length - 1;
      const metrics: { [key: string]: number } = {
        loss: result.history.loss[finalEpoch]
      };
      
      // Add accuracy if available
      if (result.history.acc) {
        metrics.accuracy = result.history.acc[finalEpoch];
      } else if (result.history.accuracy) {
        metrics.accuracy = result.history.accuracy[finalEpoch];
      }
      
      // Update model state
      if (this.modelState) {
        this.modelState.version += 1;
        this.modelState.timestamp = Date.now();
        this.modelState.metrics = metrics;
        
        // Save weights
        const weights = this.model.getWeights();
        this.modelState.weights = await Promise.all(
          weights.map(async w => new Float32Array(await w.data()))
        );
        
        // Save model state
        await this.saveModelState(this.modelState);
      }
      
      // Log feedback event
      this.logEvent({
        id: uuidv4(),
        modelId: this.options.modelId,
        eventType: 'feedback',
        timestamp: Date.now(),
        metrics: metrics,
        description: `Incorporated feedback from ${feedback.length} examples`
      });
      
      // Clean up
      xs.dispose();
      ys.dispose();
      if (sampleWeights) sampleWeights.dispose();
      
      this.isLearning = false;
      return true;
    } catch (error) {
      console.error('Error incorporating feedback:', error);
      this.isLearning = false;
      return false;
    }
  }
  
  // Adapt to new data distribution
  public async adaptToDistribution(
    newData: { xs: tf.Tensor, ys: tf.Tensor },
    oldData: { xs: tf.Tensor, ys: tf.Tensor }
  ): Promise<boolean> {
    if (!this.isInitialized || !this.model || !this.options) {
      console.error('Self-learning not properly initialized');
      return false;
    }
    
    if (this.isLearning) {
      console.error('Learning already in progress');
      return false;
    }
    
    try {
      this.isLearning = true;
      
      // Measure distribution difference
      const oldPredictions = this.model.predict(oldData.xs) as tf.Tensor;
      const newPredictions = this.model.predict(newData.xs) as tf.Tensor;
      
      const oldPredArray = await oldPredictions.array();
      const newPredArray = await newPredictions.array();
      
      // Calculate distribution difference (simplified)
      const distributionDifference = calculateDistributionDifference(oldPredArray, newPredArray);
      
      // Adjust learning rate based on distribution difference
      const adaptiveLearningRate = this.options.learningRate * 
        (1 + Math.min(5, distributionDifference / this.options.adaptiveThreshold));
      
      console.log(`Distribution difference: ${distributionDifference.toFixed(4)}, adaptive learning rate: ${adaptiveLearningRate.toFixed(6)}`);
      
      // Create new optimizer with adaptive learning rate
      const optimizer = tf.train.adam(adaptiveLearningRate);
      
      // Recompile model with new optimizer
      this.model.compile({
        optimizer: optimizer,
        loss: this.model.loss as string,
        metrics: this.model.metrics as string[]
      });
      
      // Train on combined data with emphasis on new data
      // Create a combined dataset with repeated new data
      const repetitions = Math.max(1, Math.min(5, Math.ceil(distributionDifference / this.options.adaptiveThreshold)));
      
      let combinedXs, combinedYs;
      
      if (repetitions > 1) {
        // Repeat new data to emphasize it
        const newXsArray = await newData.xs.array();
        const newYsArray = await newData.ys.array();
        
        let repeatedXs = [...newXsArray];
        let repeatedYs = [...newYsArray];
        
        for (let i = 1; i < repetitions; i++) {
          repeatedXs = repeatedXs.concat(newXsArray);
          repeatedYs = repeatedYs.concat(newYsArray);
        }
        
        const oldXsArray = await oldData.xs.array();
        const oldYsArray = await oldData.ys.array();
        
        combinedXs = tf.tensor([...oldXsArray, ...repeatedXs]);
        combinedYs = tf.tensor([...oldYsArray, ...repeatedYs]);
      } else {
        // Just concatenate the datasets
        combinedXs = tf.concat([oldData.xs, newData.xs]);
        combinedYs = tf.concat([oldData.ys, newData.ys]);
      }
      
      // Train on combined data
      const result = await this.model.fit(combinedXs, combinedYs, {
        epochs: this.options.epochs,
        batchSize: this.options.batchSize,
        validationSplit: this.options.validationSplit
      });
      
      // Get final metrics
      const finalEpoch = result.history.loss.length - 1;
      const metrics: { [key: string]: number } = {
        loss: result.history.loss[finalEpoch],
        distributionDifference: distributionDifference
      };
      
      // Add accuracy if available
      if (result.history.acc) {
        metrics.accuracy = result.history.acc[finalEpoch];
      } else if (result.history.accuracy) {
        metrics.accuracy = result.history.accuracy[finalEpoch];
      }
      
      // Update model state
      if (this.modelState) {
        this.modelState.version += 1;
        this.modelState.timestamp = Date.now();
        this.modelState.metrics = metrics;
        
        // Save weights
        const weights = this.model.getWeights();
        this.modelState.weights = await Promise.all(
          weights.map(async w => new Float32Array(await w.data()))
        );
        
        // Save model state
        await this.saveModelState(this.modelState);
      }
      
      // Log adaptation event
      this.logEvent({
        id: uuidv4(),
        modelId: this.options.modelId,
        eventType: 'adaptation',
        timestamp: Date.now(),
        metrics: metrics,
        description: `Adapted to new data distribution (difference: ${distributionDifference.toFixed(4)})`
      });
      
      // Clean up
      oldPredictions.dispose();
      newPredictions.dispose();
      combinedXs.dispose();
      combinedYs.dispose();
      
      this.isLearning = false;
      return true;
    } catch (error) {
      console.error('Error adapting to distribution:', error);
      this.isLearning = false;
      return false;
    }
  }
  
  // Get learning events
  public getEvents(): LearningEvent[] {
    return [...this.events];
  }
  
  // Get model state
  public getModelState(): ModelState | null {
    return this.modelState ? { ...this.modelState } : null;
  }
  
  // Log learning event
  private logEvent(event: LearningEvent): void {
    this.events.push(event);
    
    // Keep only the last 100 events
    if (this.events.length > 100) {
      this.events = this.events.slice(-100);
    }
    
    // Save event to storage
    this.saveEvent(event).catch(error => {
      console.error('Error saving event:', error);
    });
  }
  
  // Save event to storage
  private async saveEvent(event: LearningEvent): Promise<void> {
    try {
      // Save to Supabase
      const { error } = await supabase
        .from('learning_events')
        .insert({
          id: event.id,
          model_id: event.modelId,
          event_type: event.eventType,
          timestamp: new Date(event.timestamp).toISOString(),
          metrics: event.metrics,
          description: event.description
        });
        
      if (error) throw error;
    } catch (error) {
      console.error('Error saving event to storage:', error);
      
      // Fallback to local storage
      try {
        const storedEvents = localStorage.getItem('learning_events');
        const events = storedEvents ? JSON.parse(storedEvents) : [];
        events.push(event);
        localStorage.setItem('learning_events', JSON.stringify(events.slice(-100)));
      } catch (localError) {
        console.error('Error saving event to local storage:', localError);
      }
    }
  }
  
  // Load model state from storage
  private async loadModelState(modelId: string): Promise<ModelState | null> {
    try {
      // Try to load from Supabase
      const { data, error } = await supabase
        .from('model_states')
        .select('*')
        .eq('model_id', modelId)
        .order('version', { ascending: false })
        .limit(1)
        .single();
        
      if (error) {
        if (error.code === 'PGRST116') {
          // No data found
          return null;
        }
        throw error;
      }
      
      if (data) {
        return {
          modelId: data.model_id,
          version: data.version,
          timestamp: new Date(data.timestamp).getTime(),
          metrics: data.metrics,
          weights: data.weights
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error loading model state from Supabase:', error);
      
      // Fallback to local storage
      try {
        const storedState = localStorage.getItem(`model_state_${modelId}`);
        return storedState ? JSON.parse(storedState) : null;
      } catch (localError) {
        console.error('Error loading model state from local storage:', localError);
        return null;
      }
    }
  }
  
  // Save model state to storage
  private async saveModelState(state: ModelState): Promise<void> {
    try {
      // Save to Supabase
      const { error } = await supabase
        .from('model_states')
        .insert({
          model_id: state.modelId,
          version: state.version,
          timestamp: new Date(state.timestamp).toISOString(),
          metrics: state.metrics,
          weights: state.weights
        });
        
      if (error) throw error;
    } catch (error) {
      console.error('Error saving model state to Supabase:', error);
      
      // Fallback to local storage
      try {
        localStorage.setItem(`model_state_${state.modelId}`, JSON.stringify(state));
      } catch (localError) {
        console.error('Error saving model state to local storage:', localError);
      }
    }
  }
}

/**
 * Calculate difference between two distributions
 * This is a simplified implementation using mean and variance
 */
function calculateDistributionDifference(dist1: any[], dist2: any[]): number {
  // Convert to flat arrays if needed
  const flatten = (arr: any[]): number[] => {
    const result: number[] = [];
    const process = (item: any) => {
      if (Array.isArray(item)) {
        item.forEach(process);
      } else if (typeof item === 'number') {
        result.push(item);
      }
    };
    arr.forEach(process);
    return result;
  };
  
  const flat1 = flatten(dist1);
  const flat2 = flatten(dist2);
  
  // Calculate means
  const mean1 = flat1.reduce((sum, val) => sum + val, 0) / flat1.length;
  const mean2 = flat2.reduce((sum, val) => sum + val, 0) / flat2.length;
  
  // Calculate variances
  const variance1 = flat1.reduce((sum, val) => sum + Math.pow(val - mean1, 2), 0) / flat1.length;
  const variance2 = flat2.reduce((sum, val) => sum + Math.pow(val - mean2, 2), 0) / flat2.length;
  
  // Calculate difference using Bhattacharyya distance (simplified)
  const meanDiff = Math.pow(mean1 - mean2, 2) / (variance1 + variance2);
  const varDiff = 0.5 * Math.log(0.25 * ((variance1 / variance2) + (variance2 / variance1) + 2));
  
  return meanDiff + varDiff;
}

/**
 * Concept Drift Detector
 * Detects when the relationship between input and output changes
 */
class ConceptDriftDetector {
  private windowSize: number;
  private threshold: number;
  private errorWindow: number[] = [];
  private driftMagnitude: number = 0;
  
  constructor(options: { windowSize: number, threshold: number }) {
    this.windowSize = options.windowSize;
    this.threshold = options.threshold;
  }
  
  // Detect drift by comparing predictions to actual values
  public detectDrift(predictions: any[], actuals: any[]): boolean {
    // Calculate error for each prediction
    const errors = this.calculateErrors(predictions, actuals);
    
    // Add errors to window
    this.errorWindow = [...this.errorWindow, ...errors].slice(-this.windowSize);
    
    // Need enough samples to detect drift
    if (this.errorWindow.length < this.windowSize) {
      return false;
    }
    
    // Split window into two halves
    const midpoint = Math.floor(this.errorWindow.length / 2);
    const firstHalf = this.errorWindow.slice(0, midpoint);
    const secondHalf = this.errorWindow.slice(midpoint);
    
    // Calculate mean and variance for each half
    const mean1 = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const mean2 = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    const variance1 = firstHalf.reduce((sum, val) => sum + Math.pow(val - mean1, 2), 0) / firstHalf.length;
    const variance2 = secondHalf.reduce((sum, val) => sum + Math.pow(val - mean2, 2), 0) / secondHalf.length;
    
    // Calculate drift magnitude using Page-Hinkley test (simplified)
    const meanDifference = Math.abs(mean2 - mean1);
    const varianceDifference = Math.abs(variance2 - variance1);
    
    this.driftMagnitude = (meanDifference / (mean1 || 0.001)) + (varianceDifference / (variance1 || 0.001));
    
    // Detect drift if magnitude exceeds threshold
    return this.driftMagnitude > this.threshold;
  }
  
  // Calculate errors between predictions and actuals
  private calculateErrors(predictions: any[], actuals: any[]): number[] {
    const errors: number[] = [];
    
    // Handle different shapes of predictions and actuals
    if (Array.isArray(predictions[0])) {
      // Multi-dimensional predictions (e.g., classification)
      for (let i = 0; i < predictions.length; i++) {
        const pred = predictions[i];
        const actual = actuals[i];
        
        if (Array.isArray(pred) && Array.isArray(actual)) {
          // Calculate mean squared error
          let squaredError = 0;
          for (let j = 0; j < pred.length; j++) {
            squaredError += Math.pow(pred[j] - actual[j], 2);
          }
          errors.push(squaredError / pred.length);
        } else {
          // Scalar prediction and actual
          errors.push(Math.pow(pred - actual, 2));
        }
      }
    } else {
      // Scalar predictions
      for (let i = 0; i < predictions.length; i++) {
        errors.push(Math.pow(predictions[i] - actuals[i], 2));
      }
    }
    
    return errors;
  }
  
  // Get the magnitude of detected drift
  public getDriftMagnitude(): number {
    return this.driftMagnitude;
  }
}

/**
 * Anomaly Detector
 * Detects unusual data points that may negatively impact learning
 */
class AnomalyDetector {
  private threshold: number;
  private minSamples: number;
  private means: number[] = [];
  private stdDevs: number[] = [];
  private sampleCount: number = 0;
  
  constructor(options: { threshold: number, minSamples: number }) {
    this.threshold = options.threshold;
    this.minSamples = options.minSamples;
  }
  
  // Detect anomalies in data
  public detectAnomalies(data: any[]): number[] {
    // Update statistics with new data
    this.updateStatistics(data);
    
    // Need enough samples to detect anomalies
    if (this.sampleCount < this.minSamples) {
      return [];
    }
    
    const anomalies: number[] = [];
    
    // Check each data point for anomalies
    for (let i = 0; i < data.length; i++) {
      const point = this.flattenDataPoint(data[i]);
      let isAnomaly = false;
      
      // Check each feature
      for (let j = 0; j < point.length; j++) {
        if (j >= this.means.length) continue;
        
        const value = point[j];
        const mean = this.means[j];
        const stdDev = this.stdDevs[j];
        
        // Calculate z-score
        const zScore = Math.abs((value - mean) / (stdDev || 0.001));
        
        // Mark as anomaly if z-score exceeds threshold
        if (zScore > this.threshold) {
          isAnomaly = true;
          break;
        }
      }
      
      if (isAnomaly) {
        anomalies.push(i);
      }
    }
    
    return anomalies;
  }
  
  // Update statistics with new data
  private updateStatistics(data: any[]): void {
    // Convert data to array of flat feature vectors
    const flatData: number[][] = data.map(this.flattenDataPoint);
    
    // Initialize means and stdDevs if needed
    if (this.means.length === 0 && flatData.length > 0) {
      this.means = Array(flatData[0].length).fill(0);
      this.stdDevs = Array(flatData[0].length).fill(0);
    }
    
    // Update sample count
    const newSampleCount = this.sampleCount + flatData.length;
    
    // Update means
    for (let i = 0; i < this.means.length; i++) {
      let sum = this.means[i] * this.sampleCount;
      
      for (let j = 0; j < flatData.length; j++) {
        if (i < flatData[j].length) {
          sum += flatData[j][i];
        }
      }
      
      this.means[i] = sum / newSampleCount;
    }
    
    // Update standard deviations
    for (let i = 0; i < this.stdDevs.length; i++) {
      let sumSquaredDiff = Math.pow(this.stdDevs[i], 2) * this.sampleCount;
      
      for (let j = 0; j < flatData.length; j++) {
        if (i < flatData[j].length) {
          sumSquaredDiff += Math.pow(flatData[j][i] - this.means[i], 2);
        }
      }
      
      this.stdDevs[i] = Math.sqrt(sumSquaredDiff / newSampleCount);
    }
    
    this.sampleCount = newSampleCount;
  }
  
  // Flatten a data point into a 1D array of numbers
  private flattenDataPoint(point: any): number[] {
    if (typeof point === 'number') {
      return [point];
    }
    
    if (Array.isArray(point)) {
      const result: number[] = [];
      
      for (const item of point) {
        if (typeof item === 'number') {
          result.push(item);
        } else if (Array.isArray(item)) {
          result.push(...this.flattenDataPoint(item));
        }
      }
      
      return result;
    }
    
    return [];
  }
}

/**
 * Hook for using self-learning capabilities
 */
export const useSelfLearning = () => {
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isLearning, setIsLearning] = useState<boolean>(false);
  const [events, setEvents] = useState<LearningEvent[]>([]);
  const [modelState, setModelState] = useState<ModelState | null>(null);
  
  const selfLearningService = SelfLearningService.getInstance();
  
  // Initialize self-learning
  const initialize = async (options: Partial<SelfLearningOptions> = {}): Promise<boolean> => {
    const success = await selfLearningService.initialize(options);
    
    if (success) {
      setIsInitialized(true);
      setModelState(selfLearningService.getModelState());
      setEvents(selfLearningService.getEvents());
      toast.success('Self-learning initialized successfully');
    } else {
      toast.error('Failed to initialize self-learning');
    }
    
    return success;
  };
  
  // Load model
  const loadModel = async (model: tf.LayersModel): Promise<boolean> => {
    if (!isInitialized) {
      console.error('Self-learning not initialized');
      return false;
    }
    
    const success = await selfLearningService.loadModel(model);
    
    if (success) {
      toast.success('Model loaded successfully');
    } else {
      toast.error('Failed to load model');
    }
    
    return success;
  };
  
  // Train model
  const train = async (
    xs: tf.Tensor,
    ys: tf.Tensor,
    validationData?: [tf.Tensor, tf.Tensor]
  ): Promise<{ success: boolean, metrics?: { [key: string]: number } }> => {
    if (!isInitialized) {
      console.error('Self-learning not initialized');
      return { success: false };
    }
    
    setIsLearning(true);
    
    const result = await selfLearningService.train(xs, ys, validationData);
    
    setIsLearning(false);
    setModelState(selfLearningService.getModelState());
    setEvents(selfLearningService.getEvents());
    
    if (result.success) {
      toast.success('Training completed successfully');
    } else {
      toast.error('Training failed');
    }
    
    return result;
  };
  
  // Incorporate feedback
  const incorporateFeedback = async (
    feedback: { input: any, expected: any, importance?: number }[]
  ): Promise<boolean> => {
    if (!isInitialized) {
      console.error('Self-learning not initialized');
      return false;
    }
    
    setIsLearning(true);
    
    const success = await selfLearningService.incorporateFeedback(feedback);
    
    setIsLearning(false);
    setModelState(selfLearningService.getModelState());
    setEvents(selfLearningService.getEvents());
    
    if (success) {
      toast.success('Feedback incorporated successfully');
    } else {
      toast.error('Failed to incorporate feedback');
    }
    
    return success;
  };
  
  // Adapt to new data distribution
  const adaptToDistribution = async (
    newData: { xs: tf.Tensor, ys: tf.Tensor },
    oldData: { xs: tf.Tensor, ys: tf.Tensor }
  ): Promise<boolean> => {
    if (!isInitialized) {
      console.error('Self-learning not initialized');
      return false;
    }
    
    setIsLearning(true);
    
    const success = await selfLearningService.adaptToDistribution(newData, oldData);
    
    setIsLearning(false);
    setModelState(selfLearningService.getModelState());
    setEvents(selfLearningService.getEvents());
    
    if (success) {
      toast.success('Adapted to new distribution successfully');
    } else {
      toast.error('Failed to adapt to new distribution');
    }
    
    return success;
  };
  
  // Update events and model state periodically
  useEffect(() => {
    if (!isInitialized) return;
    
    const interval = setInterval(() => {
      setEvents(selfLearningService.getEvents());
      setModelState(selfLearningService.getModelState());
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isInitialized]);
  
  return {
    isInitialized,
    isLearning,
    events,
    modelState,
    initialize,
    loadModel,
    train,
    incorporateFeedback,
    adaptToDistribution
  };
};
