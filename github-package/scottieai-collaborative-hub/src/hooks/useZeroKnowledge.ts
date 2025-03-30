import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';

// Interface for zero-knowledge architecture options
interface ZeroKnowledgeOptions {
  encryptionAlgorithm?: 'AES-GCM' | 'ChaCha20-Poly1305' | 'XChaCha20-Poly1305';
  keyDerivationIterations?: number;
  saltSize?: number;
  memorySize?: number;
}

/**
 * Custom hook for zero-knowledge architecture
 * Ensures that even server administrators cannot access user data
 */
export const useZeroKnowledge = () => {
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [masterKey, setMasterKey] = useState<CryptoKey | null>(null);
  
  const optionsRef = useRef<ZeroKnowledgeOptions>({
    encryptionAlgorithm: 'AES-GCM',
    keyDerivationIterations: 100000,
    saltSize: 16,
    memorySize: 64
  });
  
  // Initialize zero-knowledge system
  const initialize = async (password: string, options?: ZeroKnowledgeOptions): Promise<boolean> => {
    try {
      setIsProcessing(true);
      
      // Update options
      if (options) {
        optionsRef.current = { ...optionsRef.current, ...options };
      }
      
      // Generate master key from password
      const key = await deriveKey(password);
      setMasterKey(key);
      
      setIsInitialized(true);
      setIsProcessing(false);
      
      console.log('Zero-knowledge system initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing zero-knowledge system:', error);
      toast.error('Failed to initialize zero-knowledge system');
      setIsProcessing(false);
      return false;
    }
  };
  
  // Derive encryption key from password
  const deriveKey = async (password: string): Promise<CryptoKey> => {
    // Generate salt
    const salt = crypto.getRandomValues(new Uint8Array(optionsRef.current.saltSize || 16));
    
    // Convert password to key material
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    
    // Import key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );
    
    // Derive key using PBKDF2
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: optionsRef.current.keyDerivationIterations || 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    
    return key;
  };
  
  // Encrypt data with zero-knowledge protection
  const encryptData = async (data: any): Promise<string | null> => {
    if (!isInitialized || !masterKey) {
      console.error('Zero-knowledge system not initialized');
      return null;
    }
    
    try {
      setIsProcessing(true);
      
      // Convert data to string
      const dataString = typeof data === 'string' ? data : JSON.stringify(data);
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(dataString);
      
      // Generate initialization vector
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      // Encrypt data
      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv
        },
        masterKey,
        dataBuffer
      );
      
      // Combine IV and encrypted data
      const result = new Uint8Array(iv.length + encryptedBuffer.byteLength);
      result.set(iv);
      result.set(new Uint8Array(encryptedBuffer), iv.length);
      
      // Convert to base64
      const base64 = btoa(String.fromCharCode(...result));
      
      setIsProcessing(false);
      return base64;
    } catch (error) {
      console.error('Error encrypting data:', error);
      toast.error('Failed to encrypt data');
      setIsProcessing(false);
      return null;
    }
  };
  
  // Decrypt data with zero-knowledge protection
  const decryptData = async (encryptedData: string): Promise<any | null> => {
    if (!isInitialized || !masterKey) {
      console.error('Zero-knowledge system not initialized');
      return null;
    }
    
    try {
      setIsProcessing(true);
      
      // Convert from base64
      const binaryString = atob(encryptedData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Extract IV and encrypted data
      const iv = bytes.slice(0, 12);
      const encryptedBuffer = bytes.slice(12);
      
      // Decrypt data
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv
        },
        masterKey,
        encryptedBuffer
      );
      
      // Convert to string
      const decoder = new TextDecoder();
      const decryptedString = decoder.decode(decryptedBuffer);
      
      // Parse JSON if possible
      try {
        const parsedData = JSON.parse(decryptedString);
        setIsProcessing(false);
        return parsedData;
      } catch {
        // Return as string if not valid JSON
        setIsProcessing(false);
        return decryptedString;
      }
    } catch (error) {
      console.error('Error decrypting data:', error);
      toast.error('Failed to decrypt data');
      setIsProcessing(false);
      return null;
    }
  };
  
  // Encrypt file with zero-knowledge protection
  const encryptFile = async (file: File): Promise<Blob | null> => {
    if (!isInitialized || !masterKey) {
      console.error('Zero-knowledge system not initialized');
      return null;
    }
    
    try {
      setIsProcessing(true);
      
      // Read file as ArrayBuffer
      const fileBuffer = await file.arrayBuffer();
      
      // Generate initialization vector
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      // Encrypt file data
      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv
        },
        masterKey,
        fileBuffer
      );
      
      // Create metadata
      const metadata = {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified
      };
      
      // Encrypt metadata
      const encoder = new TextEncoder();
      const metadataBuffer = encoder.encode(JSON.stringify(metadata));
      const metadataIv = crypto.getRandomValues(new Uint8Array(12));
      const encryptedMetadataBuffer = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: metadataIv
        },
        masterKey,
        metadataBuffer
      );
      
      // Combine all data
      // Format: [metadata size (4 bytes)][metadata IV (12 bytes)][encrypted metadata][file IV (12 bytes)][encrypted file]
      const metadataSize = new Uint32Array([encryptedMetadataBuffer.byteLength]);
      const result = new Uint8Array(
        4 + metadataIv.length + encryptedMetadataBuffer.byteLength + iv.length + encryptedBuffer.byteLength
      );
      
      let offset = 0;
      result.set(new Uint8Array(metadataSize.buffer), offset);
      offset += 4;
      result.set(metadataIv, offset);
      offset += metadataIv.length;
      result.set(new Uint8Array(encryptedMetadataBuffer), offset);
      offset += encryptedMetadataBuffer.byteLength;
      result.set(iv, offset);
      offset += iv.length;
      result.set(new Uint8Array(encryptedBuffer), offset);
      
      // Create blob
      const blob = new Blob([result], { type: 'application/encrypted' });
      
      setIsProcessing(false);
      return blob;
    } catch (error) {
      console.error('Error encrypting file:', error);
      toast.error('Failed to encrypt file');
      setIsProcessing(false);
      return null;
    }
  };
  
  // Decrypt file with zero-knowledge protection
  const decryptFile = async (encryptedBlob: Blob): Promise<File | null> => {
    if (!isInitialized || !masterKey) {
      console.error('Zero-knowledge system not initialized');
      return null;
    }
    
    try {
      setIsProcessing(true);
      
      // Read blob as ArrayBuffer
      const encryptedBuffer = await encryptedBlob.arrayBuffer();
      const encryptedBytes = new Uint8Array(encryptedBuffer);
      
      // Extract metadata size
      const metadataSize = new Uint32Array(encryptedBytes.buffer.slice(0, 4))[0];
      
      // Extract metadata IV
      const metadataIv = encryptedBytes.slice(4, 16);
      
      // Extract encrypted metadata
      const encryptedMetadata = encryptedBytes.slice(16, 16 + metadataSize);
      
      // Decrypt metadata
      const decryptedMetadataBuffer = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: metadataIv
        },
        masterKey,
        encryptedMetadata
      );
      
      // Parse metadata
      const decoder = new TextDecoder();
      const metadataString = decoder.decode(decryptedMetadataBuffer);
      const metadata = JSON.parse(metadataString);
      
      // Extract file IV
      const fileIvOffset = 16 + metadataSize;
      const fileIv = encryptedBytes.slice(fileIvOffset, fileIvOffset + 12);
      
      // Extract encrypted file
      const encryptedFile = encryptedBytes.slice(fileIvOffset + 12);
      
      // Decrypt file
      const decryptedFileBuffer = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: fileIv
        },
        masterKey,
        encryptedFile
      );
      
      // Create file
      const file = new File([decryptedFileBuffer], metadata.name, {
        type: metadata.type,
        lastModified: metadata.lastModified
      });
      
      setIsProcessing(false);
      return file;
    } catch (error) {
      console.error('Error decrypting file:', error);
      toast.error('Failed to decrypt file');
      setIsProcessing(false);
      return null;
    }
  };
  
  // Generate secure sharing key
  const generateSharingKey = async (): Promise<string | null> => {
    try {
      // Generate random key
      const keyBuffer = crypto.getRandomValues(new Uint8Array(32));
      
      // Convert to base64
      const base64 = btoa(String.fromCharCode(...keyBuffer));
      
      // Format for sharing (remove padding characters)
      const formattedKey = base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
      
      return formattedKey;
    } catch (error) {
      console.error('Error generating sharing key:', error);
      return null;
    }
  };
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Clear sensitive data
      setMasterKey(null);
    };
  }, []);
  
  return {
    isInitialized,
    isProcessing,
    initialize,
    encryptData,
    decryptData,
    encryptFile,
    decryptFile,
    generateSharingKey
  };
};
