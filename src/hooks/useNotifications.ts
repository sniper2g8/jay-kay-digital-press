import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface NotificationData {
  customer_id: string;
  job_id?: number;
  delivery_schedule_id?: string;
  event: 'job_submitted' | 'status_updated' | 'delivery_scheduled' | 'delivery_completed' | 'test' | string;
  subject?: string;
  message: string;
  type?: 'email' | 'sms' | 'both';
}

export const useNotifications = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const sendNotification = async (data: NotificationData) => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('send-notification', {
        body: {
          type: data.type || 'both',
          ...data,
        },
      });

      if (error) throw error;

      if (result?.success) {
        // Notification sent successfully
        toast({
          title: "Notification Sent",
          description: `Successfully sent ${result.email_sent ? 'email' : ''}${result.email_sent && result.sms_sent ? ' and ' : ''}${result.sms_sent ? 'SMS' : ''} notification`,
        });
        return result;
      } else {
        // Notification partially failed
        toast({
          title: "Notification Warning",
          description: result?.errors?.join(', ') || "Notification may not have been fully delivered",
          variant: "destructive",
        });
        return result;
      }
    } catch (error) {
      console.error('Failed to send notification:', error);
      toast({
        title: "Notification Error",
        description: "Failed to send notification. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const sendJobSubmittedNotification = async (customerId: string, jobId: number, jobTitle: string) => {
    // Fetch job details to get tracking code
    const { data: job } = await supabase
      .from('jobs')
      .select('tracking_code')
      .eq('id', jobId)
      .single();
    
    const trackingInfo = job?.tracking_code ? `\n\nJob Number: ${jobId}\nTracking ID: ${job.tracking_code}` : `\n\nJob Number: ${jobId}`;
    
    return sendNotification({
      customer_id: customerId,
      job_id: jobId,
      event: 'job_submitted',
      subject: `Job Submitted Successfully - ${jobTitle}`,
      message: `Your print job "${jobTitle}" has been submitted successfully. We'll notify you when it's ready for pickup or delivery.${trackingInfo}`,
    });
  };

  const sendStatusUpdateNotification = async (customerId: string, jobId: number, jobTitle: string, newStatus: string) => {
    // Fetch job details to get tracking code
    const { data: job } = await supabase
      .from('jobs')
      .select('tracking_code')
      .eq('id', jobId)
      .single();
    
    const trackingInfo = job?.tracking_code ? `\n\nJob Number: ${jobId}\nTracking ID: ${job.tracking_code}` : `\n\nJob Number: ${jobId}`;
    
    return sendNotification({
      customer_id: customerId,
      job_id: jobId,
      event: 'status_updated',
      subject: `Job Status Update - ${jobTitle}`,
      message: `Your print job "${jobTitle}" status has been updated to: ${newStatus}${trackingInfo}`,
    });
  };

  const sendDeliveryNotification = async (customerId: string, deliveryScheduleId: string, jobTitle: string, status: 'scheduled' | 'completed') => {
    const isCompleted = status === 'completed';
    
    // Fetch job details to get tracking code from delivery schedule
    const { data: delivery } = await supabase
      .from('delivery_schedules')
      .select('job_id, jobs(tracking_code)')
      .eq('id', deliveryScheduleId)
      .single();
    
    const jobId = delivery?.job_id;
    const trackingCode = delivery?.jobs?.tracking_code;
    const trackingInfo = trackingCode ? `\n\nJob Number: ${jobId}\nTracking ID: ${trackingCode}` : jobId ? `\n\nJob Number: ${jobId}` : '';
    
    return sendNotification({
      customer_id: customerId,
      delivery_schedule_id: deliveryScheduleId,
      event: isCompleted ? 'delivery_completed' : 'delivery_scheduled',
      subject: `Delivery ${isCompleted ? 'Completed' : 'Scheduled'} - ${jobTitle}`,
      message: isCompleted 
        ? `Your print job "${jobTitle}" has been delivered successfully.${trackingInfo}`
        : `Your print job "${jobTitle}" has been scheduled for delivery.${trackingInfo}`,
    });
  };

  const sendAdminJobNotification = async (customerId: string, jobId: number, jobTitle: string, customerName: string) => {
    // Fetch job details to get tracking code
    const { data: job } = await supabase
      .from('jobs')
      .select('tracking_code')
      .eq('id', jobId)
      .single();
    
    const trackingInfo = job?.tracking_code ? `\n\nJob Number: ${jobId}\nTracking ID: ${job.tracking_code}` : `\n\nJob Number: ${jobId}`;
    
    return sendNotification({
      customer_id: 'admin',
      job_id: jobId,
      event: 'admin_job_submitted',
      subject: `New Job Submitted - ${jobTitle}`,
      message: `A new print job "${jobTitle}" has been submitted by ${customerName} (Customer ID: ${customerId}).${trackingInfo}`,
    });
  };

  return {
    sendNotification,
    sendJobSubmittedNotification,
    sendStatusUpdateNotification,
    sendDeliveryNotification,
    sendAdminJobNotification,
    loading,
  };
};