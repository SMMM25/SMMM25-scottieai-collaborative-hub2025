import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';

// Extension Marketplace types
interface Extension {
  id: string;
  name: string;
  description: string;
  version: string;
  author: {
    id: string;
    name: string;
    email?: string;
    website?: string;
  };
  category: ExtensionCategory;
  tags: string[];
  pricing: {
    model: 'free' | 'paid' | 'subscription' | 'freemium';
    price?: number;
    currency?: string;
    trialDays?: number;
  };
  rating: {
    average: number;
    count: number;
  };
  downloads: number;
  lastUpdated: number;
  compatibility: {
    minVersion: string;
    maxVersion?: string;
  };
  permissions: string[];
  dependencies: Record<string, string>;
  installed?: boolean;
  enabled?: boolean;
}

type ExtensionCategory = 
  | 'ai-models' 
  | 'code-tools' 
  | 'collaboration' 
  | 'deployment' 
  | 'integration' 
  | 'productivity' 
  | 'security' 
  | 'ui-components' 
  | 'visualization' 
  | 'other';

interface ExtensionFilter {
  query?: string;
  categories?: ExtensionCategory[];
  tags?: string[];
  pricingModels?: ('free' | 'paid' | 'subscription' | 'freemium')[];
  minRating?: number;
  installedOnly?: boolean;
  enabledOnly?: boolean;
  sortBy?: 'name' | 'rating' | 'downloads' | 'lastUpdated' | 'price';
  sortDirection?: 'asc' | 'desc';
}

interface MarketplaceOptions {
  autoUpdate: boolean;
  allowThirdParty: boolean;
  verifySignatures: boolean;
  telemetry: boolean;
  installLocation: string;
  maxConcurrentDownloads: number;
}

/**
 * Custom hook for extension marketplace
 * Provides a developer marketplace for third-party extensions with revenue sharing
 */
