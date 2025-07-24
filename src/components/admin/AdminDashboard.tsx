import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { User } from "@supabase/supabase-js";

// UI Components
import { Button } from "@/components/ui/button";

// Icons
import {
  BarChart3,
  Users,
  PrinterIcon,
  Settings,
  Shield,
  Package,
  Truck,
  FileText,
  Grid3X3,
  LogOut,
  DollarSign,
  Bell,
} from "lucide-react";

// Components
import { NotificationSender } from '@/components/admin/NotificationSender';
import { OverviewDashboard } from './OverviewDashboard';
import { JobManagement } from './JobManagement';
import { CustomerManagement } from './CustomerManagement';
import { InvoiceManagement } from './InvoiceManagement';
import { UserManagement } from './UserManagement';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { CompanySettings } from './CompanySettings';
import { NotificationTester } from './NotificationTester';
import { CustomerStatements } from '@/components/admin/CustomerStatements';
import { DeliveryManagement } from './DeliveryManagement';
import { ServiceManagement } from '@/components/admin/ServiceManagement';
import { PayrollManagement } from './PayrollManagement';
import { NotificationLogs } from './NotificationLogs';

// Navigation Items
const navigationItems = [
  { id: "overview", label: "Overview", icon: Grid3X3 },
  { id: "jobs", label: "Job Management", icon: Package },
  { id: "services", label: "Service Management", icon: PrinterIcon },
  { id: "delivery", label: "Delivery Management", icon: Truck },
  { id: "invoices", label: "Invoices & Quotes", icon: FileText },
  { id: "customers", label: "Customers", icon: Users },
  { id: "statements", label: "Customer Statements", icon: FileText },
  { id: "staff", label: "Staff & Users", icon: Shield },
  { id: "payroll", label: "Payroll Management", icon: DollarSign },
  { id: "notifications", label: "Test Notifications", icon: Bell },
  { id: "logs", label: "Notification Logs", icon: Bell },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
];

interface AdminDashboardProps {
  user: User;
  userRole: string;
}

export const AdminDashboard = ({ user, userRole }: AdminDashboardProps) => {
  const { signOut } = useAuth();
  const { settings: companySettings } = useCompanySettings();

  // State
  const [activeView, setActiveView] = useState("overview");
  const [isNotificationSenderOpen, setIsNotificationSenderOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">{companySettings?.company_name || 'Loading...'}</h1>
              <p className="text-muted-foreground text-sm">Admin Dashboard - {userRole}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 border-l pl-2 ml-2">
                <span className="text-xs sm:text-sm">Welcome, {user.email}</span>
                <Button variant="outline" onClick={signOut} size="sm">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg border shadow-sm p-4 sticky top-4">
              <h3 className="font-semibold text-lg mb-4">Admin Portal</h3>
              <nav className="space-y-2">
                {navigationItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center space-x-2 ${
                      activeView === item.id ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeView === "overview" && <OverviewDashboard />}
            {activeView === "jobs" && <JobManagement />}
            {activeView === "customers" && <CustomerManagement />}
            {activeView === "statements" && <CustomerStatements />}
            {activeView === "services" && <ServiceManagement />}
            {activeView === "delivery" && <DeliveryManagement />}
            {activeView === "invoices" && <InvoiceManagement />}
            {activeView === "staff" && <UserManagement />}
            {activeView === "payroll" && <PayrollManagement />}
            {activeView === "logs" && <NotificationLogs />}
            {activeView === "notifications" && <NotificationTester />}
            {activeView === "analytics" && <AnalyticsDashboard />}
            {activeView === "settings" && <CompanySettings />}
          </div>
        </div>
      </main>

      {/* Notification Sender Modal */}
      <NotificationSender 
        isOpen={isNotificationSenderOpen} 
        onClose={() => setIsNotificationSenderOpen(false)} 
      />
    </div>
  );
};