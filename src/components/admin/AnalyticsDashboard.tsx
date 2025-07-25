import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAnalytics } from "@/hooks/useAnalytics";
import { 
  TrendingUp, 
  Users, 
  FileText, 
  CheckCircle, 
  Clock, 
  DollarSign,
  BarChart3,
  Calendar,
  RefreshCw
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { CompanyLogo } from "@/components/common/LogoHeader";

export const AnalyticsDashboard = () => {
  const { getMetrics, getRevenueChart } = useAnalytics();
  const [metrics, setMetrics] = useState<any>(null);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year'>('month');
  const [chartPeriod, setChartPeriod] = useState<'week' | 'month' | 'year'>('month');

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [metricsData, chartData] = await Promise.all([
        getMetrics(period),
        getRevenueChart(chartPeriod)
      ]);
      
      setMetrics(metricsData);
      setRevenueData(chartData);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period, chartPeriod]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  const formatCurrency = (amount: number) => `Le ${amount.toLocaleString()}`;

  const MetricCard = ({ 
    title, 
    value, 
    icon: Icon, 
    description, 
    trend, 
    format = 'number' 
  }: {
    title: string;
    value: number;
    icon: any;
    description: string;
    trend?: number;
    format?: 'number' | 'currency';
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {format === 'currency' ? formatCurrency(value) : value.toLocaleString()}
        </div>
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
        {trend && (
          <div className="flex items-center mt-2">
            <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
            <span className="text-xs text-green-500">+{trend}%</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-2">
            <CompanyLogo className="h-10 w-auto" />
            <h1 className="text-xl sm:text-2xl font-bold">Analytics Dashboard</h1>
          </div>
        </div>
      </header>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
            <p className="text-muted-foreground">
              Comprehensive business insights and performance metrics
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchAnalytics} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {metrics && (
          <>
            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title="Total Revenue"
                value={metrics.total_revenue}
                icon={DollarSign}
                description={`Revenue for ${period}`}
                format="currency"
              />
              <MetricCard
                title="Active Jobs"
                value={metrics.monthly_jobs}
                icon={FileText}
                description={`Jobs in ${period}`}
              />
              <MetricCard
                title="Completed Jobs"
                value={metrics.completed_jobs}
                icon={CheckCircle}
                description={`Completed in ${period}`}
              />
              <MetricCard
                title="Active Customers"
                value={metrics.active_customers}
                icon={Users}
                description={`New customers in ${period}`}
              />
            </div>

            {/* Charts and Detailed Analytics */}
            <Tabs defaultValue="revenue" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="revenue">Revenue Trends</TabsTrigger>
                <TabsTrigger value="jobs">Job Performance</TabsTrigger>
                <TabsTrigger value="customers">Customer Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="revenue" className="space-y-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Revenue Over Time</CardTitle>
                      <CardDescription>Track revenue trends and patterns</CardDescription>
                    </div>
                    <Select value={chartPeriod} onValueChange={(value: any) => setChartPeriod(value)}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="week">Last Week</SelectItem>
                        <SelectItem value="month">Last Month</SelectItem>
                        <SelectItem value="year">Last Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                      <LineChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" />
                        <YAxis tickFormatter={(value) => `Le ${value}`} />
                        <Tooltip 
                          formatter={(value: any) => [formatCurrency(value), "Revenue"]}
                          labelStyle={{ color: '#000' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="revenue" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          dot={{ fill: "hsl(var(--primary))" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Daily Average Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {formatCurrency(metrics.daily_revenue)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Average daily revenue for {period}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Revenue per Job</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {metrics.monthly_jobs > 0 
                          ? formatCurrency(metrics.total_revenue / metrics.monthly_jobs)
                          : formatCurrency(0)
                        }
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Average revenue per job
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="jobs" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader>
                      <CardTitle>Job Status Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Pending</span>
                        <Badge variant="secondary">{metrics.pending_jobs}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Completed</span>
                        <Badge variant="secondary">{metrics.completed_jobs}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Total</span>
                        <Badge>{metrics.monthly_jobs}</Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Completion Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {metrics.monthly_jobs > 0 
                          ? Math.round((metrics.completed_jobs / metrics.monthly_jobs) * 100)
                          : 0
                        }%
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Jobs completed successfully
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Average Job Value</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {formatCurrency(
                          metrics.completed_jobs > 0 
                            ? metrics.total_revenue / metrics.completed_jobs
                            : 0
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Average value per completed job
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="customers" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Customer Growth</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {metrics.active_customers}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        New customers in {period}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Revenue per Customer</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {metrics.active_customers > 0 
                          ? formatCurrency(metrics.total_revenue / metrics.active_customers)
                          : formatCurrency(0)
                        }
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Average revenue per customer
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
};