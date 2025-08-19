import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Filter, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { getPrograms } from '../api/backend';
import { getUsers } from '../api/backend';
import { useLanguage } from '@/contexts/LanguageContext';

interface Program {
  id: string;
  program_name: string;
  budget: number;
  recipient_name: string;
  exco_letter_ref: string;
  status: 'draft' | 'under_review' | 'query' | 'query_answered' | 'complete_can_send_to_mmk' | 'under_review_by_mmk' | 'document_accepted_by_mmk' | 'payment_in_progress' | 'payment_completed' | 'rejected';
  created_by: string;
  created_at: string;
  voucher_number?: string;
  eft_number?: string;
}

const getStatusColor = (status: Program['status']) => {
  const colors = {
    draft: 'bg-gray-100 text-gray-800',
    under_review: 'bg-blue-100 text-blue-800',
    query: 'bg-orange-100 text-orange-800',
    query_answered: 'bg-purple-100 text-purple-800',
    complete_can_send_to_mmk: 'bg-yellow-100 text-yellow-800',
    under_review_by_mmk: 'bg-indigo-100 text-indigo-800',
    document_accepted_by_mmk: 'bg-teal-100 text-teal-800',
    payment_in_progress: 'bg-amber-100 text-amber-800',
    payment_completed: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };
  return colors[status] || colors.draft;
};

const getStatusLabel = (status: Program['status']) => {
  const labels = {
    draft: 'status.draft',
    under_review: 'status.under_review',
    query: 'queries.title',
    query_answered: 'status.query_answered',
    complete_can_send_to_mmk: 'Complete & Send to MMK',
    under_review_by_mmk: 'Under Review by MMK',
    document_accepted_by_mmk: 'Document Accepted by MMK',
    payment_in_progress: 'Payment in Progress',
    payment_completed: 'status.payment_completed',
    rejected: 'status.rejected',
  };
  return labels[status] || status;
};

