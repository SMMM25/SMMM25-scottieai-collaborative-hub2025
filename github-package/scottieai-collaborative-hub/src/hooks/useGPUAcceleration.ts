import { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';

// WebGL shader types
type ShaderType = 'vertex' | 'fragment';

// Interface for GPU acceleration options
interface GPUAccelerationOptions {
  canvas?: HTMLCanvasElement;
  contextAttributes?: WebGLContextAttributes;
  maxTextureSize?: number;
}

/**
 * Custom hook for GPU-accelerated operations
 */
export const useGPUAcceleration = (options: GPUAccelerationOptions = {}) => {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [maxTextureSize, setMaxTextureSize] = useState<number>(0);
  const [gpuInfo, setGpuInfo] = useState<any>(null);
  
  const glRef = useRef<WebGLRenderingContext | WebGL2RenderingContext | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  
  // Initialize WebGL context
  useEffect(() => {
    const initialize = () => {
      try {
        // Use provided canvas or create a new one
        const canvas = options.canvas || document.createElement('canvas');
        canvasRef.current = canvas;
        
        // Try to get WebGL2 context first, fall back to WebGL1
        let gl = canvas.getContext('webgl2', options.contextAttributes) as WebGL2RenderingContext;
        let isWebGL2 = true;
        
        if (!gl) {
          gl = canvas.getContext('webgl', options.contextAttributes) as WebGLRenderingContext;
          isWebGL2 = false;
        }
        
        if (!gl) {
          setIsSupported(false);
          return;
        }
        
        glRef.current = gl;
        setIsSupported(true);
        
        // Get GPU info
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        const gpuVendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'Unknown';
        const gpuRenderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Unknown';
        
        // Get max texture size
        const maxSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
        setMaxTextureSize(maxSize);
        
        // Set GPU info
        setGpuInfo({
          vendor: gpuVendor,
          renderer: gpuRenderer,
          isWebGL2,
          maxTextureSize: maxSize,
          extensions: gl.getSupportedExtensions()
        });
        
        setIsInitialized(true);
        
        console.log(`GPU Acceleration initialized: ${gpuRenderer} (${gpuVendor})`);
      } catch (error) {
        console.error('Error initializing GPU acceleration:', error);
        setIsSupported(false);
        toast.error('GPU acceleration not available');
      }
    };
    
    initialize();
    
    // Cleanup
    return () => {
      if (glRef.current && programRef.current) {
        glRef.current.deleteProgram(programRef.current);
      }
    };
  }, [options.canvas, options.contextAttributes]);
  
  // Compile shader
  const compileShader = (source: string, type: ShaderType): WebGLShader | null => {
    const gl = glRef.current;
    if (!gl) return null;
    
    const shader = gl.createShader(
      type === 'vertex' ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER
    );
    
    if (!shader) return null;
    
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(`Shader compilation error: ${gl.getShaderInfoLog(shader)}`);
      gl.deleteShader(shader);
      return null;
    }
    
    return shader;
  };
  
  // Create shader program
  const createProgram = (vertexSource: string, fragmentSource: string): WebGLProgram | null => {
    const gl = glRef.current;
    if (!gl) return null;
    
    const vertexShader = compileShader(vertexSource, 'vertex');
    const fragmentShader = compileShader(fragmentSource, 'fragment');
    
    if (!vertexShader || !fragmentShader) return null;
    
    const program = gl.createProgram();
    if (!program) return null;
    
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(`Program linking error: ${gl.getProgramInfoLog(program)}`);
      gl.deleteProgram(program);
      return null;
    }
    
    // Clean up shaders
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    
    // Store program reference
    programRef.current = program;
    
    return program;
  };
  
  // Create texture from data
  const createTexture = (
    data: Float32Array | Uint8Array, 
    width: number, 
    height: number,
    format: number = glRef.current?.RGBA || 0x1908, // RGBA
    type: number = glRef.current?.FLOAT || 0x1406, // FLOAT
    internalFormat: number | null = null
  ): WebGLTexture | null => {
    const gl = glRef.current;
    if (!gl) return null;
    
    const texture = gl.createTexture();
    if (!texture) return null;
    
    gl.bindTexture(gl.TEXTURE_2D, texture);
    
    // Set texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    
    // Upload data to texture
    const actualInternalFormat = internalFormat || format;
    gl.texImage2D(gl.TEXTURE_2D, 0, actualInternalFormat, width, height, 0, format, type, data);
    
    return texture;
  };
  
  // Run computation on GPU
  const runComputation = async (
    program: WebGLProgram,
    inputTextures: { [name: string]: WebGLTexture },
    uniforms: { [name: string]: number | number[] },
    width: number,
    height: number
  ): Promise<Float32Array | null> => {
    const gl = glRef.current;
    if (!gl || !program) return null;
    
    // Create framebuffer for output
    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    
    // Create output texture
    const outputTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, outputTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    
    // For WebGL2, we can use RGBA32F directly
    if ('RGBA32F' in gl) {
      gl.texImage2D(gl.TEXTURE_2D, 0, (gl as WebGL2RenderingContext).RGBA32F, width, height, 0, gl.RGBA, gl.FLOAT, null);
    } else {
      // For WebGL1, we need to check for OES_texture_float extension
      const floatTextureExt = gl.getExtension('OES_texture_float');
      if (!floatTextureExt) {
        console.error('OES_texture_float extension not supported');
        return null;
      }
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.FLOAT, null);
    }
    
    // Attach texture to framebuffer
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, outputTexture, 0);
    
    // Check framebuffer status
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
      console.error('Framebuffer not complete');
      return null;
    }
    
    // Use program
    gl.useProgram(program);
    
    // Set viewport
    gl.viewport(0, 0, width, height);
    
    // Bind input textures
    let textureUnit = 0;
    for (const [name, texture] of Object.entries(inputTextures)) {
      const location = gl.getUniformLocation(program, name);
      gl.activeTexture(gl.TEXTURE0 + textureUnit);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(location, textureUnit);
      textureUnit++;
    }
    
    // Set uniforms
    for (const [name, value] of Object.entries(uniforms)) {
      const location = gl.getUniformLocation(program, name);
      if (Array.isArray(value)) {
        switch (value.length) {
          case 2:
            gl.uniform2fv(location, value);
            break;
          case 3:
            gl.uniform3fv(location, value);
            break;
          case 4:
            gl.uniform4fv(location, value);
            break;
          default:
            gl.uniform1fv(location, value);
        }
      } else {
        gl.uniform1f(location, value);
      }
    }
    
    // Create and bind vertex buffer for a full-screen quad
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1,
        1, -1,
        -1, 1,
        1, 1
      ]),
      gl.STATIC_DRAW
    );
    
    // Set up vertex attribute
    const positionLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    
    // Draw
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    
    // Read back result
    const result = new Float32Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.FLOAT, result);
    
    // Clean up
    gl.deleteBuffer(vertexBuffer);
    gl.deleteTexture(outputTexture);
    gl.deleteFramebuffer(framebuffer);
    
    return result;
  };
  
  // Matrix multiplication on GPU
  const multiplyMatrices = async (
    matrixA: Float32Array,
    matrixB: Float32Array,
    rowsA: number,
    colsA: number,
    colsB: number
  ): Promise<Float32Array | null> => {
    if (!isInitialized || !glRef.current) return null;
    
    // Vertex shader
    const vertexShaderSource = `
      attribute vec2 position;
      varying vec2 texCoord;
      
      void main() {
        texCoord = position * 0.5 + 0.5;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;
    
    // Fragment shader for matrix multiplication
    const fragmentShaderSource = `
      precision highp float;
      
      varying vec2 texCoord;
      uniform sampler2D matrixA;
      uniform sampler2D matrixB;
      uniform int rowsA;
      uniform int colsA;
      uniform int colsB;
      
      void main() {
        float row = floor(texCoord.y * float(rowsA));
        float col = floor(texCoord.x * float(colsB));
        
        float sum = 0.0;
        
        for (int i = 0; i < 2048; i++) {
          if (i >= colsA) break;
          
          float a = texture2D(matrixA, vec2((float(i) + 0.5) / float(colsA), (row + 0.5) / float(rowsA))).r;
          float b = texture2D(matrixB, vec2((col + 0.5) / float(colsB), (float(i) + 0.5) / float(colsA))).r;
          
          sum += a * b;
        }
        
        gl_FragColor = vec4(sum, 0.0, 0.0, 1.0);
      }
    `;
    
    // Create program
    const program = createProgram(vertexShaderSource, fragmentShaderSource);
    if (!program) return null;
    
    // Create textures for matrices
    const textureA = createTexture(matrixA, colsA, rowsA, glRef.current.RED, glRef.current.FLOAT);
    const textureB = createTexture(matrixB, colsB, colsA, glRef.current.RED, glRef.current.FLOAT);
    
    if (!textureA || !textureB) return null;
    
    // Run computation
    const result = await runComputation(
      program,
      { matrixA: textureA, matrixB: textureB },
      { rowsA, colsA, colsB },
      colsB,
      rowsA
    );
    
    // Clean up
    glRef.current.deleteTexture(textureA);
    glRef.current.deleteTexture(textureB);
    
    return result;
  };
  
  // Convolution operation on GPU (for neural networks)
  const applyConvolution = async (
    input: Float32Array,
    kernel: Float32Array,
    inputWidth: number,
    inputHeight: number,
    kernelSize: number,
    inputChannels: number,
    outputChannels: number
  ): Promise<Float32Array | null> => {
    if (!isInitialized || !glRef.current) return null;
    
    // Vertex shader
    const vertexShaderSource = `
      attribute vec2 position;
      varying vec2 texCoord;
      
      void main() {
        texCoord = position * 0.5 + 0.5;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;
    
    // Fragment shader for convolution
    const fragmentShaderSource = `
      precision highp float;
      
      varying vec2 texCoord;
      uniform sampler2D input;
      uniform sampler2D kernel;
      uniform int inputWidth;
      uniform int inputHeight;
      uniform int kernelSize;
      uniform int inputChannels;
      uniform int outputChannels;
      
      void main() {
        float outputX = floor(texCoord.x * float(inputWidth));
        float outputY = floor(texCoord.y * float(inputHeight));
        
        vec4 sum = vec4(0.0);
        
        for (int oc = 0; oc < 128; oc++) {
          if (oc >= outputChannels) break;
          
          float channelSum = 0.0;
          
          for (int ic = 0; ic < 128; ic++) {
            if (ic >= inputChannels) break;
            
            for (int ky = 0; ky < 11; ky++) {
              if (ky >= kernelSize) break;
              
              for (int kx = 0; kx < 11; kx++) {
                if (kx >= kernelSize) break;
                
                int inputX = int(outputX) - kernelSize / 2 + kx;
                int inputY = int(outputY) - kernelSize / 2 + ky;
                
                if (inputX >= 0 && inputX < inputWidth && inputY >= 0 && inputY < inputHeight) {
                  float inputValue = texture2D(input, vec2(
                    (float(inputX) + 0.5) / float(inputWidth),
                    (float(inputY) + 0.5) / float(inputHeight)
                  )).r;
                  
                  float kernelValue = texture2D(kernel, vec2(
                    (float(kx * inputChannels * outputChannels + ic * outputChannels + oc) + 0.5) / float(kernelSize * kernelSize * inputChannels * outputChannels),
                    0.5
                  )).r;
                  
                  channelSum += inputValue * kernelValue;
                }
              }
            }
          }
          
          if (oc < 4) {
            sum[oc] = channelSum;
          }
        }
        
        gl_FragColor = sum;
      }
    `;
    
    // Create program
    const program = createProgram(vertexShaderSource, fragmentShaderSource);
    if (!program) return null;
    
    // Create textures
    const inputTexture = createTexture(input, inputWidth, inputHeight, glRef.current.RED, glRef.current.FLOAT);
    const kernelTexture = createTexture(
      kernel,
      kernelSize * kernelSize * inputChannels * outputChannels,
      1,
      glRef.current.RED,
      glRef.current.FLOAT
    );
    
    if (!inputTexture || !kernelTexture) return null;
    
    // Run computation
    const result = await runComputation(
      program,
      { input: inputTexture, kernel: kernelTexture },
      { 
        inputWidth, 
        inputHeight, 
        kernelSize, 
        inputChannels, 
        outputChannels 
      },
      inputWidth,
      inputHeight
    );
    
    // Clean up
    glRef.current.deleteTexture(inputTexture);
    glRef.current.deleteTexture(kernelTexture);
    
    return result;
  };
  
  return {
    isSupported,
    isInitialized,
    maxTextureSize,
    gpuInfo,
    createProgram,
    createTexture,
    runComputation,
    multiplyMatrices,
    applyConvolution,
    gl: glRef.current,
    canvas: canvasRef.current
  };
};
