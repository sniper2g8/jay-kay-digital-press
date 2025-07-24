import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

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

interface QuotePDFProps {
  quoteData: QuoteData;
  companySettings: CompanySettings;
}

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 0,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    backgroundColor: '#2563eb',
    color: 'white',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  quoteTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  companyDetails: {
    flex: 1,
  },
  companyText: {
    fontSize: 10,
    color: '#666666',
    marginBottom: 3,
  },
  quoteDetails: {
    flex: 1,
    alignItems: 'flex-end',
  },
  quoteDetailRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  label: {
    fontSize: 10,
    marginRight: 5,
  },
  value: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#cccccc',
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  customerSection: {
    marginBottom: 25,
  },
  customerName: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  customerText: {
    fontSize: 10,
    color: '#666666',
    marginBottom: 3,
  },
  projectSection: {
    marginBottom: 25,
  },
  projectTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 15,
  },
  serviceSection: {
    marginBottom: 25,
  },
  serviceText: {
    fontSize: 10,
    marginBottom: 3,
  },
  table: {
    border: '1px solid #ddd',
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2563eb',
    color: 'white',
    padding: 8,
  },
  tableHeaderCell: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '1px solid #f0f0f0',
  },
  tableRowAlt: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#fafafa',
    borderBottom: '1px solid #f0f0f0',
  },
  tableCell: {
    fontSize: 9,
  },
  descriptionCell: {
    width: '45%',
  },
  quantityCell: {
    width: '15%',
    textAlign: 'center',
  },
  priceCell: {
    width: '20%',
    textAlign: 'right',
  },
  totalCell: {
    width: '20%',
    textAlign: 'right',
  },
  totalSection: {
    alignItems: 'flex-end',
    marginBottom: 30,
  },
  totalLine: {
    width: 150,
    height: 2,
    backgroundColor: '#2563eb',
    marginBottom: 10,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  notesSection: {
    marginBottom: 30,
  },
  notesText: {
    fontSize: 10,
    lineHeight: 1.4,
  },
  termsSection: {
    marginBottom: 30,
  },
  termItem: {
    fontSize: 9,
    marginBottom: 3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    borderTop: '1px solid #eee',
  },
  footerText: {
    fontSize: 8,
    color: '#999999',
  },
});

const formatCurrency = (amount: number, symbol: string) => {
  return `${symbol} ${amount.toLocaleString('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
};

export const QuotePDF: React.FC<QuotePDFProps> = ({ quoteData, companySettings }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>{companySettings.company_name}</Text>
          <Text style={styles.quoteTitle}>QUOTATION</Text>
        </View>

        <View style={styles.content}>
          {/* Top Section */}
          <View style={styles.topSection}>
            <View style={styles.companyDetails}>
              {companySettings.address && (
                <Text style={styles.companyText}>{companySettings.address}</Text>
              )}
              <Text style={styles.companyText}>Phone: {companySettings.phone || ''}</Text>
              <Text style={styles.companyText}>Email: {companySettings.email || ''}</Text>
            </View>
            
            <View style={styles.quoteDetails}>
              <View style={styles.quoteDetailRow}>
                <Text style={styles.label}>Quote #:</Text>
                <Text style={styles.value}>QTE-{quoteData.id.slice(0, 8)}</Text>
              </View>
              <View style={styles.quoteDetailRow}>
                <Text style={styles.label}>Date:</Text>
                <Text style={styles.value}>{new Date(quoteData.created_at).toLocaleDateString()}</Text>
              </View>
              {quoteData.valid_until && (
                <View style={styles.quoteDetailRow}>
                  <Text style={styles.label}>Valid Until:</Text>
                  <Text style={styles.value}>{new Date(quoteData.valid_until).toLocaleDateString()}</Text>
                </View>
              )}
              <View style={styles.quoteDetailRow}>
                <Text style={styles.label}>Status:</Text>
                <Text style={styles.value}>{quoteData.status.toUpperCase()}</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Quote For */}
          <View style={styles.customerSection}>
            <Text style={styles.sectionTitle}>Quote For:</Text>
            <Text style={styles.customerName}>{quoteData.customers.name}</Text>
            <Text style={styles.customerText}>Customer ID: {quoteData.customers.customer_display_id}</Text>
            <Text style={styles.customerText}>{quoteData.customers.email}</Text>
            {quoteData.customers.phone && (
              <Text style={styles.customerText}>{quoteData.customers.phone}</Text>
            )}
            {quoteData.customers.address && (
              <Text style={styles.customerText}>{quoteData.customers.address}</Text>
            )}
          </View>

          {/* Project */}
          <View style={styles.projectSection}>
            <Text style={styles.projectTitle}>Project: {quoteData.title}</Text>
          </View>

          {/* Service Details */}
          {quoteData.services && (
            <View style={styles.serviceSection}>
              <Text style={styles.sectionTitle}>Service Details:</Text>
              <Text style={styles.serviceText}>Service: {quoteData.services.name}</Text>
              {quoteData.services.description && (
                <Text style={styles.serviceText}>Description: {quoteData.services.description}</Text>
              )}
            </View>
          )}

          {/* Items Table */}
          {quoteData.quote_items && quoteData.quote_items.length > 0 && (
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, styles.descriptionCell]}>Description</Text>
                <Text style={[styles.tableHeaderCell, styles.quantityCell]}>Qty</Text>
                <Text style={[styles.tableHeaderCell, styles.priceCell]}>Unit Price</Text>
                <Text style={[styles.tableHeaderCell, styles.totalCell]}>Total</Text>
              </View>
              {quoteData.quote_items.map((item, index) => (
                <View key={index} style={index % 2 === 0 ? styles.tableRowAlt : styles.tableRow}>
                  <Text style={[styles.tableCell, styles.descriptionCell]}>{item.description}</Text>
                  <Text style={[styles.tableCell, styles.quantityCell]}>{item.quantity}</Text>
                  <Text style={[styles.tableCell, styles.priceCell]}>
                    {formatCurrency(item.unit_price, companySettings.currency_symbol)}
                  </Text>
                  <Text style={[styles.tableCell, styles.totalCell]}>
                    {formatCurrency(item.total_price, companySettings.currency_symbol)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Total */}
          {quoteData.quoted_price && (
            <View style={styles.totalSection}>
              <View style={styles.totalLine} />
              <Text style={styles.totalAmount}>
                Total Quote: {formatCurrency(quoteData.quoted_price, companySettings.currency_symbol)}
              </Text>
            </View>
          )}

          {/* Notes */}
          {quoteData.notes && (
            <View style={styles.notesSection}>
              <Text style={styles.sectionTitle}>Notes:</Text>
              <Text style={styles.notesText}>{quoteData.notes}</Text>
            </View>
          )}

          {/* Terms & Conditions */}
          <View style={styles.termsSection}>
            <Text style={styles.sectionTitle}>Terms & Conditions:</Text>
            <Text style={styles.termItem}>• This quote is valid for 30 days from the date of issue</Text>
            <Text style={styles.termItem}>• Prices are subject to change without notice</Text>
            <Text style={styles.termItem}>• Payment terms: 50% deposit, balance on completion</Text>
            <Text style={styles.termItem}>• Additional charges may apply for changes to specifications</Text>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Thank you for considering our services!</Text>
            <Text style={styles.footerText}>Generated on {new Date().toLocaleDateString()}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};