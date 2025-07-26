import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { Resend } from "npm:resend@2.0.0";
import AfricasTalking from "npm:africastalking@0.7.3";
import QRCode from "npm:qrcode@1.5.4";

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

    console.log(`Sending SMS to ${formattedPhone}: ${message}`);

    try {
      const sms = africasTalking.SMS;
      const result = await sms.send({
        to: [formattedPhone],
        message: message,
        from: 'PrintShop', // Can be customized or use shortcode
      });

      console.log('SMS sent successfully:', result);
    
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
    throw new Error(`SMS failed: ${error.message}`);
  }
};

const generateQRCode = async (trackingUrl: string): Promise<string> => {
  try {
    const qrDataURL = await QRCode.toDataURL(trackingUrl, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    return qrDataURL;
  } catch (error) {
    console.error('Failed to generate QR code:', error);
    return '';
  }
};

const sendJobProgressEmail = async (
  email: string, 
  customerName: string, 
  jobTitle: string, 
  jobId: number, 
  trackingCode: string, 
  workflowStatus: string,
  trackingUrl: string
) => {
  const { data: settings } = await supabase
    .from('company_settings')
    .select('company_name, notification_sender_email, notification_sender_name')
    .single();

  const fromEmail = settings?.notification_sender_email || 'noreply@printshop.com';
  const fromName = settings?.notification_sender_name || settings?.company_name || 'Jay Kay Digital Press';

  // Generate QR code
  const qrCodeDataURL = await generateQRCode(trackingUrl);
  const qrCodeImage = qrCodeDataURL ? `<img src="${qrCodeDataURL}" alt="QR Code for tracking" style="display: block; margin: 20px auto; max-width: 200px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">` : '';

  const subject = `Job Status Update - ${jobTitle}`;

  const emailResponse = await resend.emails.send({
    from: `${fromName} <${fromEmail}>`,
    to: [email],
    subject: subject,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .content {
            padding: 30px;
          }
          .greeting {
            font-size: 18px;
            margin-bottom: 20px;
            color: #2c3e50;
          }
          .update-message {
            font-size: 16px;
            margin-bottom: 25px;
            color: #34495e;
            font-weight: 500;
          }
          .job-details {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-radius: 10px;
            padding: 25px;
            margin: 25px 0;
            border-left: 5px solid #667eea;
          }
          .detail-item {
            display: flex;
            align-items: center;
            margin-bottom: 12px;
            font-size: 15px;
            color: #2c3e50;
          }
          .detail-item:last-child {
            margin-bottom: 0;
          }
          .detail-emoji {
            font-size: 18px;
            margin-right: 10px;
            width: 25px;
          }
          .detail-label {
            font-weight: 600;
            margin-right: 8px;
            color: #34495e;
          }
          .detail-value {
            color: #2c3e50;
            font-weight: 500;
          }
          .tracking-section {
            background: #fff;
            border-radius: 10px;
            padding: 20px;
            margin: 25px 0;
            border: 2px solid #e9ecef;
            text-align: center;
          }
          .tracking-text {
            font-size: 16px;
            color: #34495e;
            margin-bottom: 15px;
          }
          .tracking-link {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            padding: 12px 25px;
            border-radius: 25px;
            font-weight: 600;
            transition: transform 0.2s ease;
            font-size: 14px;
          }
          .tracking-link:hover {
            transform: translateY(-2px);
          }
          .qr-section {
            text-align: center;
            margin: 25px 0;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 10px;
          }
          .qr-text {
            font-size: 16px;
            color: #34495e;
            margin-bottom: 15px;
          }
          .signature {
            margin-top: 40px;
            padding-top: 25px;
            border-top: 2px solid #e9ecef;
            color: #2c3e50;
          }
          .company-name {
            font-weight: 700;
            color: #667eea;
            font-size: 18px;
          }
          .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #6c757d;
            font-size: 12px;
            border-top: 1px solid #e9ecef;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px; font-weight: 600;">Job Status Update</h1>
          </div>
          
          <div class="content">
            <div class="greeting">Hi ${customerName},</div>
            
            <div class="update-message">Your job has been updated.</div>
            
            <div class="job-details">
              <div class="detail-item">
                <span class="detail-emoji">📦</span>
                <span class="detail-label">Job Title:</span>
                <span class="detail-value">${jobTitle}</span>
              </div>
              <div class="detail-item">
                <span class="detail-emoji">🆔</span>
                <span class="detail-label">Job ID:</span>
                <span class="detail-value">JKDP-${jobId}</span>
              </div>
              <div class="detail-item">
                <span class="detail-emoji">🔢</span>
                <span class="detail-label">Tracking Code:</span>
                <span class="detail-value">${trackingCode}</span>
              </div>
              <div class="detail-item">
                <span class="detail-emoji">📍</span>
                <span class="detail-label">Status:</span>
                <span class="detail-value">${workflowStatus}</span>
              </div>
            </div>
            
            <div class="tracking-section">
              <div class="tracking-text">You can track your job anytime here:</div>
              <a href="${trackingUrl}" class="tracking-link">
                🔗 Track Your Job
              </a>
            </div>
            
            ${qrCodeImage ? `
              <div class="qr-section">
                <div class="qr-text">📱 Scan the QR code to track:</div>
                ${qrCodeImage}
              </div>
            ` : ''}
            
            <div class="signature">
              <div>Thank you,</div>
              <div class="company-name">Jay Kay Digital Press</div>
            </div>
          </div>
          
          <div class="footer">
            This is an automated message from ${settings?.company_name || 'Jay Kay Digital Press'}.
          </div>
        </div>
      </body>
      </html>
    `,
  });

  return emailResponse;
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
      console.error('Failed to log notification:', error);
    } else {
      console.log('Notification logged successfully:', data);
    }
  } catch (error) {
    console.error('Error logging notification:', error);
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

    console.log('Processing notification request:', { type, customer_id, event, job_id, delivery_schedule_id });

    // Handle admin notifications differently
    if (customer_id === 'admin') {
      console.log('Processing admin notification');
      // Get admin users for notifications
      const { data: adminUsers, error: adminError } = await supabase
        .from('internal_users')
        .select('email, name')
        .eq('role_id', 1); // Admin role ID

      if (adminError) {
        console.error('Failed to fetch admin users:', adminError);
        return Response.json({ success: false, errors: ['Failed to fetch admin users'] }, { headers: corsHeaders });
      }

      // Send notification to all admins
      const adminPromises = (adminUsers || []).map(async (admin) => {
        const emailResult = await sendEmail(admin.email, subject || "Notification from Print Shop", message);
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
        let emailResult;
        
        // Use special job progress email format for job-related events
        if ((event === 'status_updated' || event === 'job_submitted') && job_id) {
          // Fetch job details and workflow status
          const { data: jobData } = await supabase
            .from('jobs')
            .select(`
              id,
              title,
              tracking_code,
              current_status,
              workflow_status (name)
            `)
            .eq('id', job_id)
            .single();

          if (jobData) {
            const trackingUrl = `${Deno.env.get('SUPABASE_URL')?.replace('/auth', '')}/track/${jobData.tracking_code}`;
            const workflowStatus = jobData.workflow_status?.name || 'In Progress';
            
            emailResult = await sendJobProgressEmail(
              customer.email,
              customer.name,
              jobData.title || 'Print Job',
              jobData.id,
              jobData.tracking_code || '',
              workflowStatus,
              trackingUrl
            );
          } else {
            // Fallback to regular email if job data not found
            emailResult = await sendEmail(customer.email, subject || 'Job Status Update', message);
          }
        } else {
          // Use regular email for non-job events
          emailResult = await sendEmail(customer.email, subject || 'Notification', message);
        }
        
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
        
        console.log('Email sent successfully for job progress:', emailResult);
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
        
        console.log('SMS sent successfully:', smsResult);
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
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});