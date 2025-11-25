import React from 'react';
import ReactDOM from 'react-dom/client';
import { Shipment, Driver, User } from '../types';
import { sanitizeFilename } from './sanitization';
import PrintableShipment from '../components/common/components/PrintableShipment';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { TIMEOUTS, PDF, MESSAGES } from './constants';

interface CompanyPrintDetails {
    companyName: string;
    companyAddress: string;
    companyPhone: string;
    companyLogo: string;
    isPrintHeaderEnabled: boolean;
}

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
export const printShipmentDetails = async (shipment: Shipment, driver: Driver | undefined, companyDetails: CompanyPrintDetails, currentUser: User): Promise<void> => {
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
      console.error('Cleanup error:', err);
    }
  };

  try {
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

    // Step 2: Render the component into the off-screen container.
    root.render(
      React.createElement(PrintableShipment, {
        shipment,
        driverName: driver?.name || 'غير معروف',
        plateNumber: driver?.plateNumber || 'غير معروف',
        printedBy: currentUser.username,
        printTimestamp: printTimestamp,
        ...companyDetails,
      })
    );

    // Step 3: Wait for render completion with timeout protection
    await new Promise<void>((resolve, reject) => {
      const renderTimeout = setTimeout(() => {
        reject(new Error('Render timeout: Component took too long to render'));
      }, TIMEOUTS.PDF_GENERATION_TIMEOUT);

      setTimeout(() => {
        clearTimeout(renderTimeout);
        resolve();
      }, TIMEOUTS.PDF_RENDER);
    });

    if (!printContainer) {
      throw new Error('Print container was removed unexpectedly');
    }

    // Step 4: Use html2canvas to capture the rendered component.
    const canvas = await html2canvas(printContainer, { 
      scale: 2, // Higher scale for better quality PDF output
      useCORS: true, // Important for loading external logo images
      backgroundColor: '#ffffff',
      logging: false, // Disable console logging
      onclone: (clonedDoc) => {
        // Ensure images are loaded in cloned document
        const images = clonedDoc.querySelectorAll('img');
        images.forEach((img) => {
          if (!img.complete) {
            console.warn('Image not fully loaded:', img.src);
          }
        });
      }
    });

    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      throw new Error('Canvas generation failed: Invalid dimensions');
    }

    const imgData = canvas.toDataURL('image/jpeg', 0.9); // Use JPEG for smaller file sizes

    // Step 5: Initialize jsPDF.
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const canvasAspectRatio = canvas.height / canvas.width;
    const totalPDFHeight = pdfWidth * canvasAspectRatio;

    // Step 6: Add the captured image to the PDF.
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, totalPDFHeight);

    // Sanitize filename to prevent security issues
    const sanitizedSalesOrder = sanitizeFilename(shipment.salesOrder);
    const sanitizedDriverName = sanitizeFilename(driver?.name || 'UnknownDriver');
    const fileName = `${sanitizedDriverName}-${sanitizedSalesOrder}.pdf`;

    // Step 7: Trigger the download.
    pdf.save(fileName);

    // Step 8: Clean up the temporary DOM element.
    cleanup();

  } catch (err) {
    cleanup();
    
    // Provide user-friendly error messages using centralized constants
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('PDF generation failed:', err);
    
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
