import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { useJobs } from "@/hooks/useJobs";
import { useWorkflowStats } from "@/hooks/useWorkflowStats";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { User } from "@supabase/supabase-js";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Icons
import {
  BarChart3,
  Users,
  PrinterIcon,
  Settings,
  Plus,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Search,
  Filter,
  MoreHorizontal,
  Bell,
  Calendar,
  DollarSign,
  ArrowRight,
  Shield,
  Package,
  Truck,
  FileText,
  ExternalLink,
  Grid3X3,
  ChevronDown,
  Activity,
  Zap,
  Target,
  Workflow,
  PieChart,
  LogOut,
  UserCircle,
  Moon,
  Sun,
  Menu,
  X,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  ArrowUp,
  Play
} from "lucide-react";

// Components
import { SlideManager } from '@/components/admin/SlideManager';
import { NotificationSender } from '@/components/admin/NotificationSender';
import { ServiceManager } from '@/components/admin/ServiceManager';
import { CustomerStatements } from '@/components/admin/CustomerStatements';
import { DeliveryScheduleForm } from '@/components/delivery/DeliveryScheduleForm';
import { DeliveryScheduleList } from '@/components/delivery/DeliveryScheduleList';
import { useDeliverySchedules } from '@/hooks/useDeliverySchedules';

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
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
];

// Quick Actions
const quickActions = [
  { label: "New Job", icon: Plus, href: "/admin/jobs/new", variant: "default" as const },
  { label: "New Quote", icon: FileText, href: "/admin/quotes/new", variant: "outline" as const },
  { label: "Delivery", icon: Truck, href: "/admin/delivery", variant: "outline" as const },
  { label: "Financial", icon: DollarSign, href: "/admin/financial", variant: "outline" as const },
];

interface AdminDashboardProps {
  user: User;
  userRole: string;
}

