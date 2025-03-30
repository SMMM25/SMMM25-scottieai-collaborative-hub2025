import { useEffect, useState } from 'react';
import { WebAuthnClient } from '@simplewebauthn/browser';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

// Initialize WebAuthn client
const webAuthnClient = new WebAuthnClient();

// Interface for credential options
interface CredentialOptions {
  publicKey: PublicKeyCredentialCreationOptions | PublicKeyCredentialRequestOptions;
}

// Interface for security key
export interface SecurityKey {
  id: string;
  name: string;
  createdAt: string;
  lastUsed?: string;
}

/**
 * Custom hook for hardware security key authentication
 */
export const useHardwareAuth = (userId?: string) => {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [securityKeys, setSecurityKeys] = useState<SecurityKey[]>([]);

  // Check if WebAuthn is supported
  useEffect(() => {
    const checkSupport = async () => {
      try {
        const supported = await webAuthnClient.isSupported();
        setIsSupported(supported);
      } catch (error) {
        console.error('Error checking WebAuthn support:', error);
        setIsSupported(false);
      }
    };

    checkSupport();
  }, []);

  // Load registered security keys
  useEffect(() => {
    if (userId) {
      loadSecurityKeys();
    }
  }, [userId]);

  // Load security keys from database
  const loadSecurityKeys = async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('security_keys')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      setSecurityKeys(
        data.map(key => ({
          id: key.id,
          name: key.name,
          createdAt: key.created_at,
          lastUsed: key.last_used
        }))
      );
    } catch (error) {
      console.error('Error loading security keys:', error);
      toast.error('Failed to load security keys');
    } finally {
      setIsLoading(false);
    }
  };

  // Register a new security key
  const registerSecurityKey = async (name: string): Promise<boolean> => {
    if (!userId || !isSupported) return false;

    try {
      setIsLoading(true);

      // 1. Get registration options from server
      const { data: optionsData, error: optionsError } = await supabase.functions.invoke(
        'webauthn-register-options',
        {
          body: { userId }
        }
      );

      if (optionsError) throw optionsError;

      // 2. Create credentials using WebAuthn
      const credential = await webAuthnClient.startRegistration(optionsData as CredentialOptions);

      // 3. Verify registration with server
      const { data: verificationData, error: verificationError } = await supabase.functions.invoke(
        'webauthn-register-verify',
        {
          body: {
            userId,
            credential,
            name
          }
        }
      );

      if (verificationError) throw verificationError;

      // 4. Reload security keys
      await loadSecurityKeys();
      
      toast.success('Security key registered successfully');
      return true;
    } catch (error) {
      console.error('Error registering security key:', error);
      toast.error('Failed to register security key');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Authenticate with a security key
  const authenticateWithSecurityKey = async (): Promise<boolean> => {
    if (!isSupported) return false;

    try {
      setIsLoading(true);

      // 1. Get authentication options from server
      const { data: optionsData, error: optionsError } = await supabase.functions.invoke(
        'webauthn-auth-options',
        {
          body: { userId }
        }
      );

      if (optionsError) throw optionsError;

      // 2. Get credentials using WebAuthn
      const credential = await webAuthnClient.startAuthentication(optionsData as CredentialOptions);

      // 3. Verify authentication with server
      const { data: verificationData, error: verificationError } = await supabase.functions.invoke(
        'webauthn-auth-verify',
        {
          body: {
            credential
          }
        }
      );

      if (verificationError) throw verificationError;

      toast.success('Authentication successful');
      return true;
    } catch (error) {
      console.error('Error authenticating with security key:', error);
      toast.error('Authentication failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Remove a security key
  const removeSecurityKey = async (keyId: string): Promise<boolean> => {
    if (!userId) return false;

    try {
      setIsLoading(true);

      const { error } = await supabase
        .from('security_keys')
        .delete()
        .eq('id', keyId)
        .eq('user_id', userId);

      if (error) throw error;

      // Update local state
      setSecurityKeys(prevKeys => prevKeys.filter(key => key.id !== keyId));
      
      toast.success('Security key removed successfully');
      return true;
    } catch (error) {
      console.error('Error removing security key:', error);
      toast.error('Failed to remove security key');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isSupported,
    isLoading,
    securityKeys,
    registerSecurityKey,
    authenticateWithSecurityKey,
    removeSecurityKey,
    loadSecurityKeys
  };
};

/**
 * Custom hook for biometric authentication
 */
export const useBiometricAuth = () => {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Check if biometric authentication is supported
  useEffect(() => {
    const checkSupport = async () => {
      try {
        // Check if platform authenticator is available (typically used for biometrics)
        const supported = await webAuthnClient.isSupported() && 
                          await webAuthnClient.isPlatformAuthenticatorAvailable();
        setIsSupported(supported);
      } catch (error) {
        console.error('Error checking biometric support:', error);
        setIsSupported(false);
      }
    };

    checkSupport();
  }, []);

  // Register biometric authentication
  const registerBiometric = async (userId: string): Promise<boolean> => {
    if (!isSupported) return false;

    try {
      setIsLoading(true);

      // 1. Get registration options from server with platform authenticator requirement
      const { data: optionsData, error: optionsError } = await supabase.functions.invoke(
        'webauthn-register-options',
        {
          body: { 
            userId,
            authenticatorType: 'platform' // Request platform authenticator (biometrics)
          }
        }
      );

      if (optionsError) throw optionsError;

      // 2. Create credentials using WebAuthn
      const credential = await webAuthnClient.startRegistration(optionsData as CredentialOptions);

      // 3. Verify registration with server
      const { data: verificationData, error: verificationError } = await supabase.functions.invoke(
        'webauthn-register-verify',
        {
          body: {
            userId,
            credential,
            name: 'Biometric Authentication',
            authenticatorType: 'platform'
          }
        }
      );

      if (verificationError) throw verificationError;
      
      toast.success('Biometric authentication registered successfully');
      return true;
    } catch (error) {
      console.error('Error registering biometric authentication:', error);
      toast.error('Failed to register biometric authentication');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Authenticate with biometrics
  const authenticateWithBiometric = async (userId: string): Promise<boolean> => {
    if (!isSupported) return false;

    try {
      setIsLoading(true);

      // 1. Get authentication options from server with platform authenticator requirement
      const { data: optionsData, error: optionsError } = await supabase.functions.invoke(
        'webauthn-auth-options',
        {
          body: { 
            userId,
            authenticatorType: 'platform' // Request platform authenticator (biometrics)
          }
        }
      );

      if (optionsError) throw optionsError;

      // 2. Get credentials using WebAuthn
      const credential = await webAuthnClient.startAuthentication(optionsData as CredentialOptions);

      // 3. Verify authentication with server
      const { data: verificationData, error: verificationError } = await supabase.functions.invoke(
        'webauthn-auth-verify',
        {
          body: {
            credential,
            authenticatorType: 'platform'
          }
        }
      );

      if (verificationError) throw verificationError;

      toast.success('Biometric authentication successful');
      return true;
    } catch (error) {
      console.error('Error authenticating with biometrics:', error);
      toast.error('Biometric authentication failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isSupported,
    isLoading,
    registerBiometric,
    authenticateWithBiometric
  };
};
