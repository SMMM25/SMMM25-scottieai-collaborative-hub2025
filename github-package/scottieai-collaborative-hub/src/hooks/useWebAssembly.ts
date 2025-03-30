import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';

// WebAssembly module interface
interface WasmModule {
  memory: WebAssembly.Memory;
  exports: any;
}

// WebAssembly function types
type WasmFunction = (...args: any[]) => any;

/**
 * Custom hook for WebAssembly acceleration
 */
export const useWebAssembly = () => {
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const moduleRef = useRef<WasmModule | null>(null);
  const functionsRef = useRef<Record<string, WasmFunction>>({});

  // Load WebAssembly module
  const loadModule = async (wasmUrl: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch WebAssembly module
      const response = await fetch(wasmUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch WebAssembly module: ${response.statusText}`);
      }

      // Compile WebAssembly module
      const wasmBytes = await response.arrayBuffer();
      const wasmModule = await WebAssembly.compile(wasmBytes);

      // Create memory
      const memory = new WebAssembly.Memory({ initial: 10, maximum: 100 });

      // Create imports
      const imports = {
        env: {
          memory,
          abort: (_msg: number, _file: number, line: number, column: number) => {
            console.error(`Abort called at ${line}:${column}`);
          },
          log: (value: number) => {
            console.log(`WASM log: ${value}`);
          },
          now: () => {
            return Date.now();
          }
        }
      };

      // Instantiate WebAssembly module
      const instance = await WebAssembly.instantiate(wasmModule, imports);
      
      // Store module reference
      moduleRef.current = {
        memory,
        exports: instance.exports
      };

      // Extract exported functions
      const exports = instance.exports;
      const functions: Record<string, WasmFunction> = {};
      
      for (const key in exports) {
        if (typeof exports[key] === 'function') {
          functions[key] = exports[key] as WasmFunction;
        }
      }
      
      functionsRef.current = functions;
      
      setIsLoaded(true);
      setIsLoading(false);
      
      console.log('WebAssembly module loaded successfully');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error loading WebAssembly module';
      console.error('Error loading WebAssembly module:', err);
      setError(errorMessage);
      setIsLoading(false);
      toast.error(`Failed to load WebAssembly module: ${errorMessage}`);
      return false;
    }
  };

  // Call a WebAssembly function
  const callFunction = <T>(functionName: string, ...args: any[]): T | null => {
    if (!isLoaded || !moduleRef.current) {
      console.error('WebAssembly module not loaded');
      return null;
    }

    const func = functionsRef.current[functionName];
    if (!func) {
      console.error(`Function "${functionName}" not found in WebAssembly module`);
      return null;
    }

    try {
      return func(...args) as T;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error calling WebAssembly function';
      console.error(`Error calling WebAssembly function "${functionName}":`, err);
      toast.error(`WebAssembly execution error: ${errorMessage}`);
      return null;
    }
  };

  // Write data to WebAssembly memory
  const writeMemory = (offset: number, data: Uint8Array | Int8Array | Uint16Array | Int16Array | Uint32Array | Int32Array | Float32Array | Float64Array): boolean => {
    if (!isLoaded || !moduleRef.current) {
      console.error('WebAssembly module not loaded');
      return false;
    }

    try {
      const memory = moduleRef.current.memory;
      const view = new Uint8Array(memory.buffer, offset, data.byteLength);
      
      // Copy data to memory
      const sourceView = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
      view.set(sourceView);
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error writing to WebAssembly memory';
      console.error('Error writing to WebAssembly memory:', err);
      toast.error(`WebAssembly memory error: ${errorMessage}`);
      return false;
    }
  };

  // Read data from WebAssembly memory
  const readMemory = <T extends Uint8Array | Int8Array | Uint16Array | Int16Array | Uint32Array | Int32Array | Float32Array | Float64Array>(
    offset: number, 
    length: number, 
    type: new (buffer: ArrayBuffer, byteOffset: number, length: number) => T
  ): T | null => {
    if (!isLoaded || !moduleRef.current) {
      console.error('WebAssembly module not loaded');
      return null;
    }

    try {
      const memory = moduleRef.current.memory;
      return new type(memory.buffer, offset, length);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error reading from WebAssembly memory';
      console.error('Error reading from WebAssembly memory:', err);
      toast.error(`WebAssembly memory error: ${errorMessage}`);
      return null;
    }
  };

  // Allocate memory in WebAssembly
  const allocateMemory = (bytes: number): number | null => {
    if (!isLoaded || !moduleRef.current) {
      console.error('WebAssembly module not loaded');
      return null;
    }

    // Check if module exports malloc function
    const malloc = functionsRef.current['malloc'];
    if (!malloc) {
      console.error('malloc function not found in WebAssembly module');
      return null;
    }

    try {
      return malloc(bytes) as number;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error allocating WebAssembly memory';
      console.error('Error allocating WebAssembly memory:', err);
      toast.error(`WebAssembly memory allocation error: ${errorMessage}`);
      return null;
    }
  };

  // Free memory in WebAssembly
  const freeMemory = (pointer: number): boolean => {
    if (!isLoaded || !moduleRef.current) {
      console.error('WebAssembly module not loaded');
      return false;
    }

    // Check if module exports free function
    const free = functionsRef.current['free'];
    if (!free) {
      console.error('free function not found in WebAssembly module');
      return false;
    }

    try {
      free(pointer);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error freeing WebAssembly memory';
      console.error('Error freeing WebAssembly memory:', err);
      toast.error(`WebAssembly memory free error: ${errorMessage}`);
      return false;
    }
  };

  // Process array with WebAssembly
  const processArray = <T extends number>(
    functionName: string,
    inputArray: T[],
    inputType: 'i32' | 'i64' | 'f32' | 'f64',
    outputType: 'i32' | 'i64' | 'f32' | 'f64'
  ): T[] | null => {
    if (!isLoaded || !moduleRef.current) {
      console.error('WebAssembly module not loaded');
      return null;
    }

    // Determine array type based on input type
    let inputArrayType: Float32ArrayConstructor | Float64ArrayConstructor | Int32Array | BigInt64ArrayConstructor;
    let bytesPerElement: number;
    
    switch (inputType) {
      case 'f32':
        inputArrayType = Float32Array;
        bytesPerElement = 4;
        break;
      case 'f64':
        inputArrayType = Float64Array;
        bytesPerElement = 8;
        break;
      case 'i32':
        inputArrayType = Int32Array;
        bytesPerElement = 4;
        break;
      case 'i64':
        inputArrayType = BigInt64Array;
        bytesPerElement = 8;
        break;
      default:
        console.error(`Unsupported input type: ${inputType}`);
        return null;
    }

    // Determine output array type
    let outputArrayType: Float32ArrayConstructor | Float64ArrayConstructor | Int32Array | BigInt64ArrayConstructor;
    
    switch (outputType) {
      case 'f32':
        outputArrayType = Float32Array;
        break;
      case 'f64':
        outputArrayType = Float64Array;
        break;
      case 'i32':
        outputArrayType = Int32Array;
        break;
      case 'i64':
        outputArrayType = BigInt64Array;
        break;
      default:
        console.error(`Unsupported output type: ${outputType}`);
        return null;
    }

    try {
      // Allocate memory for input array
      const inputBytes = inputArray.length * bytesPerElement;
      const inputPtr = allocateMemory(inputBytes);
      if (inputPtr === null) {
        throw new Error('Failed to allocate memory for input array');
      }

      // Write input array to memory
      const inputTypedArray = new inputArrayType(inputArray.length);
      for (let i = 0; i < inputArray.length; i++) {
        inputTypedArray[i] = inputArray[i] as any;
      }
      
      const success = writeMemory(inputPtr, new Uint8Array(inputTypedArray.buffer));
      if (!success) {
        throw new Error('Failed to write input array to memory');
      }

      // Call WebAssembly function
      const outputPtr = callFunction<number>(functionName, inputPtr, inputArray.length);
      if (outputPtr === null) {
        throw new Error(`Failed to call WebAssembly function: ${functionName}`);
      }

      // Read output array from memory
      const outputArray = readMemory(outputPtr, inputArray.length, outputArrayType);
      if (!outputArray) {
        throw new Error('Failed to read output array from memory');
      }

      // Convert output array to regular array
      const result: T[] = Array.from(outputArray) as T[];

      // Free memory
      freeMemory(inputPtr);
      freeMemory(outputPtr);

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error processing array with WebAssembly';
      console.error('Error processing array with WebAssembly:', err);
      toast.error(`WebAssembly processing error: ${errorMessage}`);
      return null;
    }
  };

  // Unload WebAssembly module
  const unloadModule = (): void => {
    moduleRef.current = null;
    functionsRef.current = {};
    setIsLoaded(false);
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      unloadModule();
    };
  }, []);

  return {
    isLoaded,
    isLoading,
    error,
    loadModule,
    callFunction,
    writeMemory,
    readMemory,
    allocateMemory,
    freeMemory,
    processArray,
    unloadModule
  };
};
