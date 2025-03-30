import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { generateValidationReport, ValidationReport } from '../utils/validationReport';

// Mock the dependencies
vi.mock('../utils/securityScan', () => ({
  performSecurityScan: vi.fn().mockResolvedValue({
    overallScore: 95,
    passedChecks: [{ id: 'test-1', name: 'Test Check', category: 'authentication', severity: 'high', status: 'passed' }],
    failedChecks: [],
    warnings: [],
    recommendations: [],
    timestamp: Date.now()
  })
}));

vi.mock('../utils/performanceAnalysis', () => ({
  performPerformanceAnalysis: vi.fn().mockResolvedValue({
    overallScore: 92,
    metrics: [{ 
      id: 'test-1', 
      name: 'Test Metric', 
      category: 'loading_time', 
      value: 1.2, 
      unit: 'seconds',
      threshold: { good: 2, acceptable: 3, poor: 4 },
      status: 'good'
    }],
    bottlenecks: [],
    recommendations: [],
    timestamp: Date.now()
  })
}));

vi.mock('../utils/compatibilityChecker', () => ({
  checkCrossPlatformCompatibility: vi.fn().mockResolvedValue({
    overallScore: 96,
    platforms: [{ name: 'Windows', version: '11', score: 98, issues: [] }],
    browsers: [{ name: 'Chrome', version: '123', score: 100, issues: [] }],
    devices: [{ type: 'desktop', screenSize: '1920x1080+', score: 100, issues: [] }],
    accessibilityScore: 92,
    recommendations: [],
    timestamp: Date.now()
  })
}));

// Mock the toast function
vi.mock('sonner', () => ({
  toast: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn()
  }
}));

describe('Validation Report Utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should generate a validation report and return valid results', async () => {
    const result = await generateValidationReport();
    
    // Verify the result structure
    expect(result).toBeDefined();
    expect(result.overallRating).toBeGreaterThan(0);
    expect(result.categoryRatings).toBeDefined();
    expect(result.securityResults).toBeDefined();
    expect(result.performanceResults).toBeDefined();
    expect(result.compatibilityResults).toBeDefined();
    expect(result.strengths).toBeDefined();
    expect(result.recommendations).toBeDefined();
    expect(result.timestamp).toBeDefined();
    
    // Verify that we have category ratings
    expect(result.categoryRatings.length).toBeGreaterThan(0);
    
    // Verify the structure of a category rating
    const firstCategory = result.categoryRatings[0];
    expect(firstCategory.category).toBeDefined();
    expect(firstCategory.rating).toBeDefined();
    expect(firstCategory.description).toBeDefined();
    
    // Verify strengths and recommendations
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it('should handle errors gracefully', async () => {
    // Mock the performSecurityScan to throw an error
    const { performSecurityScan } = require('../utils/securityScan');
    performSecurityScan.mockRejectedValueOnce(new Error('Test error'));
    
    const result = await generateValidationReport();
    
    // Verify error handling
    expect(result.overallRating).toBe(0);
    expect(result.categoryRatings.length).toBe(1);
    expect(result.categoryRatings[0].category).toBe('Error');
    expect(result.categoryRatings[0].rating).toBe(0);
    expect(result.categoryRatings[0].description).toContain('Test error');
  });

  it('should calculate correct overall rating', async () => {
    const result = await generateValidationReport();
    
    // Calculate expected overall rating (average of all category ratings)
    const expectedRating = Math.round(
      result.categoryRatings.reduce((sum, category) => sum + category.rating, 0) / 
      result.categoryRatings.length
    );
    
    expect(result.overallRating).toBe(expectedRating);
  });
});
