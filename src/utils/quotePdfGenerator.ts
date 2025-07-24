import jsPDF from 'jspdf';
import QRCode from 'qrcode';

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
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  let yPosition = margin;

  // Helper function to add text with auto line breaks
  const addText = (text: string, x: number, y: number, maxWidth?: number, fontSize: number = 10) => {
    doc.setFontSize(fontSize);
    if (maxWidth) {
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, y);
      return y + (lines.length * fontSize * 0.4);
    } else {
      doc.text(text, x, y);
      return y + (fontSize * 0.4);
    }
  };

  // Helper function to format currency
  const formatCurrency = (amount: number) => {
    return `${companySettings.currency_symbol} ${amount.toLocaleString()}`;
  };

  // Helper function to convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };

  // Header with professional design
  // Add colored header background
  const primaryColor = companySettings.primary_color || '#000000';
  const rgb = hexToRgb(primaryColor);
  doc.setFillColor(rgb.r, rgb.g, rgb.b);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  // Add company logo
  if (companySettings.logo_url) {
    try {
      // Create a promise to load the image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      // Load image as base64 for PDF
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 60;
      canvas.height = 30;
      
      img.onload = () => {
        ctx?.drawImage(img, 0, 0, 60, 30);
        const logoDataUrl = canvas.toDataURL('image/png');
        doc.addImage(logoDataUrl, 'PNG', margin, 8, 60, 30);
      };
      img.src = companySettings.logo_url;
      
      // Company name next to logo
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text(companySettings.company_name, margin + 70, 25);
      yPosition = 50;
    } catch (error) {
      console.warn('Could not load logo:', error);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text(companySettings.company_name, margin, 25);
      yPosition = 50;
    }
  } else {
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text(companySettings.company_name, margin, 25);
    yPosition = 50;
  }
  
  // Reset text color for body content
  doc.setTextColor(0, 0, 0);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  if (companySettings.address) {
    yPosition = addText(companySettings.address, margin, yPosition, pageWidth - 2 * margin);
  }
  if (companySettings.phone) {
    yPosition = addText(`Phone: ${companySettings.phone}`, margin, yPosition) + 5;
  }
  if (companySettings.email) {
    yPosition = addText(`Email: ${companySettings.email}`, margin, yPosition) + 10;
  }

  // Quote Title with styling
  const titleBg = hexToRgb(companySettings.primary_color || '#000000');
  doc.setFillColor(titleBg.r, titleBg.g, titleBg.b, 0.1);
  doc.rect(pageWidth - margin - 90, yPosition - 5, 85, 20, 'F');
  
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(titleBg.r, titleBg.g, titleBg.b);
  doc.text("QUOTATION", pageWidth - margin - 80, yPosition + 8);
  doc.setTextColor(0, 0, 0);

  // Quote Details (Top Right)
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const rightColumnX = pageWidth - margin - 80;
  let rightY = margin + 30;

  rightY = addText(`Quote #: QTE-${quoteData.id.slice(0, 8)}`, rightColumnX, rightY) + 5;
  rightY = addText(`Date: ${new Date(quoteData.created_at).toLocaleDateString()}`, rightColumnX, rightY) + 5;
  if (quoteData.valid_until) {
    rightY = addText(`Valid Until: ${new Date(quoteData.valid_until).toLocaleDateString()}`, rightColumnX, rightY) + 5;
  }
  rightY = addText(`Status: ${quoteData.status.toUpperCase()}`, rightColumnX, rightY) + 10;

  // QR Code for quote tracking
  try {
    const qrData = `${window.location.origin}/admin/quotes/${quoteData.id}`;
    const qrCodeDataURL = await QRCode.toDataURL(qrData, { width: 60, margin: 1 });
    
    // Add QR code to top right corner
    doc.addImage(qrCodeDataURL, 'PNG', pageWidth - margin - 60, margin, 50, 50);
    
    // Add QR code label
    doc.setFontSize(8);
    doc.text('Scan to view', pageWidth - margin - 60, margin + 60);
  } catch (error) {
    console.warn('Could not generate QR code:', error);
  }

  // Horizontal line
  yPosition = Math.max(yPosition, rightY) + 10;
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 15;

  // Quote For Section
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Quote For:", margin, yPosition);
  yPosition += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  yPosition = addText(quoteData.customers.name, margin, yPosition) + 5;
  yPosition = addText(`Customer ID: ${quoteData.customers.customer_display_id}`, margin, yPosition) + 5;
  yPosition = addText(quoteData.customers.email, margin, yPosition) + 5;
  if (quoteData.customers.phone) {
    yPosition = addText(quoteData.customers.phone, margin, yPosition) + 5;
  }
  if (quoteData.customers.address) {
    yPosition = addText(quoteData.customers.address, margin, yPosition, pageWidth / 2) + 10;
  }

  yPosition += 10;

  // Service Information
  if (quoteData.services) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Service Details:", margin, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    yPosition = addText(`Service: ${quoteData.services.name}`, margin, yPosition) + 5;
    if (quoteData.services.description) {
      yPosition = addText(`Description: ${quoteData.services.description}`, margin, yPosition, pageWidth - 2 * margin) + 10;
    }
    yPosition += 10;
  }

  // Items Table Header (if quote items exist)
  if (quoteData.quote_items && quoteData.quote_items.length > 0) {
    const tableStartY = yPosition;
    const colWidths = {
      description: 80,
      quantity: 25,
      unitPrice: 30,
      total: 30
    };
    
    const tableX = margin;
    
    // Table headers with professional styling
    const headerBg = hexToRgb(companySettings.primary_color || '#000000');
    doc.setFillColor(headerBg.r, headerBg.g, headerBg.b);
    doc.rect(tableX, yPosition, colWidths.description + colWidths.quantity + colWidths.unitPrice + colWidths.total, 12, 'F');
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("Description", tableX + 2, yPosition + 8);
    doc.text("Qty", tableX + colWidths.description + 2, yPosition + 8);
    doc.text("Unit Price", tableX + colWidths.description + colWidths.quantity + 2, yPosition + 8);
    doc.text("Total", tableX + colWidths.description + colWidths.quantity + colWidths.unitPrice + 2, yPosition + 8);
    doc.setTextColor(0, 0, 0);
    
    yPosition += 12;

    // Table rows with alternating colors
    doc.setFont("helvetica", "normal");
    quoteData.quote_items.forEach((item, index) => {
      const rowHeight = 10;
      
      // Alternating row colors
      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(tableX, yPosition, colWidths.description + colWidths.quantity + colWidths.unitPrice + colWidths.total, rowHeight, 'F');
      }
      
      // Row border
      doc.setDrawColor(220, 220, 220);
      doc.rect(tableX, yPosition, colWidths.description + colWidths.quantity + colWidths.unitPrice + colWidths.total, rowHeight);
      
      // Add text
      doc.setFontSize(9);
      doc.text(item.description, tableX + 2, yPosition + 6);
      doc.text(item.quantity.toString(), tableX + colWidths.description + 8, yPosition + 6, { align: 'center' });
      doc.text(formatCurrency(item.unit_price), tableX + colWidths.description + colWidths.quantity + 2, yPosition + 6);
      doc.text(formatCurrency(item.total_price), tableX + colWidths.description + colWidths.quantity + colWidths.unitPrice + 2, yPosition + 6);
      
      yPosition += rowHeight;
    });

    yPosition += 10;
  }

  // Quote Total
  if (quoteData.quoted_price) {
    const totalsX = pageWidth - margin - 80;
    
    // Total line
    doc.setLineWidth(0.5);
    doc.line(totalsX - 5, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    yPosition = addText(`Total Quote: ${formatCurrency(quoteData.quoted_price)}`, totalsX, yPosition) + 15;
  }

  // Notes section
  if (quoteData.notes) {
    yPosition += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    yPosition = addText("Notes:", margin, yPosition) + 5;
    
    doc.setFont("helvetica", "normal");
    yPosition = addText(quoteData.notes, margin, yPosition, pageWidth - 2 * margin) + 10;
  }

  // Terms and Conditions
  yPosition += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  yPosition = addText("Terms & Conditions:", margin, yPosition) + 5;
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const terms = [
    "• This quote is valid for 30 days from the date of issue",
    "• Prices are subject to change without notice",
    "• Payment terms: 50% deposit, balance on completion",
    "• Additional charges may apply for changes to specifications"
  ];
  
  terms.forEach(term => {
    yPosition = addText(term, margin, yPosition, pageWidth - 2 * margin) + 3;
  });

  // Footer
  yPosition = pageHeight - 40;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Thank you for considering our services!", margin, yPosition);
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth - margin - 50, yPosition);

  // Return PDF as blob
  return doc.output('blob');
};