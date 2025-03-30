import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { performPerformanceAnalysis, PerformanceAnalysisResult } from '../utils/performanceAnalysis';

// Mock the toast function
vi.mock('sonner', () => ({
  toast: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn()
  }
}));

describe('Performance Analysis Utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should perform a performance analysis and return valid results', async () => {
    const result = await performPerformanceAnalysis();
    
    // Verify the result structure
    expect(result).toBeDefined();
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.metrics).toBeDefined();
    expect(result.bottlenecks).toBeDefined();
    expect(result.recommendations).toBeDefined();
    expect(result.timestamp).toBeDefined();
    
    // Verify that we have some metrics
    expect(result.metrics.length).toBeGreaterThan(0);
    
    // Verify the structure of a metric
    const firstMetric = result.metrics[0];
    expect(firstMetric.id).toBeDefined();
    expect(firstMetric.name).toBeDefined();
    expect(firstMetric.category).toBeDefined();
    expect(firstMetric.value).toBeDefined();
    expect(firstMetric.unit).toBeDefined();
    expect(firstMetric.threshold).toBeDefined();
    expect(firstMetric.status).toBeDefined();
  });

  it('should handle errors gracefully', async () => {
    // Mock the Promise.resolve to throw an error
    const originalSetTimeout = setTimeout;
    vi.spyOn(global, 'setTimeout').mockImplementationOnce((callback) => {
      throw new Error('Test error');
    });
    
    const result = await performPerformanceAnalysis();
    
    // Verify error handling
    expect(result.overallScore).toBe(0);
    expect(result.bottlenecks.length).toBe(1);
    expect(result.bottlenecks[0].id).toBe('error-1');
    expect(result.bottlenecks[0].recommendation).toContain('Test error');
    
    // Restore setTimeout
    vi.spyOn(global, 'setTimeout').mockImplementation(originalSetTimeout);
  });

  it('should perform a quick performance check', async () => {
    const result = await performQuickPerformanceCheck();
    
    // Verify the result structure
    expect(result).toBeDefined();
    expect(result.passed).toBeDefined();
    expect(result.score).toBeDefined();
    expect(result.criticalIssues).toBeDefined();
    expect(result.highIssues).toBeDefined();
    expect(result.mediumIssues).toBeDefined();
    expect(result.lowIssues).toBeDefined();
  });

  it('should identify performance bottlenecks', async () => {
    const result = await performPerformanceAnalysis();
    
    // Verify bottlenecks
    expect(result.bottlenecks).toBeDefined();
    expect(result.bottlenecks.length).toBeGreaterThan(0);
    
    // Verify the structure of a bottleneck
    const firstBottleneck = result.bottlenecks[0];
    expect(firstBottleneck.id).toBeDefined();
    expect(firstBottleneck.name).toBeDefined();
    expect(firstBottleneck.category).toBeDefined();
    expect(firstBottleneck.severity).toBeDefined();
    expect(firstBottleneck.impact).toBeDefined();
    expect(firstBottleneck.recommendation).toBeDefined();
  });
});
