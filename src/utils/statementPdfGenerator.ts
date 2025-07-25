import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { StatementPDF } from '../components/pdf/StatementPDF';
import QRCode from 'qrcode';

interface StatementData {
  jobs: any[];
  invoices: any[];
  payments: any[];
  totalJobs: number;
  totalInvoiced: number;
  totalPaid: number;
  outstandingBalance: number;
}

interface CompanySettings {
  company_name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  currency_symbol: string;
}

export const generateStatementPDF = async (
  statementData: StatementData,
  customer: any,
  period: string,
  companySettings: CompanySettings
): Promise<Blob> => {
  // Generate QR code for statement verification
  const statementUrl = `${window.location.origin}/verify-statement?id=${customer.id}&period=${period}`;
  const qrCodeDataUrl = await QRCode.toDataURL(statementUrl, {
    width: 200,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  });

  const pdfBlob = await pdf(
    React.createElement(StatementPDF, {
      statementData,
      customer,
      period,
      companySettings,
      qrCodeUrl: qrCodeDataUrl
    }) as any
  ).toBlob();
  
  return pdfBlob;
};