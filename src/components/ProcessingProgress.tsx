import React from 'react'; 
import { CheckCircle, AlertCircle, Loader2, Download } from 'lucide-react';
import { FileItem, ProcessingState } from '../types';
import { FileProcessor } from '../utils/fileProcessor';

interface ProcessingProgressProps {
  files: FileItem[];
  processingState: ProcessingState;
  onDownload: (fileId: string) => void;
  onDownloadAll: () => void;
}

export const ProcessingProgress: React.FC<ProcessingProgressProps> = ({
  files,
  processingState,
  onDownload,
  onDownloadAll
}) => {
  const completedFiles = files.filter(f => f.status === 'completed').length;
  const hasCompletedFiles = completedFiles > 0;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-semibold text-gray-800">Processing Progress</h3>
          {hasCompletedFiles && (
            <button
              onClick={onDownloadAll}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Download All ({completedFiles})
            </button>
          )}
        </div>

        {processingState.isProcessing && (
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <div className="flex items-center mb-2">
              <Loader2 className="h-5 w-5 text-blue-600 animate-spin mr-2" />
              <span className="text-sm font-medium text-blue-800">
                Processing file {processingState.currentFile} of {processingState.totalFiles}
              </span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${processingState.overallProgress}%` }}
              />
            </div>
            <p className="text-xs text-blue-600 mt-1">
              {Math.round(processingState.overallProgress)}% complete
            </p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {files.map((file) => (
          <div key={file.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {file.status === 'completed' && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  {file.status === 'processing' && (
                    <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                  )}
                  {file.status === 'error' && (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  {file.status === 'pending' && (
                    <div className="h-5 w-5 bg-gray-300 rounded-full" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </p>

                  {!file.isCombined && (
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>
                        Original:{' '}
                        {typeof file.size === 'number' && file.size > 0
                          ? FileProcessor.formatFileSize(file.size)
                          : 'Unknown'}
                      </span>
                      {typeof file.compressedSize === 'number' &&
                        typeof file.size === 'number' &&
                        file.size > 0 && (
                          <>
                            <span>•</span>
                            <span>
                              Compressed: {FileProcessor.formatFileSize(file.compressedSize)}
                            </span>
                            <span>•</span>
                            <span className="text-green-600 font-medium">
                              {FileProcessor.calculateCompressionRatio(file.size, file.compressedSize)}% saved
                            </span>
                          </>
                        )}
                    </div>
                  )}
                </div>
              </div>

              {/* Only show download button if file is completed AND NOT combined */}
              {file.status === 'completed' && !file.isCombined && (
                <button
                  onClick={() => onDownload(file.id)}
                  className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </button>
              )}

            </div>

            {file.status === 'error' && file.error && (
              <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-700">
                {file.error}
              </div>
            )}

            {(file.status === 'processing' || file.status === 'completed') && (
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      file.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${file.progress ?? 0}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
