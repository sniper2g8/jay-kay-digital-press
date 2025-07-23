// Centralized service configuration
export const SERVICE_TYPES = {
  SAV: 'SAV',
  BANNER: 'Banner', 
  BUSINESS_CARD: 'Business Card',
  FLYER: 'Flyer',
  BROCHURE: 'Brochure',
  POSTER: 'Poster',
  STICKER: 'Sticker',
  OTHER: 'Other'
} as const;

export const SAV_TYPES = [
  'Wedding SAV',
  'Birthday SAV', 
  'Corporate SAV',
  'Event SAV',
  'Custom SAV'
] as const;

export const BANNER_TYPES = [
  'Outdoor Banner',
  'Indoor Banner',
  'Vinyl Banner',
  'Mesh Banner',
  'Fabric Banner'
] as const;

export const PAPER_TYPES = [
  'A4 Paper',
  'A3 Paper',
  'A5 Paper',
  'Letter Paper',
  'Legal Paper',
  'Cardstock',
  'Photo Paper',
  'Canvas',
  'Vinyl',
  'Fabric'
] as const;

export const PAPER_WEIGHTS = [
  '70gsm',
  '80gsm',
  '100gsm',
  '120gsm',
  '150gsm',
  '200gsm',
  '250gsm',
  '300gsm'
] as const;

export const FINISHING_OPTIONS = [
  { id: 'lamination', name: 'Lamination', category: 'protection', price: 5.00 },
  { id: 'binding', name: 'Binding', category: 'assembly', price: 3.00 },
  { id: 'cutting', name: 'Professional Cutting', category: 'finishing', price: 2.00 },
  { id: 'folding', name: 'Folding', category: 'finishing', price: 1.50 },
  { id: 'perforation', name: 'Perforation', category: 'finishing', price: 2.50 },
  { id: 'embossing', name: 'Embossing', category: 'enhancement', price: 8.00 },
  { id: 'uv_coating', name: 'UV Coating', category: 'protection', price: 6.00 }
] as const;

export const DEFAULT_SERVICES = [
  {
    name: 'SAV (Save the Date)',
    description: 'Custom save the date cards for weddings and events',
    service_type: SERVICE_TYPES.SAV,
    base_price: 25.00,
    requires_dimensions: false,
    available_subtypes: SAV_TYPES,
    available_paper_types: ['Cardstock', 'Photo Paper'],
    available_paper_weights: ['150gsm', '200gsm', '250gsm'],
    available_finishes: ['lamination', 'uv_coating']
  },
  {
    name: 'Banner Printing',
    description: 'High-quality banners for indoor and outdoor use',
    service_type: SERVICE_TYPES.BANNER,
    base_price: 35.00,
    requires_dimensions: true,
    available_subtypes: BANNER_TYPES,
    available_paper_types: ['Vinyl', 'Fabric', 'Canvas'],
    available_paper_weights: ['200gsm', '250gsm', '300gsm'],
    available_finishes: ['cutting', 'embossing']
  },
  {
    name: 'Business Cards',
    description: 'Professional business cards with premium finishes',
    service_type: SERVICE_TYPES.BUSINESS_CARD,
    base_price: 15.00,
    requires_dimensions: false,
    available_subtypes: ['Standard', 'Premium', 'Luxury'],
    available_paper_types: ['Cardstock'],
    available_paper_weights: ['200gsm', '250gsm', '300gsm'],
    available_finishes: ['lamination', 'uv_coating', 'embossing']
  },
  {
    name: 'Flyers & Leaflets',
    description: 'Eye-catching flyers for marketing and promotions',
    service_type: SERVICE_TYPES.FLYER,
    base_price: 12.00,
    requires_dimensions: false,
    available_subtypes: ['A4 Flyer', 'A5 Flyer', 'Custom Size'],
    available_paper_types: ['A4 Paper', 'A5 Paper', 'Cardstock'],
    available_paper_weights: ['80gsm', '100gsm', '120gsm', '150gsm'],
    available_finishes: ['folding', 'cutting', 'lamination']
  },
  {
    name: 'Brochures',
    description: 'Multi-fold brochures for detailed information',
    service_type: SERVICE_TYPES.BROCHURE,
    base_price: 20.00,
    requires_dimensions: false,
    available_subtypes: ['Tri-fold', 'Bi-fold', 'Z-fold', 'Custom'],
    available_paper_types: ['A4 Paper', 'Cardstock'],
    available_paper_weights: ['100gsm', '120gsm', '150gsm', '200gsm'],
    available_finishes: ['folding', 'binding', 'lamination']
  },
  {
    name: 'Posters',
    description: 'Large format posters for advertising and decoration',
    service_type: SERVICE_TYPES.POSTER,
    base_price: 30.00,
    requires_dimensions: true,
    available_subtypes: ['A3 Poster', 'A2 Poster', 'A1 Poster', 'Custom Size'],
    available_paper_types: ['Photo Paper', 'Canvas', 'Cardstock'],
    available_paper_weights: ['150gsm', '200gsm', '250gsm'],
    available_finishes: ['lamination', 'cutting']
  }
] as const;

export type ServiceType = typeof SERVICE_TYPES[keyof typeof SERVICE_TYPES];
export type SAVType = typeof SAV_TYPES[number];
export type BannerType = typeof BANNER_TYPES[number];
export type PaperType = typeof PAPER_TYPES[number];
export type PaperWeight = typeof PAPER_WEIGHTS[number];
export type FinishingOption = typeof FINISHING_OPTIONS[number];