import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';

// Types for real-time collaboration
interface CollaborationUser {
  id: string;
  name: string;
  color: string;
  cursor?: {
    x: number;
    y: number;
    lastActive: number;
  };
  selection?: {
    start: number;
    end: number;
    path: string;
  };
  status: 'active' | 'idle' | 'offline';
}

interface CollaborationDocument {
  id: string;
  name: string;
  type: 'code' | 'text' | 'design' | 'diagram' | 'spreadsheet';
  content: any;
  version: number;
  lastModified: number;
  users: string[]; // User IDs
  history: CollaborationChange[];
}

interface CollaborationChange {
  id: string;
  userId: string;
  timestamp: number;
  type: 'insert' | 'delete' | 'replace' | 'move' | 'format';
  path: string;
  offset?: number;
  length?: number;
  value?: any;
  metadata?: Record<string, any>;
}

interface CollaborationOptions {
  syncInterval: number; // in milliseconds
  historyLimit: number;
  conflictResolution: 'last-write-wins' | 'operational-transform' | 'crdt';
  presence: boolean;
  cursors: boolean;
  comments: boolean;
  offlineSupport: boolean;
}

/**
 * Custom hook for real-time collaborative editing
 * Provides real-time collaboration with conflict resolution
 */
export const useCollaboration = () => {
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [currentDocument, setCurrentDocument] = useState<CollaborationDocument | null>(null);
  const [activeUsers, setActiveUsers] = useState<CollaborationUser[]>([]);
  const [localChanges, setLocalChanges] = useState<CollaborationChange[]>([]);
  const [pendingChanges, setPendingChanges] = useState<CollaborationChange[]>([]);
  
  const optionsRef = useRef<CollaborationOptions>({
    syncInterval: 1000,
    historyLimit: 100,
    conflictResolution: 'operational-transform',
    presence: true,
    cursors: true,
    comments: true,
    offlineSupport: true
  });
  
  const socketRef = useRef<WebSocket | null>(null);
  const userRef = useRef<CollaborationUser | null>(null);
  const syncTimerRef = useRef<number | null>(null);
  
  // Initialize collaboration
  const initialize = async (
    userId: string,
    userName: string,
    serverUrl: string,
    options?: Partial<CollaborationOptions>
  ): Promise<boolean> => {
    try {
      // Update options
      if (options) {
        optionsRef.current = { ...optionsRef.current, ...options };
      }
      
      // Create user
      userRef.current = {
        id: userId,
        name: userName,
        color: generateUserColor(userId),
        status: 'active'
      };
      
      // Connect to server
      const connected = await connectToServer(serverUrl);
      
      if (!connected) {
        throw new Error('Failed to connect to collaboration server');
      }
      
      // Start sync timer
      startSyncTimer();
      
      setIsInitialized(true);
      console.log('Collaboration system initialized successfully');
      toast.success('Collaboration system ready');
      
      return true;
    } catch (error) {
      console.error('Error initializing collaboration system:', error);
      toast.error('Failed to initialize collaboration system');
      return false;
    }
  };
  
  // Connect to collaboration server
  const connectToServer = async (serverUrl: string): Promise<boolean> => {
    try {
      // In a real implementation, this would establish a WebSocket connection
      // For now, we'll simulate the connection
      
      console.log(`Connecting to collaboration server: ${serverUrl}`);
      
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Create mock socket
      socketRef.current = {
        send: (data: string) => {
          console.log(`Sending data to server: ${data.substring(0, 100)}${data.length > 100 ? '...' : ''}`);
        },
        close: () => {
          console.log('Closing connection to server');
          setIsConnected(false);
        }
      } as unknown as WebSocket;
      
      setIsConnected(true);
      console.log('Connected to collaboration server');
      
      return true;
    } catch (error) {
      console.error('Error connecting to collaboration server:', error);
      return false;
    }
  };
  
  // Start sync timer
  const startSyncTimer = (): void => {
    if (syncTimerRef.current) {
      clearInterval(syncTimerRef.current);
    }
    
    syncTimerRef.current = window.setInterval(() => {
      syncChanges();
    }, optionsRef.current.syncInterval);
  };
  
  // Sync changes with server
  const syncChanges = async (): Promise<void> => {
    if (!isConnected || !socketRef.current) return;
    
    try {
      // Send pending changes to server
      if (pendingChanges.length > 0) {
        const changes = [...pendingChanges];
        
        // In a real implementation, this would send changes over WebSocket
        socketRef.current.send(JSON.stringify({
          type: 'sync',
          documentId: currentDocument?.id,
          changes
        }));
        
        // Clear pending changes
        setPendingChanges([]);
      }
      
      // Update user presence
      if (optionsRef.current.presence && userRef.current) {
        socketRef.current.send(JSON.stringify({
          type: 'presence',
          userId: userRef.current.id,
          status: 'active',
          timestamp: Date.now()
        }));
      }
    } catch (error) {
      console.error('Error syncing changes:', error);
      
      // Keep changes in pending queue
      // They will be retried on next sync
    }
  };
  
  // Open document
  const openDocument = async (documentId: string): Promise<CollaborationDocument | null> => {
    if (!isInitialized || !isConnected) {
      console.error('Collaboration system not initialized or not connected');
      return null;
    }
    
    try {
      console.log(`Opening document: ${documentId}`);
      
      // In a real implementation, this would fetch the document from the server
      // For now, we'll simulate opening a document
      
      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Create mock document
      const document: CollaborationDocument = {
        id: documentId,
        name: `Document ${documentId}`,
        type: 'code',
        content: '// Collaborative code editing\nfunction example() {\n  console.log("Hello, world!");\n}',
        version: 1,
        lastModified: Date.now(),
        users: [userRef.current?.id || ''],
        history: []
      };
      
      // Join document
      if (socketRef.current) {
        socketRef.current.send(JSON.stringify({
          type: 'join',
          documentId,
          userId: userRef.current?.id
        }));
      }
      
      setCurrentDocument(document);
      setLocalChanges([]);
      setPendingChanges([]);
      
      // Simulate other users
      setActiveUsers([
        {
          id: 'user1',
          name: 'Alice',
          color: '#4285F4',
          cursor: {
            x: 10,
            y: 20,
            lastActive: Date.now()
          },
          status: 'active'
        },
        {
          id: 'user2',
          name: 'Bob',
          color: '#EA4335',
          cursor: {
            x: 30,
            y: 15,
            lastActive: Date.now() - 5000
          },
          status: 'idle'
        }
      ]);
      
      toast.success(`Document "${document.name}" opened`);
      
      return document;
    } catch (error) {
      console.error('Error opening document:', error);
      toast.error('Failed to open document');
      return null;
    }
  };
  
  // Close document
  const closeDocument = async (): Promise<boolean> => {
    if (!currentDocument) {
      return true;
    }
    
    try {
      console.log(`Closing document: ${currentDocument.id}`);
      
      // Sync any pending changes
      await syncChanges();
      
      // Leave document
      if (socketRef.current) {
        socketRef.current.send(JSON.stringify({
          type: 'leave',
          documentId: currentDocument.id,
          userId: userRef.current?.id
        }));
      }
      
      setCurrentDocument(null);
      setLocalChanges([]);
      setPendingChanges([]);
      setActiveUsers([]);
      
      return true;
    } catch (error) {
      console.error('Error closing document:', error);
      return false;
    }
  };
  
  // Apply change to document
  const applyChange = (change: Omit<CollaborationChange, 'id' | 'userId' | 'timestamp'>): boolean => {
    if (!currentDocument || !userRef.current) {
      console.error('No document open or user not initialized');
      return false;
    }
    
    try {
      // Create full change object
      const fullChange: CollaborationChange = {
        id: generateChangeId(),
        userId: userRef.current.id,
        timestamp: Date.now(),
        ...change
      };
      
      // Apply change locally
      const updatedDocument = applyChangeToDocument(currentDocument, fullChange);
      
      if (!updatedDocument) {
        throw new Error('Failed to apply change to document');
      }
      
      // Update document
      setCurrentDocument(updatedDocument);
      
      // Add to local changes
      setLocalChanges(prev => [...prev, fullChange]);
      
      // Add to pending changes
      setPendingChanges(prev => [...prev, fullChange]);
      
      return true;
    } catch (error) {
      console.error('Error applying change:', error);
      return false;
    }
  };
  
  // Apply change to document
  const applyChangeToDocument = (
    document: CollaborationDocument,
    change: CollaborationChange
  ): CollaborationDocument | null => {
    try {
      // Clone document to avoid mutating the original
      const newDocument = { ...document };
      
      // Apply change based on type
      switch (change.type) {
        case 'insert':
          // In a real implementation, this would insert content at the specified path and offset
          console.log(`Inserting at ${change.path}, offset ${change.offset}: ${JSON.stringify(change.value).substring(0, 50)}`);
          break;
        
        case 'delete':
          // In a real implementation, this would delete content at the specified path and offset
          console.log(`Deleting at ${change.path}, offset ${change.offset}, length ${change.length}`);
          break;
        
        case 'replace':
          // In a real implementation, this would replace content at the specified path and offset
          console.log(`Replacing at ${change.path}, offset ${change.offset}, length ${change.length}: ${JSON.stringify(change.value).substring(0, 50)}`);
          break;
        
        case 'move':
          // In a real implementation, this would move content from one location to another
          console.log(`Moving from ${change.path}, offset ${change.offset}, length ${change.length} to ${change.metadata?.targetPath}, offset ${change.metadata?.targetOffset}`);
          break;
        
        case 'format':
          // In a real implementation, this would apply formatting to content
          console.log(`Formatting at ${change.path}, offset ${change.offset}, length ${change.length}: ${JSON.stringify(change.value).substring(0, 50)}`);
          break;
        
        default:
          console.error(`Unknown change type: ${(change as any).type}`);
          return null;
      }
      
      // Update version and last modified
      newDocument.version += 1;
      newDocument.lastModified = change.timestamp;
      
      // Add to history
      newDocument.history = [change, ...newDocument.history].slice(0, optionsRef.current.historyLimit);
      
      return newDocument;
    } catch (error) {
      console.error('Error applying change to document:', error);
      return null;
    }
  };
  
  // Update cursor position
  const updateCursor = (x: number, y: number): void => {
    if (!isConnected || !socketRef.current || !userRef.current) return;
    
    try {
      // Update local user cursor
      userRef.current.cursor = {
        x,
        y,
        lastActive: Date.now()
      };
      
      // Send cursor update to server
      if (optionsRef.current.cursors) {
        socketRef.current.send(JSON.stringify({
          type: 'cursor',
          userId: userRef.current.id,
          documentId: currentDocument?.id,
          x,
          y,
          timestamp: Date.now()
        }));
      }
    } catch (error) {
      console.error('Error updating cursor:', error);
    }
  };
  
  // Update selection
  const updateSelection = (start: number, end: number, path: string): void => {
    if (!isConnected || !socketRef.current || !userRef.current) return;
    
    try {
      // Update local user selection
      userRef.current.selection = {
        start,
        end,
        path
      };
      
      // Send selection update to server
      socketRef.current.send(JSON.stringify({
        type: 'selection',
        userId: userRef.current.id,
        documentId: currentDocument?.id,
        start,
        end,
        path,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Error updating selection:', error);
    }
  };
  
  // Generate user color
  const generateUserColor = (userId: string): string => {
    // Generate a deterministic color based on user ID
    const colors = [
      '#4285F4', // Google Blue
      '#EA4335', // Google Red
      '#FBBC05', // Google Yellow
      '#34A853', // Google Green
      '#8AB4F8', // Light Blue
      '#F28B82', // Light Red
      '#FDD663', // Light Yellow
      '#81C995', // Light Green
      '#5BB974', // Medium Green
      '#A142F4', // Purple
      '#F538A0', // Pink
      '#AF5CF7', // Light Purple
      '#FF6D01', // Orange
      '#03BCD4', // Cyan
      '#795548', // Brown
      '#9E9E9E'  // Grey
    ];
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = ((hash << 5) - hash) + userId.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    
    // Use absolute value and modulo to get index
    const index = Math.abs(hash) % colors.length;
    
    return colors[index];
  };
  
  // Generate change ID
  const generateChangeId = (): string => {
    return `change_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  };
  
  // Create new document
  const createDocument = async (
    name: string,
    type: 'code' | 'text' | 'design' | 'diagram' | 'spreadsheet',
    initialContent?: any
  ): Promise<CollaborationDocument | null> => {
    if (!isInitialized || !isConnected || !userRef.current) {
      console.error('Collaboration system not initialized or not connected');
      return null;
    }
    
    try {
      console.log(`Creating document: ${name}, type: ${type}`);
      
      // In a real implementation, this would create a document on the server
      // For now, we'll simulate creating a document
      
      // Generate document ID
      const documentId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // Create document
      const document: CollaborationDocument = {
        id: documentId,
        name,
        type,
        content: initialContent || '',
        version: 1,
        lastModified: Date.now(),
        users: [userRef.current.id],
        history: []
      };
      
      // Send create request to server
      if (socketRef.current) {
        socketRef.current.send(JSON.stringify({
          type: 'create',
          document
        }));
      }
      
      toast.success(`Document "${name}" created`);
      
      // Open the document
      return await openDocument(documentId);
    } catch (error) {
      console.error('Error creating document:', error);
      toast.error('Failed to create document');
      return null;
    }
  };
  
  // Disconnect from server
  const disconnect = (): void => {
    try {
      // Close current document
      if (currentDocument) {
        closeDocument();
      }
      
      // Stop sync timer
      if (syncTimerRef.current) {
        clearInterval(syncTimerRef.current);
        syncTimerRef.current = null;
      }
      
      // Close socket
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      
      setIsConnected(false);
      console.log('Disconnected from collaboration server');
    } catch (error) {
      console.error('Error disconnecting from server:', error);
    }
  };
  
  // Clean up resources
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);
  
  return {
    isInitialized,
    isConnected,
    currentDocument,
    activeUsers,
    localChanges,
    pendingChanges,
    initialize,
    openDocument,
    closeDocument,
    createDocument,
    applyChange,
    updateCursor,
    updateSelection,
    disconnect
  };
};
