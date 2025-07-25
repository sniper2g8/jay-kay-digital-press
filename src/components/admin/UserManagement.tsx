import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, Mail, Shield, Trash2, UserPlus, Edit, RotateCcw, Key } from "lucide-react";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { validateEmail, sanitizeInput } from "@/utils/inputValidation";

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
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [editUserData, setEditUserData] = useState({
    name: '',
    email: '',
    phone: '',
    role: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
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

    // Validate email format
    if (!validateEmail(inviteEmail)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    // Sanitize inputs
    const sanitizedName = sanitizeInput(inviteName);
    const sanitizedPhone = sanitizeInput(invitePhone);

    try {
      // Get role ID
      const roleData = roles.find(r => r.name === selectedRole);
      if (!roleData) {
        throw new Error("Invalid role selected");
      }

      // Generate a secure invite token
      const inviteToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      // Store invite in database
      const { error: inviteError } = await supabase
        .from("user_invitations")
        .insert({
          invite_token: inviteToken,
          invited_email: inviteEmail,
          invited_name: sanitizedName,
          invited_phone: sanitizedPhone || null,
          invited_role_id: roleData.id,
          invited_by: (await supabase.auth.getUser()).data.user?.id,
          expires_at: expiresAt.toISOString()
        });

      if (inviteError) throw inviteError;
      
      const inviteLink = `${window.location.origin}/auth?invite=${inviteToken}`;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(inviteLink);
      
      toast({
        title: "Invitation Sent Successfully",
        description: `Secure invite link has been copied to your clipboard. Valid for 24 hours.`,
      });

      setInviteDialogOpen(false);
      setInviteEmail("");
      setSelectedRole("");
      setInviteName("");
      setInvitePhone("");
    } catch (error: any) {
      console.error("Error generating invite:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate invite link",
        variant: "destructive",
      });
    }
  };

  const handleAddUser = async () => {
    // For staff users, email is optional, for others it's required
    const isEmailRequired = selectedRole !== "Staff";
    
    if (!selectedRole || !inviteName || (isEmailRequired && !inviteEmail)) {
      toast({
        title: "Error",
        description: `Please fill in all required fields${isEmailRequired ? " (including email)" : ""}`,
        variant: "destructive",
      });
      return;
    }

    // Validate email format only if email is provided
    if (inviteEmail && !validateEmail(inviteEmail)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    try {
      const roleData = roles.find(r => r.name === selectedRole);
      if (!roleData) {
        throw new Error("Invalid role selected");
      }

      // Check if email already exists (only if email is provided)
      if (inviteEmail) {
        const { data: existingCustomer } = await supabase
          .from("customers")
          .select("email")
          .eq("email", inviteEmail)
          .maybeSingle();

        const { data: existingInternal } = await supabase
          .from("internal_users")
          .select("email")
          .eq("email", inviteEmail)
          .maybeSingle();

        if (existingCustomer || existingInternal) {
          throw new Error("A user with this email already exists");
        }
      }

      // Allow direct creation of all user types by admins
      if (selectedRole === "Customer") {
        const { error } = await supabase
          .from("customers")
          .insert({
            name: sanitizeInput(inviteName),
            email: inviteEmail,
            phone: sanitizeInput(invitePhone) || null,
          });
        if (error) throw error;

        toast({
          title: "Success",
          description: "Customer has been added successfully",
        });
      } else if (selectedRole === "Staff") {
        // Create staff user in non_system_staff table (for staff without authentication)
        const { error } = await supabase
          .from("non_system_staff")
          .insert({
            name: sanitizeInput(inviteName),
            email: inviteEmail || null, // Email is optional for staff
            phone: sanitizeInput(invitePhone) || null,
            position: "Staff",
          });
        if (error) throw error;

        toast({
          title: "Success",
          description: "Staff member has been added successfully",
        });
      } else {
        // For Admin and System User roles, create directly in internal_users table
        // Note: These users won't have authentication until they're invited separately
        const { error } = await supabase
          .from("internal_users")
          .insert({
            name: sanitizeInput(inviteName),
            email: inviteEmail || `${selectedRole.toLowerCase()}_${Date.now()}@internal.local`,
            phone: sanitizeInput(invitePhone) || null,
            role_id: roleData.id,
            auth_user_id: null, // No authentication setup yet
          });
        if (error) throw error;

        toast({
          title: "Success",
          description: `${selectedRole} user has been added successfully. Use 'Invite User' to set up authentication.`,
        });
      }

      setAddUserDialogOpen(false);
      setInviteEmail("");
      setSelectedRole("");
      setInviteName("");
      setInvitePhone("");
      fetchUsers();
    } catch (error: any) {
      console.error("Error adding user:", error);
      
      // Provide specific error messages
      let errorMessage = "Failed to add user";
      if (error.message?.includes("duplicate key")) {
        errorMessage = "A user with this email already exists";
      } else if (error.message?.includes("foreign key")) {
        errorMessage = "Invalid role selected or database constraint violation";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const [deleteUserDialog, setDeleteUserDialog] = useState<{ open: boolean; userId?: string; userType?: 'customer' | 'internal' }>({ open: false });

  const handleDeleteUser = (userId: string, userType: 'customer' | 'internal') => {
    setDeleteUserDialog({ open: true, userId, userType });
  };

  const confirmDeleteUser = async () => {
    const { userId, userType } = deleteUserDialog;
    if (!userId || !userType) return;
    
    setDeleteUserDialog({ open: false });

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

  const editUser = (user: User) => {
    setSelectedUser(user);
    setEditUserData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role
    });
    setEditUserDialogOpen(true);
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;

    try {
      const roleData = roles.find(r => r.name === editUserData.role);
      if (!roleData && editUserData.role !== 'Customer') {
        throw new Error("Invalid role selected");
      }

      if (selectedUser.user_type === 'customer') {
        const { error } = await supabase
          .from("customers")
          .update({
            name: editUserData.name,
            email: editUserData.email,
            phone: editUserData.phone || null,
          })
          .eq("auth_user_id", selectedUser.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("internal_users")
          .update({
            name: editUserData.name,
            email: editUserData.email,
            phone: editUserData.phone || null,
            role_id: roleData?.id
          })
          .eq("auth_user_id", selectedUser.id);
        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "User updated successfully",
      });

      setEditUserDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    }
  };

  const [resetPasswordDialog, setResetPasswordDialog] = useState<{ open: boolean; userEmail?: string }>({ open: false });

  const handleResetPassword = (userEmail: string) => {
    setResetPasswordDialog({ open: true, userEmail });
  };

  const confirmResetPassword = async () => {
    const { userEmail } = resetPasswordDialog;
    if (!userEmail) return;
    
    setResetPasswordDialog({ open: false });

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) throw error;

      toast({
        title: "Password Reset Sent",
        description: `Password reset email has been sent to ${userEmail}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send password reset email",
        variant: "destructive",
      });
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
        <div className="flex gap-2">
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <UserPlus className="h-4 w-4 mr-2" />
                Invite User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite New User</DialogTitle>
                <DialogDescription>
                  Generate an invitation link for a new user to join the system.
                </DialogDescription>
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

          <Dialog open={addUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add User Directly
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add User Directly</DialogTitle>
                <DialogDescription>
                  Create a new user account directly in the system.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="add-name">Full Name</Label>
                  <Input
                    id="add-name"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <Label htmlFor="add-email">
                    Email {selectedRole === "Staff" ? "(Optional)" : "*"}
                  </Label>
                  <Input
                    id="add-email"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder={selectedRole === "Staff" ? "Enter email address (optional)" : "Enter email address"}
                  />
                </div>
                <div>
                  <Label htmlFor="add-phone">Phone</Label>
                  <Input
                    id="add-phone"
                    value={invitePhone}
                    onChange={(e) => setInvitePhone(e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <Label htmlFor="add-role">Role</Label>
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
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setAddUserDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddUser}>
                    Add User
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
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
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => editUser(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleResetPassword(user.email)}
                          disabled={user.user_type === 'internal' && !user.email.includes('@')}
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id, user.user_type)}
                          disabled={user.role === 'Admin'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={editUserDialogOpen} onOpenChange={setEditUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and role.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={editUserData.name}
                onChange={(e) => setEditUserData({...editUserData, name: e.target.value})}
                placeholder="Enter full name"
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editUserData.email}
                onChange={(e) => setEditUserData({...editUserData, email: e.target.value})}
                placeholder="Enter email address"
              />
            </div>
            <div>
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                value={editUserData.phone}
                onChange={(e) => setEditUserData({...editUserData, phone: e.target.value})}
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <Label htmlFor="edit-role">Role</Label>
              <Select 
                value={editUserData.role} 
                onValueChange={(value) => setEditUserData({...editUserData, role: value})}
              >
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
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditUserDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditUser}>
                Update User
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={deleteUserDialog.open}
        onOpenChange={(open) => setDeleteUserDialog({ open })}
        title="Delete User"
        description="Are you sure you want to delete this user? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        onConfirm={confirmDeleteUser}
      />

      <ConfirmationDialog
        open={resetPasswordDialog.open}
        onOpenChange={(open) => setResetPasswordDialog({ open })}
        title="Reset Password"
        description={`Are you sure you want to send a password reset email to ${resetPasswordDialog.userEmail}?`}
        confirmText="Send Reset Email"
        onConfirm={confirmResetPassword}
      />
    </div>
  );
};