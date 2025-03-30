import CryptoJS from 'crypto-js';
import { v4 as uuidv4 } from 'uuid';

// Encryption key management
const DEFAULT_KEY_SIZE = 256; // bits
const DEFAULT_ITERATIONS = 10000;
const DEFAULT_SALT_SIZE = 128; // bits

// Encryption modes and algorithms
export type EncryptionAlgorithm = 'AES' | 'Triple DES' | 'Blowfish';
export type EncryptionMode = 'CBC' | 'CFB' | 'OFB' | 'CTR' | 'GCM';
export type HashAlgorithm = 'SHA256' | 'SHA512' | 'SHA3' | 'RIPEMD160';

// Encryption configuration
export interface EncryptionConfig {
  algorithm: EncryptionAlgorithm;
  mode: EncryptionMode;
  keySize: number;
  iterations: number;
  hashAlgorithm: HashAlgorithm;
}

// Default encryption configuration
export const defaultEncryptionConfig: EncryptionConfig = {
  algorithm: 'AES',
  mode: 'GCM',
  keySize: DEFAULT_KEY_SIZE,
  iterations: DEFAULT_ITERATIONS,
  hashAlgorithm: 'SHA256'
};

/**
 * Secure encryption service with multiple algorithms and modes
 */
export class EncryptionService {
  private static instance: EncryptionService;
  private config: EncryptionConfig;
  private masterKey: string | null = null;
  private keyCache: Map<string, string> = new Map();

  // Private constructor for singleton pattern
  private constructor(config: EncryptionConfig = defaultEncryptionConfig) {
    this.config = config;
  }

