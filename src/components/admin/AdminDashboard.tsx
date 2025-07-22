import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { JobManagement } from "./JobManagement";
import { ServiceManagement } from "./ServiceManagement";
import { NotificationLogs } from "./NotificationLogs";
import { NotificationManagement } from "./NotificationManagement";
import { AnalyticsDashboard } from "./AnalyticsDashboard";
import { CustomerManagement } from "./CustomerManagement";
import { QuoteManagement } from "./QuoteManagement";
import { InvoiceManagement } from "./InvoiceManagement";
import { CompanySettings } from "./CompanySettings";
import { DisplayScreenManagement } from "./DisplayScreenManagement";
import { JobProgressDashboard } from "./JobProgressDashboard";

interface AdminDashboardProps {
  user: User;
  userRole: string;
}

export const AdminDashboard = ({ user, userRole }: AdminDashboardProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("overview");

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Signed out successfully",
      });
      // The auth state change will automatically redirect to login
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">JAY KAY DIGITAL PRESS</h1>
              <p className="text-muted-foreground text-sm">Admin Dashboard - {userRole}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs sm:text-sm">Welcome, {user.email}</span>
              <Button variant="outline" onClick={handleSignOut} size="sm">
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-1 bg-muted p-1 rounded-lg mb-8 w-full overflow-x-auto">
          <div className="flex space-x-1 min-w-max pb-1">
          <Button
            variant={activeTab === "overview" ? "default" : "ghost"}
            onClick={() => setActiveTab("overview")}
            className="px-3 sm:px-6 text-xs sm:text-sm"
          >
            Overview
          </Button>
          <Button
            variant={activeTab === "job-progress" ? "default" : "ghost"}
            onClick={() => setActiveTab("job-progress")}
            className="px-3 sm:px-6 text-xs sm:text-sm"
          >
            Job Progress
          </Button>
          <Button
            variant={activeTab === "analytics" ? "default" : "ghost"}
            onClick={() => setActiveTab("analytics")}
            className="px-3 sm:px-6 text-xs sm:text-sm"
          >
            Analytics
          </Button>
          <Button
            variant={activeTab === "jobs" ? "default" : "ghost"}
            onClick={() => setActiveTab("jobs")}
            className="px-3 sm:px-6 text-xs sm:text-sm"
          >
            Jobs
          </Button>
          <Button
            variant={activeTab === "services" ? "default" : "ghost"}
            onClick={() => setActiveTab("services")}
            className="px-3 sm:px-6 text-xs sm:text-sm"
          >
            Services
          </Button>
          <Button
            variant={activeTab === "notifications" ? "default" : "ghost"}
            onClick={() => setActiveTab("notifications")}
            className="px-3 sm:px-6 text-xs sm:text-sm"
          >
            Notifications
          </Button>
          <Button
            variant={activeTab === "notification-logs" ? "default" : "ghost"}
            onClick={() => setActiveTab("notification-logs")}
            className="px-3 sm:px-6 text-xs sm:text-sm"
          >
            Logs
          </Button>
          <Button
            variant={activeTab === "customers" ? "default" : "ghost"}
            onClick={() => setActiveTab("customers")}
            className="px-3 sm:px-6 text-xs sm:text-sm"
          >
            Customers
          </Button>
          <Button
            variant={activeTab === "quotes" ? "default" : "ghost"}
            onClick={() => setActiveTab("quotes")}
            className="px-3 sm:px-6 text-xs sm:text-sm"
          >
            Quotes
          </Button>
          <Button
            variant={activeTab === "invoices" ? "default" : "ghost"}
            onClick={() => setActiveTab("invoices")}
            className="px-3 sm:px-6 text-xs sm:text-sm"
          >
            Invoices
          </Button>
          <Button
            variant={activeTab === "settings" ? "default" : "ghost"}
            onClick={() => setActiveTab("settings")}
            className="px-3 sm:px-6 text-xs sm:text-sm"
          >
            Settings
          </Button>
          <Button
            variant={activeTab === "displays" ? "default" : "ghost"}
            onClick={() => setActiveTab("displays")}
            className="px-3 sm:px-6 text-xs sm:text-sm"
          >
            Displays
          </Button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && <JobProgressDashboard />}
        {activeTab === "job-progress" && <JobProgressDashboard />}

        {activeTab === "analytics" && <AnalyticsDashboard />}
        {activeTab === "jobs" && <JobManagement />}
        {activeTab === "services" && <ServiceManagement />}
        {activeTab === "notifications" && <NotificationManagement />}
        {activeTab === "notification-logs" && <NotificationLogs />}
        {activeTab === "customers" && <CustomerManagement />}
        {activeTab === "quotes" && <QuoteManagement />}
        {activeTab === "invoices" && <InvoiceManagement />}
        {activeTab === "settings" && <CompanySettings />}
        {activeTab === "displays" && <DisplayScreenManagement />}
      </main>
    </div>
  );
};