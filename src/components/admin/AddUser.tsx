import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Mail, Copy, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Role {
  id: number;
  name: string;
}

export const AddUser = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const { data, error } = await supabase
        .from("roles")
        .select("id, name");

      if (error) throw error;
      setRoles(data || []);
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };

  const handleGenerateInvite = async () => {
    if (!inviteEmail || !selectedRole || !inviteName) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      // Generate invite link with parameters
      const params = new URLSearchParams({
        mode: 'signup',
        email: inviteEmail,
        role: selectedRole,
        name: inviteName,
        ...(invitePhone && { phone: invitePhone })
      });
      
      const inviteLink = `${window.location.origin}/auth?${params.toString()}`;
      setGeneratedLink(inviteLink);
      
      toast({
        title: "Invite Link Generated",
        description: "Share this link with the user to complete registration.",
      });
    } catch (error) {
      console.error("Error generating invite:", error);
      toast({
        title: "Error",
        description: "Failed to generate invite link",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      toast({
        title: "Copied",
        description: "Invite link copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  const clearForm = () => {
    setInviteEmail("");
    setSelectedRole("");
    setInviteName("");
    setInvitePhone("");
    setGeneratedLink("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Add New User</h2>
        <p className="text-muted-foreground">Generate invite links for new users to join the system</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Invite Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              User Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inviteName">Full Name *</Label>
              <Input
                id="inviteName"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="Enter full name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="inviteEmail">Email Address *</Label>
              <Input
                id="inviteEmail"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Enter email address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invitePhone">Phone Number</Label>
              <Input
                id="invitePhone"
                type="tel"
                value={invitePhone}
                onChange={(e) => setInvitePhone(e.target.value)}
                placeholder="Enter phone number (optional)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.name}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleGenerateInvite} 
                className="flex-1"
                disabled={loading}
              >
                <Mail className="h-4 w-4 mr-2" />
                {loading ? "Generating..." : "Generate Invite"}
              </Button>
              
              {generatedLink && (
                <Button variant="outline" onClick={clearForm}>
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Generated Link */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Invite Link
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!generatedLink ? (
              <div className="text-center py-8 text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Fill out the form to generate an invite link</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Generated Invite Link</Label>
                  <div className="p-3 bg-muted rounded-lg break-all text-sm">
                    {generatedLink}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={copyToClipboard} variant="outline" className="flex-1">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Link
                  </Button>
                  
                  <Button asChild variant="outline">
                    <a href={generatedLink} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Test
                    </a>
                  </Button>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Instructions:</h4>
                  <ol className="text-sm text-blue-800 space-y-1">
                    <li>1. Copy the invite link above</li>
                    <li>2. Send it to the user via email or messaging</li>
                    <li>3. User clicks the link to complete registration</li>
                    <li>4. User will be automatically assigned the selected role</li>
                  </ol>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Role Information */}
      <Card>
        <CardHeader>
          <CardTitle>Available Roles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {roles.map((role) => (
              <div key={role.id} className="p-4 border rounded-lg">
                <h4 className="font-medium">{role.name}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {role.name === 'Admin' && 'Full system access and user management'}
                  {role.name === 'Staff' && 'Operational access to manage jobs and customers'}
                  {role.name === 'Customer' && 'Customer portal access for tracking orders'}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};