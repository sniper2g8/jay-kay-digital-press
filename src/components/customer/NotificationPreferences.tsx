import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Bell, Mail, MessageCircle, Truck, Briefcase } from "lucide-react";

interface NotificationPreferences {
  id?: string;
  customer_id: string;
  email_notifications: boolean;
  sms_notifications: boolean;
  job_status_updates: boolean;
  delivery_updates: boolean;
  promotional_messages: boolean;
}

export const NotificationPreferences = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: customer } = await supabase
        .from("customers")
        .select("id")
        .eq("auth_user_id", user.id)
        .single();

      if (!customer) throw new Error("Customer profile not found");

      const { data: prefs, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('customer_id', customer.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        throw error;
      }

      if (prefs) {
        setPreferences(prefs);
      } else {
        // Create default preferences
        const defaultPrefs: NotificationPreferences = {
          customer_id: customer.id,
          email_notifications: true,
          sms_notifications: false,
          job_status_updates: true,
          delivery_updates: true,
          promotional_messages: false,
        };

        const { data: newPrefs, error: createError } = await supabase
          .from('notification_preferences')
          .insert(defaultPrefs)
          .select()
          .single();

        if (createError) throw createError;
        setPreferences(newPrefs);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
      toast({
        title: "Error",
        description: "Failed to load notification preferences",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!preferences) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .update({
          email_notifications: preferences.email_notifications,
          sms_notifications: preferences.sms_notifications,
          job_status_updates: preferences.job_status_updates,
          delivery_updates: preferences.delivery_updates,
          promotional_messages: preferences.promotional_messages,
        })
        .eq('id', preferences.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Notification preferences updated successfully",
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Error",
        description: "Failed to save notification preferences",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (key: keyof NotificationPreferences, value: boolean) => {
    if (!preferences) return;
    setPreferences({ ...preferences, [key]: value });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!preferences) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Unable to load notification preferences.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Choose how you'd like to receive notifications about your print jobs and orders.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Notification Channels */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Notification Channels</h3>
          
          <div className="flex items-center justify-between space-x-2">
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="email-notifications" className="font-medium">
                Email Notifications
              </Label>
            </div>
            <Switch
              id="email-notifications"
              checked={preferences.email_notifications}
              onCheckedChange={(checked) => updatePreference('email_notifications', checked)}
            />
          </div>
          <p className="text-sm text-muted-foreground ml-6">
            Receive notifications via email
          </p>

          <div className="flex items-center justify-between space-x-2">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="sms-notifications" className="font-medium">
                SMS Notifications
              </Label>
            </div>
            <Switch
              id="sms-notifications"
              checked={preferences.sms_notifications}
              onCheckedChange={(checked) => updatePreference('sms_notifications', checked)}
            />
          </div>
          <p className="text-sm text-muted-foreground ml-6">
            Receive notifications via SMS text messages
          </p>
        </div>

        {/* Notification Types */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">What to Notify Me About</h3>
          
          <div className="flex items-center justify-between space-x-2">
            <div className="flex items-center space-x-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="job-updates" className="font-medium">
                Job Status Updates
              </Label>
            </div>
            <Switch
              id="job-updates"
              checked={preferences.job_status_updates}
              onCheckedChange={(checked) => updatePreference('job_status_updates', checked)}
            />
          </div>
          <p className="text-sm text-muted-foreground ml-6">
            Get notified when your print job status changes (processing, printing, ready, etc.)
          </p>

          <div className="flex items-center justify-between space-x-2">
            <div className="flex items-center space-x-2">
              <Truck className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="delivery-updates" className="font-medium">
                Delivery Updates
              </Label>
            </div>
            <Switch
              id="delivery-updates"
              checked={preferences.delivery_updates}
              onCheckedChange={(checked) => updatePreference('delivery_updates', checked)}
            />
          </div>
          <p className="text-sm text-muted-foreground ml-6">
            Get notified about delivery scheduling and completion
          </p>

          <div className="flex items-center justify-between space-x-2">
            <div className="flex items-center space-x-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="promotional" className="font-medium">
                Promotional Messages
              </Label>
            </div>
            <Switch
              id="promotional"
              checked={preferences.promotional_messages}
              onCheckedChange={(checked) => updatePreference('promotional_messages', checked)}
            />
          </div>
          <p className="text-sm text-muted-foreground ml-6">
            Receive offers, discounts, and news about our services
          </p>
        </div>

        <Button onClick={savePreferences} disabled={saving} className="w-full">
          {saving ? "Saving..." : "Save Preferences"}
        </Button>
      </CardContent>
    </Card>
  );
};