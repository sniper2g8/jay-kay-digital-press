import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, Mail, Shield, Trash2, UserPlus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  created_at: string;
  user_type: 'customer' | 'internal';
}

interface Role {
  id: number;
  name: string;
}

export const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const { data, error } = await supabase
        .from("roles")
        .select("id, name")
        .neq("name", "Customer");

      if (error) throw error;
      setRoles(data || []);
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch customers
      const { data: customers, error: customersError } = await supabase
        .from("customers")
        .select(`
          id,
          name,
          email,
          phone,
          created_at,
          auth_user_id
        `);

      // Fetch internal users
      const { data: internalUsers, error: internalError } = await supabase
        .from("internal_users")
        .select(`
          id,
          name,
          email,
          phone,
          created_at,
          auth_user_id,
          roles (
            name
          )
        `);

      // Fetch non-system staff
      const { data: nonSystemStaff, error: nonSystemError } = await supabase
        .from("non_system_staff")
        .select(`
          id,
          name,
          email,
          phone,
          created_at,
          position,
          is_active
        `);

      if (customersError) throw customersError;
      if (internalError) throw internalError;
      if (nonSystemError) throw nonSystemError;

      const allUsers: User[] = [
        ...(customers || []).map(customer => ({
          id: customer.auth_user_id || customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          role: "Customer",
          created_at: customer.created_at,
          user_type: 'customer' as const
        })),
        ...(internalUsers || []).map(user => ({
          id: user.auth_user_id || user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: (user as any).roles?.name || "Unknown",
          created_at: user.created_at,
          user_type: 'internal' as const
        })),
        ...(nonSystemStaff || []).map(staff => ({
          id: staff.id,
          name: staff.name,
          email: staff.email || "N/A",
          phone: staff.phone,
          role: staff.position || "Non-System Staff",
          created_at: staff.created_at || new Date().toISOString(),
          user_type: 'internal' as const
        }))
      ];

      setUsers(allUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = async () => {
    if (!inviteEmail || !selectedRole || !inviteName) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      // Generate invite link
      const inviteLink = `${window.location.origin}/auth?mode=signup&email=${encodeURIComponent(inviteEmail)}&role=${selectedRole}&name=${encodeURIComponent(inviteName)}`;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(inviteLink);
      
      toast({
        title: "Invite Link Generated",
        description: "Invite link has been copied to your clipboard. Share it with the user to complete registration.",
      });

      setInviteDialogOpen(false);
      setInviteEmail("");
      setSelectedRole("");
      setInviteName("");
      setInvitePhone("");
    } catch (error) {
      console.error("Error generating invite:", error);
      toast({
        title: "Error",
        description: "Failed to generate invite link",
        variant: "destructive",
      });
    }
  };

  const deleteUser = async (userId: string, userType: 'customer' | 'internal') => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return;
    }

    try {
      if (userType === 'customer') {
        const { error } = await supabase
          .from("customers")
          .delete()
          .eq("auth_user_id", userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("internal_users")
          .delete()
          .eq("auth_user_id", userId);
        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-red-500 text-white';
      case 'staff':
        return 'bg-blue-500 text-white';
      case 'customer':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4 animate-pulse" />
            <p>Loading users...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">User Management</h2>
        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite New User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="inviteName">Full Name</Label>
                <Input
                  id="inviteName"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Enter full name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="inviteEmail">Email Address</Label>
                <Input
                  id="inviteEmail"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Enter email address"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invitePhone">Phone Number (Optional)</Label>
                <Input
                  id="invitePhone"
                  type="tel"
                  value={invitePhone}
                  onChange={(e) => setInvitePhone(e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
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

              <Button onClick={handleInviteUser} className="w-full">
                <Mail className="h-4 w-4 mr-2" />
                Generate Invite Link
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Users ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Users Found</h3>
              <p className="text-muted-foreground">No users have been registered yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone || "N/A"}</TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(user.role)}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteUser(user.id, user.user_type)}
                        disabled={user.role === 'Admin'} // Prevent deletion of admin users
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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