export const useExtensionMarketplace = () => {
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [installedExtensions, setInstalledExtensions] = useState<Extension[]>([]);
  const [featuredExtensions, setFeaturedExtensions] = useState<Extension[]>([]);
  const [activeDownloads, setActiveDownloads] = useState<Record<string, number>>({}); // extensionId -> progress (0-100)
  
  const optionsRef = useRef<MarketplaceOptions>({
    autoUpdate: true,
    allowThirdParty: true,
    verifySignatures: true,
    telemetry: true,
    installLocation: 'default',
    maxConcurrentDownloads: 3
  });
  
  // Initialize marketplace
  const initialize = async (options?: Partial<MarketplaceOptions>): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Update options
      if (options) {
        optionsRef.current = { ...optionsRef.current, ...options };
      }
      
      console.log('Initializing extension marketplace');
      
      // Load installed extensions
      await loadInstalledExtensions();
      
      // Load marketplace extensions
      await loadMarketplaceExtensions();
      
      setIsInitialized(true);
      setIsLoading(false);
      
      console.log('Extension marketplace initialized successfully');
      toast.success('Extension marketplace ready');
      
      return true;
    } catch (error) {
      console.error('Error initializing extension marketplace:', error);
      toast.error('Failed to initialize extension marketplace');
      setIsLoading(false);
      return false;
    }
  };
  
  // Load installed extensions
  const loadInstalledExtensions = async (): Promise<void> => {
    try {
      console.log('Loading installed extensions');
      
      // In a real implementation, this would load extensions from the file system
      // For now, we'll simulate loading installed extensions
      
      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Mock installed extensions
      const mockInstalled: Extension[] = [
        {
          id: 'code-analyzer',
          name: 'Code Analyzer',
          description: 'Advanced static code analysis with AI-powered suggestions',
          version: '1.2.0',
          author: {
            id: 'official',
            name: 'ScottieAI',
            website: 'https://scottieai.com'
          },
          category: 'code-tools',
          tags: ['analysis', 'quality', 'ai'],
          pricing: {
            model: 'free'
          },
          rating: {
            average: 4.8,
            count: 256
          },
          downloads: 15243,
          lastUpdated: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
          compatibility: {
            minVersion: '1.0.0'
          },
          permissions: ['readFiles', 'writeFiles'],
          dependencies: {},
          installed: true,
          enabled: true
        },
        {
          id: 'theme-dark-pro',
          name: 'Dark Pro Theme',
          description: 'Professional dark theme with customizable accent colors',
          version: '2.0.1',
          author: {
            id: 'theme-studio',
            name: 'Theme Studio',
            website: 'https://themestudio.dev'
          },
          category: 'ui-components',
          tags: ['theme', 'dark', 'customization'],
          pricing: {
            model: 'free'
          },
          rating: {
            average: 4.6,
            count: 189
          },
          downloads: 8976,
          lastUpdated: Date.now() - 14 * 24 * 60 * 60 * 1000, // 14 days ago
          compatibility: {
            minVersion: '1.0.0'
          },
          permissions: ['theme'],
          dependencies: {},
          installed: true,
          enabled: true
        }
      ];
      
      setInstalledExtensions(mockInstalled);
    } catch (error) {
      console.error('Error loading installed extensions:', error);
      throw error;
    }
  };
  
  // Load marketplace extensions
  const loadMarketplaceExtensions = async (): Promise<void> => {
    try {
      console.log('Loading marketplace extensions');
      
      // In a real implementation, this would fetch extensions from the marketplace API
      // For now, we'll simulate loading marketplace extensions
      
      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock marketplace extensions
      const mockExtensions: Extension[] = [
        // Already installed extensions
        ...installedExtensions,
        
        // Additional marketplace extensions
        {
          id: 'ai-assistant-pro',
          name: 'AI Assistant Pro',
          description: 'Advanced AI assistant with specialized coding knowledge',
          version: '2.1.0',
          author: {
            id: 'ai-labs',
            name: 'AI Labs',
            website: 'https://ailabs.tech'
          },
          category: 'ai-models',
          tags: ['assistant', 'ai', 'productivity'],
          pricing: {
            model: 'subscription',
            price: 9.99,
            currency: 'USD',
            trialDays: 14
          },
          rating: {
            average: 4.9,
            count: 412
          },
          downloads: 25678,
          lastUpdated: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 days ago
          compatibility: {
            minVersion: '1.5.0'
          },
          permissions: ['readFiles', 'network', 'ai'],
          dependencies: {}
        },
        {
          id: 'git-enhanced',
          name: 'Git Enhanced',
          description: 'Advanced Git integration with visual diff and merge tools',
          version: '1.3.2',
          author: {
            id: 'dev-tools',
            name: 'Dev Tools Inc.',
            website: 'https://devtools.io'
          },
          category: 'code-tools',
          tags: ['git', 'version-control', 'diff'],
          pricing: {
            model: 'freemium',
            price: 4.99,
            currency: 'USD'
          },
          rating: {
            average: 4.7,
            count: 328
          },
          downloads: 18945,
          lastUpdated: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 days ago
          compatibility: {
            minVersion: '1.0.0'
          },
          permissions: ['readFiles', 'writeFiles', 'exec'],
          dependencies: {}
        },
        {
          id: 'data-visualizer',
          name: 'Data Visualizer',
          description: 'Interactive data visualization with multiple chart types',
          version: '1.0.0',
          author: {
            id: 'data-viz',
            name: 'DataViz Solutions',
            website: 'https://dataviz.solutions'
          },
          category: 'visualization',
          tags: ['data', 'charts', 'visualization'],
          pricing: {
            model: 'paid',
            price: 14.99,
            currency: 'USD'
          },
          rating: {
            average: 4.5,
            count: 87
          },
          downloads: 5432,
          lastUpdated: Date.now() - 10 * 24 * 60 * 60 * 1000, // 10 days ago
          compatibility: {
            minVersion: '1.2.0'
          },
          permissions: ['readFiles'],
          dependencies: {}
        },
        {
          id: 'cloud-deploy',
          name: 'Cloud Deploy',
          description: 'One-click deployment to major cloud providers',
          version: '2.0.0',
          author: {
            id: 'cloud-tools',
            name: 'Cloud Tools',
            website: 'https://cloudtools.dev'
          },
          category: 'deployment',
          tags: ['cloud', 'deployment', 'aws', 'azure', 'gcp'],
          pricing: {
            model: 'subscription',
            price: 7.99,
            currency: 'USD',
            trialDays: 30
          },
          rating: {
            average: 4.6,
            count: 156
          },
          downloads: 12567,
          lastUpdated: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
          compatibility: {
            minVersion: '1.0.0'
          },
          permissions: ['readFiles', 'writeFiles', 'network', 'exec'],
          dependencies: {}
        },
        {
          id: 'code-snippets',
          name: 'Code Snippets Library',
          description: 'Extensive library of reusable code snippets',
          version: '1.1.0',
          author: {
            id: 'code-lib',
            name: 'Code Library',
            website: 'https://codelib.io'
          },
          category: 'productivity',
          tags: ['snippets', 'templates', 'productivity'],
          pricing: {
            model: 'free'
          },
          rating: {
            average: 4.4,
            count: 203
          },
          downloads: 9876,
          lastUpdated: Date.now() - 8 * 24 * 60 * 60 * 1000, // 8 days ago
          compatibility: {
            minVersion: '1.0.0'
          },
          permissions: ['readFiles', 'writeFiles'],
          dependencies: {}
        }
      ];
      
      // Set featured extensions (top rated)
      const featured = [...mockExtensions]
        .sort((a, b) => b.rating.average - a.rating.average)
        .slice(0, 3);
      
      setExtensions(mockExtensions);
      setFeaturedExtensions(featured);
    } catch (error) {
      console.error('Error loading marketplace extensions:', error);
      throw error;
    }
  };
  
  // Search extensions
  const searchExtensions = (filter: ExtensionFilter): Extension[] => {
    try {
      let results = [...extensions];
      
      // Apply filters
      if (filter.query) {
        const query = filter.query.toLowerCase();
        results = results.filter(ext => 
          ext.name.toLowerCase().includes(query) || 
          ext.description.toLowerCase().includes(query) ||
          ext.tags.some(tag => tag.toLowerCase().includes(query))
        );
      }
      
      if (filter.categories && filter.categories.length > 0) {
        results = results.filter(ext => filter.categories!.includes(ext.category));
      }
      
      if (filter.tags && filter.tags.length > 0) {
        results = results.filter(ext => 
          filter.tags!.some(tag => ext.tags.includes(tag))
        );
      }
      
      if (filter.pricingModels && filter.pricingModels.length > 0) {
        results = results.filter(ext => 
          filter.pricingModels!.includes(ext.pricing.model)
        );
      }
      
      if (filter.minRating !== undefined) {
        results = results.filter(ext => ext.rating.average >= filter.minRating!);
      }
      
      if (filter.installedOnly) {
        results = results.filter(ext => ext.installed);
      }
      
      if (filter.enabledOnly) {
        results = results.filter(ext => ext.enabled);
      }
      
      // Apply sorting
      if (filter.sortBy) {
        const direction = filter.sortDirection === 'desc' ? -1 : 1;
        
        results.sort((a, b) => {
          switch (filter.sortBy) {
            case 'name':
              return direction * a.name.localeCompare(b.name);
            
            case 'rating':
              return direction * (b.rating.average - a.rating.average);
            
            case 'downloads':
              return direction * (b.downloads - a.downloads);
            
            case 'lastUpdated':
              return direction * (b.lastUpdated - a.lastUpdated);
            
            case 'price':
              const aPrice = a.pricing.price || 0;
              const bPrice = b.pricing.price || 0;
              return direction * (aPrice - bPrice);
            
            default:
              return 0;
          }
        });
      }
      
      return results;
    } catch (error) {
      console.error('Error searching extensions:', error);
      return [];
    }
  };
  
  // Get extension by ID
  const getExtension = (id: string): Extension | undefined => {
    return extensions.find(ext => ext.id === id);
  };
  
  // Install extension
  const installExtension = async (id: string): Promise<boolean> => {
    try {
      const extension = getExtension(id);
      
      if (!extension) {
        throw new Error(`Extension not found: ${id}`);
      }
      
      if (extension.installed) {
        console.log(`Extension already installed: ${extension.name}`);
        return true;
      }
      
      console.log(`Installing extension: ${extension.name}`);
      
      // Check concurrent downloads limit
      const currentDownloads = Object.keys(activeDownloads).length;
      if (currentDownloads >= optionsRef.current.maxConcurrentDownloads) {
        toast.error(`Maximum concurrent downloads reached (${optionsRef.current.maxConcurrentDownloads})`);
        return false;
      }
      
      // Start download
      setActiveDownloads(prev => ({
        ...prev,
        [id]: 0
      }));
      
      // Simulate download progress
      const totalSteps = 10;
      for (let step = 1; step <= totalSteps; step++) {
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const progress = Math.floor((step / totalSteps) * 100);
        
        setActiveDownloads(prev => ({
          ...prev,
          [id]: progress
        }));
      }
      
      // Update extension
      const updatedExtension = {
        ...extension,
        installed: true,
        enabled: true
      };
      
      // Update extensions list
      setExtensions(prev => 
        prev.map(ext => ext.id === id ? updatedExtension : ext)
      );
      
      // Update installed extensions
      setInstalledExtensions(prev => [...prev, updatedExtension]);
      
      // Clear download progress
      setActiveDownloads(prev => {
        const { [id]: _, ...rest } = prev;
        return rest;
      });
      
      toast.success(`Extension installed: ${extension.name}`);
      
      return true;
    } catch (error) {
      console.error('Error installing extension:', error);
      toast.error(`Failed to install extension: ${error instanceof Error ? error.message : String(error)}`);
      
      // Clear download progress
      setActiveDownloads(prev => {
        const { [id]: _, ...rest } = prev;
        return rest;
      });
      
      return false;
    }
  };
  
  // Uninstall extension
  const uninstallExtension = async (id: string): Promise<boolean> => {
    try {
      const extension = getExtension(id);
      
      if (!extension) {
        throw new Error(`Extension not found: ${id}`);
      }
      
      if (!extension.installed) {
        console.log(`Extension not installed: ${extension.name}`);
        return true;
      }
      
      console.log(`Uninstalling extension: ${extension.name}`);
      
      // Simulate uninstall delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update extension
      const updatedExtension = {
        ...extension,
        installed: false,
        enabled: false
      };
      
      // Update extensions list
      setExtensions(prev => 
        prev.map(ext => ext.id === id ? updatedExtension : ext)
      );
      
      // Update installed extensions
      setInstalledExtensions(prev => 
        prev.filter(ext => ext.id !== id)
      );
      
      toast.success(`Extension uninstalled: ${extension.name}`);
      
      return true;
    } catch (error) {
      console.error('Error uninstalling extension:', error);
      toast.error(`Failed to uninstall extension: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  };
  
  // Enable extension
  const enableExtension = async (id: string): Promise<boolean> => {
    try {
      const extension = getExtension(id);
      
      if (!extension) {
        throw new Error(`Extension not found: ${id}`);
      }
      
      if (!extension.installed) {
        throw new Error(`Extension not installed: ${extension.name}`);
      }
      
      if (extension.enabled) {
        console.log(`Extension already enabled: ${extension.name}`);
        return true;
      }
      
      console.log(`Enabling extension: ${extension.name}`);
      
      // Simulate enable delay
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Update extension
      const updatedExtension = {
        ...extension,
        enabled: true
      };
      
      // Update extensions list
      setExtensions(prev => 
        prev.map(ext => ext.id === id ? updatedExtension : ext)
      );
      
      // Update installed extensions
      setInstalledExtensions(prev => 
        prev.map(ext => ext.id === id ? updatedExtension : ext)
      );
      
      toast.success(`Extension enabled: ${extension.name}`);
      
      return true;
    } catch (error) {
      console.error('Error enabling extension:', error);
      toast.error(`Failed to enable extension: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  };
  
  // Disable extension
  const disableExtension = async (id: string): Promise<boolean> => {
    try {
      const extension = getExtension(id);
      
      if (!extension) {
        throw new Error(`Extension not found: ${id}`);
      }
      
      if (!extension.installed) {
        throw new Error(`Extension not installed: ${extension.name}`);
      }
      
      if (!extension.enabled) {
        console.log(`Extension already disabled: ${extension.name}`);
        return true;
      }
      
      console.log(`Disabling extension: ${extension.name}`);
      
      // Simulate disable delay
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Update extension
      const updatedExtension = {
        ...extension,
        enabled: false
      };
      
      // Update extensions list
      setExtensions(prev => 
        prev.map(ext => ext.id === id ? updatedExtension : ext)
      );
      
      // Update installed extensions
      setInstalledExtensions(prev => 
        prev.map(ext => ext.id === id ? updatedExtension : ext)
      );
      
      toast.success(`Extension disabled: ${extension.name}`);
      
      return true;
    } catch (error) {
      console.error('Error disabling extension:', error);
      toast.error(`Failed to disable extension: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  };
  
  // Update extension
  const updateExtension = async (id: string): Promise<boolean> => {
    try {
      const extension = getExtension(id);
      
      if (!extension) {
        throw new Error(`Extension not found: ${id}`);
      }
      
      if (!extension.installed) {
        throw new Error(`Extension not installed: ${extension.name}`);
      }
      
      console.log(`Updating extension: ${extension.name}`);
      
      // Start download
      setActiveDownloads(prev => ({
        ...prev,
        [id]: 0
      }));
      
      // Simulate download progress
      const totalSteps = 5;
      for (let step = 1; step <= totalSteps; step++) {
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const progress = Math.floor((step / totalSteps) * 100);
        
        setActiveDownloads(prev => ({
          ...prev,
          [id]: progress
        }));
      }
      
      // Update extension version (simulate update)
      const versionParts = extension.version.split('.');
      versionParts[2] = (parseInt(versionParts[2]) + 1).toString();
      const newVersion = versionParts.join('.');
      
      // Update extension
      const updatedExtension = {
        ...extension,
        version: newVersion,
        lastUpdated: Date.now()
      };
      
      // Update extensions list
      setExtensions(prev => 
        prev.map(ext => ext.id === id ? updatedExtension : ext)
      );
      
      // Update installed extensions
      setInstalledExtensions(prev => 
        prev.map(ext => ext.id === id ? updatedExtension : ext)
      );
      
      // Clear download progress
      setActiveDownloads(prev => {
        const { [id]: _, ...rest } = prev;
        return rest;
      });
      
      toast.success(`Extension updated: ${extension.name} to version ${newVersion}`);
      
      return true;
    } catch (error) {
      console.error('Error updating extension:', error);
      toast.error(`Failed to update extension: ${error instanceof Error ? error.message : String(error)}`);
      
      // Clear download progress
      setActiveDownloads(prev => {
        const { [id]: _, ...rest } = prev;
        return rest;
      });
      
      return false;
    }
  };
  
  // Check for updates
  const checkForUpdates = async (): Promise<Extension[]> => {
    try {
      console.log('Checking for extension updates');
      
      // In a real implementation, this would check for updates from the marketplace API
      // For now, we'll simulate checking for updates
      
      // Simulate check delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Randomly select some installed extensions for updates
      const updatableExtensions = installedExtensions.filter(() => Math.random() > 0.7);
      
      if (updatableExtensions.length > 0) {
        toast.info(`Updates available for ${updatableExtensions.length} extension(s)`);
      } else {
        toast.success('All extensions are up to date');
      }
      
      return updatableExtensions;
    } catch (error) {
      console.error('Error checking for updates:', error);
      toast.error('Failed to check for updates');
      return [];
    }
  };
  
  // Update options
  const updateOptions = (options: Partial<MarketplaceOptions>): void => {
    optionsRef.current = { ...optionsRef.current, ...options };
    console.log('Updated marketplace options:', optionsRef.current);
  };
  
  // Clean up resources
  useEffect(() => {
    return () => {
      // Clean up any resources
    };
  }, []);
  
  return {
    isInitialized,
    isLoading,
    extensions,
    installedExtensions,
    featuredExtensions,
    activeDownloads,
    initialize,
    searchExtensions,
    getExtension,
    installExtension,
    uninstallExtension,
    enableExtension,
    disableExtension,
    updateExtension,
    checkForUpdates,
    updateOptions
  };
};