  // Get singleton instance
  public static getInstance(config?: EncryptionConfig): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService(config);
    } else if (config) {
      EncryptionService.instance.config = config;
    }
    return EncryptionService.instance;
  }

  // Initialize with master key
  public initialize(masterKey: string): void {
    this.masterKey = this.hashKey(masterKey);
    console.log('Encryption service initialized with master key');
  }

  // Generate a secure random key
  public generateKey(size: number = this.config.keySize): string {
    const randomWords = CryptoJS.lib.WordArray.random(size / 8);
    return randomWords.toString(CryptoJS.enc.Base64);
  }

  // Generate a secure random initialization vector
  public generateIV(size: number = 128): string {
    const randomWords = CryptoJS.lib.WordArray.random(size / 8);
    return randomWords.toString(CryptoJS.enc.Base64);
  }

  // Hash a key using the configured hash algorithm
  public hashKey(key: string): string {
    switch (this.config.hashAlgorithm) {
      case 'SHA256':
        return CryptoJS.SHA256(key).toString();
      case 'SHA512':
        return CryptoJS.SHA512(key).toString();
      case 'SHA3':
        return CryptoJS.SHA3(key).toString();
      case 'RIPEMD160':
        return CryptoJS.RIPEMD160(key).toString();
      default:
        return CryptoJS.SHA256(key).toString();
    }
  }

  // Derive a key from a password using PBKDF2
  public deriveKey(password: string, salt?: string): string {
    const saltValue = salt || CryptoJS.lib.WordArray.random(DEFAULT_SALT_SIZE / 8).toString(CryptoJS.enc.Base64);
    
    const key = CryptoJS.PBKDF2(
      password,
      saltValue,
      {
        keySize: this.config.keySize / 32,
        iterations: this.config.iterations,
        hasher: this.getHasher()
      }
    ).toString(CryptoJS.enc.Base64);
    
    return `${key}:${saltValue}`;
  }

  // Get the appropriate hasher based on the configured hash algorithm
  private getHasher(): any {
    switch (this.config.hashAlgorithm) {
      case 'SHA256':
        return CryptoJS.algo.SHA256;
      case 'SHA512':
        return CryptoJS.algo.SHA512;
      case 'SHA3':
        return CryptoJS.algo.SHA3;
      case 'RIPEMD160':
        return CryptoJS.algo.RIPEMD160;
      default:
        return CryptoJS.algo.SHA256;
    }
  }

  // Encrypt data with the master key
  public encrypt(data: any): string {
    if (!this.masterKey) {
      throw new Error('Encryption service not initialized with master key');
    }
    
    return this.encryptWithKey(data, this.masterKey);
  }

  // Decrypt data with the master key
  public decrypt(encryptedData: string): any {
    if (!this.masterKey) {
      throw new Error('Encryption service not initialized with master key');
    }
    
    return this.decryptWithKey(encryptedData, this.masterKey);
  }

  // Encrypt data with a specific key
  public encryptWithKey(data: any, key: string): string {
    try {
      // Convert data to string if it's not already
      const dataString = typeof data === 'string' ? data : JSON.stringify(data);
      
      // Generate a random IV
      const iv = this.generateIV();
      
      // Generate a unique key ID for this encryption
      const keyId = uuidv4();
      
      // Store the key in the cache with the key ID
      this.keyCache.set(keyId, key);
      
      // Encrypt the data
      let encrypted;
      switch (this.config.algorithm) {
        case 'AES':
          encrypted = this.encryptAES(dataString, key, iv);
          break;
        case 'Triple DES':
          encrypted = this.encryptTripleDES(dataString, key, iv);
          break;
        case 'Blowfish':
          encrypted = this.encryptBlowfish(dataString, key, iv);
          break;
        default:
          encrypted = this.encryptAES(dataString, key, iv);
      }
      
      // Format: keyId:iv:encryptedData
      return `${keyId}:${iv}:${encrypted}`;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  // Decrypt data with a specific key
  public decryptWithKey(encryptedData: string, key: string): any {
    try {
      // Split the encrypted data into its components
      const parts = encryptedData.split(':');
      
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }
      
      const [keyId, iv, encrypted] = parts;
      
      // Check if we have the key in the cache
      const cachedKey = this.keyCache.get(keyId);
      const decryptionKey = cachedKey || key;
      
      // Decrypt the data
      let decrypted;
      switch (this.config.algorithm) {
        case 'AES':
          decrypted = this.decryptAES(encrypted, decryptionKey, iv);
          break;
        case 'Triple DES':
          decrypted = this.decryptTripleDES(encrypted, decryptionKey, iv);
          break;
        case 'Blowfish':
          decrypted = this.decryptBlowfish(encrypted, decryptionKey, iv);
          break;
        default:
          decrypted = this.decryptAES(encrypted, decryptionKey, iv);
      }
      
      // Try to parse as JSON, return as string if not valid JSON
      try {
        return JSON.parse(decrypted);
      } catch {
        return decrypted;
      }
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  // Encrypt data using AES
  private encryptAES(data: string, key: string, iv: string): string {
    const encrypted = CryptoJS.AES.encrypt(
      data,
      CryptoJS.enc.Base64.parse(key),
      {
        iv: CryptoJS.enc.Base64.parse(iv),
        mode: this.getCryptoMode(),
        padding: CryptoJS.pad.Pkcs7
      }
    );
    
    return encrypted.toString();
  }

  // Decrypt data using AES
  private decryptAES(encryptedData: string, key: string, iv: string): string {
    const decrypted = CryptoJS.AES.decrypt(
      encryptedData,
      CryptoJS.enc.Base64.parse(key),
      {
        iv: CryptoJS.enc.Base64.parse(iv),
        mode: this.getCryptoMode(),
        padding: CryptoJS.pad.Pkcs7
      }
    );
    
    return decrypted.toString(CryptoJS.enc.Utf8);
  }

  // Encrypt data using Triple DES
  private encryptTripleDES(data: string, key: string, iv: string): string {
    const encrypted = CryptoJS.TripleDES.encrypt(
      data,
      CryptoJS.enc.Base64.parse(key),
      {
        iv: CryptoJS.enc.Base64.parse(iv),
        mode: this.getCryptoMode(),
        padding: CryptoJS.pad.Pkcs7
      }
    );
    
    return encrypted.toString();
  }

  // Decrypt data using Triple DES
  private decryptTripleDES(encryptedData: string, key: string, iv: string): string {
    const decrypted = CryptoJS.TripleDES.decrypt(
      encryptedData,
      CryptoJS.enc.Base64.parse(key),
      {
        iv: CryptoJS.enc.Base64.parse(iv),
        mode: this.getCryptoMode(),
        padding: CryptoJS.pad.Pkcs7
      }
    );
    
    return decrypted.toString(CryptoJS.enc.Utf8);
  }

  // Encrypt data using Blowfish (simulated with AES since CryptoJS doesn't have native Blowfish)
  private encryptBlowfish(data: string, key: string, iv: string): string {
    // In a real implementation, this would use actual Blowfish
    // For now, we'll simulate with AES but with different parameters
    const encrypted = CryptoJS.AES.encrypt(
      data,
      CryptoJS.enc.Base64.parse(key),
      {
        iv: CryptoJS.enc.Base64.parse(iv),
        mode: CryptoJS.mode.CFB,
        padding: CryptoJS.pad.AnsiX923
      }
    );
    
    return encrypted.toString();
  }

  // Decrypt data using Blowfish (simulated with AES since CryptoJS doesn't have native Blowfish)
  private decryptBlowfish(encryptedData: string, key: string, iv: string): string {
    // In a real implementation, this would use actual Blowfish
    // For now, we'll simulate with AES but with different parameters
    const decrypted = CryptoJS.AES.decrypt(
      encryptedData,
      CryptoJS.enc.Base64.parse(key),
      {
        iv: CryptoJS.enc.Base64.parse(iv),
        mode: CryptoJS.mode.CFB,
        padding: CryptoJS.pad.AnsiX923
      }
    );
    
    return decrypted.toString(CryptoJS.enc.Utf8);
  }

  // Get the appropriate CryptoJS mode based on the configured mode
  private getCryptoMode(): any {
    switch (this.config.mode) {
      case 'CBC':
        return CryptoJS.mode.CBC;
      case 'CFB':
        return CryptoJS.mode.CFB;
      case 'OFB':
        return CryptoJS.mode.OFB;
      case 'CTR':
        return CryptoJS.mode.CTR;
      case 'GCM':
        // CryptoJS doesn't support GCM mode natively, fallback to CBC
        console.warn('GCM mode not supported by CryptoJS, falling back to CBC');
        return CryptoJS.mode.CBC;
      default:
        return CryptoJS.mode.CBC;
    }
  }

  // Generate a secure random password
  public generatePassword(length: number = 16): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=';
    let password = '';
    
    // Generate random bytes
    const randomBytes = CryptoJS.lib.WordArray.random(length * 2);
    const bytes = randomBytes.words;
    
    // Convert random bytes to password characters
    for (let i = 0; i < length; i++) {
      const index = Math.abs(bytes[Math.floor(i / 4)] >> ((i % 4) * 8)) % charset.length;
      password += charset[index];
    }
    
    return password;
  }

  // Encrypt a file
  public async encryptFile(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      try {
        const reader = new FileReader();
        
        reader.onload = (event) => {
          try {
            if (!event.target || !event.target.result) {
              throw new Error('Failed to read file');
            }
            
            // Generate a file-specific key
            const fileKey = this.generateKey();
            
            // Encrypt the file data
            const encryptedData = this.encryptWithKey(event.target.result, fileKey);
            
            // Encrypt the file key with the master key
            const encryptedKey = this.encrypt(fileKey);
            
            // Create a metadata object
            const metadata = {
              filename: file.name,
              contentType: file.type,
              size: file.size,
              encryptedKey,
              timestamp: new Date().toISOString()
            };
            
            // Convert metadata to string and encrypt it
            const encryptedMetadata = this.encrypt(metadata);
            
            // Combine encrypted metadata and data
            const combinedData = JSON.stringify({
              metadata: encryptedMetadata,
              data: encryptedData
            });
            
            // Convert to Blob
            const blob = new Blob([combinedData], { type: 'application/encrypted' });
            resolve(blob);
          } catch (error) {
            reject(error);
          }
        };
        
        reader.onerror = () => {
          reject(new Error('Failed to read file'));
        };
        
        reader.readAsDataURL(file);
      } catch (error) {
        reject(error);
      }
    });
  }

  // Decrypt a file
  public async decryptFile(encryptedBlob: Blob): Promise<{ data: Blob, metadata: any }> {
    return new Promise((resolve, reject) => {
      try {
        const reader = new FileReader();
        
        reader.onload = (event) => {
          try {
            if (!event.target || !event.target.result) {
              throw new Error('Failed to read encrypted file');
            }
            
            // Parse the combined data
            const combinedData = JSON.parse(event.target.result as string);
            
            // Decrypt the metadata
            const metadata = this.decrypt(combinedData.metadata);
            
            // Decrypt the file key
            const fileKey = this.decrypt(metadata.encryptedKey);
            
            // Decrypt the file data
            const decryptedData = this.decryptWithKey(combinedData.data, fileKey);
            
            // Convert data URL back to Blob
            const byteString = atob(decryptedData.split(',')[1]);
            const arrayBuffer = new ArrayBuffer(byteString.length);
            const uint8Array = new Uint8Array(arrayBuffer);
            
            for (let i = 0; i < byteString.length; i++) {
              uint8Array[i] = byteString.charCodeAt(i);
            }
            
            const blob = new Blob([arrayBuffer], { type: metadata.contentType });
            
            resolve({ data: blob, metadata });
          } catch (error) {
            reject(error);
          }
        };
        
        reader.onerror = () => {
          reject(new Error('Failed to read encrypted file'));
        };
        
        reader.readAsText(encryptedBlob);
      } catch (error) {
        reject(error);
      }
    });
  }

  // Create a secure hash of data
  public createHash(data: any, algorithm: HashAlgorithm = this.config.hashAlgorithm): string {
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    
    switch (algorithm) {
      case 'SHA256':
        return CryptoJS.SHA256(dataString).toString();
      case 'SHA512':
        return CryptoJS.SHA512(dataString).toString();
      case 'SHA3':
        return CryptoJS.SHA3(dataString).toString();
      case 'RIPEMD160':
        return CryptoJS.RIPEMD160(dataString).toString();
      default:
        return CryptoJS.SHA256(dataString).toString();
    }
  }

  // Create an HMAC signature
  public createHMAC(data: any, key: string, algorithm: HashAlgorithm = this.config.hashAlgorithm): string {
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    
    switch (algorithm) {
      case 'SHA256':
        return CryptoJS.HmacSHA256(dataString, key).toString();
      case 'SHA512':
        return CryptoJS.HmacSHA512(dataString, key).toString();
      case 'SHA3':
        return CryptoJS.HmacSHA3(dataString, key).toString();
      case 'RIPEMD160':
        return CryptoJS.HmacRIPEMD160(dataString, key).toString();
      default:
        return CryptoJS.HmacSHA256(dataString, key).toString();
    }
  }

  // Verify an HMAC signature
  public verifyHMAC(data: any, signature: string, key: string, algorithm: HashAlgorithm = this.config.hashAlgorithm): boolean {
    const computedSignature = this.createHMAC(data, key, algorithm);
    return computedSignature === signature;
  }

  // Clear the key cache
  public clearKeyCache(): void {
    this.keyCache.clear();
  }

  // Update the encryption configuration
  public updateConfig(config: Partial<EncryptionConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

/**
 * Custom hook for encryption functionality
 */
export const useEncryption = () => {
  const encryptionService = EncryptionService.getInstance();
  
  // Initialize with a master key
  const initialize = (masterKey: string) => {
    encryptionService.initialize(masterKey);
  };
  
  // Encrypt data
  const encrypt = (data: any) => {
    return encryptionService.encrypt(data);
  };
  
  // Decrypt data
  const decrypt = (encryptedData: string) => {
    return encryptionService.decrypt(encryptedData);
  };
  
  // Encrypt a file
  const encryptFile = async (file: File) => {
    return await encryptionService.encryptFile(file);
  };
  
  // Decrypt a file
  const decryptFile = async (encryptedBlob: Blob) => {
    return await encryptionService.decryptFile(encryptedBlob);
  };
  
  // Create a secure hash
  const createHash = (data: any, algorithm?: HashAlgorithm) => {
    return encryptionService.createHash(data, algorithm);
  };
  
  // Generate a secure password
  const generatePassword = (length?: number) => {
    return encryptionService.generatePassword(length);
  };
  
  return {
    initialize,
    encrypt,
    decrypt,
    encryptFile,
    decryptFile,
    createHash,
    generatePassword
  };
};
