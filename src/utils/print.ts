import React from 'react';
import ReactDOM from 'react-dom/client';
import { Shipment, Driver, User, Installment, InstallmentPayment } from '../../types';
import { sanitizeFilename } from './sanitization';
import PrintableShipment from '../components/common/components/PrintableShipment';
import logger from './logger';
// Lazy load PDF dependencies to reduce initial bundle size
let jsPDF: any = null;
let html2canvas: any = null;

const loadPDFDependencies = async () => {
  if (!jsPDF || !html2canvas) {
    const [pdfModule, canvasModule] = await Promise.all([
      import('jspdf'),
      import('html2canvas')
    ]);
    jsPDF = pdfModule.default;
    html2canvas = canvasModule.default;
  }
};
import { TIMEOUTS, PDF, MESSAGES } from './constants';

interface CompanyPrintDetails {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyLogo: string;
  isPrintHeaderEnabled: boolean;
}

// Helper to convert URL to Base64 using Image and Canvas (more robust for CORS if headers allow)
const getBase64FromUrl = async (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = url;
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL('image/png');
        resolve(dataURL);
      } catch (error) {
        // This usually happens if CORS headers are missing (tainted canvas)
        logger.warn('Canvas taint check failed:', error);
        resolve(url); // Fallback to URL if canvas fails, hoping html2canvas might have better luck or just show broken
      }
    };
    img.onerror = (error) => {
      logger.warn('Image load failed:', error);
      resolve(url); // Fallback to URL
    };
  });
};

/**
 * Generates and triggers the download of a PDF report for a given shipment.
 * This function works by:
 * 1. Creating a temporary, off-screen div in the DOM to act as a rendering target.
 * 2. Using React's `createRoot` to render the `PrintableShipment` component into that div.
 *    This ensures the print layout is rendered with real browser styles.
 * 3. Waiting for a short timeout to allow the component (especially images from URLs) to fully render.
 * 4. Using `html2canvas` to capture the rendered HTML component as a high-quality canvas image.
 * 5. Using `jsPDF` to create a new A4 PDF document.
 * 6. Adding the captured canvas image to the PDF, scaling it to fit the page width.
 * 7. Triggering a browser download of the generated PDF with a descriptive filename.
 * 8. Cleaning up by unmounting the React component and removing the temporary div from the DOM.
 *
 * @param shipment - The shipment object to be printed.
 * @param driver - The driver associated with the shipment.
 * @param companyDetails - Company information for the print header.
 * @param currentUser - The user who is printing the report, for auditing purposes.
 */
export const printShipmentDetails = async (shipment: Shipment, driver: Driver | undefined, companyDetails: CompanyPrintDetails, currentUser: User, regions: any[], allProducts: any[]): Promise<void> => {
  // Lazy load PDF dependencies to reduce initial bundle size
  await loadPDFDependencies();

  let printContainer: HTMLDivElement | null = null;
  let root: ReactDOM.Root | null = null;

  // Define a cleanup function to be called after PDF generation or on error.
  const cleanup = () => {
    try {
      if (root) {
        root.unmount();
      }
      if (printContainer && document.body.contains(printContainer)) {
        document.body.removeChild(printContainer);
      }
    } catch (err) {
      logger.error('Cleanup error:', err);
    }
  };

  try {
    // Pre-process logo to base64 if it exists
    let logoBase64 = '';
    if (companyDetails.companyLogo) {
      try {
        logoBase64 = await getBase64FromUrl(companyDetails.companyLogo);
      } catch (err) {
        logger.warn('Failed to load logo:', err);
      }
    }

    // Process product weights
    const productWeights: Record<string, number> = {};
    allProducts.forEach(p => {
      productWeights[p.id] = p.weightKg || 0;
    });

    // Step 1: Create a temporary container for rendering the printable component.
    printContainer = document.createElement('div');
    printContainer.id = 'pdf-container';
    // Style it to be rendered off-screen but with a fixed A4 width to control the layout.
    printContainer.style.position = 'absolute';
    printContainer.style.left = '-9999px';
    printContainer.style.top = '0px';
    printContainer.style.width = `${PDF.A4_WIDTH_MM}mm`;
    printContainer.style.backgroundColor = 'white';
    document.body.appendChild(printContainer);

    root = ReactDOM.createRoot(printContainer);

    const printTimestamp = new Date().toLocaleString('ar-EG', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });

    const regionName = regions.find((r: any) => r.id === shipment.regionId)?.name || 'غير معروف';

    // Step 2: Render the component with logo (Base64 if available, otherwise original URL).
    root.render(
      React.createElement(PrintableShipment, {
        shipment,
        driverName: driver?.name || 'غير معروف',
        plateNumber: driver?.plateNumber || 'غير معروف',
        regionName,
        printedBy: currentUser.username,
        printTimestamp: printTimestamp,
        ...companyDetails,
        companyLogo: logoBase64 || companyDetails.companyLogo, // Use base64 if available
        productWeights
      })
    );

    // Step 3: Wait for React to mount the component
    await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 100)));

    // Step 4: Wait for any other images to load
    const images = Array.from(printContainer.querySelectorAll('img'));
    await Promise.all(images.map(img => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      return new Promise((resolve) => {
        img.onload = () => resolve(undefined);
        img.onerror = () => resolve(undefined);
      });
    }));

    // Buffer after images load
    await new Promise(resolve => setTimeout(resolve, 300));

    if (!printContainer) {
      throw new Error('Print container was removed unexpectedly');
    }

    // Step 5: Use html2canvas to capture the rendered component.
    const canvas = await html2canvas(printContainer, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      throw new Error('Canvas generation failed: Invalid dimensions');
    }

    const imgData = canvas.toDataURL('image/jpeg', 0.9);

    // Step 6: Initialize jsPDF.
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const canvasAspectRatio = canvas.height / canvas.width;
    const totalPDFHeight = pdfWidth * canvasAspectRatio;

    // Step 7: Add the captured content to the PDF.
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, totalPDFHeight);

    // Sanitize filename
    const sanitizedSalesOrder = sanitizeFilename(shipment.salesOrder);
    const sanitizedDriverName = sanitizeFilename(driver?.name || 'UnknownDriver');
    const fileName = `${sanitizedDriverName}-${sanitizedSalesOrder}.pdf`;

    // Step 9: Trigger the download.
    pdf.save(fileName);

    // Step 10: Clean up
    cleanup();

  } catch (err) {
    cleanup();

    // Provide user-friendly error messages using centralized constants
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    logger.error('PDF generation failed:', err);

    if (errorMessage.includes('timeout')) {
      alert(MESSAGES.ERROR.PDF_TIMEOUT);
    } else if (errorMessage.includes('Canvas')) {
      alert(`${MESSAGES.ERROR.PDF_GENERATION}: مشكلة في معالجة الصورة. يرجى التحقق من اتصالك بالإنترنت.`);
    } else {
      alert(`${MESSAGES.ERROR.PDF_GENERATION}: ${errorMessage}`);
    }

    throw err; // Re-throw for potential handling by caller
  }
};

