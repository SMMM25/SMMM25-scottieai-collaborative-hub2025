import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthPage } from '../pages/AuthPage';
import { AuthContext } from '../contexts/AuthContext';

// Mock the AuthContext
const mockSignIn = vi.fn();
const mockSignUp = vi.fn();
const mockSignOut = vi.fn();
const mockResetPassword = vi.fn();

const mockAuthContextValue = {
  user: null,
  session: null,
  isLoading: false,
  signIn: mockSignIn,
  signUp: mockSignUp,
  signOut: mockSignOut,
  resetPassword: mockResetPassword
};

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

describe('AuthPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the login form by default', () => {
    render(
      <AuthContext.Provider value={mockAuthContextValue}>
        <AuthPage />
      </AuthContext.Provider>
    );
    
    expect(screen.getByText(/Sign in to your account/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  it('should switch to signup form when "Sign up" is clicked', async () => {
    render(
      <AuthContext.Provider value={mockAuthContextValue}>
        <AuthPage />
      </AuthContext.Provider>
    );
    
    // Click on the "Sign up" link
    fireEvent.click(screen.getByText(/Don't have an account\? Sign up/i));
    
    // Check that the signup form is displayed
    expect(screen.getByText(/Create an account/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign Up/i })).toBeInTheDocument();
  });

  it('should call signIn function when login form is submitted', async () => {
    render(
      <AuthContext.Provider value={mockAuthContextValue}>
        <AuthPage />
      </AuthContext.Provider>
    );
    
    // Fill in the login form
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));
    
    // Check that signIn was called with the correct arguments
    expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
  });

  it('should call signUp function when signup form is submitted', async () => {
    render(
      <AuthContext.Provider value={mockAuthContextValue}>
        <AuthPage />
      </AuthContext.Provider>
    );
    
    // Switch to signup form
    fireEvent.click(screen.getByText(/Don't have an account\? Sign up/i));
    
    // Fill in the signup form
    fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }));
    
    // Check that signUp was called with the correct arguments
    expect(mockSignUp).toHaveBeenCalledWith('test@example.com', 'password123', 'Test User');
  });

  it('should show loading state when isLoading is true', () => {
    const loadingAuthContextValue = {
      ...mockAuthContextValue,
      isLoading: true
    };
    
    render(
      <AuthContext.Provider value={loadingAuthContextValue}>
        <AuthPage />
      </AuthContext.Provider>
    );
    
    // Check that the loading indicator is displayed
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it('should show reset password form when "Forgot password" is clicked', async () => {
    render(
      <AuthContext.Provider value={mockAuthContextValue}>
        <AuthPage />
      </AuthContext.Provider>
    );
    
    // Click on the "Forgot password" link
    fireEvent.click(screen.getByText(/Forgot password\?/i));
    
    // Check that the reset password form is displayed
    expect(screen.getByText(/Reset your password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Send Reset Link/i })).toBeInTheDocument();
  });

  it('should call resetPassword function when reset password form is submitted', async () => {
    render(
      <AuthContext.Provider value={mockAuthContextValue}>
        <AuthPage />
      </AuthContext.Provider>
    );
    
    // Switch to reset password form
    fireEvent.click(screen.getByText(/Forgot password\?/i));
    
    // Fill in the reset password form
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'test@example.com' } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Send Reset Link/i }));
    
    // Check that resetPassword was called with the correct arguments
    expect(mockResetPassword).toHaveBeenCalledWith('test@example.com');
  });
});
