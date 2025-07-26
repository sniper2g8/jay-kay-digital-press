// Dynamic loader for PDF functionality to reduce initial bundle size
export const loadPdfGenerator = async () => {
  const { generateInvoicePDF } = await import('./pdfGenerator');
  return { generateInvoicePDF };
};

export const loadQuotePdfGenerator = async () => {
  const { generateQuotePDF } = await import('./quotePdfGenerator');
  return { generateQuotePDF };
};

// Lazy load PDF components
export const loadInvoicePDF = async () => {
  const { InvoicePDF } = await import('../components/pdf/InvoicePDF');
  return InvoicePDF;
};

export const loadQuotePDF = async () => {
  const { QuotePDF } = await import('../components/pdf/QuotePDF');
  return QuotePDF;
};

export const loadStatementPdfGenerator = async () => {
  const { generateStatementPDF } = await import('./statementPdfGenerator');
  return { generateStatementPDF };
};

export const loadStatementPDF = async () => {
  const { StatementPDF } = await import('../components/pdf/StatementPDF');
  return StatementPDF;
};