import { supabase } from '@/lib/supabase';
import { Project } from '@/components/features/ProjectCard';
import { toast } from 'sonner';

export type ProjectCreate = Omit<Project, 'id' | 'created' | 'updated'>;

// Get all projects for the current user
export const getUserProjects = async (): Promise<Project[]> => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw new Error('User not authenticated');

    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }

    return projects.map(project => ({
      id: project.id,
      name: project.name,
      description: project.description || '',
      status: project.status,
      progress: project.progress,
      created: new Date(project.created_at),
      updated: new Date(project.updated_at),
      technologies: project.technologies || [],
      deploymentUrl: project.deployment_url,
      deploymentPlatform: project.deployment_platform
    }));
  } catch (error) {
    console.error('Error in getUserProjects:', error);
    toast.error('Failed to fetch projects');
    return [];
  }
};

// Get a single project by ID
export const getProjectById = async (id: string): Promise<Project | null> => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('user_id', userData.user.id)
      .single();

    if (error) {
      console.error('Error fetching project:', error);
      throw error;
    }

    if (!data) return null;

    return {
      id: data.id,
      name: data.name,
      description: data.description || '',
      status: data.status,
      progress: data.progress,
      created: new Date(data.created_at),
      updated: new Date(data.updated_at),
      technologies: data.technologies || [],
      deploymentUrl: data.deployment_url,
      deploymentPlatform: data.deployment_platform
    };
  } catch (error) {
    console.error('Error in getProjectById:', error);
    toast.error('Failed to fetch project details');
    return null;
  }
};

// Create a new project
export const createProject = async (project: ProjectCreate): Promise<Project | null> => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw new Error('User not authenticated');

    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('projects')
      .insert([
        {
          name: project.name,
          description: project.description,
          status: project.status,
          progress: project.progress,
          technologies: project.technologies,
          deployment_url: project.deploymentUrl,
          deployment_platform: project.deploymentPlatform,
          user_id: userData.user.id,
          created_at: now,
          updated_at: now
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating project:', error);
      throw error;
    }

    toast.success('Project created successfully');

    return {
      id: data.id,
      name: data.name,
      description: data.description || '',
      status: data.status,
      progress: data.progress,
      created: new Date(data.created_at),
      updated: new Date(data.updated_at),
      technologies: data.technologies || [],
      deploymentUrl: data.deployment_url,
      deploymentPlatform: data.deployment_platform
    };
  } catch (error) {
    console.error('Error in createProject:', error);
    toast.error('Failed to create project');
    return null;
  }
};

// Update an existing project
export const updateProject = async (id: string, updates: Partial<ProjectCreate>): Promise<boolean> => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw new Error('User not authenticated');

    // First check if the project belongs to the user
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('user_id')
      .eq('id', id)
      .single();

    if (projectError) {
      console.error('Error fetching project for update:', projectError);
      throw projectError;
    }

    if (projectData.user_id !== userData.user.id) {
      throw new Error('You do not have permission to update this project');
    }

    const projectUpdates: any = { ...updates, updated_at: new Date().toISOString() };
    
    // Convert camelCase to snake_case for database
    if (updates.deploymentUrl !== undefined) {
      projectUpdates.deployment_url = updates.deploymentUrl;
      delete projectUpdates.deploymentUrl;
    }
    
    if (updates.deploymentPlatform !== undefined) {
      projectUpdates.deployment_platform = updates.deploymentPlatform;
      delete projectUpdates.deploymentPlatform;
    }
    
    const { error } = await supabase
      .from('projects')
      .update(projectUpdates)
      .eq('id', id);

    if (error) {
      console.error('Error updating project:', error);
      throw error;
    }

    toast.success('Project updated successfully');
    return true;
  } catch (error) {
    console.error('Error in updateProject:', error);
    toast.error('Failed to update project');
    return false;
  }
};

