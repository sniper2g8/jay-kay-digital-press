import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

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
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 size
  const { width, height } = page.getSize();
  
  // Load fonts
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Helper function to format currency
  const formatCurrency = (amount: number) => {
    return `${companySettings.currency_symbol} ${amount.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  const margin = 50;
  let yPosition = height - margin;

  // Header section - matching HTML layout
  // Company name and logo area (left side)
  page.drawText(companySettings.company_name, {
    x: margin,
    y: yPosition,
    size: 20,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  yPosition -= 30;

  // Company details below name
  if (companySettings.address) {
    page.drawText(companySettings.address, {
      x: margin,
      y: yPosition,
      size: 10,
      font: font,
      color: rgb(0.4, 0.4, 0.4),
    });
    yPosition -= 15;
  }

  page.drawText(`Phone: ${companySettings.phone || ''}`, {
    x: margin,
    y: yPosition,
    size: 10,
    font: font,
    color: rgb(0.4, 0.4, 0.4),
  });

  yPosition -= 15;
  page.drawText(`Email: ${companySettings.email || ''}`, {
    x: margin,
    y: yPosition,
    size: 10,
    font: font,
    color: rgb(0.4, 0.4, 0.4),
  });

  // INVOICE title (right side) - matching HTML position
  page.drawText('INVOICE', {
    x: width - margin - 120,
    y: height - 50,
    size: 28,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  // Invoice details (right side) - matching HTML layout
  let rightY = height - 85;
  const rightX = width - margin - 180;

  page.drawText(`Invoice #: ${invoiceData.invoice_number}`, {
    x: rightX,
    y: rightY,
    size: 10,
    font: font,
  });

  rightY -= 15;
  page.drawText(`Date: ${new Date(invoiceData.issued_date).toLocaleDateString()}`, {
    x: rightX,
    y: rightY,
    size: 10,
    font: font,
  });

  // Reset yPosition for two-column layout
  yPosition = height - 180;

  // Two-column layout: Bill To (left) and Invoice Details (right)
  // Bill To section (left column) - matching HTML
  page.drawText('Bill To:', {
    x: margin,
    y: yPosition,
    size: 16,
    font: boldFont,
  });

  yPosition -= 25;
  page.drawText(invoiceData.customers.name, {
    x: margin,
    y: yPosition,
    size: 12,
    font: boldFont,
  });

  yPosition -= 18;
  page.drawText(invoiceData.customers.customer_display_id, {
    x: margin,
    y: yPosition,
    size: 10,
    font: font,
    color: rgb(0.4, 0.4, 0.4),
  });

  yPosition -= 15;
  page.drawText(invoiceData.customers.email, {
    x: margin,
    y: yPosition,
    size: 10,
    font: font,
    color: rgb(0.4, 0.4, 0.4),
  });

  if (invoiceData.customers.phone) {
    yPosition -= 15;
    page.drawText(invoiceData.customers.phone, {
      x: margin,
      y: yPosition,
      size: 10,
      font: font,
      color: rgb(0.4, 0.4, 0.4),
    });
  }

  if (invoiceData.customers.address) {
    yPosition -= 15;
    page.drawText(invoiceData.customers.address, {
      x: margin,
      y: yPosition,
      size: 10,
      font: font,
      color: rgb(0.4, 0.4, 0.4),
    });
  }

  // Invoice Details section (right column) - matching HTML
  let detailsY = height - 205;
  const detailsX = width / 2 + 20;

  page.drawText('Invoice Details:', {
    x: detailsX,
    y: detailsY,
    size: 16,
    font: boldFont,
  });

  detailsY -= 25;
  page.drawText('Status:', {
    x: detailsX,
    y: detailsY,
    size: 10,
    font: font,
    color: rgb(0.4, 0.4, 0.4),
  });

  page.drawText(invoiceData.status.charAt(0).toUpperCase() + invoiceData.status.slice(1), {
    x: detailsX + 80,
    y: detailsY,
    size: 10,
    font: boldFont,
  });

  detailsY -= 20;
  page.drawText('Service:', {
    x: detailsX,
    y: detailsY,
    size: 10,
    font: font,
    color: rgb(0.4, 0.4, 0.4),
  });

  page.drawText('Print Services', {
    x: detailsX + 80,
    y: detailsY,
    size: 10,
    font: boldFont,
  });

  // Move to items section
  yPosition = Math.min(yPosition - 40, detailsY - 40);

  // Items section header - matching HTML
  page.drawText('Items:', {
    x: margin,
    y: yPosition,
    size: 16,
    font: boldFont,
  });

  yPosition -= 30;

  // Items table - exactly matching HTML table styling
  const tableY = yPosition;
  const colWidths = [200, 80, 120, 120];
  const colX = [margin, margin + colWidths[0], margin + colWidths[0] + colWidths[1], margin + colWidths[0] + colWidths[1] + colWidths[2]];
  const tableWidth = colWidths.reduce((a, b) => a + b, 0);

  // Outer table border
  page.drawRectangle({
    x: margin,
    y: tableY - 25,
    width: tableWidth,
    height: 30 + (invoiceData.invoice_items.length * 25),
    borderColor: rgb(0.85, 0.85, 0.85),
    borderWidth: 1,
  });

  // Table header with muted background - matching HTML bg-muted/50
  page.drawRectangle({
    x: margin,
    y: tableY - 25,
    width: tableWidth,
    height: 30,
    color: rgb(0.96, 0.96, 0.96),
  });

  // Table headers - matching HTML
  page.drawText('Description', {
    x: colX[0] + 15,
    y: tableY - 8,
    size: 11,
    font: boldFont,
  });

  page.drawText('Quantity', {
    x: colX[1] + 15,
    y: tableY - 8,
    size: 11,
    font: boldFont,
  });

  page.drawText('Unit Price', {
    x: colX[2] + 25,
    y: tableY - 8,
    size: 11,
    font: boldFont,
  });

  page.drawText('Total', {
    x: colX[3] + 40,
    y: tableY - 8,
    size: 11,
    font: boldFont,
  });

  let itemY = tableY - 50;

  // Table rows - matching HTML styling
  invoiceData.invoice_items.forEach((item, index) => {
    // Top border for each row (matching HTML border-t border-muted)
    page.drawLine({
      start: { x: margin, y: itemY + 20 },
      end: { x: margin + tableWidth, y: itemY + 20 },
      thickness: 0.5,
      color: rgb(0.85, 0.85, 0.85),
    });

    // Column separators
    for (let i = 1; i < colX.length; i++) {
      page.drawLine({
        start: { x: colX[i], y: tableY - 25 },
        end: { x: colX[i], y: itemY + 20 },
        thickness: 0.5,
        color: rgb(0.85, 0.85, 0.85),
      });
    }

    page.drawText(item.description, {
      x: colX[0] + 15,
      y: itemY,
      size: 10,
      font: font,
    });

    page.drawText(item.quantity.toString(), {
      x: colX[1] + 35,
      y: itemY,
      size: 10,
      font: font,
    });

    page.drawText(formatCurrency(item.unit_price), {
      x: colX[2] + 35,
      y: itemY,
      size: 10,
      font: font,
    });

    page.drawText(formatCurrency(item.total_price), {
      x: colX[3] + 45,
      y: itemY,
      size: 10,
      font: boldFont,
    });

    itemY -= 25;
  });

  // Totals section - right aligned exactly like HTML
  const totalBoxWidth = 220;
  const totalX = width - margin - totalBoxWidth;
  let totalY = itemY - 40;

  // Subtotal
  page.drawText('Subtotal:', {
    x: totalX,
    y: totalY,
    size: 11,
    font: font,
    color: rgb(0.4, 0.4, 0.4),
  });

  page.drawText(formatCurrency(invoiceData.subtotal), {
    x: totalX + 120,
    y: totalY,
    size: 11,
    font: boldFont,
  });

  // Tax (if applicable)
  if (invoiceData.tax_amount > 0) {
    totalY -= 20;
    page.drawText('Tax:', {
      x: totalX,
      y: totalY,
      size: 11,
      font: font,
      color: rgb(0.4, 0.4, 0.4),
    });

    page.drawText(formatCurrency(invoiceData.tax_amount), {
      x: totalX + 120,
      y: totalY,
      size: 11,
      font: boldFont,
    });
  }

  // Total line separator - matching HTML border-t border-muted
  totalY -= 15;
  page.drawLine({
    start: { x: totalX, y: totalY },
    end: { x: width - margin, y: totalY },
    thickness: 1,
    color: rgb(0.85, 0.85, 0.85),
  });

  // Total amount - matching HTML text-lg font-bold
  totalY -= 25;
  page.drawText('Total:', {
    x: totalX,
    y: totalY,
    size: 14,
    font: boldFont,
  });

  page.drawText(formatCurrency(invoiceData.total_amount), {
    x: totalX + 120,
    y: totalY,
    size: 14,
    font: boldFont,
  });

  // Payment Terms section - matching HTML layout
  totalY -= 80;
  page.drawText('Payment Terms:', {
    x: margin,
    y: totalY,
    size: 12,
    font: boldFont,
  });

  totalY -= 20;
  page.drawText('Payment is due within 30 days of invoice date.', {
    x: margin,
    y: totalY,
    size: 10,
    font: font,
    color: rgb(0.4, 0.4, 0.4),
  });

  totalY -= 20;
  page.drawText(`Thank you for your business! For questions about this invoice, please contact us at ${companySettings.email || ''}.`, {
    x: margin,
    y: totalY,
    size: 10,
    font: font,
    color: rgb(0.4, 0.4, 0.4),
    maxWidth: width - 2 * margin,
  });

  // Notes section (if exists)
  if (invoiceData.notes) {
    totalY -= 40;
    page.drawText('Notes:', {
      x: margin,
      y: totalY,
      size: 12,
      font: boldFont,
    });

    totalY -= 15;
    page.drawText(invoiceData.notes, {
      x: margin,
      y: totalY,
      size: 10,
      font: font,
      maxWidth: width - 2 * margin,
    });
  }

  // Footer - matching HTML
  page.drawText(`Generated on ${new Date().toLocaleDateString()} by ${companySettings.company_name}`, {
    x: margin,
    y: 40,
    size: 8,
    font: font,
    color: rgb(0.5, 0.5, 0.5),
  });

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
};