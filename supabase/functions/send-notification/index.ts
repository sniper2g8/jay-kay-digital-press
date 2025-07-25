import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { Resend } from "npm:resend@2.0.0";
import AfricasTalking from "npm:africastalking@0.7.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  type: 'email' | 'sms' | 'both';
  customer_id: string;
  job_id?: number;
  delivery_schedule_id?: string;
  event: 'job_submitted' | 'status_updated' | 'delivery_scheduled' | 'delivery_completed' | 'delivery_status_update' | 'admin_job_submitted';
  subject?: string;
  message: string;
  custom_data?: any;
}

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Initialize AfricasTalking
const africasTalkingApiKey = Deno.env.get('AFRICAS_TALKING_API_KEY');
const africasTalkingUsername = Deno.env.get('AFRICAS_TALKING_USERNAME');

let africasTalking: any = null;
if (africasTalkingApiKey && africasTalkingUsername) {
  africasTalking = AfricasTalking({
    apiKey: africasTalkingApiKey,
    username: africasTalkingUsername,
  });
}

const sendSMS = async (phone: string, message: string) => {
  if (!africasTalking) {
    throw new Error('AfricasTalking credentials not configured');
  }

  // Clean and format Sierra Leone phone number for AfricasTalking
  const cleanPhone = phone.replace(/\D/g, '');
  const formattedPhone = cleanPhone.startsWith('232') ? `+${cleanPhone}` : `+232${cleanPhone}`;

  console.log('Sending SMS via AfricasTalking to:', formattedPhone);

  try {
    const sms = africasTalking.SMS;
    const result = await sms.send({
      to: [formattedPhone],
      message: message,
      from: 'PrintShop', // Can be customized or use shortcode
    });

    console.log('AfricasTalking SMS result:', result);
    
    if (result.SMSMessageData && result.SMSMessageData.Recipients && result.SMSMessageData.Recipients.length > 0) {
      const recipient = result.SMSMessageData.Recipients[0];
      if (recipient.status === 'Success') {
        return {
          success: true,
          messageId: recipient.messageId,
          status: recipient.status,
          cost: recipient.cost
        };
      } else {
        throw new Error(`SMS failed: ${recipient.status}`);
      }
    } else {
      throw new Error('Invalid response from AfricasTalking');
    }
  } catch (error) {
    console.error('AfricasTalking SMS error:', error);
    throw new Error(`SMS failed: ${error.message}`);
  }
};

