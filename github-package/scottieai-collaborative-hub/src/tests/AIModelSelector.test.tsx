import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AIModelSelector from '@/components/features/AIModelSelector';
import { 
  getAvailableModels, 
  getModelLoadingStatus, 
  loadModelById,
  getUserModels,
  getModelRecommendations
} from '@/services/aiModelService';

// Mock AI model service
vi.mock('@/services/aiModelService', () => ({
  getAvailableModels: vi.fn(),
  getModelLoadingStatus: vi.fn(),
  loadModelById: vi.fn(),
  getUserModels: vi.fn(),
  getModelRecommendations: vi.fn()
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn()
  }
}));

describe('AIModelSelector Component', () => {
  const mockModels = [
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
    }
  ];

  const mockUserModels = [
    {
      id: 'custom-model-1',
      language: 'en',
      created_at: '2025-03-20T10:00:00Z'
    }
  ];

  const mockOnModelSelected = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    getAvailableModels.mockReturnValue(mockModels);
    getUserModels.mockResolvedValue(mockUserModels);
    getModelRecommendations.mockReturnValue([mockModels[0]]);
    getModelLoadingStatus.mockReturnValue({ loaded: false, progress: 0 });
    loadModelById.mockResolvedValue({});
  });

  it('renders available models', async () => {
    render(
      <AIModelSelector 
        aiModels={[]} 
        onModelSelected={mockOnModelSelected}
      />
    );

    // Check if model cards are rendered
    await waitFor(() => {
      expect(screen.getByText('Code Pattern Analyzer')).toBeInTheDocument();
      expect(screen.getByText('OWL Vision Model')).toBeInTheDocument();
    });
  });

  it('shows recommended models tab by default', async () => {
    render(
      <AIModelSelector 
        aiModels={[]} 
        onModelSelected={mockOnModelSelected}
        projectTechnologies={['React', 'TypeScript']}
      />
    );

    // Check if recommended tab is active
    expect(screen.getByRole('tab', { name: /recommended/i })).toHaveAttribute('data-state', 'active');
    
    // Check if recommended models are shown
    await waitFor(() => {
      expect(screen.getByText('Code Pattern Analyzer')).toBeInTheDocument();
    });
  });

  it('switches between tabs correctly', async () => {
    render(
      <AIModelSelector 
        aiModels={[]} 
        onModelSelected={mockOnModelSelected}
      />
    );

    // Click on All Models tab
    fireEvent.click(screen.getByRole('tab', { name: /all models/i }));
    
    // Check if all models tab is active
    expect(screen.getByRole('tab', { name: /all models/i })).toHaveAttribute('data-state', 'active');
    
    // Click on Custom Models tab
    fireEvent.click(screen.getByRole('tab', { name: /custom models/i }));
    
    // Check if custom models tab is active
    expect(screen.getByRole('tab', { name: /custom models/i })).toHaveAttribute('data-state', 'active');
    
    // Check if custom models are shown
    await waitFor(() => {
      expect(screen.getByText('Custom Model')).toBeInTheDocument();
    });
  });

  it('loads a model when Load Model button is clicked', async () => {
    render(
      <AIModelSelector 
        aiModels={[]} 
        onModelSelected={mockOnModelSelected}
      />
    );

    // Find and click the first Load Model button
    const loadButtons = await screen.findAllByRole('button', { name: /load model/i });
    fireEvent.click(loadButtons[0]);
    
    // Check if loadModelById was called
    await waitFor(() => {
      expect(loadModelById).toHaveBeenCalledWith('code-pattern', 'en');
    });
    
    // Check if onModelSelected was called
    await waitFor(() => {
      expect(mockOnModelSelected).toHaveBeenCalledWith('code-pattern');
    });
    
    // Check if success toast was shown
    expect(require('sonner').toast.success).toHaveBeenCalledWith(expect.stringContaining('loaded successfully'));
  });

  it('changes language when language selector is changed', async () => {
    render(
      <AIModelSelector 
        aiModels={[]} 
        onModelSelected={mockOnModelSelected}
      />
    );

    // Find and change the language selector
    const languageSelector = screen.getByRole('combobox');
    fireEvent.change(languageSelector, { target: { value: 'es' } });
    
    // Find and click the second Load Model button (OWL Vision which supports Spanish)
    const loadButtons = await screen.findAllByRole('button', { name: /load model/i });
    fireEvent.click(loadButtons[1]);
    
    // Check if loadModelById was called with Spanish language
    await waitFor(() => {
      expect(loadModelById).toHaveBeenCalledWith('owl-vision', 'es');
    });
  });

  it('shows warning when model does not support selected language', async () => {
    render(
      <AIModelSelector 
        aiModels={[]} 
        onModelSelected={mockOnModelSelected}
      />
    );

    // Find and change the language selector to a language not supported by the first model
    const languageSelector = screen.getByRole('combobox');
    fireEvent.change(languageSelector, { target: { value: 'es' } });
    
    // Check if warning is shown for the first model (Code Pattern only supports English)
    await waitFor(() => {
      expect(screen.getByText("This model doesn't support es. Will use English instead.")).toBeInTheDocument();
    });
  });

  it('shows active state for already loaded models', async () => {
    render(
      <AIModelSelector 
        aiModels={['code-pattern']} 
        onModelSelected={mockOnModelSelected}
      />
    );

    // Check if the first model shows as active
    await waitFor(() => {
      expect(screen.getByText('Model is active and ready to use')).toBeInTheDocument();
    });
  });
});
