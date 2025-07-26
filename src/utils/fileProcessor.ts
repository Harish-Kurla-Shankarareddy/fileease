import jsPDF from 'jspdf';
import { FileItem, ConversionOptions } from '../types';

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

  static async generatePreview(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => reject(new Error('Failed to generate preview'));
        reader.readAsDataURL(file);
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
