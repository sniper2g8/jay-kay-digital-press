import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { JobSubmissionForm } from "./JobSubmissionForm";
import { JobTracker } from "./JobTracker";
import { QuoteRequest } from "./QuoteRequest";
import { InvoiceView } from "./InvoiceView";
import { NotificationPreferences } from "./NotificationPreferences";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface CustomerDashboardProps {
  user: User;
}

export const CustomerDashboard = ({ user }: CustomerDashboardProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [isJobFormOpen, setIsJobFormOpen] = useState(false);
  const [isQuoteFormOpen, setIsQuoteFormOpen] = useState(false);

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
            <p className="text-muted-foreground">Customer Portal</p>
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
            variant={activeTab === "jobs" ? "default" : "ghost"}
            onClick={() => setActiveTab("jobs")}
            className="px-6"
          >
            My Jobs
          </Button>
          <Button
            variant={activeTab === "quotes" ? "default" : "ghost"}
            onClick={() => setActiveTab("quotes")}
            className="px-6"
          >
            Quotes
          </Button>
          <Button
            variant={activeTab === "invoices" ? "default" : "ghost"}
            onClick={() => setActiveTab("invoices")}
            className="px-6"
          >
            Invoices
          </Button>
          <Button
            variant={activeTab === "notifications" ? "default" : "ghost"}
            onClick={() => setActiveTab("notifications")}
            className="px-6"
          >
            Settings
          </Button>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Dialog open={isJobFormOpen} onOpenChange={setIsJobFormOpen}>
              <DialogTrigger asChild>
                <div className="bg-card p-6 rounded-lg border cursor-pointer hover:shadow-md transition-shadow">
                  <h3 className="text-lg font-semibold mb-2">Submit New Job</h3>
                  <p className="text-muted-foreground">Upload files and create a new printing job</p>
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Submit New Print Job</DialogTitle>
                </DialogHeader>
                <JobSubmissionForm onSuccess={() => setIsJobFormOpen(false)} />
              </DialogContent>
            </Dialog>
            
            <div 
              className="bg-card p-6 rounded-lg border cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setActiveTab("jobs")}
            >
              <h3 className="text-lg font-semibold mb-2">My Jobs</h3>
              <p className="text-muted-foreground">Track progress of your current jobs</p>
            </div>
            
            <div className="bg-card p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-2">Order History</h3>
              <p className="text-muted-foreground">View your past orders and invoices</p>
            </div>
            
            <Dialog open={isQuoteFormOpen} onOpenChange={setIsQuoteFormOpen}>
              <DialogTrigger asChild>
                <div className="bg-card p-6 rounded-lg border cursor-pointer hover:shadow-md transition-shadow">
                  <h3 className="text-lg font-semibold mb-2">Request Quote</h3>
                  <p className="text-muted-foreground">Get pricing for custom print jobs</p>
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Request Quote</DialogTitle>
                </DialogHeader>
                <QuoteRequest onSuccess={() => setIsQuoteFormOpen(false)} />
              </DialogContent>
            </Dialog>
            
            <div className="bg-card p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-2">My Profile</h3>
              <p className="text-muted-foreground">Update your account information</p>
            </div>
            
            <div 
              className="bg-card p-6 rounded-lg border cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setActiveTab("invoices")}
            >
              <h3 className="text-lg font-semibold mb-2">Invoices</h3>
              <p className="text-muted-foreground">View and pay outstanding invoices</p>
            </div>
          </div>
        )}

        {activeTab === "jobs" && (
          <JobTracker userId={user.id} />
        )}

        {activeTab === "quotes" && (
          <QuoteRequest />
        )}

        {activeTab === "invoices" && (
          <InvoiceView userId={user.id} />
        )}

        {activeTab === "notifications" && <NotificationPreferences />}
      </main>
    </div>
  );
};