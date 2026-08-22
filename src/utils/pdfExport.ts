import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';
import html2canvas from 'html2canvas';

export interface PDFExportOptions {
  filename?: string;
  format?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
  margin?: number | [number, number, number, number];
  quality?: number;
}

/**
 * Utility to convert OKLCH color strings to RGB if fallback html2canvas is invoked.
 */
function sanitizeOklchColors(element: HTMLElement) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const allElements = [element, ...Array.from(element.querySelectorAll('*'))] as HTMLElement[];
  const colorProps = [
    'color',
    'backgroundColor',
    'borderColor',
    'borderTopColor',
    'borderBottomColor',
    'borderLeftColor',
    'borderRightColor',
    'outlineColor',
  ];

  for (const el of allElements) {
    if (!el.style) continue;
    const computed = window.getComputedStyle(el);
    for (const prop of colorProps) {
      const val = computed.getPropertyValue(prop.replace(/([A-Z])/g, '-$1').toLowerCase());
      if (val && val.includes('oklch')) {
        try {
          ctx.fillStyle = val;
          (el.style as any)[prop] = ctx.fillStyle;
        } catch {
          // Fallback if conversion fails
          (el.style as any)[prop] = '#000000';
        }
      }
    }
  }
}

/**
 * Helper to paginate an image into multi-page jsPDF instance.
 */
async function generateMultiPagePDF(
  imgDataUrl: string,
  imgWidth: number,
  imgHeight: number,
  options?: PDFExportOptions
): Promise<jsPDF> {
  const format = options?.format || 'a4';
  const orientation = options?.orientation || 'portrait';
  const marginMm = typeof options?.margin === 'number' ? options?.margin : 8; // 8mm margin

  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format,
    compress: true,
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  const printableWidth = pdfWidth - marginMm * 2;
  const printableHeight = pdfHeight - marginMm * 2;

  const totalHeightInPdf = (imgHeight * printableWidth) / imgWidth;

  // Single page document
  if (totalHeightInPdf <= printableHeight) {
    pdf.addImage(
      imgDataUrl,
      'PNG',
      marginMm,
      marginMm,
      printableWidth,
      totalHeightInPdf,
      undefined,
      'FAST'
    );
    return pdf;
  }

  // Multi-page slicing
  const pageSliceHeightInSource = (imgWidth * printableHeight) / printableWidth;
  const totalPages = Math.ceil(imgHeight / pageSliceHeightInSource);

  // Load image into HTMLImageElement for canvas slicing
  const img = new Image();
  img.crossOrigin = 'anonymous';
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to load rendered image into memory for slicing'));
    img.src = imgDataUrl;
  });

  for (let page = 0; page < totalPages; page++) {
    if (page > 0) {
      pdf.addPage();
    }

    const sourceY = page * pageSliceHeightInSource;
    const sourceHeight = Math.min(pageSliceHeightInSource, imgHeight - sourceY);

    const sliceCanvas = document.createElement('canvas');
    sliceCanvas.width = imgWidth;
    sliceCanvas.height = sourceHeight;

    const sliceCtx = sliceCanvas.getContext('2d');
    if (sliceCtx) {
      sliceCtx.fillStyle = '#ffffff';
      sliceCtx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
      sliceCtx.drawImage(
        img,
        0,
        sourceY,
        imgWidth,
        sourceHeight,
        0,
        0,
        sliceCanvas.width,
        sourceHeight
      );
    }

    const sliceDataUrl = sliceCanvas.toDataURL('image/jpeg', 0.95);
    const sliceHeightInPdf = (sourceHeight * printableWidth) / imgWidth;

    pdf.addImage(
      sliceDataUrl,
      'JPEG',
      marginMm,
      marginMm,
      printableWidth,
      sliceHeightInPdf,
      undefined,
      'FAST'
    );
  }

  return pdf;
}

/**
 * Robust, client-side PDF download utility.
 * Uses native browser-rendered html-to-image (fully compatible with Tailwind v4 OKLCH colors),
 * with resilient fallback to html2canvas + color sanitizer.
 */
export async function downloadElementAsPDF(
  elementId: string,
  filename: string,
  options?: PDFExportOptions
): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`[PDF Export] Element with id "${elementId}" not found.`);
    return false;
  }

  const sanitizedFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

  // Timeout safety wrapper (max 20 seconds)
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('PDF generation timed out after 20 seconds')), 20000)
  );

  const generatePDFPromise = (async (): Promise<boolean> => {
    let pdf: jsPDF | null = null;

    // Primary Engine: html-to-image (Uses native SVG foreignObject, natively supports OKLCH, Grid, Fonts)
    try {
      const dataUrl = await toPng(element, {
        quality: 0.98,
        pixelRatio: 2, // 2x scale for crisp printing
        backgroundColor: '#ffffff',
        filter: (node: HTMLElement) => {
          if (node.classList) {
            if (
              node.classList.contains('print:hidden') ||
              node.tagName === 'BUTTON' ||
              node.hasAttribute('data-no-print')
            ) {
              return false;
            }
          }
          return true;
        },
      });

      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load captured DOM image'));
        img.src = dataUrl;
      });

      pdf = await generateMultiPagePDF(dataUrl, img.naturalWidth || img.width, img.naturalHeight || img.height, options);
    } catch (primaryErr) {
      console.warn('[PDF Export] Primary html-to-image renderer fallback initiated:', primaryErr);

      // Fallback Engine: html2canvas with OKLCH sanitization
      try {
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          onclone: (_clonedDoc, clonedEl) => {
            clonedEl.style.backgroundColor = '#ffffff';
            clonedEl.style.color = '#000000';
            sanitizeOklchColors(clonedEl);
            const buttons = clonedEl.querySelectorAll('button, .print\\:hidden, [data-no-print]');
            buttons.forEach((btn) => {
              (btn as HTMLElement).style.display = 'none';
            });
          },
        });

        const dataUrl = canvas.toDataURL('image/png', 0.95);
        pdf = await generateMultiPagePDF(dataUrl, canvas.width, canvas.height, options);
      } catch (fallbackErr) {
        console.error('[PDF Export] Both PDF rendering engines failed:', fallbackErr);
        throw fallbackErr;
      }
    }

    if (!pdf) {
      throw new Error('PDF instance was not generated.');
    }

    // Save directly to user Downloads folder
    try {
      pdf.save(sanitizedFilename);
    } catch (saveErr) {
      console.warn('[PDF Export] Direct pdf.save() failed, attempting Blob download fallback:', saveErr);
      const pdfBlob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.download = sanitizedFilename;
      document.body.appendChild(anchor);
      anchor.click();
      setTimeout(() => {
        document.body.removeChild(anchor);
        URL.revokeObjectURL(blobUrl);
      }, 1000);
    }

    return true;
  })();

  try {
    return await Promise.race([generatePDFPromise, timeoutPromise]);
  } catch (error) {
    console.error('[PDF Export Error]:', error);
    return false;
  }
}
