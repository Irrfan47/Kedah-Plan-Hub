import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, CheckCircle, XCircle, Clock, Wallet, ChevronDown, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from '@/contexts/LanguageContext';
import ExcoUserBudgetTable from '@/components/ExcoUserBudgetTable';
import { BASE_URL, getUsers } from '../api/backend';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  

  
  const [stats, setStats] = useState<any>({
    total: 0,
    payment_completed: 0,
    rejected: 0,
    pending: 0,
  });
  const [recentPrograms, setRecentPrograms] = useState<any[]>([]);
  const [excoUsers, setExcoUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [userMap, setUserMap] = useState<{ [id: string]: string }>({});
  const [isExcoBudgetOpen, setIsExcoBudgetOpen] = useState(false);
  
  // Modal states for program cards
  const [isTotalProgramsModalOpen, setIsTotalProgramsModalOpen] = useState(false);
  const [isPaymentCompletedModalOpen, setIsPaymentCompletedModalOpen] = useState(false);
  const [isRejectedModalOpen, setIsRejectedModalOpen] = useState(false);
  const [isPendingModalOpen, setIsPendingModalOpen] = useState(false);
  
  // Program data for modals
  const [totalProgramsData, setTotalProgramsData] = useState<any[]>([]);
  const [paymentCompletedData, setPaymentCompletedData] = useState<any[]>([]);
  const [rejectedData, setRejectedData] = useState<any[]>([]);
  const [pendingData, setPendingData] = useState<any[]>([]);

  useEffect(() => {
    fetchExcoUsers();
    fetchDashboard();
    // Fetch all users to map IDs to names
    getUsers().then(res => {
      if (res.success && res.users) {
        const map: { [id: string]: string } = {};
        res.users.forEach((u: any) => {
          map[u.id] = u.fullName || u.full_name || u.email || u.id;
        });
        setUserMap(map);
      }
    });
  }, [user]);

  const fetchExcoUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/users.php?exco_stats=1`);
      const data = await res.json();
      if (data.success) {
        setExcoUsers(data.users);
      }
    } catch (e) {
      toast({ title: t('common.error'), description: 'Failed to fetch EXCO users', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboard = async () => {
    // For EXCO users, fetch their own programs; for others, fetch all programs
    const url = user?.role === 'exco_user' && user?.id 
      ? `${BASE_URL}/dashboard.php?user_id=${user.id}`
      : `${BASE_URL}/dashboard.php`;
    
    const res = await fetch(url);
    const data = await res.json();
    if (data.success) {
      setStats(data.stats || {});
      setRecentPrograms(data.recent_programs || []);
    }
  };

  // Function to fetch programs for specific status
  const fetchProgramsByStatus = async (status: string, setData: (data: any[]) => void) => {
    try {
      const url = user?.role === 'exco_user' && user?.id 
        ? `${BASE_URL}/programs.php?exco_user_id=${user.id}&status=${status}`
        : `${BASE_URL}/programs.php?status=${status}`;
      
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.success) {
        // Double-check that we're only getting programs with the correct status
        const filteredPrograms = (data.programs || []).filter((p: any) => {
          const programStatus = p.status;
          return programStatus === status;
        });
        
        // Sort by creation date (newest first) and get only the latest 5 programs
        const sortedPrograms = filteredPrograms.sort((a: any, b: any) => 
          new Date(b.createdAt || b.created_at || 0).getTime() - new Date(a.createdAt || a.created_at || 0).getTime()
        );
        const latestPrograms = sortedPrograms.slice(0, 5);
        setData(latestPrograms);
      }
    } catch (error) {
      console.error(`Error fetching ${status} programs:`, error);
    }
  };

  // Function to fetch all programs (for total programs card)
  const fetchAllPrograms = async () => {
    try {
      const url = user?.role === 'exco_user' && user?.id 
        ? `${BASE_URL}/programs.php?exco_user_id=${user.id}`
        : `${BASE_URL}/programs.php`;
      
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.success) {
        // Sort by creation date (newest first) and get only the latest 5 programs
        const sortedPrograms = (data.programs || []).sort((a: any, b: any) => 
          new Date(b.createdAt || b.created_at || 0).getTime() - new Date(a.createdAt || a.created_at || 0).getTime()
        );
        const latestPrograms = sortedPrograms.slice(0, 5);
        setTotalProgramsData(latestPrograms);
      }
    } catch (error) {
      console.error('Error fetching all programs:', error);
    }
  };

  // Function to fetch pending programs (all statuses except payment_completed and rejected)
  const fetchPendingPrograms = async () => {
    try {
      const url = user?.role === 'exco_user' && user?.id 
        ? `${BASE_URL}/programs.php?exco_user_id=${user.id}`
        : `${BASE_URL}/programs.php`;
      
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.success) {
        // Filter programs that are NOT payment_completed or rejected, sort by creation date, then get latest 5
        const pendingPrograms = (data.programs || []).filter((p: any) => 
          p.status !== 'payment_completed' && p.status !== 'rejected'
        ).sort((a: any, b: any) => 
          new Date(b.createdAt || b.created_at || 0).getTime() - new Date(a.createdAt || a.created_at || 0).getTime()
        ).slice(0, 5);
        setPendingData(pendingPrograms);
      }
    } catch (error) {
      console.error('Error fetching pending programs:', error);
    }
  };

  // Alternative approach: fetch all programs and filter client-side for specific statuses
  const fetchProgramsByStatusClientSide = async (status: string, setData: (data: any[]) => void) => {
    try {
      const url = user?.role === 'exco_user' && user?.id 
        ? `${BASE_URL}/programs.php?exco_user_id=${user.id}`
        : `${BASE_URL}/programs.php`;
      
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.success) {
        // Filter by status client-side
        const filteredPrograms = (data.programs || []).filter((p: any) => p.status === status);
        
        // Sort and get latest 5
        const sortedPrograms = filteredPrograms.sort((a: any, b: any) => 
          new Date(b.createdAt || b.created_at || 0).getTime() - new Date(a.createdAt || a.created_at || 0).getTime()
        );
        const latestPrograms = sortedPrograms.slice(0, 5);
        setData(latestPrograms);
      }
    } catch (error) {
      console.error(`Error fetching programs for status ${status} (client-side):`, error);
    }
  };

  const handleBudgetChange = async (userId: string, newBudget: number) => {
    setUpdatingUserId(userId);
    const payload = { user_id: Number(userId), total_budget: Number(newBudget) };
    try {
      const res = await fetch(`${BASE_URL}/users.php?set_budget=1`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: t('common.success'), description: 'Budget updated.' });
        fetchExcoUsers();
      } else {
        toast({ title: t('common.error'), description: data.message || 'Failed to update budget', variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: t('common.error'), description: 'Failed to update budget', variant: 'destructive' });
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Card click handlers
  const handleTotalProgramsClick = async () => {
    await fetchAllPrograms();
    setIsTotalProgramsModalOpen(true);
  };

  const handlePaymentCompletedClick = async () => {
    await fetchProgramsByStatusClientSide('payment_completed', setPaymentCompletedData);
    setIsPaymentCompletedModalOpen(true);
  };

  const handleRejectedClick = async () => {
    await fetchProgramsByStatusClientSide('rejected', setRejectedData);
    setIsRejectedModalOpen(true);
  };

  const handlePendingClick = async () => {
    await fetchPendingPrograms();
    setIsPendingModalOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return `RM ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      draft: 'status.draft',
      under_review: 'status.under_review',
      query: 'status.query',
      query_answered: 'status.query_answered',
      complete_can_send_to_mmk: 'status.complete_can_send_to_mmk',
      under_review_by_mmk: 'status.under_review_by_mmk',
      document_accepted_by_mmk: 'status.document_accepted_by_mmk',
      payment_in_progress: 'status.payment_in_progress',
      payment_completed: 'status.payment_completed',
      rejected: 'status.rejected',
    };
    return labels[status as keyof typeof labels] || 'status.draft';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      under_review: 'bg-blue-100 text-blue-800',
      query: 'bg-orange-100 text-orange-800',
      query_answered: 'bg-purple-100 text-purple-800',
      complete_can_send_to_mmk: 'bg-yellow-100 text-yellow-800',
      under_review_by_mmk: 'bg-indigo-100 text-indigo-800',
      document_accepted_by_mmk: 'bg-green-100 text-green-800',
      payment_in_progress: 'bg-teal-100 text-teal-800',
      payment_completed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || colors.draft;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 mobile-zoom-out">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('nav.dashboard', 'Dashboard')}
          </h1>
          <p className="text-gray-600">
            {t('dashboard.subtitle')}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Skeleton className="h-6 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Calculate total/remaining budget from excoUsers
  let totalBudget = excoUsers.reduce((sum, u) => sum + (u.total_budget || 0), 0);
  let remainingBudget = excoUsers.reduce((sum, u) => sum + (u.remaining_budget || 0), 0);
  if (user?.role === 'exco_user') {
    const myBudget = excoUsers.find(u => u.id === user.id || u.user_id === user.id);
    totalBudget = myBudget?.total_budget || 0;
    remainingBudget = myBudget?.remaining_budget || 0;
  }
  const usedBudget = totalBudget - remainingBudget;
  const budgetUsagePercentage = totalBudget > 0 ? (usedBudget / totalBudget) * 100 : 0;

  // Use the stats and programs directly from API for EXCO users
  let visiblePrograms = recentPrograms;
  let statsToShow = stats;
  
  // For EXCO users, the API already returns their programs, so no additional filtering needed
  // The stats from API are already filtered for the user
  // Note: Pending programs include all statuses except 'payment_completed' and 'rejected' (including 'draft')

  return (
    <div className="container mx-auto p-6 mobile-zoom-out">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t('nav.dashboard', 'Dashboard')}
        </h1>
        <p className="text-gray-600">
          {t('dashboard.subtitle')}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
        <Card className="card-elevated cursor-pointer hover:shadow-lg transition-shadow" onClick={handleTotalProgramsClick}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('dashboard.total_programs')}</p>
                <p className="text-3xl font-bold text-foreground">{statsToShow.total}</p>
              </div>
              <div className="w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-elevated cursor-pointer hover:shadow-lg transition-shadow" onClick={handlePaymentCompletedClick}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('dashboard.payment_completed_programs')}</p>
                <p className="text-3xl font-bold text-success">{statsToShow.payment_completed}</p>
              </div>
              <div className="w-12 h-12 bg-success-light rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-elevated cursor-pointer hover:shadow-lg transition-shadow" onClick={handleRejectedClick}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('dashboard.rejected_programs')}</p>
                <p className="text-3xl font-bold text-danger">{statsToShow.rejected}</p>
              </div>
              <div className="w-12 h-12 bg-danger-light rounded-xl flex items-center justify-center">
                <XCircle className="w-6 h-6 text-danger" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-elevated cursor-pointer hover:shadow-lg transition-shadow" onClick={handlePendingClick}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('dashboard.pending_programs')}</p>
                <p className="text-3xl font-bold text-warning">{statsToShow.pending}</p>
              </div>
              <div className="w-12 h-12 bg-warning-light rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <Card className="card-elevated">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-lg font-semibold">{t('dashboard.total_budget')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(totalBudget)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('dashboard.available_for_programs')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-elevated">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-lg font-semibold">{t('dashboard.budget_used')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-warning-light rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(usedBudget)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {budgetUsagePercentage.toFixed(1)}% {t('dashboard.budget_used_percentage')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">{t('dashboard.remaining_budget')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-success-light rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-success" />
              </div>
              <div className="flex-1">
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(remainingBudget)}
                </p>
                <div className="mt-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{t('dashboard.usage')}: {budgetUsagePercentage.toFixed(1)}%</span>
                    <span>{formatCurrency(usedBudget)} {t('dashboard.used')}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 mt-1">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${budgetUsagePercentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* EXCO Users Table */}
      {user?.role !== 'exco_user' && (
        <Card className="card-elevated mb-8">
          <Collapsible open={isExcoBudgetOpen} onOpenChange={setIsExcoBudgetOpen}>
            <CardHeader className="pb-2">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full flex items-center justify-between p-0 h-auto">
                  <CardTitle className="text-lg font-semibold">{t('exco.users.budgets')}</CardTitle>
                  {isExcoBudgetOpen ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent>
                <div className="overflow-x-auto">
                  <ExcoUserBudgetTable
                    users={excoUsers}
                    userRole={user?.role || ''}
                    onBudgetChange={handleBudgetChange}
                    showViewButton={false}
                  />
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* Recent Programs */}
      <Card className="card-elevated mt-8">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{t('dashboard.recent_programs')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t('programs.program_name')}</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t('programs.budget')}</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t('programs.recipient')}</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t('programs.status')}</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t('programs.submitted_by')}</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t('common.date')}</th>
                </tr>
              </thead>
              <tbody>
                {visiblePrograms.map((program) => (
                  <tr key={program.id} className="border-b border-border hover:bg-muted/50 transition-fast">
                    <td className="py-3 px-4 font-medium text-foreground">{program.name}</td>
                    <td className="py-3 px-4 text-foreground">{formatCurrency(program.budget)}</td>
                    <td className="py-3 px-4 text-muted-foreground">{program.recipient}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(program.status)}`}>
                        {t(getStatusLabel(program.status))}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{userMap[program.submittedBy] || userMap[program.created_by] || program.submittedBy || program.created_by}</td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {new Date(program.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Program Detail Modals */}
      
      {/* Total Programs Modal */}
      <Dialog open={isTotalProgramsModalOpen} onOpenChange={setIsTotalProgramsModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Total Programs</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {totalProgramsData.length === 0 ? (
              <p className="text-center text-muted-foreground">No programs found</p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">Showing {totalProgramsData.length} programs</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Program Name</TableHead>
                      <TableHead>Budget (RM)</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {totalProgramsData.map((program) => (
                      <TableRow key={program.id}>
                        <TableCell className="font-medium">{program.program_name || program.programName}</TableCell>
                        <TableCell>RM {program.budget?.toLocaleString() || '0'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{program.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Completed Programs Modal */}
      <Dialog open={isPaymentCompletedModalOpen} onOpenChange={setIsPaymentCompletedModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Payment Completed Programs</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {paymentCompletedData.length === 0 ? (
              <p className="text-center text-muted-foreground">No payment completed programs found</p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">Showing {paymentCompletedData.length} payment completed programs</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Program Name</TableHead>
                      <TableHead>Budget (RM)</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentCompletedData.map((program) => (
                      <TableRow key={program.id}>
                        <TableCell className="font-medium">{program.program_name || program.programName}</TableCell>
                        <TableCell>RM {program.budget?.toLocaleString() || '0'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-green-100 text-green-800">{program.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Rejected Programs Modal */}
      <Dialog open={isRejectedModalOpen} onOpenChange={setIsRejectedModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Rejected Programs</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {rejectedData.length === 0 ? (
              <p className="text-center text-muted-foreground">No rejected programs found</p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">Showing {rejectedData.length} rejected programs</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Program Name</TableHead>
                      <TableHead>Budget (RM)</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rejectedData.map((program) => (
                      <TableRow key={program.id}>
                        <TableCell className="font-medium">{program.program_name || program.programName}</TableCell>
                        <TableCell>RM {program.budget?.toLocaleString() || '0'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-red-100 text-red-800">{program.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Pending Programs Modal */}
      <Dialog open={isPendingModalOpen} onOpenChange={setIsPendingModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Pending Programs</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {pendingData.length === 0 ? (
              <p className="text-center text-muted-foreground">No pending programs found</p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">Showing {pendingData.length} pending programs (excluding payment completed and rejected)</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Program Name</TableHead>
                      <TableHead>Budget (RM)</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingData.map((program) => (
                      <TableRow key={program.id}>
                        <TableCell className="font-medium">{program.program_name || program.programName}</TableCell>
                        <TableCell>RM {program.budget?.toLocaleString() || '0'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">{program.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}