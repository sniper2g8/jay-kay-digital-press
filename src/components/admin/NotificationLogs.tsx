import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Mail, MessageCircle, Filter, Clock, CheckCircle, XCircle } from "lucide-react";

interface NotificationLog {
  id: string;
  notification_type: string;
  notification_event: string;
  recipient_email?: string;
  recipient_phone?: string;
  subject?: string;
  message: string;
  status: string;
  external_id?: string;
  error_message?: string;
  sent_at?: string;
  created_at: string;
  customers?: {
    name: string;
    customer_display_id: string;
  };
}

export const NotificationLogs = () => {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchLogs();
    
    // Set up real-time subscription for new notification logs
    const channel = supabase
      .channel('notification-logs-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications_log'
        },
        () => {
          // Refresh logs when new notification is inserted
          fetchLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      // Fetching notification logs...
      
      const { data, error } = await supabase
        .from("notifications_log")
        .select(`
          id,
          notification_type,
          notification_event,
          recipient_email,
          recipient_phone,
          subject,
          message,
          status,
          external_id,
          error_message,
          sent_at,
          created_at,
          customers (
            name,
            customer_display_id
          )
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      // Notification logs response received

      if (error) {
        toast({
          title: "Error",
          description: `Failed to load notification logs: ${error.message}`,
          variant: "destructive",
        });
      } else {
        // Notification logs loaded successfully
        setLogs(data || []);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Unexpected error loading notification logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "email":
        return <Mail className="h-4 w-4" />;
      case "sms":
        return <MessageCircle className="h-4 w-4" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

  const filteredLogs = logs.filter(log => {
    if (typeFilter !== "all" && log.notification_type !== typeFilter) return false;
    if (statusFilter !== "all" && log.status !== statusFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4 animate-pulse" />
            <p>Loading notification logs...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Notification Logs</h2>
        <div className="flex items-center gap-4">
          <Button 
            onClick={fetchLogs} 
            variant="outline" 
            size="sm"
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Notifications ({filteredLogs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Notifications Found</h3>
              <p className="text-muted-foreground">
                No notifications have been sent yet.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Sent At</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(log.notification_type)}
                        <Badge variant="outline">
                          {log.notification_type.toUpperCase()}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(log.status)}
                        <Badge 
                          variant={log.status === "sent" ? "default" : 
                                 log.status === "failed" ? "destructive" : "secondary"}
                        >
                          {log.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.customers ? (
                        <div>
                          <p className="font-medium">{log.customers.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {log.customers.customer_display_id}
                          </p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {log.notification_event.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {log.recipient_email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span className="truncate max-w-[150px]">
                              {log.recipient_email}
                            </span>
                          </div>
                        )}
                        {log.recipient_phone && (
                          <div className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            <span>{log.recipient_phone}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px] truncate text-sm">
                        {log.subject || log.message.substring(0, 50) + "..."}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {log.sent_at ? 
                          new Date(log.sent_at).toLocaleString() : 
                          new Date(log.created_at).toLocaleString()
                        }
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.error_message ? (
                        <div className="max-w-[150px] truncate text-sm text-red-600">
                          {log.error_message}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};