import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Send, Eye, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/useNotifications";

interface NotificationLog {
  id: string;
  customer_id: string;
  job_id: number | null;
  notification_type: string;
  notification_event: string;
  subject: string | null;
  message: string;
  recipient_email: string | null;
  recipient_phone: string | null;
  status: string;
  sent_at: string | null;
  error_message: string | null;
  created_at: string;
  customers?: {
    name: string;
    customer_display_id: string;
  };
}

export const NotificationManagement = () => {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [testNotification, setTestNotification] = useState({
    customer_id: "",
    type: "both" as 'email' | 'sms' | 'both',
    event: "test" as string,
    subject: "",
    message: ""
  });
  const { toast } = useToast();
  const { sendNotification, loading: sendingNotification } = useNotifications();

  useEffect(() => {
    fetchNotificationLogs();
  }, []);

  const fetchNotificationLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications_log')
        .select(`
          *,
          customers (
            name,
            customer_display_id
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching notification logs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch notification logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendTestNotification = async () => {
    try {
      await sendNotification(testNotification);
      setIsTestDialogOpen(false);
      setTestNotification({
        customer_id: "",
        type: "both",
        event: "test",
        subject: "",
        message: ""
      });
      fetchNotificationLogs(); // Refresh logs
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const filteredLogs = logs.filter(log =>
    log.customers?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.customers?.customer_display_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.notification_event.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'sent': return 'default';
      case 'failed': return 'destructive';
      case 'pending': return 'secondary';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notification Management</CardTitle>
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Management
              </CardTitle>
              <CardDescription>Monitor and manage customer notifications</CardDescription>
            </div>
            <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Send className="h-4 w-4 mr-2" />
                  Send Test Notification
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Send Test Notification</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="customer_id">Customer ID</Label>
                    <Input
                      id="customer_id"
                      value={testNotification.customer_id}
                      onChange={(e) => setTestNotification({ ...testNotification, customer_id: e.target.value })}
                      placeholder="Enter customer UUID"
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Notification Type</Label>
                    <Select
                      value={testNotification.type}
                      onValueChange={(value: 'email' | 'sms' | 'both') => 
                        setTestNotification({ ...testNotification, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email Only</SelectItem>
                        <SelectItem value="sms">SMS Only</SelectItem>
                        <SelectItem value="both">Both Email & SMS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      value={testNotification.subject}
                      onChange={(e) => setTestNotification({ ...testNotification, subject: e.target.value })}
                      placeholder="Email subject (optional for SMS)"
                    />
                  </div>
                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      value={testNotification.message}
                      onChange={(e) => setTestNotification({ ...testNotification, message: e.target.value })}
                      placeholder="Notification message"
                      rows={4}
                    />
                  </div>
                  <Button 
                    onClick={handleSendTestNotification} 
                    disabled={!testNotification.customer_id || !testNotification.message || sendingNotification}
                    className="w-full"
                  >
                    {sendingNotification ? "Sending..." : "Send Test Notification"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{log.customers?.name || 'Unknown'}</div>
                      <div className="text-sm text-muted-foreground">
                        {log.customers?.customer_display_id}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {log.notification_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize">
                    {log.notification_event.replace('_', ' ')}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {log.recipient_email && (
                        <div className="truncate max-w-[200px]">{log.recipient_email}</div>
                      )}
                      {log.recipient_phone && (
                        <div className="text-muted-foreground">{log.recipient_phone}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(log.status)}>
                      {log.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {log.sent_at ? new Date(log.sent_at).toLocaleString() : 'Not sent'}
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Notification Details</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Subject</Label>
                            <p className="text-sm">{log.subject || 'No subject'}</p>
                          </div>
                          <div>
                            <Label>Message</Label>
                            <p className="text-sm bg-muted p-3 rounded">{log.message}</p>
                          </div>
                          {log.error_message && (
                            <div>
                              <Label>Error</Label>
                              <p className="text-sm text-destructive bg-muted p-3 rounded">
                                {log.error_message}
                              </p>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredLogs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No notifications found matching your search.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};