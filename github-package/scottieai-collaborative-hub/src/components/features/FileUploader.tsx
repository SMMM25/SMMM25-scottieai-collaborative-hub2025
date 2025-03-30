import React, { useState, useRef } from 'react';
import { Upload, X, CheckCircle, AlertCircle, FileCode, FileArchive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from "sonner";
import { Progress } from '@/components/ui/progress';
import { validateFile } from '@/services/fileProcessingService';

interface FileUploaderProps {
  onFileUpload: (file: File) => void;
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  onFileUpload,
  accept = ".zip,.rar,.7z",
  maxSize = 100,
  className = "",
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    setValidationError(null);
    
    // Use the validation service
    const validation = validateFile(file);
    
    if (!validation.isValid) {
      setValidationError(validation.message);
      toast.error(validation.message);
      return;
    }
    
    setFile(file);
  };

  const removeFile = () => {
    setFile(null);
    setUploadStatus('idle');
    setUploadProgress(0);
    setValidationError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = () => {
    if (!file) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 10) + 1;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(() => {
          setIsUploading(false);
          setUploadStatus('success');
          onFileUpload(file);
        }, 500);
      }
      setUploadProgress(progress);
    }, 200);
  };

  const getFileIcon = () => {
    if (!file) return <FileCode className="h-6 w-6 text-scottie" />;
    
    const fileType = file.name.split('.').pop()?.toLowerCase();
    
    switch (fileType) {
      case 'zip':
      case 'rar':
      case '7z':
        return <FileArchive className="h-6 w-6 text-scottie" />;
      default:
        return <FileCode className="h-6 w-6 text-scottie" />;
    }
  };

  const getFileTypeLabel = () => {
    if (!file) return '';
    
    const fileType = file.name.split('.').pop()?.toLowerCase();
    
    switch (fileType) {
      case 'zip':
        return 'ZIP Archive';
      case 'rar':
        return 'RAR Archive';
      case '7z':
        return '7-Zip Archive';
      default:
        return 'File';
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {!file ? (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center ${
            isDragging ? 'border-scottie bg-scottie-light/20' : validationError ? 'border-red-300' : 'border-gray-300'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className={`p-3 rounded-full ${validationError ? 'bg-red-100' : 'bg-scottie-light'}`}>
              {getFileIcon()}
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-medium">Upload your code package</h3>
              <p className="text-sm text-muted-foreground">
                Drag and drop your code package here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                Supports {accept} files up to {maxSize}MB
              </p>
              {validationError && (
                <p className="text-xs text-red-500 mt-2">{validationError}</p>
              )}
            </div>
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className={validationError 
                ? "border-red-500 text-red-500 hover:bg-red-50" 
                : "border-scottie text-scottie hover:bg-scottie-light/20"
              }
            >
              Select File
            </Button>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept={accept}
            className="hidden"
          />
        </div>
      ) : (
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-scottie-light rounded-full">
                {getFileIcon()}
              </div>
              <div>
                <p className="font-medium truncate max-w-[200px] sm:max-w-xs">
                  {file.name}
                </p>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-muted-foreground">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                  <span className="text-xs bg-scottie-light/30 text-scottie px-2 py-0.5 rounded-full">
                    {getFileTypeLabel()}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={removeFile} className="text-muted-foreground hover:text-foreground">
              <X size={20} />
            </button>
          </div>
          
          {uploadStatus === 'idle' && (
            <>
              {isUploading ? (
                <div className="space-y-2">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-center text-muted-foreground">
                    Uploading... {uploadProgress}%
                  </p>
                </div>
              ) : (
                <Button 
                  onClick={handleUpload} 
                  className="w-full bg-scottie hover:bg-scottie-secondary"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload File
                </Button>
              )}
            </>
          )}
          
          {uploadStatus === 'success' && (
            <div className="flex items-center space-x-2 text-green-500">
              <CheckCircle size={16} />
              <span className="text-sm">Upload complete</span>
            </div>
          )}
          
          {uploadStatus === 'error' && (
            <div className="flex items-center space-x-2 text-red-500">
              <AlertCircle size={16} />
              <span className="text-sm">Upload failed. Please try again.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUploader;
