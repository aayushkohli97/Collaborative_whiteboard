import { jsPDF } from "jspdf";

/**
 * Export multiple canvas elements as a multi-page PDF.
 * 
 * @param {HTMLCanvasElement[]} canvasElements - Array of canvas elements, one per page
 * @param {string} title - Document title (used in filename)
 * @returns {void} - Triggers browser download
 */
export const exportToPdf = (canvasElements, title = "Whiteboard") => {
  if (!canvasElements || canvasElements.length === 0) return;

  // Use landscape orientation, dimensions in mm
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  canvasElements.forEach((canvas, index) => {
    if (index > 0) {
      pdf.addPage();
    }

    // Convert canvas to image data
    const imgData = canvas.toDataURL("image/png", 1.0);

    // Fit image to page while maintaining aspect ratio
    const canvasAspect = canvas.width / canvas.height;
    const pageAspect = pageWidth / pageHeight;

    let imgWidth, imgHeight, offsetX, offsetY;

    if (canvasAspect > pageAspect) {
      // Canvas is wider than page — fit to width
      imgWidth = pageWidth;
      imgHeight = pageWidth / canvasAspect;
      offsetX = 0;
      offsetY = (pageHeight - imgHeight) / 2;
    } else {
      // Canvas is taller than page — fit to height
      imgHeight = pageHeight;
      imgWidth = pageHeight * canvasAspect;
      offsetX = (pageWidth - imgWidth) / 2;
      offsetY = 0;
    }

    pdf.addImage(imgData, "PNG", offsetX, offsetY, imgWidth, imgHeight);

    // Add page number
    pdf.setFontSize(8);
    pdf.setTextColor(150);
    pdf.text(
      `Page ${index + 1} of ${canvasElements.length}`,
      pageWidth / 2,
      pageHeight - 5,
      { align: "center" }
    );
  });

  // Generate filename with date
  const date = new Date().toISOString().split("T")[0];
  const safeName = title.replace(/[^a-zA-Z0-9 ]/g, "").trim() || "Whiteboard";
  const filename = `${safeName}_${date}.pdf`;

  pdf.save(filename);
};