// Delete a project
export const deleteProject = async (id: string): Promise<boolean> => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw new Error('User not authenticated');

    // First check if the project belongs to the user
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('user_id, file_path')
      .eq('id', id)
      .single();

    if (projectError) {
      console.error('Error fetching project for deletion:', projectError);
      throw projectError;
    }

    if (projectData.user_id !== userData.user.id) {
      throw new Error('You do not have permission to delete this project');
    }

    // Delete the project record
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting project:', error);
      throw error;
    }

    // If there's an associated file, delete it from storage
    if (projectData.file_path) {
      const { error: storageError } = await supabase.storage
        .from('code_packages')
        .remove([projectData.file_path]);

      if (storageError) {
        console.warn('Error deleting project file:', storageError);
        // Continue even if file deletion fails
      }
    }

    toast.success('Project deleted successfully');
    return true;
  } catch (error) {
    console.error('Error in deleteProject:', error);
    toast.error('Failed to delete project');
    return false;
  }
};

// Clone a project
export const cloneProject = async (id: string): Promise<Project | null> => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw new Error('User not authenticated');

    // Get the source project
    const sourceProject = await getProjectById(id);
    if (!sourceProject) {
      throw new Error('Source project not found');
    }

    // Create a new project based on the source
    const clonedProject: ProjectCreate = {
      name: `${sourceProject.name} (Clone)`,
      description: sourceProject.description,
      status: 'in-progress', // Always start as in-progress
      progress: 0, // Reset progress
      technologies: sourceProject.technologies,
      deploymentUrl: undefined, // Don't clone deployment URL
      deploymentPlatform: undefined // Don't clone deployment platform
    };

    const newProject = await createProject(clonedProject);
    
    if (newProject) {
      toast.success('Project cloned successfully');
    }
    
    return newProject;
  } catch (error) {
    console.error('Error in cloneProject:', error);
    toast.error('Failed to clone project');
    return null;
  }
};

// Search projects
export const searchProjects = async (query: string): Promise<Project[]> => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw new Error('User not authenticated');

    // Search in name and description
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userData.user.id)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error searching projects:', error);
      throw error;
    }

    return projects.map(project => ({
      id: project.id,
      name: project.name,
      description: project.description || '',
      status: project.status,
      progress: project.progress,
      created: new Date(project.created_at),
      updated: new Date(project.updated_at),
      technologies: project.technologies || [],
      deploymentUrl: project.deployment_url,
      deploymentPlatform: project.deployment_platform
    }));
  } catch (error) {
    console.error('Error in searchProjects:', error);
    toast.error('Failed to search projects');
    return [];
  }
};

// Filter projects by status
export const filterProjectsByStatus = async (statuses: string[]): Promise<Project[]> => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw new Error('User not authenticated');

    if (statuses.length === 0) {
      return getUserProjects();
    }

    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userData.user.id)
      .in('status', statuses)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error filtering projects:', error);
      throw error;
    }

    return projects.map(project => ({
      id: project.id,
      name: project.name,
      description: project.description || '',
      status: project.status,
      progress: project.progress,
      created: new Date(project.created_at),
      updated: new Date(project.updated_at),
      technologies: project.technologies || [],
      deploymentUrl: project.deployment_url,
      deploymentPlatform: project.deployment_platform
    }));
  } catch (error) {
    console.error('Error in filterProjectsByStatus:', error);
    toast.error('Failed to filter projects');
    return [];
  }
};

// Get project statistics
export const getProjectStatistics = async (): Promise<{
  total: number;
  inProgress: number;
  completed: number;
  deployed: number;
}> => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw new Error('User not authenticated');

    const { data: projects, error } = await supabase
      .from('projects')
      .select('status')
      .eq('user_id', userData.user.id);

    if (error) {
      console.error('Error fetching project statistics:', error);
      throw error;
    }

    const stats = {
      total: projects.length,
      inProgress: projects.filter(p => p.status === 'in-progress').length,
      completed: projects.filter(p => p.status === 'completed').length,
      deployed: projects.filter(p => p.status === 'deployed').length
    };

    return stats;
  } catch (error) {
    console.error('Error in getProjectStatistics:', error);
    return {
      total: 0,
      inProgress: 0,
      completed: 0,
      deployed: 0
    };
  }
};
