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
    const preview = await FileProcessor.generatePreview(file).catch(() => '');
    
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
    handleFiles(e.dataTransfer.files);
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
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (id: string) => {
    const newFiles = selectedFiles.filter(f => f.id !== id);
    setSelectedFiles(newFiles);
    onFilesSelected(newFiles);
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
          <h4 className="text-lg font-semibold mb-4">Selected Files ({selectedFiles.length}/{maxFiles})</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedFiles.map((fileItem) => (
              <div key={fileItem.id} className="bg-white rounded-lg shadow-md p-4 relative">
                <button
                  onClick={() => removeFile(fileItem.id)}
                  className="absolute top-2 right-2 p-1 bg-red-100 hover:bg-red-200 rounded-full transition-colors"
                  aria-label="Remove file"
                >
                  <X className="h-4 w-4 text-red-600" />
                </button>
                
                <div className="flex items-center space-x-3">
                  {fileItem.preview ? (
                    <img 
                      src={fileItem.preview} 
                      alt={fileItem.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  ) : fileItem.type.startsWith('image/') ? (
                    <Image className="h-12 w-12 text-gray-400" />
                  ) : (
                    <File className="h-12 w-12 text-gray-400" />
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {fileItem.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {FileProcessor.formatFileSize(fileItem.size)}
                    </p>
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