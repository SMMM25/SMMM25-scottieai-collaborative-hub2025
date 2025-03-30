import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UploadPage } from '../pages/UploadPage';
import { AuthContext } from '../contexts/AuthContext';

// Mock the AuthContext
const mockAuthContextValue = {
  user: { id: 'test-user-id', email: 'test@example.com', user_metadata: { name: 'Test User' } },
  session: { access_token: 'test-token' },
  isLoading: false,
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  resetPassword: vi.fn()
};

// Mock the file processing service
vi.mock('../services/fileProcessingService', () => ({
  uploadFile: vi.fn().mockResolvedValue({ id: 'test-file-id', name: 'test-file.txt' }),
  processFile: vi.fn().mockResolvedValue({ success: true, data: { content: 'Test content' } })
}));

// Mock the router
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  Link: ({ children, to }) => <a href={to}>{children}</a>
}));

// Mock the toast function
vi.mock('sonner', () => ({
  toast: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn()
  }
}));

describe('UploadPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the upload interface', () => {
    render(
      <AuthContext.Provider value={mockAuthContextValue}>
        <UploadPage />
      </AuthContext.Provider>
    );
    
    expect(screen.getByText(/Upload Files/i)).toBeInTheDocument();
    expect(screen.getByText(/Drag and drop your files here/i)).toBeInTheDocument();
  });

  it('should handle file upload when files are dropped', async () => {
    const { uploadFile, processFile } = require('../services/fileProcessingService');
    
    render(
      <AuthContext.Provider value={mockAuthContextValue}>
        <UploadPage />
      </AuthContext.Provider>
    );
    
    // Create a mock file
    const file = new File(['test content'], 'test-file.txt', { type: 'text/plain' });
    
    // Mock the drop event
    const dropEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      dataTransfer: {
        files: [file],
        clearData: vi.fn()
      }
    };
    
    // Get the drop zone element
    const dropZone = screen.getByText(/Drag and drop your files here/i).closest('div');
    
    // Trigger the drop event
    fireEvent.drop(dropZone, dropEvent);
    
    // Wait for the upload to complete
    await waitFor(() => {
      expect(uploadFile).toHaveBeenCalledWith(file, expect.any(Function));
      expect(processFile).toHaveBeenCalledWith('test-file-id', expect.any(Object));
    });
    
    // Check that success message was shown
    expect(require('sonner').toast.success).toHaveBeenCalled();
  });

  it('should show error message when upload fails', async () => {
    const { uploadFile } = require('../services/fileProcessingService');
    uploadFile.mockRejectedValueOnce(new Error('Upload failed'));
    
    render(
      <AuthContext.Provider value={mockAuthContextValue}>
        <UploadPage />
      </AuthContext.Provider>
    );
    
    // Create a mock file
    const file = new File(['test content'], 'test-file.txt', { type: 'text/plain' });
    
    // Mock the drop event
    const dropEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      dataTransfer: {
        files: [file],
        clearData: vi.fn()
      }
    };
    
    // Get the drop zone element
    const dropZone = screen.getByText(/Drag and drop your files here/i).closest('div');
    
    // Trigger the drop event
    fireEvent.drop(dropZone, dropEvent);
    
    // Wait for the upload to fail
    await waitFor(() => {
      expect(uploadFile).toHaveBeenCalledWith(file, expect.any(Function));
      expect(require('sonner').toast.error).toHaveBeenCalled();
    });
  });

  it('should redirect to login if user is not authenticated', () => {
    const navigate = vi.fn();
    vi.mock('react-router-dom', () => ({
      useNavigate: () => navigate,
      Link: ({ children, to }) => <a href={to}>{children}</a>
    }));
    
    render(
      <AuthContext.Provider value={{ ...mockAuthContextValue, user: null, session: null }}>
        <UploadPage />
      </AuthContext.Provider>
    );
    
    // Check that navigation was called
    expect(navigate).toHaveBeenCalledWith('/auth');
  });
});
