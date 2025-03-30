import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';

// Distributed Computing types
interface ComputeNode {
  id: string;
  name: string;
  type: 'local' | 'remote' | 'cloud';
  status: 'online' | 'offline' | 'busy';
  capabilities: {
    cpu: {
      cores: number;
      speed: number; // GHz
    };
    memory: number; // GB
    gpu?: {
      name: string;
      memory: number; // GB
      cores: number;
    };
    disk: number; // GB
  };
  performance: {
    loadAverage: number[];
    memoryUsage: number; // percentage
    cpuUsage: number; // percentage
    gpuUsage?: number; // percentage
  };
  location?: string;
  lastSeen: number;
}

interface ComputeTask {
  id: string;
  name: string;
  type: 'training' | 'inference' | 'processing' | 'rendering' | 'simulation';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'canceled';
  priority: 'low' | 'normal' | 'high' | 'critical';
  progress: number; // 0-100
  nodeId?: string;
  requirements: {
    minCores?: number;
    minMemory?: number;
    gpu?: boolean;
    minGpuMemory?: number;
    estimatedDuration?: number; // seconds
  };
  created: number;
  started?: number;
  completed?: number;
  result?: any;
  error?: string;
}

interface DistributedComputingOptions {
  autoDiscovery: boolean;
  maxConcurrentTasks: number;
  taskTimeout: number; // seconds
  priorityBoost: boolean;
  loadBalancing: 'round-robin' | 'least-loaded' | 'fastest-node';
  retryFailed: boolean;
  maxRetries: number;
  checkpointInterval: number; // seconds
}

/**
 * Custom hook for distributed computing
 * Provides distributed computing capabilities to leverage multiple devices
 */
