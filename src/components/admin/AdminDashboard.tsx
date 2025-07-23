import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { ExternalLink, Monitor, ImageIcon, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { JobManagement } from "./JobManagement";
import { ServiceManagement } from "./ServiceManagement";
import { NotificationLogs } from "./NotificationLogs";
import { NotificationManagement } from "./NotificationManagement";
import { AnalyticsDashboard } from "./AnalyticsDashboard";
import { CustomerManagement } from "./CustomerManagement";
import { QuoteManagement } from "./QuoteManagement";
import { InvoiceManagement } from "./InvoiceManagement";
import { InvoiceTemplateSettings } from "./InvoiceTemplateSettings";
import { CompanySettings } from "./CompanySettings";
import { DisplayScreenManagement } from "./DisplayScreenManagement";

import { OverviewDashboard } from "./OverviewDashboard";
import { UserManagement } from "./UserManagement";
import { PayrollManagement } from "./PayrollManagement";

interface AdminDashboardProps {
  user: User;
  userRole: string;
}

export const AdminDashboard = ({ user, userRole }: AdminDashboardProps) => {
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("overview");
  const { settings } = useCompanySettings();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">{settings?.company_name || 'Loading...'}</h1>
              <p className="text-muted-foreground text-sm">Admin Dashboard - {userRole}</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Display Screen Links - Desktop */}
              <div className="hidden md:flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <a 
                    href="/waiting-area" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1"
                  >
                    <Monitor className="h-4 w-4" />
                    Waiting Area
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <a 
                    href="/showcase" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1"
                  >
                    <ImageIcon className="h-4 w-4" />
                    Showcase
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              </div>

              {/* Display Screen Links - Mobile Dropdown */}
              <div className="md:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Monitor className="h-4 w-4" />
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <a 
                        href="/waiting-area" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 w-full"
                      >
                        <Monitor className="h-4 w-4" />
                        Waiting Area
                        <ExternalLink className="h-3 w-3 ml-auto" />
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a 
                        href="/showcase" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 w-full"
                      >
                        <ImageIcon className="h-4 w-4" />
                        Showcase
                        <ExternalLink className="h-3 w-3 ml-auto" />
                      </a>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="flex items-center gap-2 border-l pl-2 ml-2">
                <span className="text-xs sm:text-sm">Welcome, {user.email}</span>
                <Button variant="outline" onClick={handleSignOut} size="sm">
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
                <div className="space-y-1">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Dashboard</h4>
                  <button
                    onClick={() => setActiveTab("overview")}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      activeTab === "overview" ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab("analytics")}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      activeTab === "analytics" ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                    }`}
                  >
                    Analytics
                  </button>
                </div>
                
                <div className="space-y-1">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 mt-4">People</h4>
                  <button
                    onClick={() => setActiveTab("users")}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      activeTab === "users" ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                    }`}
                  >
                    User Management
                  </button>
                  <button
                    onClick={() => setActiveTab("customers")}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      activeTab === "customers" ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                    }`}
                  >
                    Customers
                  </button>
                  <button
                    onClick={() => setActiveTab("payroll")}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      activeTab === "payroll" ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                    }`}
                  >
                    Payroll & HR
                  </button>
                </div>
                
                <div className="space-y-1">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 mt-4">Operations</h4>
                  <button
                    onClick={() => setActiveTab("jobs")}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      activeTab === "jobs" ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                    }`}
                  >
                    Jobs
                  </button>
                  <button
                    onClick={() => setActiveTab("quotes")}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      activeTab === "quotes" ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                    }`}
                  >
                    Quotes
                  </button>
                  <button
                    onClick={() => setActiveTab("invoices")}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      activeTab === "invoices" ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                    }`}
                  >
                    Invoices
                  </button>
                </div>
                
                <div className="space-y-1">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 mt-4">Communications</h4>
                  <button
                    onClick={() => setActiveTab("notifications")}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      activeTab === "notifications" ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                    }`}
                  >
                    Notifications
                  </button>
                  <button
                    onClick={() => setActiveTab("notification-logs")}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      activeTab === "notification-logs" ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                    }`}
                  >
                    Logs
                  </button>
                </div>
                
                <div className="space-y-1">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 mt-4">Configuration</h4>
                  <button
                    onClick={() => setActiveTab("services")}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      activeTab === "services" ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                    }`}
                  >
                    Services
                  </button>
                  <button
                    onClick={() => setActiveTab("displays")}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      activeTab === "displays" ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                    }`}
                  >
                    Display Screens
                  </button>
                  <button
                    onClick={() => setActiveTab("settings")}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      activeTab === "settings" ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                    }`}
                  >
                    Company Settings
                  </button>
                  <button
                    onClick={() => setActiveTab("invoice-templates")}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      activeTab === "invoice-templates" ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                    }`}
                  >
                    Invoice Templates
                  </button>
                </div>
              </nav>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="lg:col-span-3">{/* Tab Content */}

            {activeTab === "overview" && <OverviewDashboard />}
            {activeTab === "analytics" && <AnalyticsDashboard />}
            {activeTab === "jobs" && <JobManagement />}
            {activeTab === "services" && <ServiceManagement />}
            {activeTab === "notifications" && <NotificationManagement />}
            {activeTab === "notification-logs" && <NotificationLogs />}
            {activeTab === "users" && <UserManagement />}
            {activeTab === "customers" && <CustomerManagement />}
            {activeTab === "quotes" && <QuoteManagement />}
            {activeTab === "invoices" && <InvoiceManagement />}
            {activeTab === "settings" && <CompanySettings />}
            {activeTab === "displays" && <DisplayScreenManagement />}
            {activeTab === "invoice-templates" && <InvoiceTemplateSettings />}
            {activeTab === "payroll" && <PayrollManagement />}
          </div>
        </div>
      </main>
    </div>
  );
};