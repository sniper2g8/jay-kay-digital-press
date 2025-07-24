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
    return `${companySettings.currency_symbol} ${amount.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  let yPosition = margin;

  // Header section - Company name (left) and INVOICE title (right)
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(companySettings.company_name, margin, yPosition);
  
  doc.setFontSize(28);
  doc.text('INVOICE', pageWidth - margin - 40, yPosition, { align: 'right' });

  yPosition += 10;

  // Company details (left side)
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  
  if (companySettings.address) {
    doc.text(companySettings.address, margin, yPosition);
    yPosition += 5;
  }
  
  doc.text(`Phone: ${companySettings.phone || ''}`, margin, yPosition);
  yPosition += 5;
  doc.text(`Email: ${companySettings.email || ''}`, margin, yPosition);

  // Invoice details (right side)
  doc.setTextColor(0, 0, 0);
  doc.text(`Invoice #: ${invoiceData.invoice_number}`, pageWidth - margin - 60, margin + 15, { align: 'left' });
  doc.text(`Date: ${new Date(invoiceData.issued_date).toLocaleDateString()}`, pageWidth - margin - 60, margin + 25, { align: 'left' });

  yPosition = margin + 40;

  // Two-column layout: Bill To (left) and Invoice Details (right)
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text('Bill To:', margin, yPosition);

  yPosition += 8;
  doc.setFontSize(12);
  doc.text(invoiceData.customers.name, margin, yPosition);

  yPosition += 6;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(invoiceData.customers.customer_display_id, margin, yPosition);

  yPosition += 5;
  doc.text(invoiceData.customers.email, margin, yPosition);

  if (invoiceData.customers.phone) {
    yPosition += 5;
    doc.text(invoiceData.customers.phone, margin, yPosition);
  }

  if (invoiceData.customers.address) {
    yPosition += 5;
    doc.text(invoiceData.customers.address, margin, yPosition);
  }

  // Invoice Details (right column)
  const rightX = pageWidth / 2 + 10;
  let detailsY = margin + 48;
  
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text('Invoice Details:', rightX, detailsY);

  detailsY += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text('Status:', rightX, detailsY);
  
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text(invoiceData.status.charAt(0).toUpperCase() + invoiceData.status.slice(1), rightX + 25, detailsY);

  detailsY += 6;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text('Service:', rightX, detailsY);
  
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text('Print Services', rightX + 25, detailsY);

  // Items section
  yPosition = Math.max(yPosition + 15, detailsY + 15);
  
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text('Items:', margin, yPosition);

  yPosition += 10;

  // Table setup
  const tableStartY = yPosition;
  const colWidths = [70, 25, 40, 40];
  const colPositions = [margin, margin + colWidths[0], margin + colWidths[0] + colWidths[1], margin + colWidths[0] + colWidths[1] + colWidths[2]];
  const tableWidth = colWidths.reduce((a, b) => a + b, 0);

  // Table header background
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, tableStartY, tableWidth, 8, 'F');

  // Table border
  doc.setDrawColor(200, 200, 200);
  doc.rect(margin, tableStartY, tableWidth, 8 + (invoiceData.invoice_items.length * 8));

  // Table headers
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text('Description', colPositions[0] + 2, tableStartY + 5);
  doc.text('Qty', colPositions[1] + 2, tableStartY + 5);
  doc.text('Unit Price', colPositions[2] + 2, tableStartY + 5);
  doc.text('Total', colPositions[3] + 2, tableStartY + 5);

  // Column separators for header
  for (let i = 1; i < colPositions.length; i++) {
    doc.line(colPositions[i], tableStartY, colPositions[i], tableStartY + 8);
  }

  let itemY = tableStartY + 8;

  // Table rows
  doc.setFont("helvetica", "normal");
  invoiceData.invoice_items.forEach((item, index) => {
    // Row separator
    if (index > 0) {
      doc.line(margin, itemY, margin + tableWidth, itemY);
    }

    // Column separators
    for (let i = 1; i < colPositions.length; i++) {
      doc.line(colPositions[i], itemY, colPositions[i], itemY + 8);
    }

    doc.text(item.description.substring(0, 30), colPositions[0] + 2, itemY + 5);
    doc.text(item.quantity.toString(), colPositions[1] + 2, itemY + 5);
    doc.text(formatCurrency(item.unit_price), colPositions[2] + 2, itemY + 5);
    
    doc.setFont("helvetica", "bold");
    doc.text(formatCurrency(item.total_price), colPositions[3] + 2, itemY + 5);
    doc.setFont("helvetica", "normal");

    itemY += 8;
  });

  // Totals section (right aligned)
  const totalStartX = pageWidth - margin - 70;
  let totalY = itemY + 20;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text('Subtotal:', totalStartX, totalY);
  
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text(formatCurrency(invoiceData.subtotal), totalStartX + 35, totalY);

  // Tax (if applicable)
  if (invoiceData.tax_amount > 0) {
    totalY += 6;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text('Tax:', totalStartX, totalY);
    
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(formatCurrency(invoiceData.tax_amount), totalStartX + 35, totalY);
  }

  // Total separator line
  totalY += 4;
  doc.setDrawColor(200, 200, 200);
  doc.line(totalStartX, totalY, pageWidth - margin, totalY);

  // Total amount
  totalY += 8;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text('Total:', totalStartX, totalY);
  doc.text(formatCurrency(invoiceData.total_amount), totalStartX + 35, totalY);

  // Payment Terms section
  totalY += 25;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text('Payment Terms:', margin, totalY);

  totalY += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text('Payment is due within 30 days of invoice date.', margin, totalY);

  totalY += 6;
  const thankYouText = `Thank you for your business! For questions about this invoice, please contact us at ${companySettings.email || ''}.`;
  doc.text(thankYouText, margin, totalY, { maxWidth: pageWidth - 2 * margin });

  // Notes section (if exists)
  if (invoiceData.notes) {
    totalY += 15;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text('Notes:', margin, totalY);

    totalY += 6;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(invoiceData.notes, margin, totalY, { maxWidth: pageWidth - 2 * margin });
  }

  // Footer
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  doc.text(`Generated on ${new Date().toLocaleDateString()} by ${companySettings.company_name}`, margin, pageHeight - 10);

  // Return as blob
  const pdfBlob = doc.output('blob');
  return pdfBlob;
};