import React, { useCallback, useState } from 'react';
import { Upload, X, File, Image } from 'lucide-react';
import { FileItem } from '../types';
import { FileProcessor } from '../utils/fileProcessor';

interface FileUploadProps {
  onFilesSelected: (files: FileItem[]) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFilesSelected,
  maxFiles = 10,
  acceptedTypes = ['image/jpeg', 'image/png', 'application/pdf']
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([]);

  const createFileItem = async (file: File): Promise<FileItem> => {
    // Generate preview for images and PDFs
    let preview = '';
    if (file.type.startsWith('image/') || file.type === 'application/pdf') {
      preview = await FileProcessor.generatePreview(file).catch(() => '');
    }
    
    return {
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'pending',
      progress: 0,
      preview
    };
  };

  const handleFiles = async (files: FileList) => {
    const validFiles = Array.from(files).filter(file => {
      const isValidType = acceptedTypes.includes(file.type);
      const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB limit
      return isValidType && isValidSize;
    });

    if (validFiles.length === 0) {
      alert('Please select valid JPEG, PNG, or PDF files (max 50MB each)');
      return;
    }

    if (validFiles.length + selectedFiles.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const fileItems = await Promise.all(validFiles.map(createFileItem));
    const newSelectedFiles = [...selectedFiles, ...fileItems];
    
    setSelectedFiles(newSelectedFiles);
    onFilesSelected(newSelectedFiles);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    // Get files from data transfer
    const files = Array.from(e.dataTransfer.files);
    const hasValidFiles = files.some(file => acceptedTypes.includes(file.type));
    
    if (!hasValidFiles) {
      alert('Please drop valid JPEG, PNG, or PDF files');
      return;
    }
    
    // Create a FileList-like object
    const dataTransfer = e.dataTransfer;
    handleFiles(dataTransfer.files);
  }, [selectedFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
      // Reset the input to allow selecting the same file again
      e.target.value = '';
    }
  };

  const removeFile = (id: string) => {
    const newFiles = selectedFiles.filter(f => f.id !== id);
    setSelectedFiles(newFiles);
    onFilesSelected(newFiles);
  };

  // Get file icon based on type
  const getFileIcon = (fileType: string, preview?: string) => {
    if (preview) {
      return (
        <img 
          src={preview} 
          alt="Preview" 
          className="w-12 h-12 object-cover rounded"
          onError={(e) => {
            // Fallback to icon if image fails to load
            e.currentTarget.style.display = 'none';
          }}
        />
      );
    }
    
    if (fileType.startsWith('image/')) {
      return <Image className="h-12 w-12 text-gray-400" />;
    } else if (fileType === 'application/pdf') {
      return <File className="h-12 w-12 text-blue-400" />;
    }
    
    return <File className="h-12 w-12 text-gray-400" />;
  };

  // Get file type label
  const getFileTypeLabel = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return fileType.split('/')[1].toUpperCase();
    } else if (fileType === 'application/pdf') {
      return 'PDF';
    }
    return 'File';
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div
        className={`
          border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300
          ${isDragOver 
            ? 'border-blue-500 bg-blue-50 scale-105' 
            : 'border-gray-300 hover:border-gray-400'
          }
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          Drop files here or click to browse
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Support for JPEG, PNG, and PDF files up to 50MB each
        </p>
        <input
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileInput}
          className="hidden"
          id="file-input"
        />
        <label
          htmlFor="file-input"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
        >
          <Upload className="h-4 w-4 mr-2" />
          Browse Files
        </label>
      </div>

      {selectedFiles.length > 0 && (
        <div className="mt-6">
          <h4 className="text-lg font-semibold mb-4">
            Selected Files ({selectedFiles.length}/{maxFiles})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedFiles.map((fileItem) => (
              <div key={fileItem.id} className="bg-white rounded-lg shadow-md p-4 relative group">
                <button
                  onClick={() => removeFile(fileItem.id)}
                  className="absolute top-2 right-2 p-1 bg-red-100 hover:bg-red-200 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                  aria-label="Remove file"
                >
                  <X className="h-4 w-4 text-red-600" />
                </button>
                
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    {getFileIcon(fileItem.type, fileItem.preview)}
                    <div className="absolute -bottom-1 -right-1 bg-gray-800 text-white text-xs px-1 py-0.5 rounded">
                      {getFileTypeLabel(fileItem.type)}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate" title={fileItem.name}>
                      {fileItem.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {FileProcessor.formatFileSize(fileItem.size)}
                    </p>
                    {fileItem.type === 'application/pdf' && (
                      <p className="text-xs text-blue-600 mt-1">PDF Document</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};