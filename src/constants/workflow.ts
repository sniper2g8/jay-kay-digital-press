// Workflow and status constants
export const JOB_STATUSES = [
  { id: 1, name: 'Pending', description: 'Job received, awaiting processing', color: 'yellow' },
  { id: 2, name: 'Received', description: 'Job confirmed and files received', color: 'blue' },
  { id: 3, name: 'Processing', description: 'Preparing files for printing', color: 'blue' },
  { id: 4, name: 'Printing', description: 'Currently being printed', color: 'purple' },
  { id: 5, name: 'Finishing', description: 'Adding finishing touches', color: 'orange' },
  { id: 6, name: 'Waiting for Collection', description: 'Ready for customer pickup', color: 'green' },
  { id: 7, name: 'Out for Delivery', description: 'Being delivered to customer', color: 'blue' },
  { id: 8, name: 'Completed', description: 'Job completed successfully', color: 'green' },
  { id: 9, name: 'Cancelled', description: 'Job was cancelled', color: 'red' }
] as const;

export const DELIVERY_METHODS = [
  'Collection',
  'Local Delivery',
  'Nationwide Delivery',
  'Express Delivery'
] as const;

export const PAYMENT_METHODS = [
  'cash',
  'mobile_money',
  'bank_transfer',
  'card'
] as const;

export const INVOICE_STATUSES = [
  'draft',
  'sent', 
  'paid',
  'overdue',
  'cancelled'
] as const;

export const QUOTE_STATUSES = [
  'requested',
  'reviewed',
  'approved',
  'rejected',
  'expired'
] as const;

export type JobStatus = typeof JOB_STATUSES[number];
export type DeliveryMethod = typeof DELIVERY_METHODS[number];
export type PaymentMethod = typeof PAYMENT_METHODS[number];
export type InvoiceStatus = typeof INVOICE_STATUSES[number];
export type QuoteStatus = typeof QUOTE_STATUSES[number];