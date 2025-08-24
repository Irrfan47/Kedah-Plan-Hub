import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar, Download, FileText, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { BASE_URL, getUsers } from '../api/backend';

interface ReportProgram {
  id: string;
  program_name: string;
  budget: number;
  recipient_name: string;
  exco_letter_ref: string;
  status: string;
  created_at: string;
  created_by: string;
  voucher_number?: string;
  eft_number?: string;
  eft_date?: string;
}

interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

export default function Report() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('both');
  const [excoUsers, setExcoUsers] = useState<User[]>([]);
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [userMap, setUserMap] = useState<{ [id: string]: string }>({});

  useEffect(() => {
    fetchExcoUsers();
    // Set default dates to current month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
  }, []);

  const fetchExcoUsers = async () => {
    try {
      const res = await getUsers();
      if (res.success && res.users) {
        const excoUsers = res.users.filter((u: User) => u.role === 'exco_user');
        setExcoUsers(excoUsers);
        
        // Create user map
        const map: { [id: string]: string } = {};
        res.users.forEach((u: User) => {
          map[u.id] = u.full_name || u.full_name || u.email || u.id;
        });
        setUserMap(map);
      }
    } catch (error) {
      toast({ title: t('common.error'), description: 'Failed to fetch users', variant: 'destructive' });
    }
  };

  const generateReport = async () => {
    if (!startDate || !endDate) {
      toast({ title: t('common.error'), description: 'Please select both start and end dates', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
        user_id: user?.role === 'exco_user' ? user.id : selectedUser,
        status_filter: selectedStatus
      });

      const res = await fetch(`${BASE_URL}/report.php?${params}`);
      const data = await res.json();
      
      if (data.success) {
        setReportData(data.programs || []);
        toast({ title: t('common.success'), description: 'Report generated successfully' });
      } else {
        toast({ title: t('common.error'), description: data.message || 'Failed to generate report', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: t('common.error'), description: 'Failed to generate report', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async () => {
    if (reportData.length === 0) {
      toast({ title: t('common.error'), description: 'No report data to download', variant: 'destructive' });
      return;
    }

    setGenerating(true);
    try {
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
        user_id: user?.role === 'exco_user' ? user.id : selectedUser,
        status_filter: selectedStatus,
        download: '1'
      });

      const res = await fetch(`${BASE_URL}/report.php?${params}`);
      const blob = await res.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `program_report_${startDate}_to_${endDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({ title: t('common.success'), description: 'Report downloaded successfully' });
    } catch (error) {
      toast({ title: t('common.error'), description: 'Failed to download report', variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      payment_completed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ms-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ms-MY');
  };

  // Group programs by user for display
  const groupedPrograms = reportData.reduce((acc: any, program: ReportProgram) => {
    const userName = userMap[program.created_by] || program.created_by;
    if (!acc[userName]) {
      acc[userName] = [];
    }
    acc[userName].push(program);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Page Header */}
             <div>
         <h1 className="text-3xl font-bold text-foreground">SISTEM PENGURUSAN PERUNTUKAN EXCO</h1>
         <p className="text-muted-foreground mt-1">
           {user?.role === 'exco_user' 
             ? `Generate and download reports for your own programs based on date range and ${selectedStatus === 'both' ? 'approved & rejected status' : selectedStatus === 'approved' ? 'approved status only' : 'rejected status only'}`
             : `Generate and download program reports based on date range and ${selectedStatus === 'both' ? 'approved & rejected status' : selectedStatus === 'approved' ? 'approved status only' : 'rejected status only'}`
           }
         </p>
       </div>

      {/* Report Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('report.title')} Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date Range Selection */}
            <div className="space-y-2">
              <Label htmlFor="startDate">{t('report.start_date')}</Label>
              <div 
                className="relative cursor-pointer border rounded-md p-3 hover:bg-muted/50 transition-colors"
                onClick={() => {
                  const input = document.getElementById('startDate') as HTMLInputElement;
                  if (input) {
                    input.focus();
                    input.showPicker?.();
                  }
                }}
              >
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pl-10 border-0 bg-transparent focus:ring-0 focus:border-0 cursor-pointer"
                  onFocus={(e) => e.target.showPicker?.()}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endDate">{t('report.end_date')}</Label>
              <div 
                className="relative cursor-pointer border rounded-md p-3 hover:bg-muted/50 transition-colors"
                onClick={() => {
                  const input = document.getElementById('endDate') as HTMLInputElement;
                  if (input) {
                    input.focus();
                    input.showPicker?.();
                  }
                }}
              >
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="pl-10 border-0 bg-transparent focus:ring-0 focus:border-0 cursor-pointer"
                  onFocus={(e) => e.target.showPicker?.()}
                />
              </div>
            </div>
          </div>

          {/* User Selection */}
          {user?.role !== 'exco_user' && (
            <div className="space-y-2">
              <Label htmlFor="userSelect">{t('report.select_user')}</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder={t('report.select_user')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('report.all_users')}</SelectItem>
                  {excoUsers.map((excoUser) => (
                    <SelectItem key={excoUser.id} value={excoUser.id}>
                      {excoUser.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Status Filter */}
          <div className="space-y-2">
            <Label htmlFor="statusSelect">{t('report.select_status')}</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder={t('report.select_status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="both">{t('report.both')}</SelectItem>
                <SelectItem value="approved">{t('report.approved')}</SelectItem>
                <SelectItem value="rejected">{t('report.rejected')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Generate Report Button */}
          <div className="flex gap-2">
            <Button 
              onClick={generateReport} 
              disabled={loading || !startDate || !endDate}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              {loading ? t('common.loading') : t('report.generate_report')}
            </Button>
            
            {reportData.length > 0 && (
              <Button 
                onClick={downloadReport} 
                disabled={generating}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {generating ? t('common.loading') : t('report.download_report')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Report Preview */}
      {reportData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t('report.title')} Preview
            </CardTitle>
                         <p className="text-sm text-muted-foreground">
               Showing programs from {formatDate(startDate)} to {formatDate(endDate)} | 
               {user?.role === 'exco_user' ? `User: ${user.fullName || user.full_name || user.email}` : `User: ${selectedUser === 'all' ? 'All EXCO Users' : userMap[selectedUser] || selectedUser}`} | 
               Status: {selectedStatus === 'both' ? t('report.both') : selectedStatus === 'approved' ? t('report.approved') : t('report.rejected')}
             </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(groupedPrograms).map(([userName, programs]: [string, any]) => (
                <div key={userName} className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">
                    {t('programs.title')} for {userName}
                  </h3>
                  
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('programs.program_name')}</TableHead>
                          <TableHead>{t('programs.budget')}</TableHead>
                          <TableHead>{t('programs.recipient_name')}</TableHead>
                          <TableHead>{t('status.letter_ref')}</TableHead>
                          <TableHead>{t('status.voucher_no')}</TableHead>
                          <TableHead>{t('status.eft_no')}</TableHead>
                          <TableHead>{t('status.eft_date')}</TableHead>
                          <TableHead>{t('programs.status')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {programs.map((program: ReportProgram) => (
                          <TableRow key={program.id}>
                            <TableCell className="font-medium">
                              {program.program_name}
                            </TableCell>
                            <TableCell>
                              {formatCurrency(program.budget)}
                            </TableCell>
                            <TableCell>
                              {program.recipient_name}
                            </TableCell>
                                                         <TableCell>
                               {program.exco_letter_ref}
                             </TableCell>
                             <TableCell>
                               {program.voucher_number || '-'}
                             </TableCell>
                             <TableCell>
                               {program.eft_number || '-'}
                             </TableCell>
                                                         <TableCell>
                              {program.eft_date ? formatDate(program.eft_date) : '-'}
                            </TableCell>
                             <TableCell>
                               <Badge className={getStatusColor(program.status)}>
                                 {t(getStatusLabel(program.status))}
                               </Badge>
                             </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Summary for this user */}
                  <div className="text-sm text-muted-foreground">
                    Total {t('programs.title').toLowerCase()}: {programs.length} | 
                    Total {t('programs.budget').toLowerCase()}: {formatCurrency(programs.filter((p: ReportProgram) => p.status === 'payment_completed').reduce((sum: number, p: ReportProgram) => sum + p.budget, 0))}
                  </div>
                </div>
              ))}
              
              {/* Overall Summary */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-foreground mb-2">Overall Summary</h4>
                <div className="text-sm text-muted-foreground">
                  Total {t('programs.title').toLowerCase()}: {reportData.length} | 
                  Total {t('programs.budget').toLowerCase()}: {formatCurrency(reportData.filter((p: ReportProgram) => p.status === 'payment_completed').reduce((sum: number, p: ReportProgram) => sum + p.budget, 0))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 