import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { QuotePDF } from '../components/pdf/QuotePDF';

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
  const pdfBlob = await pdf(
    React.createElement(QuotePDF, { quoteData, companySettings }) as any
  ).toBlob();
  
  return pdfBlob;
};