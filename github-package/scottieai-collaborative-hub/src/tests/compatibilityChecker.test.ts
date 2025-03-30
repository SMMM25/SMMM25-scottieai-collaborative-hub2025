import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { checkCrossPlatformCompatibility, CompatibilityResult, performAccessibilityCheck } from '../utils/compatibilityChecker';

// Mock the toast function
vi.mock('sonner', () => ({
  toast: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn()
  }
}));

describe('Compatibility Checker Utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should perform a compatibility check and return valid results', async () => {
    const result = await checkCrossPlatformCompatibility();
    
    // Verify the result structure
    expect(result).toBeDefined();
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.platforms).toBeDefined();
    expect(result.browsers).toBeDefined();
    expect(result.devices).toBeDefined();
    expect(result.accessibilityScore).toBeDefined();
    expect(result.recommendations).toBeDefined();
    expect(result.timestamp).toBeDefined();
    
    // Verify that we have platform data
    expect(result.platforms.length).toBeGreaterThan(0);
    
    // Verify the structure of a platform
    const firstPlatform = result.platforms[0];
    expect(firstPlatform.name).toBeDefined();
    expect(firstPlatform.version).toBeDefined();
    expect(firstPlatform.score).toBeDefined();
    expect(firstPlatform.issues).toBeDefined();
    
    // Verify browser data
    expect(result.browsers.length).toBeGreaterThan(0);
    
    // Verify device data
    expect(result.devices.length).toBeGreaterThan(0);
  });

  it('should handle errors gracefully', async () => {
    // Mock the Promise.resolve to throw an error
    const originalSetTimeout = setTimeout;
    vi.spyOn(global, 'setTimeout').mockImplementationOnce((callback) => {
      throw new Error('Test error');
    });
    
    const result = await checkCrossPlatformCompatibility();
    
    // Verify error handling
    expect(result.overallScore).toBe(0);
    expect(result.platforms.length).toBe(0);
    expect(result.browsers.length).toBe(0);
    expect(result.devices.length).toBe(0);
    expect(result.recommendations.length).toBe(1);
    expect(result.recommendations[0]).toContain('Test error');
    
    // Restore setTimeout
    vi.spyOn(global, 'setTimeout').mockImplementation(originalSetTimeout);
  });

  it('should perform an accessibility check', async () => {
    const result = await performAccessibilityCheck();
    
    // Verify the result structure
    expect(result).toBeDefined();
    expect(result.score).toBeDefined();
    expect(result.passed).toBeDefined();
    expect(result.criticalIssues).toBeDefined();
    expect(result.highIssues).toBeDefined();
    expect(result.mediumIssues).toBeDefined();
    expect(result.lowIssues).toBeDefined();
  });

  it('should identify compatibility issues', async () => {
    const result = await checkCrossPlatformCompatibility();
    
    // Find a platform or browser with issues
    const itemWithIssues = [...result.platforms, ...result.browsers, ...result.devices]
      .find(item => item.issues && item.issues.length > 0);
    
    if (itemWithIssues) {
      // Verify the structure of an issue
      const issue = itemWithIssues.issues[0];
      expect(issue.id).toBeDefined();
      expect(issue.description).toBeDefined();
      expect(issue.severity).toBeDefined();
      expect(issue.affectedFeature).toBeDefined();
      expect(issue.recommendation).toBeDefined();
    }
  });
});
