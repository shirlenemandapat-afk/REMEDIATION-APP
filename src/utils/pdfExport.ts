import html2pdf from 'html2pdf.js';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PDFExportOptions {
  filename?: string;
  format?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
  margin?: number | [number, number, number, number];
  quality?: number;
}

/**
 * Automatically downloads a PDF copy of an element directly to the user's computer.
 */
export async function downloadElementAsPDF(
  elementId: string,
  filename: string,
  options?: PDFExportOptions
): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id "${elementId}" not found for PDF export.`);
    return false;
  }

  // Ensure clean filename ending in .pdf
  const sanitizedFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  const format = options?.format || 'a4';
  const orientation = options?.orientation || 'portrait';
  const margin: number | [number, number, number, number] = options?.margin !== undefined ? options?.margin : [10, 10, 10, 10]; // 10mm margins

  try {
    // Primary approach: html2pdf.js with optimal rendering settings
    const opt: any = {
      margin: margin,
      filename: sanitizedFilename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        letterRendering: true,
        backgroundColor: '#ffffff',
        windowWidth: 1024,
      },
      jsPDF: {
        unit: 'mm',
        format: format,
        orientation: orientation,
      },
      pagebreak: {
        mode: ['avoid-all', 'css', 'legacy'],
        avoid: ['tr', '.no-break', '.signature-block', '.parent-slip'],
      },
    };

    await html2pdf().set(opt).from(element).save();
    return true;
  } catch (primaryErr) {
    console.warn('html2pdf primary failed, attempting html2canvas + jsPDF fallback...', primaryErr);

    try {
      // Fallback approach using direct html2canvas + jsPDF
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: format,
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const marginMm = 10;
      const contentWidth = pdfWidth - marginMm * 2;
      const contentHeight = (canvas.height * contentWidth) / canvas.width;

      let heightLeft = contentHeight;
      let position = marginMm;

      // First page
      pdf.addImage(imgData, 'JPEG', marginMm, position, contentWidth, contentHeight);
      heightLeft -= (pdfHeight - marginMm * 2);

      // Subsequent pages if long document
      while (heightLeft > 0) {
        position = heightLeft - contentHeight + marginMm;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', marginMm, position, contentWidth, contentHeight);
        heightLeft -= (pdfHeight - marginMm * 2);
      }

      pdf.save(sanitizedFilename);
      return true;
    } catch (fallbackErr) {
      console.error('All PDF download methods failed:', fallbackErr);
      return false;
    }
  }
}
