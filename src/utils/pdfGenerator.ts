import { jsPDF } from 'jspdf';

interface InvoiceData {
  invoice_number: string;
  issued_date: string;
  due_date: string | null;
  status: string;
  total_amount: number;
  paid_amount: number;
  balance_due: number | null;
  tax_amount: number;
  discount_amount: number;
  subtotal: number;
  notes: string | null;
  customers: {
    name: string;
    email: string;
    phone: string | null;
    address: string | null;
    customer_display_id: string;
  };
  invoice_items: {
    description: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }[];
}

interface CompanySettings {
  company_name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  primary_color: string;
  currency_symbol: string;
}

export const generateInvoicePDF = async (
  invoiceData: InvoiceData,
  companySettings: CompanySettings
): Promise<Blob> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  
  // Helper function to format currency
  const formatCurrency = (amount: number) => {
    return `${companySettings.currency_symbol} ${amount.toFixed(2)}`;
  };

  // Helper function to draw rounded rectangle
  const drawRoundedRect = (x: number, y: number, w: number, h: number, r: number = 2) => {
    doc.roundedRect(x, y, w, h, r, r);
  };

  // Helper function to add logo with high quality
  const addLogo = async (logoUrl: string, x: number, y: number, width: number, height: number) => {
    try {
      const response = await fetch(logoUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      
      return new Promise((resolve) => {
        reader.onload = () => {
          const img = new Image();
          img.onload = () => {
            // Use higher resolution canvas for better quality
            const scale = 3; // 3x resolution for crisp output
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = width * scale;
            canvas.height = height * scale;
            
            // Enable image smoothing for better quality
            if (ctx) {
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'high';
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            }
            
            // Use PNG format with maximum quality for logos
            const dataUrl = canvas.toDataURL('image/png', 1.0);
            doc.addImage(dataUrl, 'PNG', x, y, width, height);
            resolve(true);
          };
          img.src = reader.result as string;
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error loading logo:', error);
      return false;
    }
  };

  // Helper function to generate QR code
  const addQRCode = async (text: string, x: number, y: number, size: number) => {
    try {
      const QRCode = (await import('qrcode')).default;
      const qrDataUrl = await QRCode.toDataURL(text, {
        width: size * 4, // Higher resolution
        margin: 1,
        color: { dark: '#000000', light: '#FFFFFF' }
      });
      doc.addImage(qrDataUrl, 'PNG', x, y, size, size);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  let yPosition = margin + 10;

  // Add company logo if available
  if (companySettings.logo_url) {
    await addLogo(companySettings.logo_url, margin, yPosition, 50, 25);
    // Company name next to logo - positioned better
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(companySettings.company_name, margin + 55, yPosition + 18);
  } else {
    // Header section - Company info (left) and INVOICE title (right)
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(companySettings.company_name, margin, yPosition + 15);
  }
  
  // INVOICE title - right aligned
  doc.setFontSize(36);
  doc.text('INVOICE', pageWidth - margin, yPosition + 15, { align: 'right' });

  yPosition += 30;

  // Company details (left side) - styled like HTML
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120); // muted-foreground color
  
  if (companySettings.address) {
    doc.text(companySettings.address, margin, yPosition);
    yPosition += 4;
  }
  
  doc.text(`Phone: ${companySettings.phone || ''}`, margin, yPosition);
  yPosition += 4;
  doc.text(`Email: ${companySettings.email || ''}`, margin, yPosition);

  // Invoice details (right side) - matching HTML
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.text('Invoice #:', pageWidth - margin - 50, margin + 20, { align: 'left' });
  doc.setFont("helvetica", "normal");
  doc.text(invoiceData.invoice_number, pageWidth - margin - 10, margin + 20, { align: 'right' });

  doc.setFont("helvetica", "bold");
  doc.text('Date:', pageWidth - margin - 50, margin + 28, { align: 'left' });
  doc.setFont("helvetica", "normal");
  doc.text(new Date(invoiceData.issued_date).toLocaleDateString(), pageWidth - margin - 10, margin + 28, { align: 'right' });

  yPosition = margin + 45;

  // Section separator
  doc.setDrawColor(230, 230, 230);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  
  yPosition += 15;

  // Two-column layout: Bill To (left) and Invoice Details (right)
  const leftColX = margin;
  const rightColX = pageWidth / 2 + 10;

  // Bill To section (left column)
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text('Bill To:', leftColX, yPosition);

  let leftY = yPosition + 8;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(invoiceData.customers.name, leftColX, leftY);

  leftY += 5;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  doc.text(invoiceData.customers.customer_display_id, leftColX, leftY);

  leftY += 4;
  doc.text(invoiceData.customers.email, leftColX, leftY);

  if (invoiceData.customers.phone) {
    leftY += 4;
    doc.text(invoiceData.customers.phone, leftColX, leftY);
  }

  if (invoiceData.customers.address) {
    leftY += 4;
    doc.text(invoiceData.customers.address, leftColX, leftY);
  }

  // Invoice Details section (right column)
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text('Invoice Details:', rightColX, yPosition);

  let rightY = yPosition + 8;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  doc.text('Status:', rightColX, rightY);
  
  // Status badge-like styling
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text(invoiceData.status.charAt(0).toUpperCase() + invoiceData.status.slice(1), rightColX + 25, rightY);

  rightY += 6;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  doc.text('Service:', rightColX, rightY);
  
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text('Print Services', rightColX + 25, rightY);

  // Items section
  yPosition = Math.max(leftY, rightY) + 20;
  
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text('Items:', margin, yPosition);

  yPosition += 10;

  // Professional table with proper borders and styling
  const tableStartY = yPosition;
  const tableWidth = pageWidth - 2 * margin;
  const colWidths = [tableWidth * 0.45, tableWidth * 0.15, tableWidth * 0.2, tableWidth * 0.2];
  const colPositions = [
    margin,
    margin + colWidths[0],
    margin + colWidths[0] + colWidths[1],
    margin + colWidths[0] + colWidths[1] + colWidths[2]
  ];
  const rowHeight = 12;
  const headerHeight = 12;

  // Table outer border
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  const totalTableHeight = headerHeight + (invoiceData.invoice_items.length * rowHeight);
  drawRoundedRect(margin, tableStartY, tableWidth, totalTableHeight, 3);

  // Table header with background
  doc.setFillColor(248, 248, 248); // bg-muted/50
  drawRoundedRect(margin, tableStartY, tableWidth, headerHeight, 3);
  doc.rect(margin, tableStartY, tableWidth, headerHeight, 'F');

  // Table headers with proper styling
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text('Description', colPositions[0] + 3, tableStartY + 8);
  doc.text('Quantity', colPositions[1] + 3, tableStartY + 8);
  doc.text('Unit Price', colPositions[2] + 3, tableStartY + 8);
  doc.text('Total', colPositions[3] + 3, tableStartY + 8);

  // Header column separators
  doc.setDrawColor(220, 220, 220);
  for (let i = 1; i < colPositions.length; i++) {
    doc.line(colPositions[i], tableStartY, colPositions[i], tableStartY + headerHeight);
  }

  let currentRowY = tableStartY + headerHeight;

  // Table rows with alternating backgrounds
  doc.setFont("helvetica", "normal");
  invoiceData.invoice_items.forEach((item, index) => {
    // Alternating row background
    if (index % 2 === 1) {
      doc.setFillColor(252, 252, 252);
      doc.rect(margin, currentRowY, tableWidth, rowHeight, 'F');
    }

    // Row separator line
    doc.setDrawColor(240, 240, 240);
    doc.line(margin, currentRowY, margin + tableWidth, currentRowY);

    // Column separators
    for (let i = 1; i < colPositions.length; i++) {
      doc.line(colPositions[i], currentRowY, colPositions[i], currentRowY + rowHeight);
    }

    // Cell content
    doc.setTextColor(0, 0, 0);
    doc.text(item.description.substring(0, 35), colPositions[0] + 3, currentRowY + 8);
    doc.text(item.quantity.toString(), colPositions[1] + 3, currentRowY + 8);
    doc.text(formatCurrency(item.unit_price), colPositions[2] + 3, currentRowY + 8);
    
    doc.setFont("helvetica", "bold");
    doc.text(formatCurrency(item.total_price), colPositions[3] + 3, currentRowY + 8);
    doc.setFont("helvetica", "normal");

    currentRowY += rowHeight;
  });

  // Totals section - professional right-aligned layout
  const totalsBoxWidth = 80;
  const totalsX = pageWidth - margin - totalsBoxWidth;
  let totalsY = currentRowY + 20;

  // Totals box with subtle background
  doc.setFillColor(250, 250, 250);
  drawRoundedRect(totalsX - 5, totalsY - 5, totalsBoxWidth + 10, 40, 3);
  doc.rect(totalsX - 5, totalsY - 5, totalsBoxWidth + 10, 40, 'F');

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  doc.text('Subtotal:', totalsX, totalsY);
  
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text(formatCurrency(invoiceData.subtotal), totalsX + 55, totalsY, { align: 'right' });

  // Tax (if applicable)
  if (invoiceData.tax_amount > 0) {
    totalsY += 8;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text('Tax:', totalsX, totalsY);
    
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(formatCurrency(invoiceData.tax_amount), totalsX + 55, totalsY, { align: 'right' });
  }

  // Total separator line
  totalsY += 6;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(1);
  doc.line(totalsX, totalsY, totalsX + totalsBoxWidth, totalsY);

  // Total amount - larger and bold
  totalsY += 10;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text('Total:', totalsX, totalsY);
  doc.text(formatCurrency(invoiceData.total_amount), totalsX + 55, totalsY, { align: 'right' });

  // Payment Terms section - matching HTML styling
  totalsY += 30;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text('Payment Terms:', margin, totalsY);

  totalsY += 8;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  doc.text('Payment is due within 30 days of invoice date.', margin, totalsY);

  totalsY += 8;
  const thankYouText = `Thank you for your business! For questions about this invoice, please contact us at ${companySettings.email || ''}.`;
  doc.text(thankYouText, margin, totalsY, { maxWidth: pageWidth - 2 * margin });

  // Notes section (if exists)
  if (invoiceData.notes) {
    totalsY += 20;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text('Notes:', margin, totalsY);

    totalsY += 8;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text(invoiceData.notes, margin, totalsY, { maxWidth: pageWidth - 2 * margin });
  }

  // Add QR Code for invoice tracking
  const qrSize = 25;
  const qrX = pageWidth - margin - qrSize;
  const qrY = totalsY + 20;
  // Use a generic invoice tracking URL since we're in PDF context
  const invoiceUrl = `Invoice: ${invoiceData.invoice_number}`;
  await addQRCode(invoiceUrl, qrX, qrY, qrSize);
  
  // QR Code label
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  doc.text('Track Invoice', qrX + (qrSize / 2), qrY + qrSize + 5, { align: 'center' });

  // Footer with separator line - matching HTML
  const footerY = pageHeight - 20;
  doc.setDrawColor(230, 230, 230);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(150, 150, 150);
  doc.text(`Generated on ${new Date().toLocaleDateString()} by ${companySettings.company_name}`, margin, footerY);

  // Return as blob
  const pdfBlob = doc.output('blob');
  return pdfBlob;
};