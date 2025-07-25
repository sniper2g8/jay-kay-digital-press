# Jay Kay Digital Press

A modern, offline-capable web application for professional printing services in Sierra Leone.

## Features

- 🎨 **Modern UI/UX** - Beautiful, responsive design with Tailwind CSS
- 📱 **Progressive Web App** - Installable with offline capabilities
- 🔒 **Secure Authentication** - Supabase-powered user management
- 📊 **Admin Dashboard** - Complete job and customer management
- 🗃️ **Database Integration** - PostgreSQL with Supabase
- 🌐 **Offline Support** - Service worker for offline functionality
- 📈 **Analytics** - Built-in analytics and reporting
- 🖨️ **PDF Generation** - Professional invoices and quotes
- 📧 **Notifications** - Email and SMS notification system

## Tech Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **Build Tool:** Vite
- **UI Components:** Shadcn/ui, Radix UI
- **Charts:** Recharts
- **PDF:** React PDF
- **Icons:** Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd jay-kay-digital-press
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── admin/          # Admin dashboard components
│   ├── auth/           # Authentication components
│   ├── common/         # Shared components
│   ├── customer/       # Customer portal components
│   └── ui/             # Base UI components (shadcn/ui)
├── contexts/           # React contexts
├── hooks/              # Custom hooks
├── integrations/       # Third-party integrations
├── lib/               # Utility libraries
├── pages/             # Page components
├── utils/             # Utility functions
└── assets/            # Static assets
```

## Features

### For Customers
- Service browsing and quote requests
- Job submission with file uploads
- Order tracking
- Invoice viewing and payment
- Profile management

### For Admin/Staff
- Complete dashboard with analytics
- Job management and workflow
- Customer management
- Invoice and quote generation
- Service management
- User and role management
- Notification system

## Offline Capabilities

The app includes comprehensive offline support:

- **Service Worker** - Caches critical resources
- **Offline Indicator** - Shows connection status
- **Local Storage** - Stores data for offline access
- **Background Sync** - Syncs data when connection returns

## Security

- Row Level Security (RLS) policies
- Input validation and sanitization
- Secure authentication with Supabase
- HTTPS enforcement
- Security headers via .htaccess

## Performance

- Code splitting with React.lazy()
- Image optimization
- Compression enabled
- Caching strategies
- Lighthouse score optimized

## Deployment

Simply open [Lovable](https://lovable.dev/projects/0fac3561-c8d6-48f4-ba31-c7ab3481bb93) and click on Share -> Publish.

For custom domains, navigate to Project > Settings > Domains and click Connect Domain.

## Contact

Jay Kay Digital Press
- Email: jaykaydigitalpress@gmail.com
- Phone: +232 34 788711, +232 30 741062
- Address: St. Edward School Avenue, By Caritas, Freetown, Sierra Leone