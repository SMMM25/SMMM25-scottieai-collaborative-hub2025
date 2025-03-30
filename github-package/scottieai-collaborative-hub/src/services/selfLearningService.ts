import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import CryptoJS from 'crypto-js';

// Secret key for encryption (in a real app, this would be stored securely)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'scottieai-secure-key-2025';

// Interface for feedback data
interface FeedbackData {
  recommendationId: string;
  projectId: string;
  userId: string;
  accepted: boolean;
  helpful: boolean;
  feedbackText?: string;
  context?: any;
  timestamp: string;
}

// Interface for learning model
interface LearningModel {
  id: string;
  modelType: string;
  weights: any;
  metadata: any;
  version: number;
  createdAt: string;
  updatedAt: string;
}

// Interface for knowledge repository item
interface KnowledgeItem {
  id: string;
  category: string;
  pattern: string;
  solution: string;
  confidence: number;
  usageCount: number;
  successRate: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Service for self-learning AI capabilities
 */
export class SelfLearningService {
  private static instance: SelfLearningService;
  private models: Map<string, LearningModel> = new Map();
  private knowledgeRepository: KnowledgeItem[] = [];
  private feedbackQueue: FeedbackData[] = [];
  private isProcessingFeedback = false;
  private lastTrainingTime: Date | null = null;
  private trainingInterval: number = 24 * 60 * 60 * 1000; // 24 hours
  private initialized = false;

  // Private constructor for singleton pattern
  private constructor() {}

  // Get singleton instance
  public static getInstance(): SelfLearningService {
    if (!SelfLearningService.instance) {
      SelfLearningService.instance = new SelfLearningService();
    }
    return SelfLearningService.instance;
  }

  // Initialize the service
  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Load models from database
      await this.loadModels();
      
      // Load knowledge repository
      await this.loadKnowledgeRepository();
      
      // Set up periodic training
      this.setupPeriodicTraining();
      
