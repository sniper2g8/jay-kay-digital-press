import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

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

interface InvoicePDFProps {
  invoiceData: InvoiceData;
  companySettings: CompanySettings;
}

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 20,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 40,
  },
  companyInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  logo: {
    width: 50,
    height: 30,
    marginRight: 10,
  },
  companyDetails: {
    flexDirection: 'column',
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  companyText: {
    fontSize: 9,
    color: '#666666',
    marginBottom: 2,
  },
  invoiceTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  invoiceDetails: {
    marginTop: 10,
    textAlign: 'right',
  },
  invoiceDetailRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 3,
  },
  label: {
    fontWeight: 'bold',
    marginRight: 5,
  },
  mainContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  billTo: {
    flex: 1,
    marginRight: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  customerName: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  customerText: {
    fontSize: 9,
    color: '#666666',
    marginBottom: 2,
  },
  invoiceDetailsSection: {
    flex: 1,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  detailLabel: {
    width: 60,
    fontSize: 9,
    color: '#666666',
  },
  detailValue: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  itemsSection: {
    marginBottom: 20,
  },
  table: {
    border: '1px solid #ddd',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f8f8',
    padding: 8,
    borderBottom: '1px solid #ddd',
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
  tableCell: {
    fontSize: 9,
  },
  descriptionCell: {
    width: '50%',
  },
  quantityCell: {
    width: '15%',
  },
  priceCell: {
    width: '17.5%',
  },
  totalCell: {
    width: '17.5%',
    fontWeight: 'bold',
  },
  totalsSection: {
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 5,
    width: 200,
  },
  totalLabel: {
    fontSize: 10,
    color: '#666666',
    width: 80,
  },
  totalValue: {
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'right',
    width: 80,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTop: '1px solid #ddd',
    paddingTop: 5,
    width: 200,
  },
  grandTotalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    width: 80,
  },
  grandTotalValue: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'right',
    width: 80,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 30,
  },
  paymentTerms: {
    flex: 1,
  },
  termsTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  termsText: {
    fontSize: 9,
    color: '#666666',
    marginBottom: 8,
  },
  qrSection: {
    alignItems: 'center',
  },
  qrLabel: {
    fontSize: 7,
    color: '#666666',
    marginTop: 5,
  },
  footerLine: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: '#ddd',
  },
  footerText: {
    position: 'absolute',
    bottom: 15,
    left: 0,
    right: 0,
    fontSize: 8,
    color: '#999999',
    textAlign: 'center',
  },
});

const formatCurrency = (amount: number, symbol: string) => {
  return `${symbol} ${amount.toFixed(2)}`;
};

export const InvoicePDF: React.FC<InvoicePDFProps> = ({ invoiceData, companySettings }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            {companySettings.logo_url && (
              <Image src={companySettings.logo_url} style={styles.logo} />
            )}
            <View style={styles.companyDetails}>
              <Text style={styles.companyName}>{companySettings.company_name}</Text>
              {companySettings.address && (
                <Text style={styles.companyText}>{companySettings.address}</Text>
              )}
              <Text style={styles.companyText}>Phone: {companySettings.phone || ''}</Text>
              <Text style={styles.companyText}>Email: {companySettings.email || ''}</Text>
              {companySettings.website && (
                <Text style={styles.companyText}>Website: {companySettings.website}</Text>
              )}
            </View>
          </View>
          
          <View>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <View style={styles.invoiceDetails}>
              <View style={styles.invoiceDetailRow}>
                <Text style={styles.label}>Invoice #:</Text>
                <Text>{invoiceData.invoice_number}</Text>
              </View>
              <View style={styles.invoiceDetailRow}>
                <Text style={styles.label}>Date:</Text>
                <Text>{new Date(invoiceData.issued_date).toLocaleDateString()}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Bill To */}
          <View style={styles.billTo}>
            <Text style={styles.sectionTitle}>Bill To:</Text>
            <Text style={styles.customerName}>{invoiceData.customers.name}</Text>
            <Text style={styles.customerText}>{invoiceData.customers.customer_display_id}</Text>
            <Text style={styles.customerText}>{invoiceData.customers.email}</Text>
            {invoiceData.customers.phone && (
              <Text style={styles.customerText}>{invoiceData.customers.phone}</Text>
            )}
            {invoiceData.customers.address && (
              <Text style={styles.customerText}>{invoiceData.customers.address}</Text>
            )}
          </View>

          {/* Invoice Details */}
          <View style={styles.invoiceDetailsSection}>
            <Text style={styles.sectionTitle}>Invoice Details:</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status:</Text>
              <Text style={styles.detailValue}>
                {invoiceData.status.charAt(0).toUpperCase() + invoiceData.status.slice(1)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Service:</Text>
              <Text style={styles.detailValue}>Print Services</Text>
            </View>
          </View>
        </View>

        {/* Items */}
        <View style={styles.itemsSection}>
          <Text style={styles.sectionTitle}>Items:</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.descriptionCell]}>Description</Text>
              <Text style={[styles.tableHeaderCell, styles.quantityCell]}>Quantity</Text>
              <Text style={[styles.tableHeaderCell, styles.priceCell]}>Unit Price</Text>
              <Text style={[styles.tableHeaderCell, styles.priceCell]}>Total</Text>
            </View>
            {invoiceData.invoice_items.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.descriptionCell]}>
                  {item.description.substring(0, 40)}
                </Text>
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
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(invoiceData.subtotal, companySettings.currency_symbol)}
            </Text>
          </View>
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total:</Text>
            <Text style={styles.grandTotalValue}>
              {formatCurrency(invoiceData.total_amount, companySettings.currency_symbol)}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.paymentTerms}>
            <Text style={styles.termsTitle}>Payment Terms:</Text>
            <Text style={styles.termsText}>Payment is due within 30 days of invoice date.</Text>
            <Text style={styles.termsText}>
              Thank you for your business! For questions about this invoice, please contact us at {companySettings.email || ''}.
            </Text>
          </View>
        </View>

        {/* Footer Line and Text */}
        <View style={styles.footerLine} />
        <Text style={styles.footerText}>
          Generated on {new Date().toLocaleDateString()} by {companySettings.company_name}
        </Text>
      </Page>
    </Document>
  );
};