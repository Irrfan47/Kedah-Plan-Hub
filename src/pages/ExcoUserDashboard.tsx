import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Users, FileText, CheckCircle, XCircle, Clock, Settings, Wallet, ChevronDown, ChevronUp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { getExcoUserDashboard, updateExcoUserDashboard } from "@/api/backend";
import { BASE_URL } from "@/api/backend";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import ProgramManagement from './ProgramManagement';

interface ExcoUser {
  id: number;
  full_name: string;
  email: string;
  phone_number: string;
  profile_picture: string | null;
  portfolio: string;
}

interface UserDashboardData {
  total_programs: number;
  payment_completed_programs: number;
  rejected_programs: number;
  pending_programs: number;
  total_budget: number;
  remaining_budget: number;
  recent_programs: any[];
}

export default function ExcoUserDashboard() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [excoUser, setExcoUser] = useState<ExcoUser | null>(null);
  const [dashboardData, setDashboardData] = useState<UserDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingBudget, setUpdatingBudget] = useState(false);
  const [newBudget, setNewBudget] = useState("");
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  
  // Collapsible state for recent programs
  const [isRecentProgramsOpen, setIsRecentProgramsOpen] = useState(false);

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
    // Get EXCO user data from navigation state
    if (location.state?.excoUser) {
      setExcoUser(location.state.excoUser);
    }
    
    // Fetch dashboard data for this specific EXCO user
    fetchUserDashboardData();
  }, [userId]);

  const fetchUserDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch programs for this specific user
      const programsResponse = await fetch(`${BASE_URL}/programs.php?exco_user_id=${userId}`);
      const programsData = await programsResponse.json();
      const userPrograms = programsData.success ? programsData.programs || [] : [];
      
      // Calculate statistics for this specific user
      const totalPrograms = userPrograms.length;
      const paymentCompletedPrograms = userPrograms.filter((p: any) => p.status === 'payment_completed').length;
      const rejectedPrograms = userPrograms.filter((p: any) => p.status === 'rejected').length;
      // Pending programs = all programs except rejected and payment_completed
      const pendingPrograms = userPrograms.filter((p: any) => p.status !== 'rejected' && p.status !== 'payment_completed').length;
      
      // Get user's budget from the users API
      const userResponse = await fetch(`${BASE_URL}/users.php?exco_stats=1`);
      const userData = await userResponse.json();
      const userBudgetData = userData.success ? userData.users.find((user: any) => user.id == userId) : null;
      
      setDashboardData({
        total_programs: totalPrograms,
        payment_completed_programs: paymentCompletedPrograms,
        rejected_programs: rejectedPrograms,
        pending_programs: pendingPrograms,
        total_budget: userBudgetData?.total_budget || 0,
        remaining_budget: userBudgetData?.remaining_budget || 0,
        recent_programs: userPrograms.slice(0, 5) // Show only last 5 programs
      });
    } catch (error) {
      console.error('Error fetching user dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBudget = async () => {
    if (!newBudget || !userId) return;
    
    const budgetAmount = parseFloat(newBudget);
    if (isNaN(budgetAmount) || budgetAmount < 0) {
      toast({
        title: "Error",
        description: "Please enter a valid budget amount",
        variant: "destructive"
      });
      return;
    }

    setUpdatingBudget(true);
    try {
      // Use the same API endpoint that works in Dashboard
      const payload = { user_id: Number(userId), total_budget: Number(budgetAmount) };
      const res = await fetch(`${BASE_URL}/users.php?set_budget=1`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const response = await res.json();
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Budget updated successfully"
        });
        setShowBudgetForm(false);
        setNewBudget("");
        fetchUserDashboardData(); // Refresh data
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to update budget",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update budget",
        variant: "destructive"
      });
    } finally {
      setUpdatingBudget(false);
    }
  };

  const handleBackClick = () => {
    navigate("/exco-users");
  };

  // Function to fetch programs for specific status
  const fetchProgramsByStatus = async (status: string, setData: (data: any[]) => void) => {
    try {
      const url = `${BASE_URL}/programs.php?exco_user_id=${userId}&status=${status}`;
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
      const res = await fetch(`${BASE_URL}/programs.php?exco_user_id=${userId}`);
      const data = await res.json();
      if (data.success) {
        // Sort by creation date (newest first) and get only the latest 5 programs
        const sortedPrograms = (data.programs || []).slice(0, 5);
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
      const res = await fetch(`${BASE_URL}/programs.php?exco_user_id=${userId}`);
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
      const url = `${BASE_URL}/programs.php?exco_user_id=${userId}`;
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

  const handleManagePrograms = () => {
    // Navigate to program management with the specific user pre-selected
    navigate("/programs", { 
      state: { 
        selectedUserId: userId,
        selectedUserName: excoUser?.full_name 
      } 
    });
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

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Button variant="outline" onClick={handleBackClick} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('exco.users.back_to_exco_users')}
          </Button>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-6 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
             {/* Header with Back Button and Manage Programs */}
       <div className="mb-6">
         <div className="flex justify-between items-center mb-4">
           <Button variant="outline" onClick={handleBackClick}>
             <ArrowLeft className="h-4 w-4 mr-2" />
             {t('exco.users.back_to_exco_users')}
           </Button>
           
           {(user?.role === "finance_mmk" || user?.role === "admin" || user?.role === "finance_officer" || user?.role === "super_admin") && (
             <Button onClick={handleManagePrograms} className="bg-blue-600 hover:bg-blue-700">
               <Settings className="h-4 w-4 mr-2" />
               {t('exco.users.manage_programs')}
             </Button>
           )}
         </div>
        
                 {excoUser && (
           <div className="flex items-center gap-4 mb-4">
             {excoUser.profile_picture ? (
               <img 
                 src={excoUser.profile_picture} 
                 alt={excoUser.full_name}
                 className="w-16 h-20 object-cover rounded-lg"
               />
             ) : (
               <div className="w-16 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                 <span className="text-lg font-semibold text-gray-500">
                   {excoUser.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                 </span>
               </div>
             )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {excoUser.full_name}
              </h1>
              <p className="text-gray-600">{excoUser.email}</p>
              <p className="text-sm text-gray-500">{excoUser.portfolio || t('profile.no_portfolio')}</p>
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      {/* 
        Pending Programs = All programs except 'rejected' and 'payment_completed'
        This includes: draft, under_review, query, query_answered, complete_can_send_to_mmk, 
        under_review_by_mmk, document_accepted_by_mmk, payment_in_progress
      */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={handleTotalProgramsClick}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('dashboard.total_programs')}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData?.total_programs || 0}
                </p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={handlePaymentCompletedClick}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('dashboard.payment_completed_programs')}</p>
                <p className="text-2xl font-bold text-green-600">
                  {dashboardData?.payment_completed_programs || 0}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={handleRejectedClick}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('dashboard.rejected_programs')}</p>
                <p className="text-2xl font-bold text-red-600">
                  {dashboardData?.rejected_programs || 0}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={handlePendingClick}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('dashboard.pending_programs')}</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {dashboardData?.pending_programs || 0}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              {t('exco.dashboard.total_budget')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-3xl font-bold text-gray-900">
                  RM {(dashboardData?.total_budget || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-gray-600">
                  {t('exco.dashboard.remaining_budget')}: RM {(dashboardData?.remaining_budget || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              
              {user?.role === "finance_mmk" && (
                <div>
                  {!showBudgetForm ? (
                    <Button onClick={() => setShowBudgetForm(true)}>
                      {t('exco.users.update_budget')}
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <Input
                        type="text"
                        placeholder={t('dashboard.enter_budget')}
                        value={newBudget}
                        onChange={(e) => setNewBudget(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button 
                          onClick={handleUpdateBudget}
                          disabled={updatingBudget}
                        >
                          {updatingBudget ? t('common.updating') : t('common.save')}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setShowBudgetForm(false);
                            setNewBudget("");
                          }}
                        >
                          {t('common.cancel')}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t('exco.dashboard.user_information')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {excoUser && (
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium text-gray-600">{t('profile.full_name')}</p>
                  <p className="text-gray-900">{excoUser.full_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">{t('profile.email')}</p>
                  <p className="text-gray-900">{excoUser.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">{t('profile.phone')}</p>
                  <p className="text-gray-900">{excoUser.phone_number || t('exco.users.no_phone')}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Programs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {t('exco.dashboard.recent_programs')}
            <Collapsible open={isRecentProgramsOpen} onOpenChange={setIsRecentProgramsOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  {isRecentProgramsOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          </CardTitle>
        </CardHeader>
        <Collapsible open={isRecentProgramsOpen} onOpenChange={setIsRecentProgramsOpen}>
          <CollapsibleContent>
            <CardContent>
              {dashboardData?.recent_programs && dashboardData.recent_programs.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.recent_programs.map((program: any) => (
                    <div key={program.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold text-gray-900">{program.program_name}</h3>
                        <p className="text-sm text-gray-600">
                          {t('programs.budget')}: RM {(program.budget || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <Badge 
                        variant={
                          program.status === 'payment_completed' ? 'default' :
                          program.status === 'rejected' ? 'destructive' :
                          program.status === 'pending' ? 'secondary' : 'outline'
                        }
                      >
                        {t(getStatusLabel(program.status))}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">{t('exco.dashboard.no_recent_programs')}</p>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Program Management - Full Functionality */}
      {(user?.role === "finance_mmk") && (
        <div className="mt-8">
          <Card>
            <CardContent>
              {/* Reuse the entire Program Management page here */}
              <ProgramManagement 
                initialUserId={excoUser?.id}
                initialUserName={excoUser?.full_name}
              />
            </CardContent>
          </Card>
        </div>
      )}

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