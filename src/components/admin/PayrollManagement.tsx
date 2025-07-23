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
  name: string;
  email: string;
  salary: number;
  allowances: number;
  deductions: number;
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
      const { data, error } = await supabase
        .from("employees")
        .select("id, name, email, salary, allowances, deductions")
        .eq("is_active", true);

      if (error) throw error;
      setEmployees(data || []);
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
          month: newPayrollMonth,
          total_amount: totalAmount,
          status: "draft"
        })
        .select()
        .single();

      if (payrollError) throw payrollError;

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
    </div>
  );
};