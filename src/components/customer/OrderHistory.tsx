import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Search, Calendar, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OrderHistoryItem {
  id: number;
  title: string;
  tracking_code: string;
  status: string;
  final_price: number | null;
  quoted_price: number | null;
  created_at: string;
  actual_completion: string | null;
  services: {
    name: string;
    service_type: string;
  };
}

interface OrderHistoryProps {
  userId: string;
}

export const OrderHistory = ({ userId }: OrderHistoryProps) => {
  const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<OrderHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchOrderHistory();
  }, [userId]);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter]);

  const fetchOrderHistory = async () => {
    try {
      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('auth_user_id', userId)
        .single();

      if (!customer) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('jobs')
        .select(`
          id,
          title,
          tracking_code,
          status,
          final_price,
          quoted_price,
          created_at,
          actual_completion,
          services (
            name,
            service_type
          )
        `)
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching order history:', error);
      toast({
        title: "Error",
        description: "Failed to load order history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.tracking_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.services.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(order => order.status.toLowerCase() === statusFilter);
    }

    setFilteredOrders(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'default';
      case 'processing':
      case 'printing':
      case 'finishing': return 'secondary';
      case 'waiting for collection':
      case 'out for delivery': return 'outline';
      case 'pending':
      case 'received': return 'secondary';
      default: return 'outline';
    }
  };

  const formatPrice = (price: number | null) => {
    if (!price) return '-';
    return `Le ${price.toLocaleString()}`;
  };

  const getUniqueStatuses = () => {
    const statuses = [...new Set(orders.map(order => order.status.toLowerCase()))];
    return statuses.sort();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Order History
        </CardTitle>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {getUniqueStatuses().map(status => (
                <SelectItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        {filteredOrders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{orders.length === 0 ? "No orders found" : "No orders match your filters"}</p>
            {orders.length > 0 && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                }}
                className="mt-4"
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Completed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.title || `Job #${order.tracking_code.slice(-6)}`}</div>
                        <div className="text-sm text-muted-foreground font-mono">#{order.tracking_code}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.services.name}</div>
                        <div className="text-sm text-muted-foreground">{order.services.service_type}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        {order.final_price ? (
                          <div className="font-medium">{formatPrice(order.final_price)}</div>
                        ) : order.quoted_price ? (
                          <div className="text-muted-foreground">{formatPrice(order.quoted_price)}</div>
                        ) : (
                          <span className="text-muted-foreground">Pending</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(order.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {order.actual_completion ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(order.actual_completion).toLocaleDateString()}
                        </div>
                      ) : (
                        <span>-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};