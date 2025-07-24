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
  
  // Helper function to convert hex to rgb
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255
    } : { r: 0, g: 0, b: 0 };
  };

  // Helper function to format currency
  const formatCurrency = (amount: number) => {
    return `${companySettings.currency_symbol} ${amount.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  const primaryColor = hexToRgb(companySettings.primary_color || '#000000');
  const margin = 50;
  let yPosition = height - margin;

  // Header background
  page.drawRectangle({
    x: 0,
    y: height - 80,
    width: width,
    height: 80,
    color: rgb(primaryColor.r, primaryColor.g, primaryColor.b),
  });

  // Company name
  page.drawText(companySettings.company_name, {
    x: margin,
    y: height - 40,
    size: 24,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  // Invoice title
  page.drawText('INVOICE', {
    x: width - margin - 100,
    y: height - 40,
    size: 28,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  yPosition = height - 100;

  // Company details
  page.drawText(companySettings.address || '', {
    x: margin,
    y: yPosition,
    size: 10,
    font: font,
    color: rgb(0.3, 0.3, 0.3),
  });

  yPosition -= 15;
  page.drawText(`Phone: ${companySettings.phone || ''}`, {
    x: margin,
    y: yPosition,
    size: 10,
    font: font,
    color: rgb(0.3, 0.3, 0.3),
  });

  yPosition -= 15;
  page.drawText(`Email: ${companySettings.email || ''}`, {
    x: margin,
    y: yPosition,
    size: 10,
    font: font,
    color: rgb(0.3, 0.3, 0.3),
  });

  // Invoice details (right side)
  const rightX = width - margin - 150;
  let rightY = height - 100;

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

  if (invoiceData.due_date) {
    rightY -= 15;
    page.drawText(`Due Date: ${new Date(invoiceData.due_date).toLocaleDateString()}`, {
      x: rightX,
      y: rightY,
      size: 10,
      font: font,
    });
  }

  rightY -= 15;
  page.drawText(`Status: ${invoiceData.status.toUpperCase()}`, {
    x: rightX,
    y: rightY,
    size: 10,
    font: boldFont,
  });

  // Horizontal line
  yPosition = Math.min(yPosition - 20, rightY - 20);
  page.drawLine({
    start: { x: margin, y: yPosition },
    end: { x: width - margin, y: yPosition },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });

  yPosition -= 30;

  // Bill To section
  page.drawText('Bill To:', {
    x: margin,
    y: yPosition,
    size: 12,
    font: boldFont,
  });

  yPosition -= 20;
  page.drawText(invoiceData.customers.name, {
    x: margin,
    y: yPosition,
    size: 11,
    font: boldFont,
  });

  yPosition -= 15;
  page.drawText(`Customer ID: ${invoiceData.customers.customer_display_id}`, {
    x: margin,
    y: yPosition,
    size: 10,
    font: font,
  });

  yPosition -= 15;
  page.drawText(invoiceData.customers.email, {
    x: margin,
    y: yPosition,
    size: 10,
    font: font,
  });

  if (invoiceData.customers.phone) {
    yPosition -= 15;
    page.drawText(invoiceData.customers.phone, {
      x: margin,
      y: yPosition,
      size: 10,
      font: font,
    });
  }

  if (invoiceData.customers.address) {
    yPosition -= 15;
    page.drawText(invoiceData.customers.address, {
      x: margin,
      y: yPosition,
      size: 10,
      font: font,
    });
  }

  yPosition -= 40;

  // Items table header
  const tableY = yPosition;
  const colWidths = [250, 80, 100, 100];
  const colX = [margin, margin + colWidths[0], margin + colWidths[0] + colWidths[1], margin + colWidths[0] + colWidths[1] + colWidths[2]];

  // Table header background
  page.drawRectangle({
    x: margin,
    y: tableY - 5,
    width: colWidths.reduce((a, b) => a + b, 0),
    height: 25,
    color: rgb(primaryColor.r, primaryColor.g, primaryColor.b),
  });

  // Table headers
  page.drawText('Description', {
    x: colX[0] + 5,
    y: tableY + 5,
    size: 10,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  page.drawText('Qty', {
    x: colX[1] + 5,
    y: tableY + 5,
    size: 10,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  page.drawText('Unit Price', {
    x: colX[2] + 5,
    y: tableY + 5,
    size: 10,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  page.drawText('Total', {
    x: colX[3] + 5,
    y: tableY + 5,
    size: 10,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  let itemY = tableY - 25;

  // Table rows
  invoiceData.invoice_items.forEach((item, index) => {
    // Alternating row colors
    if (index % 2 === 0) {
      page.drawRectangle({
        x: margin,
        y: itemY - 5,
        width: colWidths.reduce((a, b) => a + b, 0),
        height: 20,
        color: rgb(0.98, 0.98, 0.98),
      });
    }

    page.drawText(item.description, {
      x: colX[0] + 5,
      y: itemY,
      size: 9,
      font: font,
    });

    page.drawText(item.quantity.toString(), {
      x: colX[1] + 20,
      y: itemY,
      size: 9,
      font: font,
    });

    page.drawText(formatCurrency(item.unit_price), {
      x: colX[2] + 5,
      y: itemY,
      size: 9,
      font: font,
    });

    page.drawText(formatCurrency(item.total_price), {
      x: colX[3] + 5,
      y: itemY,
      size: 9,
      font: font,
    });

    itemY -= 20;
  });

  // Totals section
  const totalX = width - margin - 150;
  let totalY = itemY - 20;

  page.drawText(`Subtotal: ${formatCurrency(invoiceData.subtotal)}`, {
    x: totalX,
    y: totalY,
    size: 10,
    font: font,
  });

  if (invoiceData.discount_amount > 0) {
    totalY -= 15;
    page.drawText(`Discount: ${formatCurrency(invoiceData.discount_amount)}`, {
      x: totalX,
      y: totalY,
      size: 10,
      font: font,
    });
  }

  if (invoiceData.tax_amount > 0) {
    totalY -= 15;
    page.drawText(`Tax: ${formatCurrency(invoiceData.tax_amount)}`, {
      x: totalX,
      y: totalY,
      size: 10,
      font: font,
    });
  }

  // Total line
  totalY -= 10;
  page.drawLine({
    start: { x: totalX - 10, y: totalY },
    end: { x: width - margin, y: totalY },
    thickness: 1,
    color: rgb(0.5, 0.5, 0.5),
  });

  totalY -= 20;
  page.drawText(`Total: ${formatCurrency(invoiceData.total_amount)}`, {
    x: totalX,
    y: totalY,
    size: 12,
    font: boldFont,
  });

  if (invoiceData.paid_amount > 0) {
    totalY -= 15;
    page.drawText(`Paid: ${formatCurrency(invoiceData.paid_amount)}`, {
      x: totalX,
      y: totalY,
      size: 10,
      font: font,
    });
  }

  if (invoiceData.balance_due && invoiceData.balance_due > 0) {
    totalY -= 15;
    page.drawText(`Balance Due: ${formatCurrency(invoiceData.balance_due)}`, {
      x: totalX,
      y: totalY,
      size: 12,
      font: boldFont,
      color: rgb(0.8, 0, 0),
    });
  }

  // Notes section
  if (invoiceData.notes) {
    totalY -= 40;
    page.drawText('Notes:', {
      x: margin,
      y: totalY,
      size: 10,
      font: boldFont,
    });

    totalY -= 15;
    page.drawText(invoiceData.notes, {
      x: margin,
      y: totalY,
      size: 9,
      font: font,
      maxWidth: width - 2 * margin,
    });
  }

  // Footer
  page.drawText('Thank you for your business!', {
    x: margin,
    y: 60,
    size: 8,
    font: font,
    color: rgb(0.5, 0.5, 0.5),
  });

  page.drawText(`Generated on ${new Date().toLocaleDateString()}`, {
    x: width - margin - 120,
    y: 60,
    size: 8,
    font: font,
    color: rgb(0.5, 0.5, 0.5),
  });

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
};