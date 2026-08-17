/**
 * Reliable print helper utility for standard and iframe sandboxed environments.
 */

export function safePrintDocument(elementId?: string, documentTitle?: string) {
  // Set page title temporarily if provided for print header
  const originalTitle = document.title;
  if (documentTitle) {
    document.title = documentTitle;
  }

  // Ensure window is focused (critical for iframe print triggers)
  window.focus();

  try {
    // If elementId is specified, we can also ensure print styles target it cleanly
    if (elementId) {
      const element = document.getElementById(elementId);
      if (element) {
        element.scrollIntoView();
      }
    }
    
    // Trigger browser print
    window.print();
  } catch (error) {
    console.error('Direct window.print() failed:', error);
    // Fallback: If in an iframe where direct print is blocked, open print window
    if (elementId) {
      fallbackPrintWindow(elementId, documentTitle || 'Print Document');
    }
  } finally {
    // Restore title after print dialog closes
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  }
}

function fallbackPrintWindow(elementId: string, title: string) {
  const element = document.getElementById(elementId);
  if (!element) return;

  const printWindow = window.open('', '_blank', 'width=850,height=900');
  if (!printWindow) {
    alert('Please allow popups to print this document.');
    return;
  }

  // Extract stylesheets
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((el) => el.outerHTML)
    .join('\n');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        ${styles}
        <style>
          body {
            background-color: white !important;
            color: black !important;
            padding: 20px !important;
            font-family: system-ui, -apple-system, sans-serif !important;
          }
          @page {
            size: auto;
            margin: 15mm;
          }
          .print\\:hidden, button {
            display: none !important;
          }
        </style>
      </head>
      <body>
        <div id="print-root">
          ${element.innerHTML}
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.focus();
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `);

  printWindow.document.close();
}
