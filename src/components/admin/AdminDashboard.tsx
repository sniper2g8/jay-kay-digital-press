import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { JobManagement } from "./JobManagement";
import { ServiceManagement } from "./ServiceManagement";
import { NotificationLogs } from "./NotificationLogs";
import { AnalyticsDashboard } from "./AnalyticsDashboard";

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
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">JAY KAY DIGITAL PRESS</h1>
            <p className="text-muted-foreground">Admin Dashboard - {userRole}</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm">Welcome, {user.email}</span>
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg mb-8 w-fit">
          <Button
            variant={activeTab === "overview" ? "default" : "ghost"}
            onClick={() => setActiveTab("overview")}
            className="px-6"
          >
            Overview
          </Button>
          <Button
            variant={activeTab === "analytics" ? "default" : "ghost"}
            onClick={() => setActiveTab("analytics")}
            className="px-6"
          >
            Analytics
          </Button>
          <Button
            variant={activeTab === "jobs" ? "default" : "ghost"}
            onClick={() => setActiveTab("jobs")}
            className="px-6"
          >
            Jobs
          </Button>
          <Button
            variant={activeTab === "services" ? "default" : "ghost"}
            onClick={() => setActiveTab("services")}
            className="px-6"
          >
            Services
          </Button>
          <Button
            variant={activeTab === "notifications" ? "default" : "ghost"}
            onClick={() => setActiveTab("notifications")}
            className="px-6"
          >
            Notifications
          </Button>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div 
              className="bg-card p-6 rounded-lg border cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setActiveTab("analytics")}
            >
              <h3 className="text-lg font-semibold mb-2">Analytics Dashboard</h3>
              <p className="text-muted-foreground">View business insights and performance metrics</p>
            </div>

            <div 
              className="bg-card p-6 rounded-lg border cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setActiveTab("jobs")}
            >
              <h3 className="text-lg font-semibold mb-2">Jobs Management</h3>
              <p className="text-muted-foreground">Create, edit, and track all printing jobs</p>
            </div>
            
            <div className="bg-card p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-2">Customer Management</h3>
              <p className="text-muted-foreground">Manage customer accounts and information</p>
            </div>
            
            <div 
              className="bg-card p-6 rounded-lg border cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setActiveTab("services")}
            >
              <h3 className="text-lg font-semibold mb-2">Services & Options</h3>
              <p className="text-muted-foreground">Configure printing services and options</p>
            </div>
            
            <div className="bg-card p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-2">Financials</h3>
              <p className="text-muted-foreground">View invoices, quotes, and payments</p>
            </div>
            
            <div className="bg-card p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-2">Display Screens</h3>
              <p className="text-muted-foreground">Control waiting area displays</p>
            </div>
            
            <div className="bg-card p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-2">Settings</h3>
              <p className="text-muted-foreground">Company info, themes, and configuration</p>
            </div>
          </div>
        )}

        {activeTab === "analytics" && <AnalyticsDashboard />}
        {activeTab === "jobs" && <JobManagement />}
        {activeTab === "services" && <ServiceManagement />}
        {activeTab === "notifications" && <NotificationLogs />}
      </main>
    </div>
  );
};