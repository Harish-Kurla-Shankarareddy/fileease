import React, { useState } from 'react';
import { 
  FileImage, 
  Zap, 
  FileText, 
  ArrowRight,
  FileDown,
  Download,
  X,
  Settings,
  Upload
} from 'lucide-react';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { PrivacyNotice } from '../components/PrivacyNotice';
import { Helmet } from 'react-helmet';
import { FileItem, ConversionType, ProcessingState } from '../types';
import { FileProcessor } from '../utils/fileProcessor';
import { ConversionOptions } from '../components/ConversionOptions';

export const HomePage: React.FC = () => {
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
  const [isDragOver, setIsDragOver] = useState(false);

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
        case 'pdf-to-jpeg':
          processedBlob = await FileProcessor.convertPdfToImage(fileItem.file, 'jpeg', quality);
          filename = fileItem.name.replace(/\.pdf$/i, '.jpg');
          if (processedBlob.type === 'application/zip') {
            filename = fileItem.name.replace(/\.pdf$/i, '-converted.zip');
          }
          break;
        case 'pdf-to-png':
          processedBlob = await FileProcessor.convertPdfToImage(fileItem.file, 'png', quality);
          filename = fileItem.name.replace(/\.pdf$/i, '.png');
          if (processedBlob.type === 'application/zip') {
            filename = fileItem.name.replace(/\.pdf$/i, '-converted.zip');
          }
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
    const acceptedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    const validFiles = Array.from(files).filter(file => {
      const isValidType = acceptedTypes.includes(file.type);
      const isValidSize = file.size <= 50 * 1024 * 1024;
      return isValidType && isValidSize;
    });

    if (validFiles.length === 0) {
      alert('Please select valid JPEG, PNG, or PDF files (max 50MB each)');
      return;
    }

    const fileItems = await Promise.all(validFiles.map(createFileItem));
    const newSelectedFiles = [...files, ...fileItems];
    
    setFiles(newSelectedFiles);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
      e.target.value = '';
    }
  };

  const removeFile = (id: string) => {
    const newFiles = files.filter(f => f.id !== id);
    setFiles(newFiles);
  };

  const canProcess = files.length > 0 && files.every(f => f.status === 'pending');
  const hasResults = files.some(f => f.status === 'completed');

  const features = [
    {
      icon: FileImage,
      title: 'Image Conversion',
      description: 'Convert between JPEG and PNG formats with precision and speed.',
      features: ['JPEG ↔ PNG conversion', 'Batch processing', 'Quality preservation', 'Metadata retention'],
      gradient: 'from-blue-500 to-blue-700'
    },
    {
      icon: FileText,
      title: 'PDF Tools',
      description: 'Transform between PDF and image formats with professional results.',
      features: ['Image to PDF', 'PDF to Image (JPG/PNG)', 'Custom page options'],
      gradient: 'from-purple-500 to-purple-700'
    },
    {
      icon: Zap,
      title: 'File Optimization',
      description: 'Compress and optimize files without compromising quality.',
      features: ['Smart compression', 'Quality control', 'Size reduction', 'Lossless options'],
      gradient: 'from-green-500 to-green-700'
    },
    {
      icon: FileDown,
      title: 'PDF Extraction',
      description: 'Extract images from PDF files into usable formats.',
      features: ['PDF to JPG conversion', 'PDF to PNG conversion', 'Multi-page support', 'Quality settings'],
      gradient: 'from-orange-500 to-orange-700'
    }
  ];

  const ProcessingProgress = ({ files, processingState, onDownload, onDownloadAll }: any) => (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Processing Progress</h3>
      
      {processingState.isProcessing && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Overall Progress</span>
            <span>{Math.round(processingState.overallProgress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${processingState.overallProgress}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Processing file {processingState.currentFile} of {processingState.totalFiles}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {files.map((file: FileItem) => (
          <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  file.status === 'completed' ? 'bg-green-100 text-green-800' :
                  file.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                  file.status === 'error' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {file.status}
                </span>
                {file.compressedSize && file.originalSize && (
                  <span className="text-xs text-gray-500">
                    {FileProcessor.calculateCompressionRatio(file.originalSize, file.compressedSize)}% smaller
                  </span>
                )}
              </div>
            </div>
            
            {file.status === 'completed' && file.downloadUrl && (
              <button
                onClick={() => onDownload(file.id)}
                className="ml-2 px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {hasResults && files.length > 1 && (
        <button
          onClick={onDownloadAll}
          className="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
        >
          <Download className="h-4 w-4 mr-2" />
          Download All Files
        </button>
      )}
    </div>
  );

  const FileUploadSection = () => (
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
          accept="image/jpeg,image/png,application/pdf"
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

      {files.length > 0 && (
        <div className="mt-6">
          <h4 className="text-lg font-semibold mb-4">
            Selected Files ({files.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map((fileItem) => (
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
                    {fileItem.preview ? (
                      <img 
                        src={fileItem.preview} 
                        alt={fileItem.name}
                        className="w-12 h-12 object-cover rounded"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : fileItem.type.startsWith('image/') ? (
                      <FileImage className="h-12 w-12 text-gray-400" />
                    ) : (
                      <FileText className="h-12 w-12 text-blue-400" />
                    )}
                    <div className="absolute -bottom-1 -right-1 bg-gray-800 text-white text-xs px-1 py-0.5 rounded">
                      {fileItem.type.startsWith('image/') 
                        ? fileItem.type.split('/')[1].toUpperCase()
                        : 'PDF'
                      }
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate" title={fileItem.name}>
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

  return (
    <>
      <Helmet>
        {/* Primary Meta Tags */}
        <title>FileEase | Free Online Image & PDF Converter (Fast & Secure)</title>
        <meta
          name="description"
          content="Free online file converter – convert JPG to PNG, PNG to JPG, PDF to JPG, PDF to PNG, and images to PDF instantly. No signup required. Fast, secure, and works right in your browser with advanced compression options."
        />
        <meta
          name="keywords"
          content="free jpg to png converter, png to jpg online, image to pdf converter, pdf to jpg converter, pdf to png converter, compress images online, file optimization tool, fast file converter, FileEase"
        />
        <meta name="author" content="FileEase Team" />
        <meta name="robots" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="canonical" href="https://fileease-iota.vercel.app/" />

        {/* FAQ Schema */}
        <script type="application/ld+json">
          {`
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "Is FileEase free to use?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes, FileEase is completely free for converting images and PDFs. No signup or installation required."
                }
              },
              {
                "@type": "Question",
                "name": "Is FileEase safe and secure?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes, all file conversions are processed securely in your browser. Your files are never stored on our servers."
                }
              },
              {
                "@type": "Question",
                "name": "What file types does FileEase support?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "FileEase supports JPG, PNG, and PDF conversions with built-in compression and optimization."
                }
              }
            ]
          }
          `}
        </script>
        <script type="application/ld+json">
          {`
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "FileEase",
            "url": "https://fileease-iota.vercel.app",
            "description": "Free online tool for JPG ↔ PNG conversion, PDF to JPG/PNG, image to PDF, and file compression. Fast, secure, no signup required.",
            "applicationCategory": "UtilityApplication",
            "operatingSystem": "All",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            }
          }
          `}
        </script>
      </Helmet>

      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-8">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
                Convert & Optimize with
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  FileEase
                </span>
              </h1>
              
              <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
                Free online file converter – instantly convert JPG to PNG, PNG to JPG, PDF to JPG, PDF to PNG, and images to PDF. Fast, secure, no signup required.
              </p>
            </div>

            {/* File Upload Section */}
            <div className="mb-12">
              <FileUploadSection />
            </div>

            {/* Conversion Options */}
            {files.length > 0 && (
              <div className="mb-8">
                <ConversionOptions
                  conversionType={conversionType}
                  quality={quality}
                  onQualityChange={setQuality}
                  onConversionTypeChange={setConversionType}
                />
              </div>
            )}

            {/* PDF Options */}
            {(conversionType === 'jpeg-to-pdf' || conversionType === 'png-to-pdf') && files.length > 0 && (
              <div className="mb-6 space-y-3">
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

            {/* Process Button */}
            {files.length > 0 && (
              <div className="text-center mb-8">
                <button
                  onClick={startProcessing}
                  disabled={!canProcess || processingState.isProcessing}
                  className={`px-8 py-4 rounded-lg text-white text-lg font-semibold ${
                    canProcess && !processingState.isProcessing
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  {processingState.isProcessing ? 'Processing...' : 'Start Processing'}
                </button>
              </div>
            )}

            {/* Progress Section */}
            {files.length > 0 && (
              <ProcessingProgress
                files={files}
                processingState={processingState}
                onDownload={handleDownload}
                onDownloadAll={downloadAllFiles}
              />
            )}
          </div>
          
          {/* Background decoration */}
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 transform translate-x-1/2 translate-y-1/2 w-96 h-96 bg-gradient-to-r from-green-400/20 to-blue-400/20 rounded-full blur-3xl" />
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Why Choose FileEase?
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Professional file conversion tools that work directly in your browser - no uploads, no waiting, no compromises on quality.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300"
                >
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-r ${feature.gradient} mb-4`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 mb-4">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.features.map((feat, idx) => (
                      <li key={idx} className="flex items-center text-sm text-gray-600">
                        <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${feature.gradient} mr-3`} />
                        {feat}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <PrivacyNotice />

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Ready to Convert Your Files?
            </h2>
            <p className="text-xl text-white text-opacity-90 mb-8">
              Drag and drop your files above to get started instantly.
            </p>
          </div>
        </section>
      </div>
    </>
  );
};