export const useDistributedComputing = () => {
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isDiscovering, setIsDiscovering] = useState<boolean>(false);
  const [nodes, setNodes] = useState<ComputeNode[]>([]);
  const [tasks, setTasks] = useState<ComputeTask[]>([]);
  const [activeNodes, setActiveNodes] = useState<number>(0);
  const [totalCapacity, setTotalCapacity] = useState<{
    cores: number;
    memory: number;
    gpuCores: number;
  }>({ cores: 0, memory: 0, gpuCores: 0 });
  
  const optionsRef = useRef<DistributedComputingOptions>({
    autoDiscovery: true,
    maxConcurrentTasks: 10,
    taskTimeout: 3600, // 1 hour
    priorityBoost: true,
    loadBalancing: 'least-loaded',
    retryFailed: true,
    maxRetries: 3,
    checkpointInterval: 300 // 5 minutes
  });
  
  const discoveryTimerRef = useRef<number | null>(null);
  const statusTimerRef = useRef<number | null>(null);
  
  // Initialize distributed computing
  const initialize = async (options?: Partial<DistributedComputingOptions>): Promise<boolean> => {
    try {
      // Update options
      if (options) {
        optionsRef.current = { ...optionsRef.current, ...options };
      }
      
      console.log('Initializing distributed computing system');
      
      // Initialize local node
      const localNode = await initializeLocalNode();
      setNodes([localNode]);
      
      // Start discovery if enabled
      if (optionsRef.current.autoDiscovery) {
        startDiscovery();
      }
      
      // Start status updates
      startStatusUpdates();
      
      setIsInitialized(true);
      console.log('Distributed computing system initialized successfully');
      toast.success('Distributed computing system ready');
      
      return true;
    } catch (error) {
      console.error('Error initializing distributed computing system:', error);
      toast.error('Failed to initialize distributed computing system');
      return false;
    }
  };
  
  // Initialize local node
  const initializeLocalNode = async (): Promise<ComputeNode> => {
    try {
      console.log('Initializing local compute node');
      
      // In a real implementation, this would detect system capabilities
      // For now, we'll create a mock local node
      
      // Simulate detection delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Create local node
      const localNode: ComputeNode = {
        id: 'local-' + Math.random().toString(36).substring(2, 9),
        name: 'Local Machine',
        type: 'local',
        status: 'online',
        capabilities: {
          cpu: {
            cores: navigator.hardwareConcurrency || 4,
            speed: 2.4
          },
          memory: 16, // GB
          gpu: {
            name: 'Integrated GPU',
            memory: 2, // GB
            cores: 384
          },
          disk: 500 // GB
        },
        performance: {
          loadAverage: [0.2, 0.3, 0.25],
          memoryUsage: 40,
          cpuUsage: 15,
          gpuUsage: 5
        },
        lastSeen: Date.now()
      };
      
      return localNode;
    } catch (error) {
      console.error('Error initializing local node:', error);
      throw error;
    }
  };
  
  // Start node discovery
  const startDiscovery = (): void => {
    if (isDiscovering) return;
    
    console.log('Starting node discovery');
    setIsDiscovering(true);
    
    // Perform initial discovery
    discoverNodes();
    
    // Set up discovery timer
    discoveryTimerRef.current = window.setInterval(() => {
      discoverNodes();
    }, 30000); // Every 30 seconds
  };
  
  // Stop node discovery
  const stopDiscovery = (): void => {
    if (!isDiscovering) return;
    
    console.log('Stopping node discovery');
    
    if (discoveryTimerRef.current) {
      clearInterval(discoveryTimerRef.current);
      discoveryTimerRef.current = null;
    }
    
    setIsDiscovering(false);
  };
  
  // Discover compute nodes
  const discoverNodes = async (): Promise<void> => {
    try {
      console.log('Discovering compute nodes');
      
      // In a real implementation, this would use network discovery or a registry
      // For now, we'll simulate discovering nodes
      
      // Simulate discovery delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get existing node IDs
      const existingIds = nodes.map(node => node.id);
      
      // Generate random number of new nodes (0-2)
      const newNodeCount = Math.floor(Math.random() * 3);
      
      if (newNodeCount === 0) {
        console.log('No new nodes discovered');
        return;
      }
      
      // Create mock nodes
      const newNodes: ComputeNode[] = [];
      
      for (let i = 0; i < newNodeCount; i++) {
        const nodeId = 'node-' + Math.random().toString(36).substring(2, 9);
        
        // Skip if node already exists
        if (existingIds.includes(nodeId)) continue;
        
        // Determine if node has GPU (70% chance)
        const hasGpu = Math.random() > 0.3;
        
        // Create node
        const node: ComputeNode = {
          id: nodeId,
          name: `Remote Node ${nodeId.substring(5)}`,
          type: Math.random() > 0.5 ? 'remote' : 'cloud',
          status: 'online',
          capabilities: {
            cpu: {
              cores: 4 + Math.floor(Math.random() * 28), // 4-32 cores
              speed: 2.0 + Math.random() * 2.0 // 2.0-4.0 GHz
            },
            memory: 8 + Math.floor(Math.random() * 248), // 8-256 GB
            gpu: hasGpu ? {
              name: `GPU ${Math.floor(Math.random() * 4000)}`,
              memory: 4 + Math.floor(Math.random() * 76), // 4-80 GB
              cores: 1024 + Math.floor(Math.random() * 15360) // 1024-16384 cores
            } : undefined,
            disk: 100 + Math.floor(Math.random() * 900) // 100-1000 GB
          },
          performance: {
            loadAverage: [
              Math.random() * 0.5,
              Math.random() * 0.7,
              Math.random() * 0.9
            ],
            memoryUsage: Math.random() * 60, // 0-60%
            cpuUsage: Math.random() * 50, // 0-50%
            gpuUsage: hasGpu ? Math.random() * 40 : undefined // 0-40%
          },
          location: ['US-East', 'US-West', 'EU', 'Asia'][Math.floor(Math.random() * 4)],
          lastSeen: Date.now()
        };
        
        newNodes.push(node);
      }
      
      if (newNodes.length > 0) {
        console.log(`Discovered ${newNodes.length} new compute nodes`);
        setNodes(prev => [...prev, ...newNodes]);
        toast.success(`Discovered ${newNodes.length} new compute node(s)`);
      }
    } catch (error) {
      console.error('Error discovering nodes:', error);
    }
  };
  
  // Start status updates
  const startStatusUpdates = (): void => {
    // Set up status timer
    statusTimerRef.current = window.setInterval(() => {
      updateNodeStatus();
      updateTaskStatus();
      updateCapacityMetrics();
    }, 5000); // Every 5 seconds
  };
  
  // Update node status
  const updateNodeStatus = (): void => {
    setNodes(prev => {
      return prev.map(node => {
        // Skip offline nodes (20% chance to come back online)
        if (node.status === 'offline' && Math.random() > 0.8) {
          return {
            ...node,
            status: 'online',
            lastSeen: Date.now(),
            performance: {
              ...node.performance,
              loadAverage: [
                Math.random() * 0.5,
                Math.random() * 0.7,
                Math.random() * 0.9
              ],
              memoryUsage: Math.random() * 60,
              cpuUsage: Math.random() * 50,
              gpuUsage: node.performance.gpuUsage !== undefined ? Math.random() * 40 : undefined
            }
          };
        }
        
        // Random chance (5%) for node to go offline
        if (node.type !== 'local' && Math.random() < 0.05) {
          return {
            ...node,
            status: 'offline',
            lastSeen: Date.now() - Math.floor(Math.random() * 300000) // 0-5 minutes ago
          };
        }
        
        // Update performance metrics for online nodes
        if (node.status === 'online') {
          return {
            ...node,
            lastSeen: Date.now(),
            performance: {
              ...node.performance,
              loadAverage: [
                Math.min(1, Math.max(0, node.performance.loadAverage[0] + (Math.random() * 0.2 - 0.1))),
                Math.min(1, Math.max(0, node.performance.loadAverage[1] + (Math.random() * 0.2 - 0.1))),
                Math.min(1, Math.max(0, node.performance.loadAverage[2] + (Math.random() * 0.2 - 0.1)))
              ],
              memoryUsage: Math.min(100, Math.max(0, node.performance.memoryUsage + (Math.random() * 10 - 5))),
              cpuUsage: Math.min(100, Math.max(0, node.performance.cpuUsage + (Math.random() * 10 - 5))),
              gpuUsage: node.performance.gpuUsage !== undefined
                ? Math.min(100, Math.max(0, node.performance.gpuUsage + (Math.random() * 10 - 5)))
                : undefined
            }
          };
        }
        
        return node;
      });
    });
  };
  
  // Update task status
  const updateTaskStatus = (): void => {
    setTasks(prev => {
      return prev.map(task => {
        // Skip completed, failed, or canceled tasks
        if (['completed', 'failed', 'canceled'].includes(task.status)) {
          return task;
        }
        
        // Update running tasks
        if (task.status === 'running') {
          // Increment progress
          const newProgress = Math.min(100, task.progress + Math.random() * 5);
          
          // Check if task is complete
          if (newProgress >= 100) {
            return {
              ...task,
              status: 'completed',
              progress: 100,
              completed: Date.now(),
              result: { success: true, data: `Result for task ${task.id}` }
            };
          }
          
          // Random chance (2%) for task to fail
          if (Math.random() < 0.02) {
            return {
              ...task,
              status: 'failed',
              progress: task.progress,
              completed: Date.now(),
              error: 'Simulated random failure'
            };
          }
          
          // Continue running
          return {
            ...task,
            progress: newProgress
          };
        }
        
        // Start pending tasks if node is available
        if (task.status === 'pending') {
          // Count running tasks
          const runningTaskCount = prev.filter(t => t.status === 'running').length;
          
          // Check if we can start more tasks
          if (runningTaskCount < optionsRef.current.maxConcurrentTasks) {
            // Find suitable node
            const suitableNode = findSuitableNode(task);
            
            if (suitableNode) {
              return {
                ...task,
                status: 'running',
                nodeId: suitableNode.id,
                started: Date.now(),
                progress: 0
              };
            }
          }
        }
        
        return task;
      });
    });
  };
  
  // Update capacity metrics
  const updateCapacityMetrics = (): void => {
    // Count active nodes
    const active = nodes.filter(node => node.status === 'online').length;
    setActiveNodes(active);
    
    // Calculate total capacity
    const capacity = nodes
      .filter(node => node.status === 'online')
      .reduce((total, node) => {
        return {
          cores: total.cores + node.capabilities.cpu.cores,
          memory: total.memory + node.capabilities.memory,
          gpuCores: total.gpuCores + (node.capabilities.gpu?.cores || 0)
        };
      }, { cores: 0, memory: 0, gpuCores: 0 });
    
    setTotalCapacity(capacity);
  };
  
  // Find suitable node for task
  const findSuitableNode = (task: ComputeTask): ComputeNode | undefined => {
    // Get online nodes
    const onlineNodes = nodes.filter(node => node.status === 'online');
    
    if (onlineNodes.length === 0) {
      return undefined;
    }
    
    // Filter nodes by requirements
    const suitableNodes = onlineNodes.filter(node => {
      // Check CPU cores
      if (task.requirements.minCores && node.capabilities.cpu.cores < task.requirements.minCores) {
        return false;
      }
      
      // Check memory
      if (task.requirements.minMemory && node.capabilities.memory < task.requirements.minMemory) {
        return false;
      }
      
      // Check GPU
      if (task.requirements.gpu && !node.capabilities.gpu) {
        return false;
      }
      
      // Check GPU memory
      if (task.requirements.minGpuMemory && 
          (!node.capabilities.gpu || node.capabilities.gpu.memory < task.requirements.minGpuMemory)) {
        return false;
      }
      
      return true;
    });
    
    if (suitableNodes.length === 0) {
      return undefined;
    }
    
    // Sort nodes by load balancing strategy
    switch (optionsRef.current.loadBalancing) {
      case 'round-robin':
        // Simple round-robin (just take the first one)
        return suitableNodes[0];
      
      case 'least-loaded':
        // Sort by CPU usage
        return [...suitableNodes].sort((a, b) => a.performance.cpuUsage - b.performance.cpuUsage)[0];
      
      case 'fastest-node':
        // Sort by CPU speed and cores
        return [...suitableNodes].sort((a, b) => {
          const aScore = a.capabilities.cpu.cores * a.capabilities.cpu.speed;
          const bScore = b.capabilities.cpu.cores * b.capabilities.cpu.speed;
          return bScore - aScore; // Higher score first
        })[0];
      
      default:
        return suitableNodes[0];
    }
  };
  
  // Submit task
  const submitTask = (
    name: string,
    type: 'training' | 'inference' | 'processing' | 'rendering' | 'simulation',
    requirements: ComputeTask['requirements'],
    priority: ComputeTask['priority'] = 'normal'
  ): string => {
    try {
      console.log(`Submitting task: ${name}, type: ${type}, priority: ${priority}`);
      
      // Generate task ID
      const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // Create task
      const task: ComputeTask = {
        id: taskId,
        name,
        type,
        status: 'pending',
        priority,
        progress: 0,
        requirements,
        created: Date.now()
      };
      
      // Add task to queue
      setTasks(prev => [...prev, task]);
      
      toast.success(`Task submitted: ${name}`);
      
      return taskId;
    } catch (error) {
      console.error('Error submitting task:', error);
      toast.error(`Failed to submit task: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  };
  
  // Cancel task
  const cancelTask = (taskId: string): boolean => {
    try {
      console.log(`Canceling task: ${taskId}`);
      
      // Find task
      const task = tasks.find(t => t.id === taskId);
      
      if (!task) {
        throw new Error(`Task not found: ${taskId}`);
      }
      
      // Check if task can be canceled
      if (['completed', 'failed', 'canceled'].includes(task.status)) {
        console.log(`Task ${taskId} is already ${task.status}, cannot cancel`);
        return false;
      }
      
      // Update task
      setTasks(prev => 
        prev.map(t => t.id === taskId
          ? { ...t, status: 'canceled', completed: Date.now() }
          : t
        )
      );
      
      toast.info(`Task canceled: ${task.name}`);
      
      return true;
    } catch (error) {
      console.error('Error canceling task:', error);
      toast.error(`Failed to cancel task: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  };
  
  // Get task
  const getTask = (taskId: string): ComputeTask | undefined => {
    return tasks.find(task => task.id === taskId);
  };
  
  // Get node
  const getNode = (nodeId: string): ComputeNode | undefined => {
    return nodes.find(node => node.id === nodeId);
  };
  
  // Update options
  const updateOptions = (options: Partial<DistributedComputingOptions>): void => {
    optionsRef.current = { ...optionsRef.current, ...options };
    console.log('Updated distributed computing options:', optionsRef.current);
  };
  
  // Clean up resources
  useEffect(() => {
    return () => {
      // Stop timers
      if (discoveryTimerRef.current) {
        clearInterval(discoveryTimerRef.current);
      }
      
      if (statusTimerRef.current) {
        clearInterval(statusTimerRef.current);
      }
    };
  }, []);
  
  return {
    isInitialized,
    isDiscovering,
    nodes,
    tasks,
    activeNodes,
    totalCapacity,
    initialize,
    startDiscovery,
    stopDiscovery,
    submitTask,
    cancelTask,
    getTask,
    getNode,
    updateOptions
  };
};