export default function StatusTracking() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [programs, setPrograms] = useState<Program[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    getPrograms().then(res => {
      if (res.success && res.programs) {
        setPrograms(res.programs);
      }
      setLoading(false);
    });
    getUsers().then(res => {
      if (res.success && res.users) {
        setUsers(res.users);
      }
    });
  }, []);

  // Function to get user name by ID
  const getUserNameById = (userId: string) => {
    const user = users.find(u => u.id.toString() === userId);
    return user ? (user.fullName || user.full_name || user.email || user.id) : userId;
  };

  const filteredPrograms = programs
    .filter(program => {
      const matchesSearch = program.program_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           program.recipient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           program.exco_letter_ref.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || program.status === statusFilter;
      const matchesUser = userFilter === 'all' || program.created_by == userFilter;
      return matchesSearch && matchesStatus && matchesUser;
    })
    .sort((a, b) => {
      // Sort by program ID in descending order (highest ID first)
      const idA = parseInt(a.id);
      const idB = parseInt(b.id);
      return idB - idA;
    });

  // Pagination logic
  const totalPages = Math.ceil(filteredPrograms.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPrograms = filteredPrograms.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, userFilter]);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const goToFirstPage = () => goToPage(1);
  const goToLastPage = () => goToPage(totalPages);
  const goToNextPage = () => goToPage(currentPage + 1);
  const goToPreviousPage = () => goToPage(currentPage - 1);

  const statusCounts = {
    total: programs.length,
    payment_completed: programs.filter(p => p.status === 'payment_completed').length,
    pending: programs.filter(p => ['under_review', 'query', 'query_answered', 'complete_can_send_to_mmk', 'under_review_by_mmk', 'document_accepted_by_mmk', 'payment_in_progress'].includes(p.status)).length,
    rejected: programs.filter(p => p.status === 'rejected').length,
  };

  if (loading) {
    return (
      <div className="space-y-6 mobile-zoom-out">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('status.title')}</h1>
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mobile-zoom-out">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t('status.title')}</h1>
        <p className="text-muted-foreground">{t('status.subtitle')}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('status.total_programs')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('status.payment_completed')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-green-600">{statusCounts.payment_completed}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('status.pending_programs')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{statusCounts.pending}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('status.rejected')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{statusCounts.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>{t('status.programs_overview')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t('users.all_roles')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('users.all_roles')}</SelectItem>
                {users.filter(u => u.role === 'exco_user').map((u) => (
                  <SelectItem key={u.id} value={u.id.toString()}>{u.fullName || u.full_name || u.email || u.id}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              className="w-64"
              placeholder={t('status.search_programs')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              prefix={<Search className="h-4 w-4 text-muted-foreground" />}
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('status.all_status')}</SelectItem>
                <SelectItem value="draft">{t('status.draft')}</SelectItem>
                <SelectItem value="under_review">{t('status.under_review')}</SelectItem>
                <SelectItem value="query">{t('status.query')}</SelectItem>
                <SelectItem value="query_answered">{t('status.query_answered')}</SelectItem>
                <SelectItem value="complete_can_send_to_mmk">{t('status.complete_can_send_to_mmk')}</SelectItem>
                <SelectItem value="under_review_by_mmk">{t('status.under_review_by_mmk')}</SelectItem>
                <SelectItem value="document_accepted_by_mmk">{t('status.document_accepted_by_mmk')}</SelectItem>
                <SelectItem value="payment_in_progress">{t('status.payment_in_progress')}</SelectItem>
                <SelectItem value="payment_completed">{t('status.payment_completed')}</SelectItem>
                <SelectItem value="rejected">{t('status.rejected')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('programs.program_name')}</TableHead>
                  <TableHead>{t('programs.budget_rm')}</TableHead>
                  <TableHead>{t('programs.recipient')}</TableHead>
                  <TableHead>{t('status.letter_ref')}</TableHead>
                  <TableHead>{t('programs.status')}</TableHead>
                  <TableHead>{t('programs.created_by')}</TableHead>
                  <TableHead>{t('common.date')}</TableHead>
                  <TableHead>{t('status.voucher_no')}</TableHead>
                  <TableHead>{t('status.eft_no')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentPrograms.map((program) => (
                  <TableRow key={program.id}>
                    <TableCell className="font-medium">{program.program_name}</TableCell>
                    <TableCell>{program.budget.toLocaleString()}</TableCell>
                    <TableCell>{program.recipient_name}</TableCell>
                    <TableCell>{program.exco_letter_ref}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(program.status)}>
                        {t(getStatusLabel(program.status))}
                      </Badge>
                    </TableCell>
                    <TableCell>{getUserNameById(program.created_by)}</TableCell>
                    <TableCell>{new Date(program.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>{program.voucher_number || '-'}</TableCell>
                    <TableCell>{program.eft_number || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-2 py-4 sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
              <Button
                variant="outline"
                className="mr-1"
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
              >
                {t('common.previous')}
              </Button>
              <Button
                variant="outline"
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
              >
                {t('common.next')}
              </Button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t('status.showing')} {startIndex + 1} {t('status.to')} {Math.min(endIndex, filteredPrograms.length)} {t('status.of')} {filteredPrograms.length} {t('status.results')}
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <Button
                    variant="outline"
                    onClick={goToFirstPage}
                    disabled={currentPage === 1}
                    className="rounded-l-md"
                  >
                    <span className="sr-only">First</span>
                    <ChevronsLeft className="h-5 w-5" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    className="rounded-l-md"
                  >
                    <span className="sr-only">Previous</span>
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className="rounded-r-md"
                  >
                    <span className="sr-only">Next</span>
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={goToLastPage}
                    disabled={currentPage === totalPages}
                    className="rounded-r-md"
                  >
                    <span className="sr-only">Last</span>
                    <ChevronsRight className="h-5 w-5" aria-hidden="true" />
                  </Button>
                </nav>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}