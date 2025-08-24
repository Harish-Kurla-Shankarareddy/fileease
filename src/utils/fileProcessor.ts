import jsPDF from 'jspdf';
import * as pdfjs from 'pdfjs-dist';
import JSZip from 'jszip';
import { FileItem, ConversionOptions } from '../types';


// Dynamic import to handle worker setup correctly
const initializePdfJs = async () => {
  try {
    // Try to use the built-in worker first
    const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.min.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker.default;
  } catch (error) {
    console.warn('PDF.js worker not available, falling back to main thread');
    // If worker fails to load, operations will run in main thread
  }
};

// Initialize PDF.js
initializePdfJs().catch(console.error);

export class FileProcessor {
  static async convertImage(
    file: File,
    targetFormat: 'jpeg' | 'png',
    quality: number = 0.9
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;

        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        if (targetFormat === 'jpeg') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(img, 0, 0);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Conversion failed'));
            }
          },
          `image/${targetFormat}`,
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  static async imageToPdf(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        const pdf = new jsPDF();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgAspectRatio = img.width / img.height;
        const pdfAspectRatio = pdfWidth / pdfHeight;

        let imgWidth, imgHeight;

        if (imgAspectRatio > pdfAspectRatio) {
          imgWidth = pdfWidth;
          imgHeight = pdfWidth / imgAspectRatio;
        } else {
          imgHeight = pdfHeight;
          imgWidth = pdfHeight * imgAspectRatio;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);

        const pdfBlob = pdf.output('blob');
        resolve(pdfBlob);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  static async combineImagesToSinglePdf(
    files: File[],
    pageSize: 'a4' | 'letter' = 'a4',
    margin: number = 10,
    orientation: 'portrait' | 'landscape' = 'portrait'
  ): Promise<Blob> {
    // Sort files alphabetically by name for consistent ordering
    const sortedFiles = files.slice().sort((a, b) => a.name.localeCompare(b.name));

    const pdf = new jsPDF({ format: pageSize, orientation });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    let isFirstPage = true;

    for (const file of sortedFiles) {
      // Load image asynchronously
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Failed to load image: ' + file.name));
        image.src = URL.createObjectURL(file);
      });

      // Create canvas to get image data
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Detect image type for proper PDF embedding (handle transparency for PNG)
      const isPng = file.type === 'image/png';
      const imgData = canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', 0.95);

      // Calculate content area size (subtract margins and space for caption)
      const captionHeight = 10; // space for filename caption (in mm)
      const contentWidth = pageWidth - 2 * margin;
      const contentHeight = pageHeight - 2 * margin - captionHeight;

      // Calculate image display size keeping aspect ratio within content area
      const imgAspectRatio = img.width / img.height;
      const contentAspectRatio = contentWidth / contentHeight;

      let displayWidth, displayHeight;
      if (imgAspectRatio > contentAspectRatio) {
        displayWidth = contentWidth;
        displayHeight = contentWidth / imgAspectRatio;
      } else {
        displayHeight = contentHeight;
        displayWidth = contentHeight * imgAspectRatio;
      }

      // Center the image horizontally, and position below caption vertically
      const x = (pageWidth - displayWidth) / 2;
      const y = margin + captionHeight; // push image below caption

      // Add new page if not the first image
      if (!isFirstPage) pdf.addPage();
      isFirstPage = false;

      // Add filename caption at top-left within margin
      pdf.setFontSize(12);
      pdf.setTextColor(40, 40, 40); // dark grey
      pdf.text(file.name, margin, margin + 7); // small vertical offset for better positioning

      // Add the image below the caption
      pdf.addImage(imgData, isPng ? 'PNG' : 'JPEG', x, y, displayWidth, displayHeight);
    }

    // Return the generated PDF as a Blob
    return pdf.output('blob');
  }

  static async optimizeImage(file: File, quality: number = 0.8): Promise<Blob> {
    const format = file.type.includes('png') ? 'png' : 'jpeg';
    return this.convertImage(file, format, quality);
  }

  // PDF to Image conversion (for both JPEG and PNG)
  static async convertPdfToImage(pdfFile: File, format: 'jpeg' | 'png', quality: number = 0.9): Promise<Blob> {
    return new Promise(async (resolve, reject) => {
      try {
        const pdfData = await pdfFile.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: pdfData }).promise;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }
        
        // Process each page
        const imageBlobs: Blob[] = [];
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 2.0 });
          
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          
          await page.render({
            canvasContext: ctx,
            viewport: viewport
          }).promise;
          
          // Convert canvas to blob
          const blob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(
              blob => {
                if (blob) {
                  resolve(blob);
                } else {
                  reject(new Error('Failed to convert canvas to blob'));
                }
              },
              format === 'jpeg' ? 'image/jpeg' : 'image/png',
              quality
            );
          });
          
          imageBlobs.push(blob);
        }
        
        // If there's only one page, return that image
        if (imageBlobs.length === 1) {
          resolve(imageBlobs[0]);
        } else {
          // For multi-page PDFs, create a zip file with all images
          const zip = new JSZip();
          imageBlobs.forEach((blob, index) => {
            zip.file(`page-${index + 1}.${format}`, blob);
          });
          
          const zipBlob = await zip.generateAsync({ type: 'blob' });
          resolve(zipBlob);
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  // PDF to Word conversion
  static async convertPdfToWord(pdfFile: File): Promise<Blob> {
    try {
      // Extract text from PDF
      const pdfData = await pdfFile.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: pdfData }).promise;
      let textContent = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const text = await page.getTextContent();
        textContent += text.items.map((item: any) => item.str).join(' ') + '\n\n';
      }
      
      // Create a simple Word document (DOCX) using a template
      // Note: This creates a basic document with just text
      // For more advanced features, consider using a library like docx.js
      
      // Create a simple HTML document that can be opened as a Word document
      const htmlContent = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" 
              xmlns:w="urn:schemas-microsoft-com:office:word" 
              xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          <title>${pdfFile.name.replace('.pdf', '')}</title>
          <style>
            body { font-family: Arial, sans-serif; font-size: 12pt; }
            p { margin: 0 0 12pt; }
          </style>
        </head>
        <body>
          <div>${textContent.replace(/\n/g, '</div><div>')}</div>
        </body>
        </html>
      `;
      
      // Create a Blob with the HTML content that can be opened in Word
      const blob = new Blob([htmlContent], { 
        type: 'application/msword' 
      });
      
      return blob;
    } catch (error) {
      throw new Error('Failed to convert PDF to Word: ' + error);
    }
  }

  static async generatePreview(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => reject(new Error('Failed to generate preview'));
        reader.readAsDataURL(file);
      } else if (file.type === 'application/pdf') {
        // Generate preview for PDF files
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const pdfData = new Uint8Array(e.target?.result as ArrayBuffer);
            const pdf = await pdfjs.getDocument({ data: pdfData }).promise;
            const page = await pdf.getPage(1);
            const viewport = page.getViewport({ scale: 1.0 });
            
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            
            await page.render({
              canvasContext: ctx!,
              viewport: viewport
            }).promise;
            
            resolve(canvas.toDataURL('image/jpeg', 0.7));
          } catch (error) {
            // Fallback to generic PDF icon if preview generation fails
            resolve('');
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        resolve('');
      }
    });
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  static calculateCompressionRatio(original: number, compressed: number): number {
    return Math.round(((original - compressed) / original) * 100);
  }
}