export const AdminDashboard = ({ user, userRole }: AdminDashboardProps) => {
  const { signOut } = useAuth();
  const { settings: companySettings } = useCompanySettings();
  const { jobs, loading: jobsLoading, fetchJobs, updateJobStatus } = useJobs();
  const { stats, loading: statsLoading } = useWorkflowStats();
  const { deliverySchedules, loading: deliveryLoading, createDeliverySchedule, updateDeliveryStatus, deleteDeliverySchedule } = useDeliverySchedules();
  const navigate = useNavigate();
  const { toast } = useToast();

  // State
  const [activeView, setActiveView] = useState("overview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [customers, setCustomers] = useState<any[]>([]);
  const [internalUsers, setInternalUsers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [nonSystemStaff, setNonSystemStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [workflowStatuses, setWorkflowStatuses] = useState<any[]>([]);
  const [isNotificationSenderOpen, setIsNotificationSenderOpen] = useState(false);

  // Load data
  useEffect(() => {
    loadCustomers();
    loadInternalUsers();
    loadEmployees();
    loadNonSystemStaff();
    loadWorkflowStatuses();
  }, []);

  const loadCustomers = async () => {
    try {
      const { data: customersData, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setCustomers(customersData || []);
    } catch (error) {
      console.error('Failed to load customers:', error);
      setCustomers([]);
    }
  };

  const loadInternalUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('internal_users')
        .select(`*, roles(name)`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setInternalUsers(data || []);
    } catch (error) {
      console.error('Failed to load internal users:', error);
      setInternalUsers([]);
    }
  };

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Failed to load employees:', error);
      setEmployees([]);
    }
  };

  const loadNonSystemStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('non_system_staff')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setNonSystemStaff(data || []);
    } catch (error) {
      console.error('Failed to load non-system staff:', error);
      setNonSystemStaff([]);
    }
  };

  const loadWorkflowStatuses = async () => {
    try {
      const { data, error } = await supabase
        .from('workflow_status')
        .select('*')
        .order('sequence');
      
      if (error) {
        console.error('Failed to load workflow statuses:', error);
        setWorkflowStatuses([]);
        return;
      }
      setWorkflowStatuses(data || []);
    } catch (error) {
      console.error('Failed to load workflow statuses:', error);
      setWorkflowStatuses([]);
    }
  };

  const downloadJobFiles = async (jobId: number) => {
    try {
      setLoading(true);
      
      // Get job files from database
      const { data: jobFiles, error: filesError } = await supabase
        .from('job_files')
        .select('*')
        .eq('job_id', jobId);

      if (filesError) throw filesError;

      if (!jobFiles || jobFiles.length === 0) {
        toast({
          title: "No files found",
          description: "No files have been uploaded for this job.",
          variant: "destructive"
        });
        return;
      }

      // Download each file
      for (const file of jobFiles) {
        try {
          const { data: fileData, error: downloadError } = await supabase.storage
            .from('job-files')
            .download(file.file_path);

          if (downloadError) {
            console.error(`Error downloading file ${file.file_path}:`, downloadError);
            continue;
          }

          // Create download link
          const url = URL.createObjectURL(fileData);
          const link = document.createElement('a');
          link.href = url;
          link.download = file.file_path.split('/').pop() || `job-${jobId}-file`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } catch (error) {
          console.error(`Error processing file ${file.file_path}:`, error);
        }
      }

      toast({
        title: "Files downloaded",
        description: `Downloaded ${jobFiles.length} file(s) for job ${jobId}.`
      });

    } catch (error) {
      console.error('Error downloading job files:', error);
      toast({
        title: "Download failed",
        description: "Failed to download job files. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getNextStatus = (currentStatusId: number) => {
    const currentStatus = workflowStatuses.find(s => s.id === currentStatusId);
    if (!currentStatus) return null;
    
    // Find the next status in sequence (exclude cancelled status which has sequence 0)
    const nextStatus = workflowStatuses
      .filter(s => s.sequence > 0)
      .find(s => s.sequence === currentStatus.sequence + 1);
    
    return nextStatus;
  };

  const handleAdvanceStatus = async (job: any) => {
    const nextStatus = getNextStatus(job.current_status);
    if (nextStatus) {
      await updateJobStatus(job.id, nextStatus.id);
    } else {
      toast({
        title: "Information",
        description: "Job is already at the final stage.",
      });
    }
  };

  // Calculate stats
  const activeJobs = jobs.filter(job => 
    job.status_name && !['Completed', 'Waiting for Collection'].includes(job.status_name)
  ).length;
  
  const completedToday = jobs.filter(job => {
    const jobDate = new Date(job.updated_at);
    const today = new Date();
    return (job.status_name === 'Completed' || job.status_name === 'Waiting for Collection') && 
           jobDate.toDateString() === today.toDateString();
  }).length;

  const recentJobs = jobs.slice(0, 5);
  const recentCustomers = customers.slice(0, 5);

  // Stats cards data
  const statsCards = [
    {
      title: "Active Jobs",
      value: activeJobs.toString(),
      change: "+12%",
      changeType: "positive" as const,
      icon: Clock,
      description: "Jobs in progress"
    },
    {
      title: "Completed Today",
      value: completedToday.toString(),
      change: "+25%",
      changeType: "positive" as const,
      icon: CheckCircle,
      description: "Jobs finished today"
    },
    {
      title: "Total Customers",
      value: customers.length.toString(),
      change: "+8%",
      changeType: "positive" as const,
      icon: Users,
      description: "Registered customers"
    },
    {
       title: "Monthly Revenue",
       value: "Le 0",
      change: "+15%",
      changeType: "positive" as const,
      icon: DollarSign,
      description: "This month's revenue"
    }
  ];

  const OverviewContent = () => (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-xl border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Welcome back, Admin! 👋
            </h1>
            <p className="text-muted-foreground">
              Here's what's happening with your print shop today.
            </p>
          </div>
          <div className="hidden md:flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsNotificationSenderOpen(true)}
              className="h-9"
            >
              <Bell className="h-4 w-4 mr-2" />
              Send Notification
            </Button>
            {quickActions.map((action) => (
              <Button
                key={action.label}
                variant={action.variant}
                size="sm"
                onClick={() => navigate(action.href)}
                className="h-9"
              >
                <action.icon className="h-4 w-4 mr-2" />
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <div className="flex items-center space-x-2">
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <Badge 
                      variant={stat.changeType === "positive" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {stat.change}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </div>
                <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Jobs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Jobs</CardTitle>
              <CardDescription>Latest job submissions</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setActiveView("jobs")}>
              View All
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentJobs.length > 0 ? (
              recentJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">JKD{job.id.toString().padStart(3, '0')}</p>
                      <p className="text-sm text-muted-foreground">{job.service_name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">{job.status_name}</Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(job.created_at), 'MMM dd')}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No recent jobs</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Customers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Customers</CardTitle>
              <CardDescription>New customer registrations</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setActiveView("customers")}>
              View All
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentCustomers.length > 0 ? (
              recentCustomers.map((customer) => (
                <div key={customer.id} className="flex items-center space-x-3 p-3 rounded-lg border">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-secondary">
                      {customer.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{customer.name}</p>
                    <p className="text-sm text-muted-foreground">{customer.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(customer.created_at), 'MMM dd')}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No recent customers</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions for Mobile */}
      <div className="md:hidden">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  variant={action.variant}
                  className="h-12 flex-col space-y-1"
                  onClick={() => navigate(action.href)}
                >
                  <action.icon className="h-4 w-4" />
                  <span className="text-xs">{action.label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const JobsContent = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Job Management</h2>
          <p className="text-muted-foreground">Manage and track all print jobs</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64"
            />
          </div>
          <Button onClick={() => navigate('/admin/jobs/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Job
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30 border-b">
                <tr>
                  <th className="p-4 text-left font-medium">Job ID</th>
                  <th className="p-4 text-left font-medium">Customer</th>
                  <th className="p-4 text-left font-medium">Service</th>
                  <th className="p-4 text-left font-medium">Status</th>
                  <th className="p-4 text-left font-medium">Created</th>
                  <th className="p-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.filter(job => 
                  searchQuery === "" || 
                  job.id.toString().includes(searchQuery) ||
                  job.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  job.service_name?.toLowerCase().includes(searchQuery.toLowerCase())
                ).map((job) => (
                  <tr key={job.id} className="border-b hover:bg-muted/20 transition-colors">
                    <td className="p-4">
                      <div className="font-medium">JKD{job.id.toString().padStart(3, '0')}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {job.customer_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'NA'}
                          </AvatarFallback>
                        </Avatar>
                        <span>{job.customer_name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="p-4">{job.service_name}</td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{job.status_name}</Badge>
                        {workflowStatuses.length > 0 && getNextStatus(job.current_status) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAdvanceStatus(job)}
                            className="h-7 px-2 text-xs"
                          >
                            <ArrowUp className="h-3 w-3 mr-1" />
                            Next
                          </Button>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {format(new Date(job.created_at), 'MMM dd, yyyy')}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => navigate(`/admin/jobs/${job.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => navigate(`/admin/jobs/${job.id}/edit`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => downloadJobFiles(job.id)}>
                              <Download className="h-4 w-4 mr-2" />
                              Download Files
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/admin/delivery`)}>
                              <Truck className="h-4 w-4 mr-2" />
                              Schedule Delivery
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => {
                              if (confirm('Are you sure you want to delete this job?')) {
                                toast({ title: "Job deleted", description: "Job has been deleted successfully." });
                              }
                            }}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const CustomersContent = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Customer Management</h2>
          <p className="text-muted-foreground">View and manage customer accounts</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={() => setActiveView('customers')}>
            <Plus className="h-4 w-4 mr-2" />
            Manage Customers
          </Button>
          <Button variant="outline" onClick={() => navigate('/admin/customers/new')}>
            Add Customer
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30 border-b">
                <tr>
                  <th className="p-4 text-left font-medium">Customer</th>
                  <th className="p-4 text-left font-medium">Contact</th>
                  <th className="p-4 text-left font-medium">Jobs</th>
                  <th className="p-4 text-left font-medium">Joined</th>
                  <th className="p-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id} className="border-b hover:bg-muted/20 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback>
                            {customer.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-sm text-muted-foreground">ID: {customer.customer_display_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <div className="text-sm">{customer.email}</div>
                        <div className="text-sm text-muted-foreground">{customer.phone || 'No phone'}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant="secondary">
                        {jobs.filter(job => job.customer_uuid === customer.id).length} jobs
                      </Badge>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {format(new Date(customer.created_at), 'MMM dd, yyyy')}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end items-center space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => setActiveView('customers')}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setActiveView('customers')}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

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
            {activeView === "overview" && <OverviewContent />}
            {activeView === "jobs" && <JobsContent />}
            {activeView === "customers" && <CustomersContent />}
            {activeView === "statements" && <CustomerStatements />}
            {/* Add other views here */}
            {activeView === "services" && <ServiceManager />}
            {activeView === "delivery" && <DeliveryScheduleList />}
            {activeView === "invoices" && <div className="p-8 text-center text-muted-foreground">Invoice management will be implemented here</div>}
            {activeView === "staff" && <div className="p-8 text-center text-muted-foreground">Staff management will be implemented here</div>}
            {activeView === "analytics" && <div className="p-8 text-center text-muted-foreground">Analytics will be implemented here</div>}
            {activeView === "settings" && <div className="p-8 text-center text-muted-foreground">Settings will be implemented here</div>}
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