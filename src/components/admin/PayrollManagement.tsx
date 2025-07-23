import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Eye, DollarSign, Users, Calendar } from "lucide-react";
import { format } from "date-fns";

interface Payroll {
  id: string;
  month: string;
  total_amount: number;
  status: string;
  created_at: string;
  processed_at: string | null;
  processed_by: string | null;
}

interface Employee {
  id: string;
  employee_number: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  salary: number;
  allowances: number;
  deductions: number;
  hire_date: string;
  is_active: boolean;
}

interface PayrollPayment {
  id: string;
  employee_id: string;
  base_salary: number;
  allowances: number;
  deductions: number;
  net_amount: number;
  payment_method: string;
  payment_reference: string;
  notes: string;
  paid_at: string | null;
}

export const PayrollManagement = () => {
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
  const [payrollPayments, setPayrollPayments] = useState<PayrollPayment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newPayrollMonth, setNewPayrollMonth] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isAddStaffDialogOpen, setIsAddStaffDialogOpen] = useState(false);
  const [isEditSalaryDialogOpen, setIsEditSalaryDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    salary: '',
    allowances: '',
    deductions: ''
  });

  const [editSalary, setEditSalary] = useState({
    salary: 0,
    allowances: 0,
    deductions: 0
  });

  useEffect(() => {
    fetchPayrolls();
    fetchEmployees();
  }, []);

  const fetchPayrolls = async () => {
    try {
      const { data, error } = await supabase
        .from("payrolls")
        .select("*")
        .order("month", { ascending: false });

      if (error) throw error;
      setPayrolls(data || []);
    } catch (error) {
      console.error("Error fetching payrolls:", error);
      toast.error("Failed to fetch payrolls");
    }
  };

  const fetchEmployees = async () => {
    try {
      // First fetch all employees
      const { data: employeesData, error } = await supabase
        .from("employees")
        .select("*");

      if (error) throw error;

      console.log("Raw employees data:", employeesData);

      // Get unique internal user IDs and non-system staff IDs
      const internalUserIds = employeesData?.filter(emp => emp.internal_user_id).map(emp => emp.internal_user_id) || [];
      const nonSystemStaffIds = employeesData?.filter(emp => emp.non_system_staff_id).map(emp => emp.non_system_staff_id) || [];

      // Fetch internal users data
      let internalUsersData: any[] = [];
      if (internalUserIds.length > 0) {
        const { data, error: internalError } = await supabase
          .from("internal_users")
          .select("id, name, email, phone, roles(name)")
          .in("id", internalUserIds);
        
        if (!internalError) {
          internalUsersData = data || [];
        }
      }

      // Fetch non-system staff data
      let nonSystemStaffData: any[] = [];
      if (nonSystemStaffIds.length > 0) {
        const { data, error: staffError } = await supabase
          .from("non_system_staff")
          .select("id, name, email, phone, position")
          .in("id", nonSystemStaffIds);
        
        if (!staffError) {
          nonSystemStaffData = data || [];
        }
      }

      // Create lookup maps
      const internalUsersMap = new Map(internalUsersData.map(user => [user.id, user]));
      const nonSystemStaffMap = new Map(nonSystemStaffData.map(staff => [staff.id, staff]));

      const formattedEmployees = (employeesData || []).map(emp => {
        let name, email, phone, role;
        
        if (emp.internal_user_id && internalUsersMap.has(emp.internal_user_id)) {
          const internalUser = internalUsersMap.get(emp.internal_user_id);
          name = internalUser.name;
          email = internalUser.email;
          phone = internalUser.phone;
          role = internalUser.roles?.name || 'System User';
        } else if (emp.non_system_staff_id && nonSystemStaffMap.has(emp.non_system_staff_id)) {
          const staffUser = nonSystemStaffMap.get(emp.non_system_staff_id);
          name = staffUser.name;
          email = staffUser.email;
          phone = staffUser.phone;
          role = staffUser.position || 'Non-System Staff';
        } else {
          // Fallback to employee table data
          name = emp.name || 'Unknown Employee';
          email = emp.email || '';
          phone = emp.phone || '';
          role = emp.role || 'Staff';
        }

        return {
          id: emp.id,
          employee_number: emp.employee_number || 'Not assigned',
          name: name,
          email: email,
          phone: phone,
          role: role,
          salary: Number(emp.salary || 0),
          allowances: Number(emp.allowances || 0),
          deductions: Number(emp.deductions || 0),
          hire_date: emp.hire_date || emp.created_at,
          is_active: emp.is_active !== false
        };
      });

      console.log("Formatted employees:", formattedEmployees);
      setEmployees(formattedEmployees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast.error("Failed to fetch employees");
    }
  };

  const fetchPayrollPayments = async (payrollId: string) => {
    try {
      const { data, error } = await supabase
        .from("payroll_payments")
        .select("*")
        .eq("payroll_id", payrollId);

      if (error) throw error;
      setPayrollPayments(data || []);
    } catch (error) {
      console.error("Error fetching payroll payments:", error);
      toast.error("Failed to fetch payroll payments");
    }
  };

  const createPayroll = async () => {
    if (!newPayrollMonth) {
      toast.error("Please select a month");
      return;
    }

    setIsLoading(true);
    try {
      // Calculate total amount from all active employees
      const totalAmount = employees.reduce((sum, emp) => 
        sum + (emp.salary + emp.allowances - emp.deductions), 0
      );

      const { data: payroll, error: payrollError } = await supabase
        .from("payrolls")
        .insert({
          month: newPayrollMonth + "-01", // Convert YYYY-MM to YYYY-MM-DD
          total_amount: totalAmount,
          status: "draft"
        })
        .select()
        .maybeSingle();

      if (payrollError || !payroll) throw payrollError || new Error('Failed to create payroll');

      // Create payroll payments for all employees
      const payrollPayments = employees.map(emp => ({
        payroll_id: payroll.id,
        employee_id: emp.id,
        base_salary: emp.salary,
        allowances: emp.allowances || 0,
        deductions: emp.deductions || 0,
        net_amount: emp.salary + (emp.allowances || 0) - (emp.deductions || 0)
      }));

      const { error: paymentsError } = await supabase
        .from("payroll_payments")
        .insert(payrollPayments);

      if (paymentsError) throw paymentsError;

      toast.success("Payroll created successfully");
      setIsCreateDialogOpen(false);
      setNewPayrollMonth("");
      fetchPayrolls();
    } catch (error) {
      console.error("Error creating payroll:", error);
      toast.error("Failed to create payroll");
    } finally {
      setIsLoading(false);
    }
  };

  const processPayroll = async (payrollId: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("payrolls")
        .update({
          status: "processed",
          processed_at: new Date().toISOString()
        })
        .eq("id", payrollId);

      if (error) throw error;

      toast.success("Payroll processed successfully");
      fetchPayrolls();
    } catch (error) {
      console.error("Error processing payroll:", error);
      toast.error("Failed to process payroll");
    } finally {
      setIsLoading(false);
    }
  };

  const addStaff = async () => {
    if (!newStaff.name || !newStaff.salary) {
      toast.error("Please fill in required fields (name and salary)");
      return;
    }

    setIsLoading(true);
    try {
      // First create the non-system staff record
      const { data: staffData, error: staffError } = await supabase
        .from("non_system_staff")
        .insert({
          name: newStaff.name,
          email: newStaff.email || null,
          phone: newStaff.phone || null,
          position: newStaff.position || 'Staff'
        })
        .select()
        .maybeSingle();

      if (staffError || !staffData) throw staffError || new Error('Failed to create staff record');

      // Then create the employee record with salary information
      const { error: employeeError } = await supabase
        .from("employees")
        .insert({
          name: newStaff.name,
          email: newStaff.email || null,
          phone: newStaff.phone || null,
          role: 'NonSystemStaff',
          non_system_staff_id: staffData.id,
          salary: parseFloat(newStaff.salary),
          allowances: parseFloat(newStaff.allowances) || 0,
          deductions: parseFloat(newStaff.deductions) || 0,
          is_active: true
        } as any);

      if (employeeError) throw employeeError;

      toast.success("Staff member added successfully");
      setIsAddStaffDialogOpen(false);
      setNewStaff({
        name: '',
        email: '',
        phone: '',
        position: '',
        salary: '',
        allowances: '',
        deductions: ''
      });
      fetchEmployees();
    } catch (error: any) {
      console.error("Error adding staff:", error);
      toast.error("Failed to add staff member");
    } finally {
      setIsLoading(false);
    }
  };

  const editEmployeeSalary = (employee: Employee) => {
    setSelectedEmployee(employee);
    setEditSalary({
      salary: employee.salary,
      allowances: employee.allowances,
      deductions: employee.deductions
    });
    setIsEditSalaryDialogOpen(true);
  };

  const updateEmployeeSalary = async () => {
    if (!selectedEmployee) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("employees")
        .update({
          salary: editSalary.salary,
          allowances: editSalary.allowances,
          deductions: editSalary.deductions
        })
        .eq("id", selectedEmployee.id);

      if (error) throw error;

      toast.success("Salary updated successfully");
      setIsEditSalaryDialogOpen(false);
      setSelectedEmployee(null);
      fetchEmployees();
    } catch (error: any) {
      console.error("Error updating salary:", error);
      toast.error("Failed to update salary");
    } finally {
      setIsLoading(false);
    }
  };

  const viewPayrollDetails = (payroll: Payroll) => {
    setSelectedPayroll(payroll);
    fetchPayrollPayments(payroll.id);
    setIsViewDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="secondary">Draft</Badge>;
      case "processed":
        return <Badge variant="default">Processed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Payroll Management</h2>
          <p className="text-muted-foreground">Manage employee payrolls and payments</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Payroll
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Payroll</DialogTitle>
              <DialogDescription>
                Create a new payroll for all active employees.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="month">Payroll Month</Label>
                <Input
                  id="month"
                  type="month"
                  value={newPayrollMonth}
                  onChange={(e) => setNewPayrollMonth(e.target.value)}
                  min="2024-01"
                  max="2030-12"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createPayroll} disabled={isLoading}>
                  {isLoading ? "Creating..." : "Create Payroll"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        
        <Dialog open={isAddStaffDialogOpen} onOpenChange={setIsAddStaffDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Add Staff
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Staff Member</DialogTitle>
              <DialogDescription>
                Add a new staff member to the payroll system.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="staff-name">Full Name *</Label>
                  <Input
                    id="staff-name"
                    value={newStaff.name}
                    onChange={(e) => setNewStaff({...newStaff, name: e.target.value})}
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <Label htmlFor="staff-position">Position</Label>
                  <Input
                    id="staff-position"
                    value={newStaff.position}
                    onChange={(e) => setNewStaff({...newStaff, position: e.target.value})}
                    placeholder="e.g. Delivery Staff, Cleaner"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="staff-email">Email</Label>
                  <Input
                    id="staff-email"
                    type="email"
                    value={newStaff.email}
                    onChange={(e) => setNewStaff({...newStaff, email: e.target.value})}
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="staff-phone">Phone</Label>
                  <Input
                    id="staff-phone"
                    value={newStaff.phone}
                    onChange={(e) => setNewStaff({...newStaff, phone: e.target.value})}
                    placeholder="+232 XX XXX XXXX"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="staff-salary">Base Salary *</Label>
                  <Input
                    id="staff-salary"
                    type="number"
                    value={newStaff.salary}
                    onChange={(e) => setNewStaff({...newStaff, salary: e.target.value})}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="staff-allowances">Allowances</Label>
                  <Input
                    id="staff-allowances"
                    type="number"
                    value={newStaff.allowances}
                    onChange={(e) => setNewStaff({...newStaff, allowances: e.target.value})}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="staff-deductions">Deductions</Label>
                  <Input
                    id="staff-deductions"
                    type="number"
                    value={newStaff.deductions}
                    onChange={(e) => setNewStaff({...newStaff, deductions: e.target.value})}
                    placeholder="0"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddStaffDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={addStaff} disabled={isLoading}>
                  {isLoading ? "Adding..." : "Add Staff"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payrolls</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payrolls.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Le {employees.reduce((sum, emp) => sum + (emp.salary + emp.allowances - emp.deductions), 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Staff and Salary Table */}
      <Card>
        <CardHeader>
          <CardTitle>Staff and Salaries</CardTitle>
          <CardDescription>
            View all staff members and their compensation details
          </CardDescription>
        </CardHeader>
        <CardContent>
          {employees.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No staff records found. Add employees to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee #</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Base Salary</TableHead>
                  <TableHead>Allowances</TableHead>
                  <TableHead>Deductions</TableHead>
                  <TableHead>Net Salary</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-mono text-xs">
                      {employee.employee_number}
                    </TableCell>
                    <TableCell className="font-medium">
                      {employee.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{employee.role}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {employee.email || 'Not provided'}
                    </TableCell>
                    <TableCell className="font-mono">
                      Le {employee.salary.toLocaleString()}
                    </TableCell>
                    <TableCell className="font-mono text-success">
                      +Le {employee.allowances.toLocaleString()}
                    </TableCell>
                    <TableCell className="font-mono text-destructive">
                      -Le {employee.deductions.toLocaleString()}
                    </TableCell>
                    <TableCell className="font-mono font-bold">
                      Le {(employee.salary + employee.allowances - employee.deductions).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={employee.is_active ? "default" : "secondary"}>
                        {employee.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => editEmployeeSalary(employee)}
                      >
                        Edit Salary
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Payrolls Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payroll History</CardTitle>
          <CardDescription>
            View and manage all payroll records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payrolls.map((payroll) => (
                <TableRow key={payroll.id}>
                  <TableCell className="font-medium">
                    {format(new Date(payroll.month), "MMMM yyyy")}
                  </TableCell>
                  <TableCell>Le {payroll.total_amount.toLocaleString()}</TableCell>
                  <TableCell>{getStatusBadge(payroll.status)}</TableCell>
                  <TableCell>{format(new Date(payroll.created_at), "MMM dd, yyyy")}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewPayrollDetails(payroll)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      {payroll.status === "draft" && (
                        <Button
                          size="sm"
                          onClick={() => processPayroll(payroll.id)}
                          disabled={isLoading}
                        >
                          Process
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payroll Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Payroll Details - {selectedPayroll && format(new Date(selectedPayroll.month), "MMMM yyyy")}
            </DialogTitle>
            <DialogDescription>
              View detailed breakdown of payroll payments
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Base Salary</TableHead>
                  <TableHead>Allowances</TableHead>
                  <TableHead>Deductions</TableHead>
                  <TableHead>Net Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrollPayments.map((payment) => {
                  const employee = employees.find(emp => emp.id === payment.employee_id);
                  return (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        {employee?.name || "Unknown Employee"}
                      </TableCell>
                      <TableCell>Le {payment.base_salary.toLocaleString()}</TableCell>
                      <TableCell>Le {payment.allowances.toLocaleString()}</TableCell>
                      <TableCell>Le {payment.deductions.toLocaleString()}</TableCell>
                      <TableCell className="font-medium">
                        Le {payment.net_amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={payment.paid_at ? "default" : "secondary"}>
                          {payment.paid_at ? "Paid" : "Pending"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Salary Dialog */}
      <Dialog open={isEditSalaryDialogOpen} onOpenChange={setIsEditSalaryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Employee Salary</DialogTitle>
            <DialogDescription>
              Update salary and compensation details for {selectedEmployee?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit-salary">Base Salary</Label>
                <Input
                  id="edit-salary"
                  type="number"
                  value={editSalary.salary}
                  onChange={(e) => setEditSalary({...editSalary, salary: Number(e.target.value)})}
                />
              </div>
              <div>
                <Label htmlFor="edit-allowances">Allowances</Label>
                <Input
                  id="edit-allowances"
                  type="number"
                  value={editSalary.allowances}
                  onChange={(e) => setEditSalary({...editSalary, allowances: Number(e.target.value)})}
                />
              </div>
              <div>
                <Label htmlFor="edit-deductions">Deductions</Label>
                <Input
                  id="edit-deductions"
                  type="number"
                  value={editSalary.deductions}
                  onChange={(e) => setEditSalary({...editSalary, deductions: Number(e.target.value)})}
                />
              </div>
            </div>
            
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Net Salary:</span>
                <span className="text-lg font-bold">
                  Le {(editSalary.salary + editSalary.allowances - editSalary.deductions).toLocaleString()}
                </span>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditSalaryDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={updateEmployeeSalary} disabled={isLoading}>
                {isLoading ? "Updating..." : "Update Salary"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};