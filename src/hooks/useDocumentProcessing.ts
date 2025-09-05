import { useState, useCallback } from 'react';
import Tesseract from 'tesseract.js';
import { pdfjs } from 'react-pdf';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface ProcessingResult {
  text: string;
  filename: string;
  success: boolean;
  error?: string;
}

export const useDocumentProcessing = () => {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const processPDF = useCallback(async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item) => ('str' in item ? item.str : ''))
          .join(' ');
        fullText += pageText + '\n';
      }

      return fullText;
    } catch (error) {
      console.error('Error processing PDF:', error);
      throw new Error('Failed to process PDF');
    }
  }, []);

  const processImage = useCallback(async (file: File): Promise<string> => {
    try {
      const result = await Tesseract.recognize(file, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(m.progress * 100);
          }
        },
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz .,;:!?()[]{}"/\\-+=%@#$^&*',
        preserve_interword_spaces: '1',
      });

      let extractedText = result.data.text;
      
      // If very little text was extracted, add image description context
      if (extractedText.trim().length < 20) {
        extractedText += `\n\n[IMAGE ANALYSIS]: This appears to be a medical/hospital-related image with limited extractable text. 
Image filename: ${file.name}
File type: ${file.type}
File size: ${(file.size / 1024 / 1024).toFixed(2)} MB
Note: This may be a medical photograph, chart, equipment display, or document that requires visual analysis rather than text extraction.`;
      }

      return extractedText;
    } catch (error) {
      console.error('Error processing image:', error);
      throw new Error('Failed to process image');
    }
  }, []);

  const processVideo = useCallback(async (file: File): Promise<string> => {
    // For video processing, we'll extract frames and process the first few
    // This is a simplified version - in production you'd want more sophisticated frame extraction
    try {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      return new Promise((resolve, reject) => {
        video.onloadeddata = async () => {
          try {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            // Extract frame at 1 second
            video.currentTime = 1;
            
            video.onseeked = async () => {
              ctx?.drawImage(video, 0, 0);
              canvas.toBlob(async (blob) => {
                if (blob) {
                  const imageFile = new File([blob], 'frame.jpg', { type: 'image/jpeg' });
                  try {
                    const text = await processImage(imageFile);
                    resolve(text);
                  } catch (error) {
                    reject(error);
                  }
                } else {
                  reject(new Error('Failed to extract frame'));
                }
              }, 'image/jpeg');
            };
          } catch (error) {
            reject(error);
          }
        };

        video.onerror = () => reject(new Error('Failed to load video'));
        video.src = URL.createObjectURL(file);
      });
    } catch (error) {
      console.error('Error processing video:', error);
      throw new Error('Failed to process video');
    }
  }, [processImage]);

  const enhanceImage = useCallback(async (file: File): Promise<File> => {
    // Enhanced image processing for better OCR results, especially for medical documents
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      return new Promise((resolve, reject) => {
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          
          if (!ctx) {
            reject(new Error('Canvas context not available'));
            return;
          }

          // Draw original image
          ctx.drawImage(img, 0, 0);

          // Apply medical document optimized enhancement
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          for (let i = 0; i < data.length; i += 4) {
            // Convert to grayscale for better OCR
            const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            
            // Apply contrast enhancement and sharpening for medical text
            const enhanced = gray < 128 ? Math.max(0, gray - 20) : Math.min(255, gray + 30);
            
            data[i] = enhanced;     // Red
            data[i + 1] = enhanced; // Green
            data[i + 2] = enhanced; // Blue
            // Alpha channel (data[i + 3]) remains unchanged
          }

          ctx.putImageData(imageData, 0, 0);

          canvas.toBlob((blob) => {
            if (blob) {
              const enhancedFile = new File([blob], file.name, { type: file.type });
              resolve(enhancedFile);
            } else {
              reject(new Error('Failed to enhance image'));
            }
          }, file.type);
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = URL.createObjectURL(file);
      });
    } catch (error) {
      console.error('Error enhancing image:', error);
      throw error;
    }
  }, []);

  const processFile = useCallback(async (file: File): Promise<ProcessingResult> => {
    setProcessing(true);
    setProgress(0);

    try {
      let text = '';
      
      if (file.type.includes('pdf')) {
        text = await processPDF(file);
      } else if (file.type.includes('image')) {
        // Enhance image first for better OCR results
        const enhancedFile = await enhanceImage(file);
        text = await processImage(enhancedFile);
      } else if (file.type.includes('video')) {
        text = await processVideo(file);
      } else {
        throw new Error('Unsupported file type');
      }

      setProgress(100);
      return {
        text,
        filename: file.name,
        success: true,
      };
    } catch (error) {
      return {
        text: '',
        filename: file.name,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  }, [processPDF, processImage, processVideo, enhanceImage]);

  return {
    processFile,
    processing,
    progress,
  };
};