export interface FileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  originalSize?: number;
  compressedSize?: number;
  preview?: string;
  downloadUrl?: string;
  error?: string;
}

export interface ConversionOptions {
  format: 'jpeg' | 'png' | 'pdf';
  quality: number;
  optimize: boolean;
}

export type ConversionType = 
  | 'jpeg-to-png'
  | 'png-to-jpeg'
  | 'jpeg-to-pdf'
  | 'png-to-pdf'
  | 'optimize-jpeg'
  | 'optimize-png'
  | 'optimize-pdf';

export interface ProcessingState {
  isProcessing: boolean;
  currentFile: number;
  totalFiles: number;
  overallProgress: number;
}