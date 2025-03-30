import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import FileUploader from '@/components/features/FileUploader';
import { validateFile } from '@/services/fileProcessingService';

// Mock file processing service
vi.mock('@/services/fileProcessingService', () => ({
  validateFile: vi.fn()
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

describe('FileUploader Component', () => {
  const mockOnFileUpload = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    validateFile.mockReturnValue({ isValid: true, message: '' });
  });

  it('renders the file upload area', () => {
    render(
      <FileUploader onFileUpload={mockOnFileUpload} />
    );

    expect(screen.getByText('Upload your code package')).toBeInTheDocument();
    expect(screen.getByText('Drag and drop your code package here, or click to browse')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /select file/i })).toBeInTheDocument();
  });

  it('shows file details after file selection', async () => {
    render(
      <FileUploader onFileUpload={mockOnFileUpload} />
    );

    // Create a mock file
    const file = new File(['dummy content'], 'test-file.zip', { type: 'application/zip' });
    
    // Get the hidden file input
    const input = screen.getByLabelText(/upload your code package/i, { selector: 'input' });
    
    // Simulate file selection
    fireEvent.change(input, { target: { files: [file] } });
    
    // Check if file details are displayed
    expect(await screen.findByText('test-file.zip')).toBeInTheDocument();
    expect(screen.getByText('ZIP Archive')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /upload file/i })).toBeInTheDocument();
  });

  it('validates files and shows error for invalid files', async () => {
    // Mock validation to return invalid
    validateFile.mockReturnValue({ 
      isValid: false, 
      message: 'Invalid file type. Only .zip, .rar, and .7z files are allowed.' 
    });

    render(
      <FileUploader onFileUpload={mockOnFileUpload} />
    );

    // Create a mock file with invalid type
    const file = new File(['dummy content'], 'test-file.txt', { type: 'text/plain' });
    
    // Get the hidden file input
    const input = screen.getByLabelText(/upload your code package/i, { selector: 'input' });
    
    // Simulate file selection
    fireEvent.change(input, { target: { files: [file] } });
    
    // Check if error message is displayed
    expect(await screen.findByText('Invalid file type. Only .zip, .rar, and .7z files are allowed.')).toBeInTheDocument();
    expect(require('sonner').toast.error).toHaveBeenCalledWith('Invalid file type. Only .zip, .rar, and .7z files are allowed.');
  });

  it('shows upload progress when uploading a file', async () => {
    render(
      <FileUploader onFileUpload={mockOnFileUpload} />
    );

    // Create a mock file
    const file = new File(['dummy content'], 'test-file.zip', { type: 'application/zip' });
    
    // Get the hidden file input
    const input = screen.getByLabelText(/upload your code package/i, { selector: 'input' });
    
    // Simulate file selection
    fireEvent.change(input, { target: { files: [file] } });
    
    // Find and click the upload button
    const uploadButton = await screen.findByRole('button', { name: /upload file/i });
    fireEvent.click(uploadButton);
    
    // Check if progress indicator is shown
    expect(await screen.findByText(/uploading/i)).toBeInTheDocument();
    
    // Wait for upload to complete
    await waitFor(() => {
      expect(screen.getByText('Upload complete')).toBeInTheDocument();
    }, { timeout: 3000 });
    
    // Check if onFileUpload was called with the file
    expect(mockOnFileUpload).toHaveBeenCalledWith(file);
  });

  it('allows removing a selected file', async () => {
    render(
      <FileUploader onFileUpload={mockOnFileUpload} />
    );

    // Create a mock file
    const file = new File(['dummy content'], 'test-file.zip', { type: 'application/zip' });
    
    // Get the hidden file input
    const input = screen.getByLabelText(/upload your code package/i, { selector: 'input' });
    
    // Simulate file selection
    fireEvent.change(input, { target: { files: [file] } });
    
    // Find and click the remove button (X icon)
    const removeButton = await screen.findByRole('button', { name: '' });
    fireEvent.click(removeButton);
    
    // Check if we're back to the initial upload state
    expect(screen.getByText('Upload your code package')).toBeInTheDocument();
    expect(screen.getByText('Drag and drop your code package here, or click to browse')).toBeInTheDocument();
  });

  it('respects custom accept and maxSize props', () => {
    render(
      <FileUploader 
        onFileUpload={mockOnFileUpload} 
        accept=".pdf,.doc" 
        maxSize={50} 
      />
    );

    expect(screen.getByText('Supports .pdf,.doc files up to 50MB')).toBeInTheDocument();
  });
});
