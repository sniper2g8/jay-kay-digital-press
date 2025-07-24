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
  website?: string | null;
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

  let yPosition = margin;

  // HEADER SECTION - Match HTML exactly
  // Logo and Company Info (Left) + INVOICE Title (Right)
  if (companySettings.logo_url) {
    await addLogo(companySettings.logo_url, margin, yPosition, 32, 16); // h-16 w-auto equivalent
    
    // Company info next to logo
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(companySettings.company_name, margin + 38, yPosition + 10);
    
    // Company details below name
    let detailY = yPosition + 16;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    
    if (companySettings.address) {
      doc.text(companySettings.address, margin + 38, detailY);
      detailY += 4;
    }
    doc.text(`Phone: ${companySettings.phone || ''}`, margin + 38, detailY);
    detailY += 4;
    doc.text(`Email: ${companySettings.email || ''}`, margin + 38, detailY);
    detailY += 4;
    if (companySettings.website) {
      doc.text(`Website: ${companySettings.website}`, margin + 38, detailY);
    }
  } else {
    // Just company name if no logo
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(companySettings.company_name, margin, yPosition + 10);
  }

  // INVOICE title (right side)
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text('INVOICE', pageWidth - margin, yPosition + 10, { align: 'right' });

  // Invoice details (right side, below INVOICE title)
  let rightY = yPosition + 18;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);

  // Invoice # line
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  const invoiceLabel = `Invoice #: `;
  const invoiceLabelWidth = doc.getTextWidth(invoiceLabel);
  doc.text(invoiceLabel, pageWidth - margin - 60, rightY);
  doc.setFont("helvetica", "normal");
  doc.text(invoiceData.invoice_number, pageWidth - margin - 60 + invoiceLabelWidth, rightY);

  rightY += 6;
  // Date line
  doc.setFont("helvetica", "bold");
  const dateLabel = `Date: `;
  const dateLabelWidth = doc.getTextWidth(dateLabel);
  doc.text(dateLabel, pageWidth - margin - 60, rightY);
  doc.setFont("helvetica", "normal");
  doc.text(new Date(invoiceData.issued_date).toLocaleDateString(), pageWidth - margin - 60 + dateLabelWidth, rightY);

  yPosition += 60; // Move down after header

  // BILL TO AND INVOICE DETAILS SECTION
  const leftColX = margin;
  const rightColX = pageWidth / 2 + 10;

  // Bill To section (left column)
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text('Bill To:', leftColX, yPosition);

  let billToY = yPosition + 8;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(invoiceData.customers.name, leftColX, billToY);

  billToY += 5;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  doc.text(invoiceData.customers.customer_display_id, leftColX, billToY);

  billToY += 4;
  doc.text(invoiceData.customers.email, leftColX, billToY);

  if (invoiceData.customers.phone) {
    billToY += 4;
    doc.text(invoiceData.customers.phone, leftColX, billToY);
  }

  if (invoiceData.customers.address) {
    billToY += 4;
    doc.text(invoiceData.customers.address, leftColX, billToY);
  }

  // Invoice Details section (right column)
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text('Invoice Details:', rightColX, yPosition);

  let detailsY = yPosition + 8;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);

  // Status
  doc.text('Status:', rightColX, detailsY);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text(invoiceData.status.charAt(0).toUpperCase() + invoiceData.status.slice(1), rightColX + 35, detailsY);

  detailsY += 6;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  doc.text('Service:', rightColX, detailsY);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text('Print Services', rightColX + 35, detailsY);

  yPosition = Math.max(billToY, detailsY) + 20;

  // ITEMS SECTION
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text('Items:', margin, yPosition);

  yPosition += 10;

  // Table setup
  const tableWidth = pageWidth - 2 * margin;
  const colWidths = [tableWidth * 0.5, tableWidth * 0.15, tableWidth * 0.175, tableWidth * 0.175];
  const colPositions = [
    margin,
    margin + colWidths[0],
    margin + colWidths[0] + colWidths[1],
    margin + colWidths[0] + colWidths[1] + colWidths[2]
  ];
  const rowHeight = 12;
  const headerHeight = 12;

  // Table header with background
  doc.setFillColor(248, 248, 248);
  doc.rect(margin, yPosition, tableWidth, headerHeight, 'F');
  
  // Table border
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.rect(margin, yPosition, tableWidth, headerHeight + (invoiceData.invoice_items.length * rowHeight));

  // Header text
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text('Description', colPositions[0] + 3, yPosition + 8);
  doc.text('Quantity', colPositions[1] + 3, yPosition + 8);
  doc.text('Unit Price', colPositions[2] + 3, yPosition + 8);
  doc.text('Total', colPositions[3] + 3, yPosition + 8);

  // Header column separators
  for (let i = 1; i < colPositions.length; i++) {
    doc.line(colPositions[i], yPosition, colPositions[i], yPosition + headerHeight);
  }

  let currentRowY = yPosition + headerHeight;

  // Table rows
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  invoiceData.invoice_items.forEach((item, index) => {
    // Row separator
    doc.setDrawColor(240, 240, 240);
    doc.line(margin, currentRowY, margin + tableWidth, currentRowY);

    // Column separators
    for (let i = 1; i < colPositions.length; i++) {
      doc.line(colPositions[i], currentRowY, colPositions[i], currentRowY + rowHeight);
    }

    // Cell content
    doc.setTextColor(0, 0, 0);
    doc.text(item.description.substring(0, 40), colPositions[0] + 3, currentRowY + 8);
    doc.text(item.quantity.toString(), colPositions[1] + 3, currentRowY + 8);
    doc.text(formatCurrency(item.unit_price), colPositions[2] + 3, currentRowY + 8);
    
    doc.setFont("helvetica", "bold");
    doc.text(formatCurrency(item.total_price), colPositions[3] + 3, currentRowY + 8);
    doc.setFont("helvetica", "normal");

    currentRowY += rowHeight;
  });

  // TOTALS SECTION (right-aligned like HTML)
  const totalsWidth = 80;
  const totalsX = pageWidth - margin - totalsWidth;
  let totalsY = currentRowY + 15;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);

  // Subtotal
  doc.text('Subtotal:', totalsX, totalsY);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text(formatCurrency(invoiceData.subtotal), totalsX + totalsWidth, totalsY, { align: 'right' });

  // Tax (if applicable)
  if (invoiceData.tax_amount > 0) {
    totalsY += 8;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text('Tax:', totalsX, totalsY);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(formatCurrency(invoiceData.tax_amount), totalsX + totalsWidth, totalsY, { align: 'right' });
  }

  // Separator line
  totalsY += 6;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(totalsX, totalsY, totalsX + totalsWidth, totalsY);

  // Total
  totalsY += 8;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text('Total:', totalsX, totalsY);
  doc.text(formatCurrency(invoiceData.total_amount), totalsX + totalsWidth, totalsY, { align: 'right' });

  // PAYMENT TERMS AND QR CODE SECTION
  totalsY += 20;

  // Payment Terms (left side)
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
  const lines = doc.splitTextToSize(thankYouText, pageWidth - margin - 100);
  doc.text(lines, margin, totalsY);

  // QR Code (right side)
  const qrSize = 20;
  const qrX = pageWidth - margin - qrSize;
  const qrY = totalsY - 10;
  const invoiceUrl = `Invoice: ${invoiceData.invoice_number}`;
  await addQRCode(invoiceUrl, qrX, qrY, qrSize);
  
  // QR Code label
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  doc.text('Track Invoice', qrX + (qrSize / 2), qrY + qrSize + 4, { align: 'center' });

  // FOOTER
  const footerY = pageHeight - 15;
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(150, 150, 150);
  doc.text(`Generated on ${new Date().toLocaleDateString()} by ${companySettings.company_name}`, pageWidth / 2, footerY, { align: 'center' });

  // Return as blob
  const pdfBlob = doc.output('blob');
  return pdfBlob;
};