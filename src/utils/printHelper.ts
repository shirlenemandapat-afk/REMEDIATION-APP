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

/**
 * Executes a reliable print dialog for an element.
 * Strategy 1: Pop open a dedicated clean print window with styles and auto-print (works in iframes & sandboxes).
 * Strategy 2: Fallback to direct window.print().
 */
export function safePrintDocument(
  elementId?: string,
  documentTitle?: string,
  options?: { pageSize?: string; pageMargin?: string }
): boolean {
  const docTitle = documentTitle || 'DepEd RMCHS Official Document';
  const originalTitle = document.title;
  if (documentTitle) {
    document.title = documentTitle;
  }

  const pageSize = options?.pageSize || '8.5in 13in';
  const pageMargin = options?.pageMargin || '1in';

  const targetEl = elementId ? document.getElementById(elementId) : null;

  if (!targetEl) {
    try {
      window.focus();
      window.print();
      return true;
    } catch (e) {
      console.error('Direct window.print() failed:', e);
      return false;
    }
  }

  // Collect all styles and stylesheets from the main document
  let stylesHtml = '';
  const styleTags = document.querySelectorAll('style, link[rel="stylesheet"]');
  styleTags.forEach((tag) => {
    stylesHtml += tag.outerHTML;
  });

  const printHtmlContent = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${docTitle}</title>
        ${stylesHtml}
        <style>
          @page {
            size: ${pageSize};
            margin: ${pageMargin};
          }
          html, body {
            background-color: #ffffff !important;
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-toolbar {
            position: sticky;
            top: 0;
            left: 0;
            right: 0;
            background: #064e3b;
            color: #ffffff;
            padding: 12px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            z-index: 99999;
          }
          .print-btn {
            background: #f59e0b;
            color: #022c22;
            font-weight: 800;
            padding: 8px 18px;
            border-radius: 8px;
            border: none;
            cursor: pointer;
            font-size: 14px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.15);
          }
          .print-btn:hover {
            background: #fbbf24;
          }
          .close-btn {
            background: rgba(255,255,255,0.15);
            color: #ffffff;
            padding: 8px 14px;
            border-radius: 8px;
            border: 1px solid rgba(255,255,255,0.25);
            cursor: pointer;
            font-size: 13px;
          }
          .close-btn:hover {
            background: rgba(255,255,255,0.25);
          }
          .doc-wrap {
            max-width: 820px;
            margin: 20px auto;
            background: #ffffff;
            padding: 24px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            border-radius: 12px;
          }
          @media print {
            .print-toolbar {
              display: none !important;
            }
            .doc-wrap {
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              box-shadow: none !important;
              border-radius: 0 !important;
            }
            .print\\:hidden, [data-no-print] {
              display: none !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-toolbar">
          <div style="font-weight: bold; font-size: 14px; display: flex; align-items: center; gap: 8px;">
            <span>📄 ${docTitle}</span>
          </div>
          <div style="display: flex; gap: 10px; align-items: center;">
            <button class="print-btn" onclick="window.print()">🖨️ Click to Print / Save PDF</button>
            <button class="close-btn" onclick="window.close()">Close Window</button>
          </div>
        </div>
        <div class="doc-wrap">
          ${targetEl.outerHTML}
        </div>
        <script>
          // Automatically trigger print dialog when fully loaded
          window.addEventListener('load', function() {
            setTimeout(function() {
              window.focus();
              try {
                window.print();
              } catch(e) {
                console.error(e);
              }
            }, 400);
          });
        </script>
      </body>
    </html>
  `;

  // Try opening dedicated print window
  try {
    const printWindow = window.open('', '_blank', 'width=900,height=800,menubar=no,toolbar=no,location=no,status=no');
    if (printWindow && !printWindow.closed) {
      printWindow.document.open();
      printWindow.document.write(printHtmlContent);
      printWindow.document.close();
      return true;
    }
  } catch (winErr) {
    console.warn('window.open was blocked or restricted:', winErr);
  }

  // Fallback: Create a blob URL and open or print in current window
  try {
    const blob = new Blob([printHtmlContent], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const popup = window.open(blobUrl, '_blank');
    if (popup) {
      setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);
      return true;
    }
  } catch (blobErr) {
    console.warn('Blob print fallback error:', blobErr);
  }

  // Fallback: Main window print
  try {
    window.focus();
    window.print();
    return true;
  } catch (directErr) {
    console.error('All direct print methods failed:', directErr);
    return false;
  } finally {
    setTimeout(() => {
      document.title = originalTitle;
    }, 1500);
  }
}