/**
 * Generates and triggers the download of a PDF report for an installment.
 */
export const printInstallmentDetails = async (
  installment: Installment,
  payments: InstallmentPayment[],
  shipment: Shipment | undefined,
  driverName: string,
  companyDetails: CompanyPrintDetails,
  currentUser: User
): Promise<void> => {
  // Lazy load PDF dependencies to reduce initial bundle size
  await loadPDFDependencies();

  // Dynamically import the component to avoid circular dependencies
  const PrintableInstallment = (await import('../components/common/components/PrintableInstallment')).default;

  let printContainer: HTMLDivElement | null = null;
  let root: ReactDOM.Root | null = null;

  const cleanup = () => {
    try {
      if (root) root.unmount();
      if (printContainer && document.body.contains(printContainer)) {
        document.body.removeChild(printContainer);
      }
    } catch (err) {
      logger.error('Cleanup error:', err);
    }
  };

  try {
    // Pre-process logo to base64
    let logoBase64 = '';
    if (companyDetails.companyLogo) {
      try {
        logoBase64 = await getBase64FromUrl(companyDetails.companyLogo);
      } catch (err) {
        logger.warn('Failed to load logo:', err);
      }
    }

    // Create container
    printContainer = document.createElement('div');
    printContainer.id = 'pdf-container';
    printContainer.style.position = 'absolute';
    printContainer.style.left = '-9999px';
    printContainer.style.top = '0px';
    printContainer.style.width = `${PDF.A4_WIDTH_MM}mm`;
    printContainer.style.backgroundColor = 'white';
    document.body.appendChild(printContainer);

    root = ReactDOM.createRoot(printContainer);

    const printTimestamp = new Date().toLocaleString('ar-EG', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });

    // Render the component
    root.render(
      React.createElement(PrintableInstallment, {
        installment,
        payments,
        shipment,
        driverName,
        printedBy: currentUser.username,
        printTimestamp,
        ...companyDetails,
        companyLogo: logoBase64 || companyDetails.companyLogo,
      })
    );

    // Wait for React to mount
    await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 100)));

    // Wait for images to load
    const images = Array.from(printContainer.querySelectorAll('img'));
    await Promise.all(images.map(img => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      return new Promise((resolve) => {
        img.onload = () => resolve(undefined);
        img.onerror = () => resolve(undefined);
      });
    }));

    await new Promise(resolve => setTimeout(resolve, 300));

    if (!printContainer) {
      throw new Error('Print container was removed unexpectedly');
    }

    // Capture with html2canvas
    const canvas = await html2canvas(printContainer, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      throw new Error('Canvas generation failed');
    }

    const imgData = canvas.toDataURL('image/jpeg', 0.9);

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const canvasAspectRatio = canvas.height / canvas.width;
    const totalPDFHeight = pdfWidth * canvasAspectRatio;

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, totalPDFHeight);

    // Generate filename
    const salesOrder = shipment?.salesOrder || installment.id.slice(-8);
    const fileName = `تسديد-${sanitizeFilename(salesOrder)}.pdf`;

    pdf.save(fileName);
    cleanup();

  } catch (err) {
    cleanup();
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    logger.error('Installment PDF generation failed:', err);
    alert(`فشل إنشاء ملف PDF: ${errorMessage}`);
    throw err;
  }
};
