import { downloadElementAsPDF, PDFExportOptions } from './pdfExport';

/**
 * Reliable print and auto-PDF download helper utility for standard and iframe sandboxed environments.
 */

export async function downloadPDFDocument(
  elementId: string,
  documentTitle: string,
  options?: PDFExportOptions
): Promise<boolean> {
  return await downloadElementAsPDF(elementId, documentTitle, options);
}

export function safePrintDocument(elementId?: string, documentTitle?: string) {
  // Set page title temporarily if provided for print header
  const originalTitle = document.title;
  if (documentTitle) {
    document.title = documentTitle;
  }

  // Ensure window is focused (critical for iframe print triggers)
  window.focus();

  try {
    if (elementId) {
      const element = document.getElementById(elementId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    // Trigger browser native print dialog
    window.print();
  } catch (error) {
    console.error('Direct window.print() failed:', error);
  } finally {
    // Restore title after print dialog closes
    setTimeout(() => {
      document.title = originalTitle;
    }, 1200);
  }
}
