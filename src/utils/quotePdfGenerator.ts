import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

interface QuoteData {
  id: string;
  title: string;
  created_at: string;
  valid_until: string | null;
  status: string;
  quoted_price: number | null;
  notes: string | null;
  customers: {
    name: string;
    email: string;
    phone: string | null;
    address: string | null;
    customer_display_id: string;
  };
  services: {
    name: string;
    description: string | null;
  } | null;
  quote_items: {
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

export const generateQuotePDF = async (
  quoteData: QuoteData,
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

  // Quote title
  page.drawText('QUOTATION', {
    x: width - margin - 120,
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

  // Quote details (right side)
  const rightX = width - margin - 150;
  let rightY = height - 100;

  page.drawText(`Quote #: QTE-${quoteData.id.slice(0, 8)}`, {
    x: rightX,
    y: rightY,
    size: 10,
    font: font,
  });

  rightY -= 15;
  page.drawText(`Date: ${new Date(quoteData.created_at).toLocaleDateString()}`, {
    x: rightX,
    y: rightY,
    size: 10,
    font: font,
  });

  if (quoteData.valid_until) {
    rightY -= 15;
    page.drawText(`Valid Until: ${new Date(quoteData.valid_until).toLocaleDateString()}`, {
      x: rightX,
      y: rightY,
      size: 10,
      font: font,
    });
  }

  rightY -= 15;
  page.drawText(`Status: ${quoteData.status.toUpperCase()}`, {
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

  // Quote For section
  page.drawText('Quote For:', {
    x: margin,
    y: yPosition,
    size: 12,
    font: boldFont,
  });

  yPosition -= 20;
  page.drawText(quoteData.customers.name, {
    x: margin,
    y: yPosition,
    size: 11,
    font: boldFont,
  });

  yPosition -= 15;
  page.drawText(`Customer ID: ${quoteData.customers.customer_display_id}`, {
    x: margin,
    y: yPosition,
    size: 10,
    font: font,
  });

  yPosition -= 15;
  page.drawText(quoteData.customers.email, {
    x: margin,
    y: yPosition,
    size: 10,
    font: font,
  });

  if (quoteData.customers.phone) {
    yPosition -= 15;
    page.drawText(quoteData.customers.phone, {
      x: margin,
      y: yPosition,
      size: 10,
      font: font,
    });
  }

  if (quoteData.customers.address) {
    yPosition -= 15;
    page.drawText(quoteData.customers.address, {
      x: margin,
      y: yPosition,
      size: 10,
      font: font,
    });
  }

  yPosition -= 30;

  // Project title
  page.drawText(`Project: ${quoteData.title}`, {
    x: margin,
    y: yPosition,
    size: 14,
    font: boldFont,
    color: rgb(primaryColor.r, primaryColor.g, primaryColor.b),
  });

  yPosition -= 30;

  // Service information
  if (quoteData.services) {
    page.drawText('Service Details:', {
      x: margin,
      y: yPosition,
      size: 12,
      font: boldFont,
    });

    yPosition -= 20;
    page.drawText(`Service: ${quoteData.services.name}`, {
      x: margin,
      y: yPosition,
      size: 10,
      font: font,
    });

    if (quoteData.services.description) {
      yPosition -= 15;
      page.drawText(`Description: ${quoteData.services.description}`, {
        x: margin,
        y: yPosition,
        size: 10,
        font: font,
        maxWidth: width - 2 * margin,
      });
    }

    yPosition -= 30;
  }

  // Items table (if items exist)
  if (quoteData.quote_items && quoteData.quote_items.length > 0) {
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
    quoteData.quote_items.forEach((item, index) => {
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

    yPosition = itemY - 20;
  }

  // Quote total
  if (quoteData.quoted_price) {
    const totalX = width - margin - 150;
    yPosition -= 20;

    // Total line
    page.drawLine({
      start: { x: totalX - 10, y: yPosition },
      end: { x: width - margin, y: yPosition },
      thickness: 2,
      color: rgb(primaryColor.r, primaryColor.g, primaryColor.b),
    });

    yPosition -= 25;
    page.drawText(`Total Quote: ${formatCurrency(quoteData.quoted_price)}`, {
      x: totalX,
      y: yPosition,
      size: 16,
      font: boldFont,
      color: rgb(primaryColor.r, primaryColor.g, primaryColor.b),
    });
  }

  // Notes section
  if (quoteData.notes) {
    yPosition -= 40;
    page.drawText('Notes:', {
      x: margin,
      y: yPosition,
      size: 12,
      font: boldFont,
    });

    yPosition -= 20;
    page.drawText(quoteData.notes, {
      x: margin,
      y: yPosition,
      size: 10,
      font: font,
      maxWidth: width - 2 * margin,
    });
  }

  // Terms and conditions
  yPosition -= 60;
  page.drawText('Terms & Conditions:', {
    x: margin,
    y: yPosition,
    size: 12,
    font: boldFont,
  });

  const terms = [
    '• This quote is valid for 30 days from the date of issue',
    '• Prices are subject to change without notice',
    '• Payment terms: 50% deposit, balance on completion',
    '• Additional charges may apply for changes to specifications'
  ];

  terms.forEach(term => {
    yPosition -= 15;
    page.drawText(term, {
      x: margin,
      y: yPosition,
      size: 9,
      font: font,
    });
  });

  // Footer
  page.drawText('Thank you for considering our services!', {
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