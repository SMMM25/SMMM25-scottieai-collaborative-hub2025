
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface ExportConfig {
  projectId: string;
  electronVersion?: string;
  appName?: string;
  appVersion?: string;
  includeUpdater?: boolean;
  platforms?: ('win' | 'mac' | 'linux')[];
}

export interface ExportResult {
  success: boolean;
  downloadUrl?: string;
  error?: string;
}

const DEFAULT_ELECTRON_VERSION = '26.2.1';

/**
 * Exports a project as a Windows desktop application
 */
export const exportAsWindowsApp = async (
  projectId: string,
  config?: Partial<ExportConfig>
): Promise<ExportResult> => {
  try {
    // Get project details from Supabase
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();
      
    if (projectError) throw projectError;

    // Setup the configuration for electron-builder
    const appName = config?.appName || project.name;
    const appVersion = config?.appVersion || '1.0.0';
    const electronVersion = config?.electronVersion || DEFAULT_ELECTRON_VERSION;
    const includeUpdater = config?.includeUpdater || false;
    
    // Log export start
    console.log(`Starting Windows export for project: ${appName}`);
    toast.info('Preparing project for Windows packaging...');
    
    // Create a packaging request to our backend packaging service
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/package-electron`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectId,
        config: {
          appName: appName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          appVersion,
          electronVersion,
          includeUpdater,
          platform: 'win',
          icon: project.icon_url || null,
        }
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create Windows package');
    }
    
    // Get the packaging job ID and status URL from the response
    const { jobId, statusUrl } = await response.json();
    
    // Poll the status endpoint to check progress
    toast.info('Building Windows application...');
    const packageStatus = await pollPackagingStatus(statusUrl);
    
    if (!packageStatus.success) {
      throw new Error(packageStatus.error || 'Package build failed');
    }
    
    // Update project with export information in Supabase
    await supabase
      .from('projects')
      .update({ 
        has_desktop_export: true,
        desktop_export_url: packageStatus.downloadUrl,
        last_exported_at: new Date().toISOString()
      })
      .eq('id', projectId);
    
    toast.success('Windows package created successfully!');
    return {
      success: true,
      downloadUrl: packageStatus.downloadUrl
    };
  } catch (error) {
    console.error('Error creating Windows package:', error);
    toast.error(`Export failed: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Polls the packaging status endpoint until the build is complete
 */
const pollPackagingStatus = async (statusUrl: string): Promise<ExportResult> => {
  let attempts = 0;
  const maxAttempts = 30; // 5 minutes maximum (10 second intervals)
  
  while (attempts < maxAttempts) {
    try {
      const response = await fetch(statusUrl);
      const statusData = await response.json();
      
      if (statusData.status === 'completed') {
        return {
          success: true,
          downloadUrl: statusData.downloadUrl
        };
      } else if (statusData.status === 'failed') {
        return {
          success: false,
          error: statusData.error || 'Package build failed'
        };
      } else if (statusData.status === 'progress') {
        // Update UI with progress information
        if (statusData.step) {
          toast.info(statusData.message || `Building: ${statusData.step}`);
        }
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, 10000)); // 10 second interval
      attempts++;
    } catch (error) {
      console.error('Error polling packaging status:', error);
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
  
  return {
    success: false,
    error: 'Timed out waiting for package build to complete'
  };
};

// Future support for other platforms
export const exportAsMacApp = async (
  projectId: string,
  config?: Partial<ExportConfig>
): Promise<ExportResult> => {
  // Similar implementation as Windows export but with platform-specific settings
  toast.info('Mac export coming soon!');
  return {
    success: false,
    error: 'Mac export not implemented yet'
  };
};

export const exportAsLinuxApp = async (
  projectId: string,
  config?: Partial<ExportConfig>
): Promise<ExportResult> => {
  // Similar implementation as Windows export but with platform-specific settings
  toast.info('Linux export coming soon!');
  return {
    success: false,
    error: 'Linux export not implemented yet'
  };
};
