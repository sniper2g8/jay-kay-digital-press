import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { format } from 'date-fns';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    borderBottom: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 20,
  },
  logo: {
    width: 100,
    height: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 5,
  },
  companyInfo: {
    textAlign: 'right',
    fontSize: 10,
    color: '#6b7280',
  },
  section: {
    marginVertical: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1f2937',
    borderBottom: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 5,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 5,
    borderBottom: 1,
    borderBottomColor: '#f3f4f6',
  },
  summaryCard: {
    backgroundColor: '#f9fafb',
    padding: 15,
    margin: 5,
    borderRadius: 5,
    border: 1,
    borderColor: '#e5e7eb',
    textAlign: 'center',
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 5,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    paddingVertical: 8,
    paddingHorizontal: 5,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 5,
    borderBottom: 1,
    borderBottomColor: '#f3f4f6',
  },
  col1: { width: '12%' },
  col2: { width: '20%' },
  col3: { width: '25%' },
  col4: { width: '8%' },
  col5: { width: '15%' },
  col6: { width: '12%' },
  col7: { width: '8%', textAlign: 'right' },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
    fontSize: 8,
    color: '#6b7280',
  },
  qrCode: {
    width: 60,
    height: 60,
  },
});

interface StatementPDFProps {
  statementData: {
    jobs: any[];
    invoices: any[];
    payments: any[];
    totalJobs: number;
    totalInvoiced: number;
    totalPaid: number;
    outstandingBalance: number;
  };
  customer: any;
  period: string;
  companySettings: {
    company_name: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    logo_url: string | null;
    currency_symbol: string;
  };
  qrCodeUrl?: string;
}

export const StatementPDF: React.FC<StatementPDFProps> = ({
  statementData,
  customer,
  period,
  companySettings,
  qrCodeUrl
}) => {
  const { jobs, invoices, payments, totalJobs, totalInvoiced, totalPaid, outstandingBalance } = statementData;

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case "current_month": return "Current Month";
      case "last_3_months": return "Last 3 Months";
      case "last_6_months": return "Last 6 Months";
      case "all_time": return "All Time";
      default: return "Current Month";
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            {companySettings.logo_url && (
              <Image style={styles.logo} src={companySettings.logo_url} />
            )}
            <Text style={styles.title}>{companySettings.company_name}</Text>
            {companySettings.address && (
              <Text style={styles.companyInfo}>{companySettings.address}</Text>
            )}
            {companySettings.phone && (
              <Text style={styles.companyInfo}>Tel: {companySettings.phone}</Text>
            )}
            {companySettings.email && (
              <Text style={styles.companyInfo}>Email: {companySettings.email}</Text>
            )}
          </View>
          <View style={styles.companyInfo}>
            <Text style={styles.title}>Customer Statement</Text>
            <Text style={styles.subtitle}>Period: {getPeriodLabel(period)}</Text>
            <Text style={styles.subtitle}>Generated: {format(new Date(), 'MMM dd, yyyy')}</Text>
            <Text style={styles.subtitle}>Customer: {customer.name}</Text>
            <Text style={styles.subtitle}>ID: {customer.customer_display_id}</Text>
          </View>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Total Jobs</Text>
            <Text style={styles.summaryValue}>{totalJobs}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Total Invoiced</Text>
            <Text style={styles.summaryValue}>{companySettings.currency_symbol} {totalInvoiced.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Total Paid</Text>
            <Text style={styles.summaryValue}>{companySettings.currency_symbol} {totalPaid.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Outstanding Balance</Text>
            <Text style={[styles.summaryValue, { color: outstandingBalance > 0 ? '#dc2626' : '#16a34a' }]}>
              {companySettings.currency_symbol} {outstandingBalance.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Jobs Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Jobs Summary</Text>
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>Job ID</Text>
            <Text style={styles.col2}>Service Type</Text>
            <Text style={styles.col3}>Job Title</Text>
            <Text style={styles.col4}>Qty</Text>
            <Text style={styles.col5}>Status</Text>
            <Text style={styles.col6}>Date</Text>
            <Text style={styles.col7}>Amount</Text>
          </View>
          {jobs.map((job) => (
            <View key={job.id} style={styles.tableRow}>
              <Text style={styles.col1}>{job.tracking_code || `JKDP-${job.id.toString().padStart(4, '0')}`}</Text>
              <Text style={styles.col2}>{job.services?.name || 'N/A'}</Text>
              <Text style={styles.col3}>{job.title || job.description || 'N/A'}</Text>
              <Text style={styles.col4}>{job.quantity || 1}</Text>
              <Text style={styles.col5}>{job.workflow_status?.name || job.status}</Text>
              <Text style={styles.col6}>{format(new Date(job.created_at), 'MMM dd, yyyy')}</Text>
              <Text style={styles.col7}>
                {job.final_price ? `${companySettings.currency_symbol} ${job.final_price.toLocaleString()}` : 
                 job.quoted_price ? `${companySettings.currency_symbol} ${job.quoted_price.toLocaleString()}` : 'TBD'}
              </Text>
            </View>
          ))}
        </View>

        {/* Invoices Summary */}
        {invoices.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Invoices Summary</Text>
            {invoices.map((invoice) => (
              <View key={invoice.id} style={styles.row}>
                <Text style={{ width: '30%' }}>{invoice.invoice_number}</Text>
                <Text style={{ width: '25%' }}>{format(new Date(invoice.created_at), 'MMM dd, yyyy')}</Text>
                <Text style={{ width: '20%' }}>{invoice.status}</Text>
                <Text style={{ width: '25%', textAlign: 'right' }}>
                  {companySettings.currency_symbol} {invoice.total_amount?.toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Payments Summary */}
        {payments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payments Summary</Text>
            {payments.map((payment) => (
              <View key={payment.id} style={styles.row}>
                <Text style={{ width: '30%' }}>#{payment.reference_number || payment.id.slice(0, 8)}</Text>
                <Text style={{ width: '25%' }}>{format(new Date(payment.payment_date), 'MMM dd, yyyy')}</Text>
                <Text style={{ width: '20%' }}>{payment.payment_method}</Text>
                <Text style={{ width: '25%', textAlign: 'right' }}>
                  {companySettings.currency_symbol} {payment.amount?.toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <View>
            <Text>This statement was generated electronically and is valid without signature.</Text>
            <Text>For inquiries, contact us at {companySettings.email || companySettings.phone}</Text>
          </View>
          {qrCodeUrl && (
            <View>
              <Image style={styles.qrCode} src={qrCodeUrl} />
              <Text style={{ textAlign: 'center', marginTop: 5 }}>Verify online</Text>
            </View>
          )}
        </View>
      </Page>
    </Document>
  );
};