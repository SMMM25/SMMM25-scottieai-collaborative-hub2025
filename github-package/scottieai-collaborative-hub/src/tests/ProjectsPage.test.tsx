import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import ProjectsPage from '@/pages/ProjectsPage';
import { getUserProjects, deleteProject, updateProject, searchProjects, filterProjectsByStatus, getProjectStatistics } from '@/services/projectService';

// Mock project service functions
vi.mock('@/services/projectService', () => ({
  getUserProjects: vi.fn(),
  deleteProject: vi.fn(),
  updateProject: vi.fn(),
  searchProjects: vi.fn(),
  filterProjectsByStatus: vi.fn(),
  getProjectStatistics: vi.fn(),
  cloneProject: vi.fn()
}));

// Mock auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'test-user-id', email: 'test@example.com' }
  })),
  AuthProvider: ({ children }) => <div>{children}</div>
}));

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn()
  };
});

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  }
}));

describe('ProjectsPage Component', () => {
  const mockProjects = [
    {
      id: 'project-1',
      name: 'Test Project 1',
      description: 'This is a test project',
      status: 'in-progress',
      progress: 50,
      created: new Date('2025-01-01'),
      updated: new Date('2025-01-02'),
      technologies: ['React', 'TypeScript']
    },
    {
      id: 'project-2',
      name: 'Test Project 2',
      description: 'This is another test project',
      status: 'completed',
      progress: 100,
      created: new Date('2025-01-03'),
      updated: new Date('2025-01-04'),
      technologies: ['Vue', 'JavaScript']
    }
  ];

  const mockStatistics = {
    total: 2,
    inProgress: 1,
    completed: 1,
    deployed: 0
  };

  beforeEach(() => {
    vi.clearAllMocks();
    getUserProjects.mockResolvedValue(mockProjects);
    getProjectStatistics.mockResolvedValue(mockStatistics);
    searchProjects.mockImplementation((term) => {
      return Promise.resolve(
        mockProjects.filter(p => 
          p.name.toLowerCase().includes(term.toLowerCase()) || 
          p.description.toLowerCase().includes(term.toLowerCase())
        )
      );
    });
    filterProjectsByStatus.mockImplementation((statuses) => {
      return Promise.resolve(
        mockProjects.filter(p => statuses.includes(p.status))
      );
    });
  });

  it('renders projects page with statistics and project cards', async () => {
    render(
      <BrowserRouter>
        <ProjectsPage />
      </BrowserRouter>
    );

    // Check if statistics are rendered
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument(); // Total projects
      expect(screen.getByText('1')).toBeInTheDocument(); // In progress projects
    });

    // Check if project cards are rendered
    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
      expect(screen.getByText('Test Project 2')).toBeInTheDocument();
    });
  });

  it('filters projects when search term is entered', async () => {
    render(
      <BrowserRouter>
        <ProjectsPage />
      </BrowserRouter>
    );

    // Wait for initial projects to load
    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    });

    // Enter search term
    const searchInput = screen.getByPlaceholderText('Search projects...');
    fireEvent.change(searchInput, { target: { value: 'another' } });

    // Check if search function was called
    await waitFor(() => {
      expect(searchProjects).toHaveBeenCalledWith('another');
    });
  });

  it('filters projects by status when status filter is applied', async () => {
    render(
      <BrowserRouter>
        <ProjectsPage />
      </BrowserRouter>
    );

    // Wait for initial projects to load
    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    });

    // Open filter dropdown
    const filterButton = screen.getByText('Filter');
    fireEvent.click(filterButton);

    // Select 'Completed' filter
    const completedFilter = screen.getByText('Completed');
    fireEvent.click(completedFilter);

    // Check if filter function was called
    await waitFor(() => {
      expect(filterProjectsByStatus).toHaveBeenCalledWith(['completed']);
    });
  });

  it('calls deleteProject when delete is confirmed', async () => {
    // Mock window.confirm to return true
    const originalConfirm = window.confirm;
    window.confirm = vi.fn(() => true);

    deleteProject.mockResolvedValue(true);

    render(
      <BrowserRouter>
        <ProjectsPage />
      </BrowserRouter>
    );

    // Wait for projects to load
    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    });

    // Find and click the more options button for the first project
    const moreButtons = screen.getAllByRole('button', { name: '' });
    fireEvent.click(moreButtons[0]);

    // Find and click the delete option
    const deleteOption = await screen.findByText('Delete');
    fireEvent.click(deleteOption);

    // Check if deleteProject was called
    await waitFor(() => {
      expect(deleteProject).toHaveBeenCalledWith('project-1');
    });

    // Restore original confirm
    window.confirm = originalConfirm;
  });

  it('updates project list when a project is deleted', async () => {
    // Mock window.confirm to return true
    const originalConfirm = window.confirm;
    window.confirm = vi.fn(() => true);

    deleteProject.mockResolvedValue(true);
    
    // After deletion, return only the second project
    getUserProjects.mockResolvedValueOnce(mockProjects)
      .mockResolvedValueOnce([mockProjects[1]]);

    render(
      <BrowserRouter>
        <ProjectsPage />
      </BrowserRouter>
    );

    // Wait for projects to load
    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
      expect(screen.getByText('Test Project 2')).toBeInTheDocument();
    });

    // Find and click the more options button for the first project
    const moreButtons = screen.getAllByRole('button', { name: '' });
    fireEvent.click(moreButtons[0]);

    // Find and click the delete option
    const deleteOption = await screen.findByText('Delete');
    fireEvent.click(deleteOption);

    // Check if the first project is removed from the DOM
    await waitFor(() => {
      expect(screen.queryByText('Test Project 1')).not.toBeInTheDocument();
      expect(screen.getByText('Test Project 2')).toBeInTheDocument();
    });

    // Restore original confirm
    window.confirm = originalConfirm;
  });

  it('shows empty state when no projects match filters', async () => {
    // Mock empty search results
    searchProjects.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <ProjectsPage />
      </BrowserRouter>
    );

    // Wait for initial projects to load
    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    });

    // Enter search term that won't match any projects
    const searchInput = screen.getByPlaceholderText('Search projects...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    // Check if empty state is shown
    await waitFor(() => {
      expect(screen.getByText('No projects found')).toBeInTheDocument();
      expect(screen.getByText('Try changing your search or filter criteria')).toBeInTheDocument();
    });
  });
});
