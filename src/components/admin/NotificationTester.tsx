import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Send, Mail, MessageSquare, TestTube, CheckCircle, XCircle } from 'lucide-react';

interface TestResult {
  type: 'email' | 'sms';
  success: boolean;
  message: string;
  timestamp: string;
}

export const NotificationTester = () => {
  const [testData, setTestData] = useState({
    customerPhone: '+232 76 XXXXXX',
    customerEmail: 'customer@example.com',
    customerName: 'Customer Name',
    subject: 'Test Notification from Jay Kay Digital Press',
    message: 'This is a test notification to verify our notification system is working correctly.',
    notificationType: 'both' as 'email' | 'sms' | 'both'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const { toast } = useToast();

  const sendTestNotification = async () => {
    setIsLoading(true);
    setTestResults([]);

    try {
      // Call the notification edge function directly for testing
      const { data, error } = await supabase.functions.invoke('send-notification', {
        body: {
          type: testData.notificationType,
          customer_id: 'demo-customer',
          event: 'test_notification',
          subject: testData.subject,
          message: testData.message,
          custom_data: {
            demo_mode: true,
            recipient_email: testData.customerEmail,
            recipient_phone: testData.customerPhone,
            recipient_name: testData.customerName
          }
        }
      });

      if (error) {
        throw error;
      }

      // Create test results based on response
      const results: TestResult[] = [];
      
      if (data.email_sent) {
        results.push({
          type: 'email',
          success: true,
          message: `Email sent successfully to ${testData.customerEmail}`,
          timestamp: new Date().toISOString()
        });
      }

      if (data.sms_sent) {
        results.push({
          type: 'sms',
          success: true,
          message: `SMS sent successfully to ${testData.customerPhone}`,
          timestamp: new Date().toISOString()
        });
      }

      if (data.errors && data.errors.length > 0) {
        data.errors.forEach((error: string) => {
          results.push({
            type: error.includes('Email') ? 'email' : 'sms',
            success: false,
            message: error,
            timestamp: new Date().toISOString()
          });
        });
      }

      setTestResults(results);
      
      if (results.some(r => r.success)) {
        toast({
          title: "Test Successful",
          description: "Test notifications sent successfully",
        });
      } else {
        toast({
          title: "Test Failed",
          description: "No notifications were sent successfully",
          variant: "destructive",
        });
      }

    } catch (error: any) {
      setTestResults([{
        type: 'email',
        success: false,
        message: error.message || 'Unknown error occurred',
        timestamp: new Date().toISOString()
      }]);
      
      toast({
        title: "Test Failed",
        description: error.message || "Failed to send test notifications",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Notification System Tester
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customerName">Test Customer Name</Label>
              <Input
                id="customerName"
                value={testData.customerName}
                onChange={(e) => setTestData(prev => ({ ...prev, customerName: e.target.value }))}
                placeholder="Enter test customer name"
              />
            </div>
            
            <div>
              <Label htmlFor="notificationType">Notification Type</Label>
              <Select 
                value={testData.notificationType} 
                onValueChange={(value: 'email' | 'sms' | 'both') => 
                  setTestData(prev => ({ ...prev, notificationType: value }))
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
              <Label htmlFor="customerEmail">Test Email Address</Label>
              <Input
                id="customerEmail"
                type="email"
                value={testData.customerEmail}
                onChange={(e) => setTestData(prev => ({ ...prev, customerEmail: e.target.value }))}
                placeholder="customer@example.com"
              />
            </div>

            <div>
              <Label htmlFor="customerPhone">Test Phone Number</Label>
              <Input
                id="customerPhone"
                value={testData.customerPhone}
                onChange={(e) => setTestData(prev => ({ ...prev, customerPhone: e.target.value }))}
                placeholder="+232 76 XXXXXX"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="subject">Email Subject</Label>
            <Input
              id="subject"
              value={testData.subject}
              onChange={(e) => setTestData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Demo notification subject"
            />
          </div>

          <div>
            <Label htmlFor="message">Message Content</Label>
            <Textarea
              id="message"
              value={testData.message}
              onChange={(e) => setTestData(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Enter your demo message content"
              rows={4}
            />
          </div>

          <Button onClick={sendTestNotification} disabled={isLoading} className="w-full">
            <Send className="h-4 w-4 mr-2" />
            {isLoading ? 'Sending Test...' : 'Send Test Notification'}
          </Button>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div 
                  key={index}
                  className={`p-3 rounded-lg border ${
                    result.success 
                      ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' 
                      : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex items-center gap-2">
                      {result.type === 'email' ? (
                        <Mail className="h-4 w-4" />
                      ) : (
                        <MessageSquare className="h-4 w-4" />
                      )}
                      <Badge variant={result.success ? "default" : "destructive"}>
                        {result.type.toUpperCase()}
                      </Badge>
                      {result.success ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{result.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(result.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuration Help */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-2">
            <p><strong>Email (Resend):</strong> Requires RESEND_API_KEY</p>
            <p><strong>SMS (Plivo):</strong> Requires PLIVO_AUTH_ID, PLIVO_AUTH_TOKEN, PLIVO_PHONE_NUMBER</p>
            <p className="text-muted-foreground mt-4">
              Configure these secrets in your Supabase project settings under Edge Functions.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};