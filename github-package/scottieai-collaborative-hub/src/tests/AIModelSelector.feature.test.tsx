import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AIModelSelector } from '../components/features/AIModelSelector';

// Mock the AI model service
vi.mock('../services/aiModelService', () => ({
  getAvailableModels: vi.fn().mockResolvedValue([
    { id: 'model1', name: 'Model 1', description: 'Test model 1', capabilities: ['text'] },
    { id: 'model2', name: 'Model 2', description: 'Test model 2', capabilities: ['text', 'image'] }
  ]),
  selectModel: vi.fn().mockResolvedValue({ success: true })
}));

// Mock the toast function
vi.mock('sonner', () => ({
  toast: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn()
  }
}));

describe('AIModelSelector Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the model selector with available models', async () => {
    render(<AIModelSelector onModelSelect={vi.fn()} />);
    
    // Initially should show loading state
    expect(screen.getByText(/Loading models/i)).toBeInTheDocument();
    
    // Wait for models to load
    await waitFor(() => {
      expect(screen.getByText(/Select AI Model/i)).toBeInTheDocument();
      expect(screen.getByText(/Model 1/i)).toBeInTheDocument();
      expect(screen.getByText(/Model 2/i)).toBeInTheDocument();
    });
  });

  it('should call onModelSelect when a model is selected', async () => {
    const mockOnModelSelect = vi.fn();
    render(<AIModelSelector onModelSelect={mockOnModelSelect} />);
    
    // Wait for models to load
    await waitFor(() => {
      expect(screen.getByText(/Model 1/i)).toBeInTheDocument();
    });
    
    // Select a model
    fireEvent.click(screen.getByText(/Model 1/i));
    
    // Check that onModelSelect was called with the correct model
    expect(mockOnModelSelect).toHaveBeenCalledWith({
      id: 'model1',
      name: 'Model 1',
      description: 'Test model 1',
      capabilities: ['text']
    });
  });

  it('should show error message when models fail to load', async () => {
    const { getAvailableModels } = require('../services/aiModelService');
    getAvailableModels.mockRejectedValueOnce(new Error('Failed to load models'));
    
    render(<AIModelSelector onModelSelect={vi.fn()} />);
    
    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/Error loading models/i)).toBeInTheDocument();
    });
    
    // Check that error toast was shown
    expect(require('sonner').toast.error).toHaveBeenCalled();
  });

  it('should filter models based on capabilities', async () => {
    render(<AIModelSelector onModelSelect={vi.fn()} capabilities={['image']} />);
    
    // Wait for models to load
    await waitFor(() => {
      expect(screen.getByText(/Select AI Model/i)).toBeInTheDocument();
    });
    
    // Should only show Model 2 which has image capability
    expect(screen.queryByText(/Model 1/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Model 2/i)).toBeInTheDocument();
  });

  it('should show model details when hovering over a model', async () => {
    render(<AIModelSelector onModelSelect={vi.fn()} />);
    
    // Wait for models to load
    await waitFor(() => {
      expect(screen.getByText(/Model 1/i)).toBeInTheDocument();
    });
    
    // Hover over a model
    fireEvent.mouseEnter(screen.getByText(/Model 1/i).closest('div'));
    
    // Check that model description is shown
    expect(screen.getByText(/Test model 1/i)).toBeInTheDocument();
  });
});
