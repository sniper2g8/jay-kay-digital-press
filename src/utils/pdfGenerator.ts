import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { InvoicePDF } from '../components/pdf/InvoicePDF';

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
  const pdfBlob = await pdf(
    React.createElement(InvoicePDF, { invoiceData, companySettings }) as any
  ).toBlob();
  
  return pdfBlob;
};