const sendEmail = async (email: string, subject: string, message: string) => {
  const { data: settings } = await supabase
    .from('company_settings')
    .select('company_name, notification_sender_email, notification_sender_name')
    .single();

  const fromEmail = settings?.notification_sender_email || 'noreply@printshop.com';
  const fromName = settings?.notification_sender_name || settings?.company_name || 'Print Shop';

  const emailResponse = await resend.emails.send({
    from: `${fromName} <${fromEmail}>`,
    to: [email],
    subject: subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">${subject}</h2>
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          ${message.replace(/\n/g, '<br>')}
        </div>
        <p style="color: #666; font-size: 12px;">
          This is an automated message from ${settings?.company_name || 'Print Shop'}.
        </p>
      </div>
    `,
  });

  return emailResponse;
};

const logNotification = async (
  customerId: string,
  type: string,
  event: string,
  recipientEmail?: string,
  recipientPhone?: string,
  subject?: string,
  message?: string,
  status?: string,
  externalId?: string,
  errorMessage?: string,
  jobId?: number,
  deliveryScheduleId?: string
) => {
  try {
    console.log('Attempting to log notification:', {
      customerId,
      type,
      event,
      recipientEmail,
      recipientPhone,
      status: status || 'sent'
    });
    
    const { data, error } = await supabase.from('notifications_log').insert({
      customer_id: customerId,
      notification_type: type,
      notification_event: event,
      recipient_email: recipientEmail,
      recipient_phone: recipientPhone,
      subject: subject,
      message: message,
      status: status || 'sent',
      external_id: externalId,
      error_message: errorMessage,
      job_id: jobId,
      delivery_schedule_id: deliveryScheduleId,
      sent_at: new Date().toISOString(),
    });
    
    if (error) {
      // ...existing code...
    } else {
      // ...existing code...
    }
  } catch (error) {
    // ...existing code...
  }
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      type, 
      customer_id, 
      job_id, 
      delivery_schedule_id, 
      event, 
      subject, 
      message,
      custom_data 
    }: NotificationRequest = await req.json();

    // ...existing code...

    // Handle admin notifications differently
    if (customer_id === 'admin') {
      // Get admin users for notifications
      const { data: adminUsers, error: adminError } = await supabase
        .from('internal_users')
        .select('email, name')
        .eq('role_id', 1); // Admin role ID

      if (adminError) {
      // ...existing code...
        return Response.json({ success: false, errors: ['Failed to fetch admin users'] }, { headers: corsHeaders });
      }

      // Send notification to all admins
      const adminPromises = (adminUsers || []).map(async (admin) => {
        const emailResult = await sendEmail(admin.email, subject, message);
        await logNotification(
          'admin',
          'email',
          event,
          admin.email,
          undefined,
          subject,
          message,
          'sent',
          emailResult?.data?.id || null,
          undefined,
          job_id,
          delivery_schedule_id
        );
        return emailResult;
      });

      const results = await Promise.all(adminPromises);
      return Response.json({ 
        success: true, 
        email_sent: results.length > 0,
        admin_notifications_sent: results.length
      }, { headers: corsHeaders });
    }

    // Get customer info and preferences
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select(`
        id,
        name,
        email,
        phone,
        notification_preferences (
          email_notifications,
          sms_notifications,
          job_status_updates,
          delivery_updates
        )
      `)
      .eq('id', customer_id)
      .single();

    if (customerError || !customer) {
      throw new Error('Customer not found');
    }

    const preferences = customer.notification_preferences?.[0];
    let emailSent = false;
    let smsSent = false;
    let errors: string[] = [];

    // Check if notifications are enabled for this event
    const isJobEvent = ['job_submitted', 'status_updated', 'admin_job_submitted'].includes(event);
    const isDeliveryEvent = ['delivery_scheduled', 'delivery_completed', 'delivery_status_update'].includes(event);
    
    const emailEnabled = preferences?.email_notifications && 
      ((isJobEvent && preferences?.job_status_updates) || 
       (isDeliveryEvent && preferences?.delivery_updates));
    
    const smsEnabled = preferences?.sms_notifications && 
      ((isJobEvent && preferences?.job_status_updates) || 
       (isDeliveryEvent && preferences?.delivery_updates));

    // Send email notification
    if ((type === 'email' || type === 'both') && emailEnabled && customer.email) {
      try {
        const emailResult = await sendEmail(
          customer.email, 
          subject || `Notification from Print Shop`, 
          message
        );
        emailSent = true;
        
        await logNotification(
          customer_id,
          'email',
          event,
          customer.email,
          undefined,
          subject,
          message,
          'sent',
          emailResult.data?.id,
          undefined,
          job_id,
          delivery_schedule_id
        );
        
        console.log('Email sent successfully:', emailResult.data?.id);
      } catch (error) {
        errors.push(`Email failed: ${error.message}`);
        await logNotification(
          customer_id,
          'email',
          event,
          customer.email,
          undefined,
          subject,
          message,
          'failed',
          undefined,
          error.message,
          job_id,
          delivery_schedule_id
        );
      }
    }

    // Send SMS notification
    if ((type === 'sms' || type === 'both') && smsEnabled && customer.phone) {
      try {
        const smsResult = await sendSMS(customer.phone, message);
        smsSent = true;
        
        await logNotification(
          customer_id,
          'sms',
          event,
          undefined,
          customer.phone,
          undefined,
          message,
          'sent',
          smsResult.messageId,
          undefined,
          job_id,
          delivery_schedule_id
        );
        
        console.log('SMS sent successfully via AfricasTalking:', smsResult.messageId);
      } catch (error) {
        errors.push(`SMS failed: ${error.message}`);
        await logNotification(
          customer_id,
          'sms',
          event,
          undefined,
          customer.phone,
          undefined,
          message,
          'failed',
          undefined,
          error.message,
          job_id,
          delivery_schedule_id
        );
      }
    }

    const response = {
      success: emailSent || smsSent,
      email_sent: emailSent,
      sms_sent: smsSent,
      errors: errors.length > 0 ? errors : undefined,
      customer_name: customer.name,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    console.error('Notification error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});