      this.initialized = true;
      console.log('Self-learning service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize self-learning service:', error);
      toast.error('Failed to initialize AI learning capabilities');
    }
  }

  // Load models from database
  private async loadModels(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('learning_models')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Group by model type and get latest version
      const latestModels = new Map<string, any>();
      
      data.forEach(model => {
        const decryptedWeights = this.decryptData(model.weights);
        const modelWithDecryptedWeights = {
          ...model,
          weights: decryptedWeights
        };
        
        if (!latestModels.has(model.model_type) || 
            latestModels.get(model.model_type).version < model.version) {
          latestModels.set(model.model_type, modelWithDecryptedWeights);
        }
      });
      
      // Convert to our internal model format
      latestModels.forEach((model, modelType) => {
        this.models.set(modelType, {
          id: model.id,
          modelType: model.model_type,
          weights: model.weights,
          metadata: model.metadata,
          version: model.version,
          createdAt: model.created_at,
          updatedAt: model.updated_at
        });
      });
      
      console.log(`Loaded ${this.models.size} learning models`);
    } catch (error) {
      console.error('Error loading learning models:', error);
      throw error;
    }
  }

  // Load knowledge repository from database
  private async loadKnowledgeRepository(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('knowledge_repository')
        .select('*')
        .order('usage_count', { ascending: false });

      if (error) throw error;

      // Convert to our internal format
      this.knowledgeRepository = data.map(item => ({
        id: item.id,
        category: item.category,
        pattern: item.pattern,
        solution: item.solution,
        confidence: item.confidence,
        usageCount: item.usage_count,
        successRate: item.success_rate,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));
      
      console.log(`Loaded ${this.knowledgeRepository.length} knowledge items`);
    } catch (error) {
      console.error('Error loading knowledge repository:', error);
      throw error;
    }
  }

  // Set up periodic training
  private setupPeriodicTraining(): void {
    // Check if training is needed every hour
    setInterval(() => {
      this.checkAndTrain();
    }, 60 * 60 * 1000); // 1 hour
  }

  // Check if training is needed and train if necessary
  private async checkAndTrain(): Promise<void> {
    // If never trained or last training was more than trainingInterval ago
    if (!this.lastTrainingTime || 
        (new Date().getTime() - this.lastTrainingTime.getTime() > this.trainingInterval)) {
      
      // Check if we have enough feedback data
      const { count, error } = await supabase
        .from('recommendation_feedback')
        .select('*', { count: 'exact', head: true })
        .gt('created_at', this.lastTrainingTime?.toISOString() || '1970-01-01');

      if (error) {
        console.error('Error checking feedback count:', error);
        return;
      }

      // If we have enough new feedback data, train the models
      if (count > 50) {
        await this.trainModels();
      }
    }
  }

  // Train models with new feedback data
  private async trainModels(): Promise<void> {
    try {
      console.log('Starting model training...');
      toast.info('AI is learning from new feedback data');
      
      // Get feedback data since last training
      const { data, error } = await supabase
        .from('recommendation_feedback')
        .select('*')
        .gt('created_at', this.lastTrainingTime?.toISOString() || '1970-01-01')
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        console.log('No new feedback data for training');
        return;
      }

      // Process feedback data for each model type
      await this.trainRecommendationModel(data);
      await this.trainPatternRecognitionModel(data);
      
      // Update last training time
      this.lastTrainingTime = new Date();
      
      console.log('Model training completed successfully');
      toast.success('AI has successfully learned from new data');
    } catch (error) {
      console.error('Error training models:', error);
      toast.error('Failed to train AI models');
    }
  }

  // Train recommendation model
  private async trainRecommendationModel(feedbackData: any[]): Promise<void> {
    try {
      // Get current model or create new one
      let model = this.models.get('recommendation') || {
        id: crypto.randomUUID(),
        modelType: 'recommendation',
        weights: {
          categories: {},
          technologies: {},
          patterns: {}
        },
        metadata: {
          totalSamples: 0,
          accuracy: 0
        },
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Simple training logic (in a real app, this would be more sophisticated)
      let correctPredictions = 0;
      
      feedbackData.forEach(feedback => {
        // Extract features from feedback context
        const category = feedback.context?.category || 'unknown';
        const technologies = feedback.context?.technologies || [];
        const patterns = feedback.context?.patterns || [];
        
        // Update category weights
        if (!model.weights.categories[category]) {
          model.weights.categories[category] = { accepted: 0, rejected: 0 };
        }
        
        if (feedback.accepted) {
          model.weights.categories[category].accepted += 1;
        } else {
          model.weights.categories[category].rejected += 1;
        }
        
        // Update technology weights
        technologies.forEach((tech: string) => {
          if (!model.weights.technologies[tech]) {
            model.weights.technologies[tech] = { accepted: 0, rejected: 0 };
          }
          
          if (feedback.accepted) {
            model.weights.technologies[tech].accepted += 1;
          } else {
            model.weights.technologies[tech].rejected += 1;
          }
        });
        
        // Update pattern weights
        patterns.forEach((pattern: string) => {
          if (!model.weights.patterns[pattern]) {
            model.weights.patterns[pattern] = { accepted: 0, rejected: 0 };
          }
          
          if (feedback.accepted) {
            model.weights.patterns[pattern].accepted += 1;
          } else {
            model.weights.patterns[pattern].rejected += 1;
          }
        });
        
        // Calculate if our model would have predicted correctly
        const categoryScore = model.weights.categories[category]?.accepted > model.weights.categories[category]?.rejected;
        const techScores = technologies.map((tech: string) => 
          model.weights.technologies[tech]?.accepted > model.weights.technologies[tech]?.rejected
        );
        const patternScores = patterns.map((pattern: string) => 
          model.weights.patterns[pattern]?.accepted > model.weights.patterns[pattern]?.rejected
        );
        
        // Simple majority vote
        const positiveScores = [categoryScore, ...techScores, ...patternScores].filter(Boolean).length;
        const totalScores = 1 + technologies.length + patterns.length;
        const wouldRecommend = positiveScores > totalScores / 2;
        
        if ((wouldRecommend && feedback.accepted) || (!wouldRecommend && !feedback.accepted)) {
          correctPredictions++;
        }
      });
      
      // Update metadata
      model.metadata.totalSamples += feedbackData.length;
      model.metadata.accuracy = correctPredictions / feedbackData.length;
      
      // Update model version and timestamp
      model.version += 1;
      model.updatedAt = new Date().toISOString();
      
      // Save updated model
      this.models.set('recommendation', model);
      
      // Encrypt weights for storage
      const encryptedWeights = this.encryptData(model.weights);
      
      // Save to database
      await supabase.from('learning_models').insert({
        id: model.id,
        model_type: model.modelType,
        weights: encryptedWeights,
        metadata: model.metadata,
        version: model.version,
        created_at: model.createdAt,
        updated_at: model.updatedAt
      });
      
      console.log(`Trained recommendation model (v${model.version}) with accuracy: ${model.metadata.accuracy.toFixed(2)}`);
    } catch (error) {
      console.error('Error training recommendation model:', error);
      throw error;
    }
  }

  // Train pattern recognition model
  private async trainPatternRecognitionModel(feedbackData: any[]): Promise<void> {
    try {
      // Get current model or create new one
      let model = this.models.get('pattern_recognition') || {
        id: crypto.randomUUID(),
        modelType: 'pattern_recognition',
        weights: {
          patterns: {}
        },
        metadata: {
          totalSamples: 0,
          accuracy: 0
        },
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Extract patterns from feedback
      const patternFrequency: Record<string, { count: number, accepted: number }> = {};
      
      feedbackData.forEach(feedback => {
        const patterns = feedback.context?.patterns || [];
        const codeSnippet = feedback.context?.codeSnippet || '';
        
        if (codeSnippet && feedback.accepted) {
          // Extract new patterns from code snippet
          const extractedPatterns = this.extractPatternsFromCode(codeSnippet);
          
          extractedPatterns.forEach(pattern => {
            if (!patternFrequency[pattern]) {
              patternFrequency[pattern] = { count: 0, accepted: 0 };
            }
            
            patternFrequency[pattern].count += 1;
            if (feedback.accepted) {
              patternFrequency[pattern].accepted += 1;
            }
          });
        }
      });
      
      // Update model weights with new patterns
      Object.entries(patternFrequency).forEach(([pattern, stats]) => {
        if (!model.weights.patterns[pattern]) {
          model.weights.patterns[pattern] = 0;
        }
        
        // Update weight based on acceptance rate
        const acceptanceRate = stats.accepted / stats.count;
        model.weights.patterns[pattern] += (acceptanceRate - 0.5) * stats.count;
      });
      
      // Update metadata
      model.metadata.totalSamples += feedbackData.length;
      
      // Simple accuracy calculation
      const correctPatterns = Object.values(model.weights.patterns).filter(weight => weight > 0).length;
      const totalPatterns = Object.keys(model.weights.patterns).length;
      model.metadata.accuracy = totalPatterns > 0 ? correctPatterns / totalPatterns : 0;
      
      // Update model version and timestamp
      model.version += 1;
      model.updatedAt = new Date().toISOString();
      
      // Save updated model
      this.models.set('pattern_recognition', model);
      
      // Encrypt weights for storage
      const encryptedWeights = this.encryptData(model.weights);
      
      // Save to database
      await supabase.from('learning_models').insert({
        id: model.id,
        model_type: model.modelType,
        weights: encryptedWeights,
        metadata: model.metadata,
        version: model.version,
        created_at: model.createdAt,
        updated_at: model.updatedAt
      });
      
      // Update knowledge repository with new patterns
      await this.updateKnowledgeRepository(patternFrequency);
      
      console.log(`Trained pattern recognition model (v${model.version}) with ${Object.keys(patternFrequency).length} new patterns`);
    } catch (error) {
      console.error('Error training pattern recognition model:', error);
      throw error;
    }
  }

  // Extract patterns from code snippet
  private extractPatternsFromCode(codeSnippet: string): string[] {
    // In a real implementation, this would use more sophisticated pattern recognition
    // For now, we'll use a simple approach
    const patterns: string[] = [];
    
    // Look for common React patterns
    if (codeSnippet.includes('useState')) {
      patterns.push('react-useState');
    }
    
    if (codeSnippet.includes('useEffect')) {
      patterns.push('react-useEffect');
    }
    
    if (codeSnippet.includes('useCallback')) {
      patterns.push('react-useCallback');
    }
    
    if (codeSnippet.includes('useMemo')) {
      patterns.push('react-useMemo');
    }
    
    // Look for async patterns
    if (codeSnippet.includes('async') && codeSnippet.includes('await')) {
      patterns.push('async-await');
    }
    
    if (codeSnippet.includes('Promise')) {
      patterns.push('promise');
    }
    
    // Look for error handling patterns
    if (codeSnippet.includes('try') && codeSnippet.includes('catch')) {
      patterns.push('try-catch');
    }
    
    // Look for functional programming patterns
    if (codeSnippet.includes('.map(') || codeSnippet.includes('.filter(') || codeSnippet.includes('.reduce(')) {
      patterns.push('functional-array-methods');
    }
    
    return patterns;
  }

  // Update knowledge repository with new patterns
  private async updateKnowledgeRepository(patternFrequency: Record<string, { count: number, accepted: number }>): Promise<void> {
    try {
      const newKnowledgeItems: KnowledgeItem[] = [];
      
      // Process patterns with high frequency and acceptance rate
      Object.entries(patternFrequency).forEach(([pattern, stats]) => {
        if (stats.count >= 3 && stats.accepted / stats.count >= 0.7) {
          // Check if pattern already exists in repository
          const existingItem = this.knowledgeRepository.find(item => item.pattern === pattern);
          
          if (existingItem) {
            // Update existing item
            existingItem.usageCount += stats.count;
            existingItem.successRate = (existingItem.successRate * existingItem.usageCount + stats.accepted) / 
                                      (existingItem.usageCount + stats.count);
            existingItem.confidence = Math.min(1, existingItem.confidence + 0.1);
            existingItem.updatedAt = new Date().toISOString();
          } else {
            // Create new item
            const category = this.determineCategoryForPattern(pattern);
            const solution = this.generateSolutionForPattern(pattern);
            
            const newItem: KnowledgeItem = {
              id: crypto.randomUUID(),
              category,
              pattern,
              solution,
              confidence: 0.7,
              usageCount: stats.count,
              successRate: stats.accepted / stats.count,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            
            newKnowledgeItems.push(newItem);
            this.knowledgeRepository.push(newItem);
          }
        }
      });
      
      // Save new items to database
      if (newKnowledgeItems.length > 0) {
        await supabase.from('knowledge_repository').insert(
          newKnowledgeItems.map(item => ({
            id: item.id,
            category: item.category,
            pattern: item.pattern,
            solution: item.solution,
            confidence: item.confidence,
            usage_count: item.usageCount,
            success_rate: item.successRate,
            created_at: item.createdAt,
            updated_at: item.updatedAt
          }))
        );
        
        console.log(`Added ${newKnowledgeItems.length} new items to knowledge repository`);
      }
      
      // Update existing items in database
      const updatedItems = this.knowledgeRepository.filter(item => 
        !newKnowledgeItems.some(newItem => newItem.id === item.id) && 
        new Date(item.updatedAt) > new Date(Date.now() - 24 * 60 * 60 * 1000) // Updated in last 24 hours
      );
      
      if (updatedItems.length > 0) {
        for (const item of updatedItems) {
          await supabase.from('knowledge_repository')
            .update({
              usage_count: item.usageCount,
              success_rate: item.successRate,
              confidence: item.confidence,
              updated_at: item.updatedAt
            })
            .eq('id', item.id);
        }
        
        console.log(`Updated ${updatedItems.length} existing items in knowledge repository`);
      }
    } catch (error) {
      console.error('Error updating knowledge repository:', error);
      throw error;
    }
  }

  // Determine category for a pattern
  private determineCategoryForPattern(pattern: string): string {
    if (pattern.startsWith('react-')) {
      return 'react';
    }
    
    if (pattern === 'async-await' || pattern === 'promise') {
      return 'async';
    }
    
    if (pattern === 'try-catch') {
      return 'error-handling';
    }
    
    if (pattern === 'functional-array-methods') {
      return 'functional-programming';
    }
    
    return 'general';
  }

  // Generate solution for a pattern
  private generateSolutionForPattern(pattern: string): string {
    switch (pattern) {
      case 'react-useState':
        return 'Use React.useState for component state management';
      case 'react-useEffect':
        return 'Use React.useEffect for side effects and lifecycle events';
      case 'react-useCallback':
        return 'Use React.useCallback to memoize functions and prevent unnecessary re-renders';
      case 'react-useMemo':
        return 'Use React.useMemo to memoize expensive calculations';
      case 'async-await':
        return 'Use async/await for cleaner asynchronous code';
      case 'promise':
        return 'Use Promises for handling asynchronous operations';
      case 'try-catch':
        return 'Use try/catch blocks for error handling';
      case 'functional-array-methods':
        return 'Use functional array methods (map, filter, reduce) for cleaner data transformations';
      default:
        return 'Apply this pattern for better code quality';
    }
  }

  // Submit feedback for a recommendation
  public async submitFeedback(feedback: Omit<FeedbackData, 'timestamp'>): Promise<void> {
    try {
      const feedbackWithTimestamp: FeedbackData = {
        ...feedback,
        timestamp: new Date().toISOString()
      };
      
      // Add to queue
      this.feedbackQueue.push(feedbackWithTimestamp);
      
      // Process queue if not already processing
      if (!this.isProcessingFeedback) {
        await this.processFeedbackQueue();
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback');
    }
  }

  // Process feedback queue
  private async processFeedbackQueue(): Promise<void> {
    if (this.feedbackQueue.length === 0) {
      this.isProcessingFeedback = false;
      return;
    }
    
    this.isProcessingFeedback = true;
    
    try {
      // Take up to 10 items from queue
      const batch = this.feedbackQueue.splice(0, 10);
      
      // Save to database
      await supabase.from('recommendation_feedback').insert(
        batch.map(feedback => ({
          recommendation_id: feedback.recommendationId,
          project_id: feedback.projectId,
          user_id: feedback.userId,
          accepted: feedback.accepted,
          helpful: feedback.helpful,
          feedback_text: feedback.feedbackText,
          context: feedback.context,
          created_at: feedback.timestamp
        }))
      );
      
      // Continue processing if more items in queue
      if (this.feedbackQueue.length > 0) {
        await this.processFeedbackQueue();
      } else {
        this.isProcessingFeedback = false;
      }
    } catch (error) {
      console.error('Error processing feedback queue:', error);
      this.isProcessingFeedback = false;
      
      // Retry failed items later
      setTimeout(() => {
        if (!this.isProcessingFeedback) {
          this.processFeedbackQueue();
        }
      }, 60000); // Retry after 1 minute
    }
  }

  // Get recommendations based on project context
  public async getRecommendations(projectContext: any): Promise<any[]> {
    try {
      // Get recommendation model
      const model = this.models.get('recommendation');
      
      if (!model) {
        console.warn('Recommendation model not found, using default recommendations');
        return this.getDefaultRecommendations(projectContext);
      }
      
      // Extract features from project context
      const category = projectContext.category || 'unknown';
      const technologies = projectContext.technologies || [];
      const codeSnippets = projectContext.codeSnippets || [];
      
      // Extract patterns from code snippets
      const patterns: string[] = [];
      codeSnippets.forEach((snippet: string) => {
        patterns.push(...this.extractPatternsFromCode(snippet));
      });
      
      // Calculate scores for each recommendation type
      const categoryScore = this.calculateCategoryScore(model, category);
      const technologyScores = this.calculateTechnologyScores(model, technologies);
      const patternScores = this.calculatePatternScores(model, patterns);
      
      // Get knowledge items that match the patterns
      const relevantKnowledgeItems = this.knowledgeRepository.filter(item => 
        patterns.includes(item.pattern) || 
        technologies.some(tech => item.category === tech.toLowerCase())
      );
      
      // Generate recommendations
      const recommendations = [
        ...this.generateCategoryRecommendations(category, categoryScore),
        ...this.generateTechnologyRecommendations(technologies, technologyScores),
        ...this.generatePatternRecommendations(patterns, patternScores, relevantKnowledgeItems)
      ];
      
      // Sort by confidence
      recommendations.sort((a, b) => b.confidence - a.confidence);
      
      return recommendations;
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return this.getDefaultRecommendations(projectContext);
    }
  }

  // Calculate score for a category
  private calculateCategoryScore(model: LearningModel, category: string): number {
    const categoryData = model.weights.categories[category];
    
    if (!categoryData) return 0.5;
    
    const total = categoryData.accepted + categoryData.rejected;
    return total > 0 ? categoryData.accepted / total : 0.5;
  }

  // Calculate scores for technologies
  private calculateTechnologyScores(model: LearningModel, technologies: string[]): Record<string, number> {
    const scores: Record<string, number> = {};
    
    technologies.forEach(tech => {
      const techData = model.weights.technologies[tech];
      
      if (!techData) {
        scores[tech] = 0.5;
      } else {
        const total = techData.accepted + techData.rejected;
        scores[tech] = total > 0 ? techData.accepted / total : 0.5;
      }
    });
    
    return scores;
  }

  // Calculate scores for patterns
  private calculatePatternScores(model: LearningModel, patterns: string[]): Record<string, number> {
    const scores: Record<string, number> = {};
    
    patterns.forEach(pattern => {
      const patternData = model.weights.patterns[pattern];
      
      if (!patternData) {
        scores[pattern] = 0.5;
      } else {
        const total = patternData.accepted + patternData.rejected;
        scores[pattern] = total > 0 ? patternData.accepted / total : 0.5;
      }
    });
    
    return scores;
  }

  // Generate recommendations based on category
  private generateCategoryRecommendations(category: string, score: number): any[] {
    if (score < 0.6) return []; // Only recommend if score is high enough
    
    switch (category) {
      case 'react':
        return [{
          id: crypto.randomUUID(),
          title: 'Optimize React Component Rendering',
          description: 'Use React.memo, useMemo, and useCallback to prevent unnecessary re-renders',
          confidence: score,
          category: 'performance',
          source: 'ai-learning'
        }];
      case 'node':
        return [{
          id: crypto.randomUUID(),
          title: 'Implement Proper Error Handling',
          description: 'Add comprehensive error handling for asynchronous operations',
          confidence: score,
          category: 'best-practice',
          source: 'ai-learning'
        }];
      default:
        return [];
    }
  }

  // Generate recommendations based on technologies
  private generateTechnologyRecommendations(technologies: string[], scores: Record<string, number>): any[] {
    const recommendations: any[] = [];
    
    technologies.forEach(tech => {
      const score = scores[tech] || 0.5;
      if (score < 0.6) return; // Only recommend if score is high enough
      
      switch (tech.toLowerCase()) {
        case 'react':
          recommendations.push({
            id: crypto.randomUUID(),
            title: 'Update to React 18',
            description: 'React 18 includes performance improvements and new features',
            confidence: score,
            category: 'dependency',
            source: 'ai-learning'
          });
          break;
        case 'typescript':
          recommendations.push({
            id: crypto.randomUUID(),
            title: 'Enable Strict TypeScript Checks',
            description: 'Enable strict mode in tsconfig.json for better type safety',
            confidence: score,
            category: 'best-practice',
            source: 'ai-learning'
          });
          break;
        case 'tailwind':
          recommendations.push({
            id: crypto.randomUUID(),
            title: 'Optimize Tailwind CSS',
            description: 'Configure content purging to reduce CSS bundle size',
            confidence: score,
            category: 'performance',
            source: 'ai-learning'
          });
          break;
      }
    });
    
    return recommendations;
  }

  // Generate recommendations based on patterns
  private generatePatternRecommendations(
    patterns: string[], 
    scores: Record<string, number>,
    knowledgeItems: KnowledgeItem[]
  ): any[] {
    const recommendations: any[] = [];
    
    // Add recommendations from knowledge repository
    knowledgeItems.forEach(item => {
      if (item.confidence >= 0.7) {
        recommendations.push({
          id: crypto.randomUUID(),
          title: `Apply ${item.pattern} Pattern`,
          description: item.solution,
          confidence: item.confidence,
          category: 'best-practice',
          source: 'knowledge-repository'
        });
      }
    });
    
    // Add recommendations based on pattern scores
    patterns.forEach(pattern => {
      const score = scores[pattern] || 0.5;
      if (score < 0.6) return; // Only recommend if score is high enough
      
      // Skip if we already have a recommendation for this pattern from knowledge repository
      if (recommendations.some(rec => rec.title.includes(pattern))) {
        return;
      }
      
      switch (pattern) {
        case 'react-useState':
          recommendations.push({
            id: crypto.randomUUID(),
            title: 'Optimize State Management',
            description: 'Consider using useReducer for complex state logic',
            confidence: score,
            category: 'best-practice',
            source: 'ai-learning'
          });
          break;
        case 'async-await':
          recommendations.push({
            id: crypto.randomUUID(),
            title: 'Improve Error Handling',
            description: 'Add try/catch blocks to all async/await calls',
            confidence: score,
            category: 'best-practice',
            source: 'ai-learning'
          });
          break;
      }
    });
    
    return recommendations;
  }

  // Get default recommendations when model is not available
  private getDefaultRecommendations(projectContext: any): any[] {
    const technologies = projectContext.technologies || [];
    
    const recommendations = [
      {
        id: crypto.randomUUID(),
        title: 'Implement Code Splitting',
        description: 'Use dynamic imports to reduce initial bundle size',
        confidence: 0.8,
        category: 'performance',
        source: 'default'
      },
      {
        id: crypto.randomUUID(),
        title: 'Add Comprehensive Error Handling',
        description: 'Implement error boundaries and proper error logging',
        confidence: 0.75,
        category: 'best-practice',
        source: 'default'
      }
    ];
    
    // Add technology-specific recommendations
    if (technologies.includes('React')) {
      recommendations.push({
        id: crypto.randomUUID(),
        title: 'Optimize React Component Rendering',
        description: 'Use React.memo for functional components and implement shouldComponentUpdate for class components',
        confidence: 0.85,
        category: 'performance',
        source: 'default'
      });
    }
    
    if (technologies.includes('TypeScript')) {
      recommendations.push({
        id: crypto.randomUUID(),
        title: 'Enable Strict TypeScript Checks',
        description: 'Enable strict mode in tsconfig.json for better type safety',
        confidence: 0.8,
        category: 'best-practice',
        source: 'default'
      });
    }
    
    return recommendations;
  }

  // Encrypt data using AES
  private encryptData(data: any): string {
    try {
      const jsonString = JSON.stringify(data);
      return CryptoJS.AES.encrypt(jsonString, ENCRYPTION_KEY).toString();
    } catch (error) {
      console.error('Encryption error:', error);
      throw error;
    }
  }

  // Decrypt data using AES
  private decryptData(encryptedData: string): any {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
      const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
      return JSON.parse(decryptedString);
    } catch (error) {
      console.error('Decryption error:', error);
      throw error;
    }
  }
}

/**
 * Custom hook for self-learning AI capabilities
 */
export const useSelfLearning = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const serviceRef = useRef<SelfLearningService | null>(null);

  // Initialize service on mount
  useEffect(() => {
    const initService = async () => {
      try {
        serviceRef.current = SelfLearningService.getInstance();
        await serviceRef.current.initialize();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize self-learning service:', error);
      }
    };

    initService();
  }, []);

  // Submit feedback
  const submitFeedback = async (feedback: Omit<FeedbackData, 'timestamp'>) => {
    if (!serviceRef.current) {
      console.error('Self-learning service not initialized');
      return;
    }

    await serviceRef.current.submitFeedback(feedback);
  };

  // Get recommendations
  const getRecommendations = async (projectContext: any) => {
    if (!serviceRef.current) {
      console.error('Self-learning service not initialized');
      return [];
    }

    return await serviceRef.current.getRecommendations(projectContext);
  };

  return {
    isInitialized,
    submitFeedback,
    getRecommendations
  };
};
