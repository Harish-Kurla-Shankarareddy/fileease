import React, { useState } from 'react';
import { ArrowLeft, Download } from 'lucide-react';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { FileUpload } from '../components/FileUpload';
import { ConversionOptions } from '../components/ConversionOptions';
import { ProcessingProgress } from '../components/ProcessingProgress';
import { FileItem, ConversionType, ProcessingState } from '../types';
import { FileProcessor } from '../utils/fileProcessor';

interface ConverterPageProps {
  onNavigateHome: () => void;
}

export const ConverterPage: React.FC<ConverterPageProps> = ({ onNavigateHome }) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [conversionType, setConversionType] = useState<ConversionType>('jpeg-to-png');
  const [quality, setQuality] = useState(0.9);
  const [combineToSinglePdf, setCombineToSinglePdf] = useState(false);
  const [pdfPageSize, setPdfPageSize] = useState<'a4' | 'letter'>('a4');
  const [pdfOrientation, setPdfOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [pdfMargin, setPdfMargin] = useState<number>(10);
  const [processingState, setProcessingState] = useState<ProcessingState>({
    isProcessing: false,
    currentFile: 0,
    totalFiles: 0,
    overallProgress: 0,
  });

  const processFile = async (fileItem: FileItem): Promise<FileItem> => {
    try {
      let processedBlob: Blob;
      let filename: string;

      switch (conversionType) {
        case 'jpeg-to-png':
          processedBlob = await FileProcessor.convertImage(fileItem.file, 'png', quality);
          filename = fileItem.name.replace(/\.(jpg|jpeg)$/i, '.png');
          break;
        case 'png-to-jpeg':
          processedBlob = await FileProcessor.convertImage(fileItem.file, 'jpeg', quality);
          filename = fileItem.name.replace(/\.png$/i, '.jpg');
          break;
        case 'jpeg-to-pdf':
        case 'png-to-pdf':
          processedBlob = await FileProcessor.imageToPdf(fileItem.file);
          filename = fileItem.name.replace(/\.(jpg|jpeg|png)$/i, '.pdf');
          break;
        case 'optimize-jpeg':
        case 'optimize-png':
          processedBlob = await FileProcessor.optimizeImage(fileItem.file, quality);
          filename = fileItem.name;
          break;
        default:
          throw new Error('Unsupported conversion type');
      }

      const downloadUrl = URL.createObjectURL(processedBlob);

      return {
        ...fileItem,
        status: 'completed',
        progress: 100,
        compressedSize: processedBlob.size,
        downloadUrl,
        name: filename,
      };
    } catch (error) {
      return {
        ...fileItem,
        status: 'error',
        error: error instanceof Error ? error.message : 'Processing failed',
      };
    }
  };

  const startProcessing = async () => {
    if (files.length === 0) return;

    setProcessingState({
      isProcessing: true,
      currentFile: 0,
      totalFiles: files.length,
      overallProgress: 0,
    });

    if ((conversionType === 'jpeg-to-pdf' || conversionType === 'png-to-pdf') && combineToSinglePdf) {
      try {
        const allFiles = files.map(f => f.file);
        const mergedPdfBlob = await FileProcessor.combineImagesToSinglePdf(
          allFiles,
          pdfPageSize,
          pdfMargin,
          pdfOrientation
        );

        const downloadUrl = URL.createObjectURL(mergedPdfBlob);

        const resultFile: FileItem = {
          id: 'combined-pdf',
          file: new File([mergedPdfBlob], 'combined.pdf', { type: 'application/pdf' }),
          name: 'combined.pdf',
          status: 'completed',
          progress: 100,
          compressedSize: mergedPdfBlob.size,
          downloadUrl,
        };

        setFiles([resultFile]);
        setProcessingState({
          isProcessing: false,
          currentFile: 0,
          totalFiles: 0,
          overallProgress: 100,
        });
      } catch (error) {
        setFiles(files.map(f => ({ ...f, status: 'error', error: 'Failed to combine PDF' })));
        setProcessingState(prev => ({ ...prev, isProcessing: false }));
      }
      return;
    }

    const processedFiles: FileItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      setProcessingState(prev => ({
        ...prev,
        currentFile: i + 1,
        overallProgress: (i / files.length) * 100,
      }));

      setFiles(prev => prev.map(f =>
        f.id === file.id ? { ...f, status: 'processing', progress: 50 } : f
      ));

      const processedFile = await processFile(file);
      processedFiles.push(processedFile);

      setFiles(prev => prev.map(f =>
        f.id === file.id ? processedFile : f
      ));

      await new Promise(resolve => setTimeout(resolve, 300));
    }

    setProcessingState({
      isProcessing: false,
      currentFile: 0,
      totalFiles: 0,
      overallProgress: 100,
    });
  };

  const clearFiles = () => {
    files.forEach(file => {
      if (file.downloadUrl) URL.revokeObjectURL(file.downloadUrl);
    });
    setFiles([]);
    setCombineToSinglePdf(false);
    setProcessingState({
      isProcessing: false,
      currentFile: 0,
      totalFiles: 0,
      overallProgress: 0,
    });
  };

  const handleDownload = (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (file?.downloadUrl) {
      const link = document.createElement('a');
      link.href = file.downloadUrl;
      link.download = file.name;
      link.click();
    }
  };

  const downloadAllFiles = async () => {
    const completedFiles = files.filter(f => f.status === 'completed' && f.downloadUrl);
    if (completedFiles.length === 1) {
      handleDownload(completedFiles[0].id);
      return;
    }

    const zip = new JSZip();
    for (const file of completedFiles) {
      const response = await fetch(file.downloadUrl!);
      const blob = await response.blob();
      zip.file(file.name, blob);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, 'converted-files.zip');
  };

  const canProcess = files.length > 0 && files.every(f => f.status === 'pending');
  const hasResults = files.some(f => f.status === 'completed');

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onNavigateHome}
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Home
            </button>

            <h1 className="text-2xl font-bold text-gray-900">FileEase Converter</h1>

            <div className="flex items-center space-x-3">
              {hasResults && (
                <button
                  onClick={downloadAllFiles}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download All
                </button>
              )}
              {files.length > 0 && (
                <button
                  onClick={clearFiles}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col gap-8">
          <FileUpload onFilesSelected={setFiles} />

          {files.length > 0 && (
            <ConversionOptions
              conversionType={conversionType}
              quality={quality}
              onQualityChange={setQuality}
              onConversionTypeChange={setConversionType}
            />
          )}

          {(conversionType === 'jpeg-to-pdf' || conversionType === 'png-to-pdf') && files.length > 0 && (
            <div className="mb-4 space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="combineToSinglePdf"
                  checked={combineToSinglePdf}
                  onChange={() => setCombineToSinglePdf(!combineToSinglePdf)}
                  className="form-checkbox h-4 w-4 text-blue-600"
                />
                <label htmlFor="combineToSinglePdf" className="text-gray-700 text-sm">
                  Combine all images into one PDF
                </label>
              </div>

              {combineToSinglePdf && (
                <div className="flex flex-wrap gap-4 items-center">
                  <label className="text-gray-700 text-sm flex items-center space-x-2">
                    <span>Page Size:</span>
                    <select
                      value={pdfPageSize}
                      onChange={e => setPdfPageSize(e.target.value as 'a4' | 'letter')}
                      className="form-select border rounded px-2 py-1 text-sm"
                    >
                      <option value="a4">A4</option>
                      <option value="letter">Letter</option>
                    </select>
                  </label>

                  <label className="text-gray-700 text-sm flex items-center space-x-2">
                    <span>Orientation:</span>
                    <select
                      value={pdfOrientation}
                      onChange={e => setPdfOrientation(e.target.value as 'portrait' | 'landscape')}
                      className="form-select border rounded px-2 py-1 text-sm"
                    >
                      <option value="portrait">Portrait</option>
                      <option value="landscape">Landscape</option>
                    </select>
                  </label>

                  <label className="text-gray-700 text-sm flex items-center space-x-2">
                    <span>Margin (mm):</span>
                    <input
                      type="number"
                      min={0}
                      max={50}
                      step={1}
                      value={pdfMargin}
                      onChange={e => setPdfMargin(Number(e.target.value))}
                      className="form-input border rounded px-2 py-1 text-sm w-16"
                    />
                  </label>
                </div>
              )}
            </div>
          )}

          {files.length > 0 && (
            <>
              <button
                onClick={startProcessing}
                disabled={!canProcess || processingState.isProcessing}
                className={`px-6 py-3 rounded-lg text-white ${
                  canProcess && !processingState.isProcessing
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                {processingState.isProcessing ? 'Processing...' : 'Start Processing'}
              </button>

              <ProcessingProgress
                files={files}
                processingState={processingState}
                onDownload={handleDownload}
                onDownloadAll={downloadAllFiles}
              />
            </>
          )}
        </div>
      </main>
    </div>
  );
};
