import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus, Eye, Edit, Trash, Send, FileText, MessageSquare, Upload, Check, X, Download, HelpCircle, Clock, CheckCircle, AlertCircle, ChevronDown, ChevronRight, History, Wallet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  getPrograms,
  createProgram,
  updateProgram,
  uploadDocument,
  downloadDocument,
  viewDocument,
  changeProgramStatus,
  addRemark,
  getRemarks,
  deleteProgram,
  deleteDocument,
  createQuery,
  answerQuery,
  getUserBudget
} from '../api/backend';
import ExcoUserBudgetTable from '@/components/ExcoUserBudgetTable';
import DocumentHistoryModal from '@/components/DocumentHistoryModal';
import { BASE_URL } from '../api/backend';

interface Document {
  id: string;
  name: string;
  file: File | null;
  uploadedAt: string;
}

interface Program {
  id: string;
  programName: string;
  budget: number;
  recipientName: string;
  excoLetterRef: string;
  status: 'draft' | 'under_review' | 'query' | 'query_answered' | 'complete_can_send_to_mmk' | 'under_review_by_mmk' | 'document_accepted_by_mmk' | 'payment_in_progress' | 'payment_completed' | 'rejected';
  createdBy: string;
  createdAt: string;
  documents: Document[];
  signedDocuments?: Document[];
  voucherNumber?: string;
  eftNumber?: string;
  eftDate?: string;
  remarks: Array<{
    id: string;
    message: string;
    createdBy: string;
    createdAt: string;
    role: string;
  }>;
}

// Mock data
const mockPrograms: Program[] = [
  {
    id: '1',
    programName: 'Community Development Project',
    budget: 50000,
    recipientName: 'Ahmad bin Abdullah',
    excoLetterRef: 'EXC/2024/001',
    status: 'payment_completed',
    createdBy: 'Siti binti Rahman',
    createdAt: '2024-01-15',
    documents: [
      { id: '1', name: 'Project Proposal.pdf', file: null, uploadedAt: '2024-01-15' },
      { id: '2', name: 'Budget Breakdown.xlsx', file: null, uploadedAt: '2024-01-15' }
    ],
    signedDocuments: [
      { id: '3', name: 'Approved Letter.pdf', file: null, uploadedAt: '2024-01-20' }
    ],
    voucherNumber: 'V2024001',
    eftNumber: 'EFT2024001',
    eftDate: '2024-01-20',
    remarks: [
      { id: '1', message: 'Initial submission', createdBy: 'Siti binti Rahman', createdAt: '2024-01-15', role: 'exco_user' },
      { id: '2', message: 'Approved for implementation', createdBy: 'Fatimah binti Omar', createdAt: '2024-01-20', role: 'finance' }
    ]
  }
];

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

export default function ProgramManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const location = useLocation();
  const [programs, setPrograms] = useState<any[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<any | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDocumentsModalOpen, setIsDocumentsModalOpen] = useState(false);
  const [isAddDocModalOpen, setIsAddDocModalOpen] = useState(false);
  const [isViewDetailsModalOpen, setIsViewDetailsModalOpen] = useState(false);
  const [isDocumentHistoryModalOpen, setIsDocumentHistoryModalOpen] = useState(false);
  const [selectedDocumentForHistory, setSelectedDocumentForHistory] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeDocumentTab, setActiveDocumentTab] = useState<string>('original');
  
  // Query modal states
  const [isQueryModalOpen, setIsQueryModalOpen] = useState(false);
  const [isAnswerQueryModalOpen, setIsAnswerQueryModalOpen] = useState(false);
  const [isViewQueryModalOpen, setIsViewQueryModalOpen] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState<any>(null);
  const [newQuery, setNewQuery] = useState('');
  const [queryAnswer, setQueryAnswer] = useState('');
  const [userMap, setUserMap] = useState<{ [id: string]: string }>({});
  
  // Approve modal states for voucher/EFT numbers
  const [voucherNumber, setVoucherNumber] = useState('');
  const [eftNumber, setEftNumber] = useState('');
  const [eftDate, setEftDate] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    programName: '',
    budget: '',
    recipientName: '',
    excoLetterRef: '',
    suratAkuanPusatKhidmat: null as File | null,
    suratKelulusanPkn: null as File | null,
    suratProgram: null as File | null,
    suratExco: null as File | null,
    penyataAkaunBank: null as File | null,
    borangDaftarKod: null as File | null
  });

  // Custom documents state
  const [customDocuments, setCustomDocuments] = useState<Array<{
    id: string;
    documentName: string;
    file: File | null;
  }>>([]);

  // Edit mode custom documents state
  const [editCustomDocuments, setEditCustomDocuments] = useState<Array<{
    id: string;
    documentName: string;
    file: File | null;
  }>>([]);
  const [editFormData, setEditFormData] = useState({
    programName: '',
    budget: '',
    recipientName: '',
    excoLetterRef: '',
    suratAkuanPusatKhidmat: null as File | any | null,
    suratKelulusanPkn: null as File | any | null,
    suratProgram: null as File | any | null,
    suratExco: null as File | any | null,
    penyataAkaunBank: null as File | any | null,
    borangDaftarKod: null as File | any | null
  });
  const [newRemark, setNewRemark] = useState('');
  const [newDocument, setNewDocument] = useState<File | null>(null);

  const [programToDelete, setProgramToDelete] = useState<any>(null);
  const [isDeleteProgramModalOpen, setIsDeleteProgramModalOpen] = useState(false);
  
  // Confirmation modal states for status changes
  const [programToSubmit, setProgramToSubmit] = useState<any>(null);
  const [isSubmitConfirmModalOpen, setIsSubmitConfirmModalOpen] = useState(false);
  const [programToSubmitToMMK, setProgramToSubmitToMMK] = useState<any>(null);
  const [isSubmitToMMKModalOpen, setIsSubmitToMMKModalOpen] = useState(false);
  const [programToApproveByMMK, setProgramToApproveByMMK] = useState<any>(null);
  const [isApproveByMMKModalOpen, setIsApproveByMMKModalOpen] = useState(false);
  const [programToStartPayment, setProgramToStartPayment] = useState<any>(null);
  const [isStartPaymentModalOpen, setIsStartPaymentModalOpen] = useState(false);
  const [programToCompletePayment, setProgramToCompletePayment] = useState<any>(null);
  const [isCompletePaymentModalOpen, setIsCompletePaymentModalOpen] = useState(false);
  const [programToReject, setProgramToReject] = useState<any>(null);
  const [programToCompleteSendToMMK, setProgramToCompleteSendToMMK] = useState<any>(null);
  const [isRejectConfirmModalOpen, setIsRejectConfirmModalOpen] = useState(false);
  const [isCompleteSendToMMKModalOpen, setIsCompleteSendToMMKModalOpen] = useState(false);
  const [expandedStatusTimelines, setExpandedStatusTimelines] = useState<{ [key: string]: boolean }>({});
  
  // Query details modal state
  const [isQueryDetailsModalOpen, setIsQueryDetailsModalOpen] = useState(false);
  const [selectedQueryDetails, setSelectedQueryDetails] = useState<any>(null);
  
  // EFT details modal state
  const [isEftDetailsModalOpen, setIsEftDetailsModalOpen] = useState(false);
  
  // Pagination state for EXCO users
  const [currentPage, setCurrentPage] = useState(1);
  const [programsPerPage] = useState(5);


    const canCreateProgram = user?.role === 'exco_user';
  const canReviewPrograms = user?.role === 'finance_mmk';
  const isFinanceRole = user?.role === 'finance_mmk';

  const [excoUsers, setExcoUsers] = useState<any[]>([]);
  const [selectedExcoUser, setSelectedExcoUser] = useState<any | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [userBudgetInfo, setUserBudgetInfo] = useState<any>(null);

  // Custom document functions
  const addCustomDocument = () => {
    const newDoc = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      documentName: '',
      file: null
    };
    setCustomDocuments([...customDocuments, newDoc]);
  };

  const removeCustomDocument = (id: string) => {
    setCustomDocuments(customDocuments.filter(doc => doc.id !== id));
  };

  const updateCustomDocument = (id: string, field: 'documentName' | 'file', value: string | File | null) => {
    setCustomDocuments(customDocuments.map(doc => 
      doc.id === id ? { ...doc, [field]: value } : doc
    ));
  };

  // Edit mode custom document functions
  const addEditCustomDocument = () => {
    const newDoc = {
      id: `edit_custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      documentName: '',
      file: null
    };
    setEditCustomDocuments([...editCustomDocuments, newDoc]);
  };

  const removeEditCustomDocument = (id: string) => {
    setEditCustomDocuments(editCustomDocuments.filter(doc => doc.id !== id));
  };

  const updateEditCustomDocument = (id: string, field: 'documentName' | 'file', value: string | File | null) => {
    setEditCustomDocuments(editCustomDocuments.map(doc => 
      doc.id === id ? { ...doc, [field]: value } : doc
    ));
  };

  // Function to fetch existing custom documents for display
  const fetchExistingCustomDocuments = (program: any) => {
    if (!program.documents) return [];
    
    // Define the 6 predefined document names to filter out
    const predefinedNames = [
      'Surat Akuan Pusat Khidmat',
      'Surat Kelulusan Pkn', 
      'Surat Program',
      'Surat Exco',
      'Penyata Akaun Bank',
      'Borang Daftar Kod'
    ];
    
    // Filter documents that are NOT in the predefined list
    return program.documents
      .filter((doc: any) => {
        const docName = doc.original_name || doc.name || '';
        return !predefinedNames.some(predefined => docName.includes(predefined));
      })
      .map((doc: any) => {
        // Clean the document name by removing program ID and file extension
        let cleanName = doc.original_name || doc.name || 'Custom Document';
        
        // Remove program ID pattern (e.g., "(64)")
        cleanName = cleanName.replace(/\(\d+\)/g, '');
        
        // Remove file extensions
        cleanName = cleanName.replace(/\.(pdf|doc|docx|jpg|jpeg|png|gif|bmp|webp)$/i, '');
        
        // Trim whitespace
        cleanName = cleanName.trim();
        
        return {
          id: doc.id,
          documentName: cleanName || 'Custom Document',
          file: null, // We don't have the actual file, just the document info
          isExisting: true, // Flag to identify existing documents
          documentId: doc.id // Store the original document ID for reference
        };
      });
  };

  useEffect(() => {
    console.log('ProgramManagement useEffect triggered', { user, locationState: location.state });
    
    try {
    fetchExcoUsers();
    
      // Fetch all users to map IDs to names
      fetch(`${BASE_URL}/users.php`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.users) {
            const map: { [id: string]: string } = {};
            data.users.forEach((u: any) => {
              map[u.id] = u.fullName || u.full_name || u.email || u.id;
            });
            setUserMap(map);
          }
        })
        .catch(error => {
          console.error('Failed to fetch users for userMap:', error);
        });
      
    // Check if we have a pre-selected user from navigation state (from EXCO user dashboard)
    if (location.state?.selectedUserId && location.state?.selectedUserName) {
        console.log('Setting selected user from location state:', location.state.selectedUserId);
      setSelectedExcoUser({ 
        id: location.state.selectedUserId, 
        name: location.state.selectedUserName 
      });
      fetchProgramsForUser(location.state.selectedUserId);
      fetchUserBudget(location.state.selectedUserId);
    }
    // If exco_user, auto-select themselves to show their programs
    else if (user?.role === 'exco_user' && user?.id) {
        console.log('Setting selected user for exco_user:', user.id);
      setSelectedExcoUser({ id: user.id, name: user.fullName || user.full_name || user.email || 'EXCO User' });
      fetchProgramsForUser(user.id);
      fetchUserBudget(user.id);
      }
    } catch (error) {
      console.error('Error in ProgramManagement useEffect:', error);
    }
  }, [user, location.state]);

  const fetchExcoUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch(`${BASE_URL}/users.php?exco_stats=1`);
      const data = await res.json();
      if (data.success) {
        setExcoUsers(data.users);
      }
    } catch (e) {
      toast({ title: t('common.error'), description: 'Failed to fetch EXCO users', variant: 'destructive' });
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchUserBudget = async (userId: string) => {
    try {
      const response = await getUserBudget(userId);
      if (response.success) {
        setUserBudgetInfo(response.user);
      }
    } catch (error) {
      console.error('Error fetching user budget:', error);
    }
  };

  const fetchProgramsForUser = async (userId: string) => {
    console.log('fetchProgramsForUser called with userId:', userId);
    setLoadingPrograms(true);
    try {
      const res = await fetch(`${BASE_URL}/programs.php?exco_user_id=${userId}`);
      const data = await res.json();
      console.log('fetchProgramsForUser response:', data);
      if (data.success) {
        setPrograms(data.programs || []);
      } else {
        console.error('fetchProgramsForUser failed:', data.message);
        setPrograms([]);
      }
    } catch (e) {
      console.error('fetchProgramsForUser error:', e);
      toast({ title: t('common.error'), description: 'Failed to fetch programs', variant: 'destructive' });
      setPrograms([]);
    } finally {
      setLoadingPrograms(false);
    }
  };

  const filteredPrograms = programs
    .filter(program => {
      if (statusFilter === 'all') return true;
      return program.status === statusFilter;
    })
    .sort((a, b) => {
      // Sort by program ID in descending order (highest ID first)
      const idA = parseInt(a.id);
      const idB = parseInt(b.id);
      return idB - idA;
    });

  // Pagination logic for all users
  const totalPages = Math.ceil(filteredPrograms.length / programsPerPage);
  const indexOfLastProgram = currentPage * programsPerPage;
  const indexOfFirstProgram = indexOfLastProgram - programsPerPage;
  const currentPrograms = filteredPrograms.slice(indexOfFirstProgram, indexOfLastProgram);

  // Reset to first page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  // Update budget validation when form data changes
  useEffect(() => {
    if (user?.role === 'exco_user' && formData.budget && userBudgetInfo?.remaining_budget) {
      const programBudget = parseFloat(formData.budget);
      const remainingBudget = userBudgetInfo.remaining_budget;
      
      if (programBudget > remainingBudget) {
        // Budget exceeds remaining budget - this will show the warning in the UI
        console.log('Budget validation: Program budget exceeds remaining budget');
      }
    }
  }, [formData.budget, userBudgetInfo, user?.role]);

  const handleAddProgram = async () => {
    // Check if all required fields are filled
    if (!formData.programName || !formData.budget || !formData.recipientName || !formData.excoLetterRef) {
      toast({
        title: t('common.error'),
        description: t('programs.fill_required_fields'),
        variant: "destructive"
      });
      return;
    }

    // Budget validation for EXCO users
    if (user?.role === 'exco_user') {
      try {
        const budgetResponse = await getUserBudget(user.id);
        if (budgetResponse.success) {
          const { remaining_budget } = budgetResponse.user;
          const programBudget = parseFloat(formData.budget);
          
          if (programBudget > remaining_budget) {
            const programBudgetFormatted = programBudget.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const remainingBudgetFormatted = remaining_budget.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const errorMessage = `${t('budget.insufficient')}. ${t('budget.exceeds_remaining')} (RM ${programBudgetFormatted}) (RM ${remainingBudgetFormatted}).`;
            toast({
              title: t('common.error'),
              description: errorMessage,
              variant: "destructive"
            });
            return;
          }
        }
      } catch (error) {
        console.error('Error checking budget:', error);
        // Continue with program creation if budget check fails
      }
    }

    // Validate custom documents if any exist
    const invalidCustomDocs = customDocuments.filter(doc => 
      (doc.documentName.trim() && !doc.file) || (!doc.documentName.trim() && doc.file)
    );
    
    if (invalidCustomDocs.length > 0) {
      toast({
        title: t('common.error'),
        description: 'Please provide both document name and file for all custom documents, or remove incomplete entries.',
        variant: "destructive"
      });
      return;
    }
    const programToAdd = {
      program_name: formData.programName,
      budget: parseFloat(formData.budget),
      recipient_name: formData.recipientName,
      exco_letter_ref: formData.excoLetterRef,
      created_by: user?.id, // Use user ID for created_by
      status: 'draft',
    };
    const res = await createProgram(programToAdd);
    if (res.success) {
      // Upload documents to database if any were added
      const programId = res.program_id; // Get the created program ID
      let uploadedCount = 0;
      
      // Define document types and their corresponding form fields
      const documentTypes = [
        { field: 'suratAkuanPusatKhidmat', name: 'Surat Akuan Pusat Khidmat', type: 'surat_akuan' },
        { field: 'suratKelulusanPkn', name: 'Surat Kelulusan Pkn', type: 'surat_kelulusan' },
        { field: 'suratProgram', name: 'Surat Program', type: 'surat_program' },
        { field: 'suratExco', name: 'Surat Exco', type: 'surat_exco' },
        { field: 'penyataAkaunBank', name: 'Penyata Akaun Bank', type: 'penyata_akaun' },
        { field: 'borangDaftarKod', name: 'Borang Daftar Kod', type: 'borang_daftar' }
      ];
      
      // Upload predefined documents
      for (const docType of documentTypes) {
        const file = formData[docType.field as keyof typeof formData] as File | null;
        if (file) {
          try {
            // Create a new file with the renamed name
            const fileExtension = file.name.split('.').pop();
            const newFileName = `${docType.name}(${programId}).${fileExtension}`;
            
            // Create a new File object with the renamed name
            const renamedFile = new File([file], newFileName, { type: file.type });
            
            const uploadRes = await uploadDocument(programId, renamedFile, user?.fullName || user?.full_name || '', docType.type);
            if (uploadRes.success) {
              uploadedCount++;
            } else {
              console.error('Failed to upload document:', file.name, uploadRes.message);
            }
          } catch (error) {
            console.error('Failed to upload document:', file.name, error);
          }
        }
      }

      // Upload custom documents
      for (const customDoc of customDocuments) {
        if (customDoc.file && customDoc.documentName.trim()) {
          try {
            const fileExtension = customDoc.file.name.split('.').pop();
            const newFileName = `${customDoc.documentName.trim()}(${programId}).${fileExtension}`;
            
            // Create a new File object with the renamed name
            const renamedFile = new File([customDoc.file], newFileName, { type: customDoc.file.type });
            
            const uploadRes = await uploadDocument(programId, renamedFile, user?.fullName || user?.full_name || '', 'custom');
            if (uploadRes.success) {
              uploadedCount++;
            } else {
              console.error('Failed to upload custom document:', customDoc.documentName, uploadRes.message);
            }
          } catch (error) {
            console.error('Failed to upload custom document:', customDoc.documentName, error);
          }
        }
      }
      
      if (uploadedCount > 0) {
        toast({ 
          title: t('common.success'), 
          description: `${uploadedCount} document(s) uploaded successfully` 
        });
      } else {
        toast({ 
          title: t('common.success'), 
          description: t('programs.created_successfully') 
        });
      }
      
      // Refresh programs - use user-specific fetch for exco_user
      if (user?.role === 'exco_user') {
        fetchProgramsForUser(user.id);
      } else {
        getPrograms().then(res => {
          if (res.success && res.programs) setPrograms(res.programs);
        });
      }
      setIsAddModalOpen(false);
      setFormData({ 
        programName: '', 
        budget: '', 
        recipientName: '', 
        excoLetterRef: '',
        suratAkuanPusatKhidmat: null,
        suratKelulusanPkn: null,
        suratProgram: null,
        suratExco: null,
        penyataAkaunBank: null,
        borangDaftarKod: null
      });
      setCustomDocuments([]);
    } else {
      toast({ title: t('common.error'), description: res.message || t('programs.create_failed'), variant: "destructive" });
    }
  };

  const handleEditProgram = async () => {
    if (!editFormData.programName || !editFormData.budget || !editFormData.recipientName || !editFormData.excoLetterRef) {
      toast({
        title: t('common.error'),
        description: t('programs.fill_required_fields'),
        variant: "destructive"
      });
      return;
    }
    
    if (!selectedProgram) return;
    
    const programToUpdate = {
      program_name: editFormData.programName,
      budget: parseFloat(editFormData.budget),
      recipient_name: editFormData.recipientName,
      exco_letter_ref: editFormData.excoLetterRef,
    };
    
    console.log('Updating program with ID:', selectedProgram.id);
    console.log('Program data to update:', programToUpdate);
    console.log('Selected program:', selectedProgram);
    
    const res = await updateProgram(selectedProgram.id, programToUpdate);
    if (res.success) {
      // Handle document uploads if any new documents are selected
      const documentFields = [
        { field: 'suratAkuanPusatKhidmat', name: 'Surat Akuan Pusat Khidmat', type: 'surat_akuan' },
        { field: 'suratKelulusanPkn', name: 'Surat Kelulusan Pkn', type: 'surat_kelulusan' },
        { field: 'suratProgram', name: 'Surat Program', type: 'surat_program' },
        { field: 'suratExco', name: 'Surat Exco', type: 'surat_exco' },
        { field: 'penyataAkaunBank', name: 'Penyata Akaun Bank', type: 'penyata_akaun' },
        { field: 'borangDaftarKod', name: 'Borang Daftar Kod', type: 'borang_daftar' }
      ];


      
      for (const docField of documentFields) {
        const file = editFormData[docField.field as keyof typeof editFormData] as File | null;
        if (file) {
          try {
            const programId = selectedProgram.id;
            const fileExtension = file.name.split('.').pop();
            
            // Check if there's an existing document of this type
            const existingDoc = selectedProgram.documents?.find((doc: any) => {
              const docName = doc.original_name || doc.name;
              return docName.includes(docField.name);
            });
            
            // If existing document found, delete it first
            if (existingDoc) {
              console.log(`Deleting existing ${docField.name} document:`, existingDoc.id);
              await deleteDocument(existingDoc.id);
            }
            
            // Create new filename with program ID
            const newFileName = `${docField.name}(${programId}).${fileExtension}`;
            
            const renamedFile = new File([file], newFileName, { type: file.type });
            await uploadDocument(programId, renamedFile, user?.fullName || user?.full_name || '', docField.type);
            
            console.log(`Successfully uploaded ${docField.name} with new filename:`, newFileName);
          } catch (error) {
            console.error(`Error uploading ${docField.name}:`, error);
            toast({ 
              title: t('common.error'), 
              description: `Failed to upload ${docField.name}`, 
              variant: "destructive" 
            });
          }
        }
      }

      // Handle custom documents uploads if any were added
      for (const customDoc of editCustomDocuments) {
        // Skip existing documents that haven't been changed
        if (customDoc.isExisting) continue;
        
        if (customDoc.file && customDoc.documentName.trim()) {
          try {
            const programId = selectedProgram.id;
            const fileExtension = customDoc.file.name.split('.').pop();
            const newFileName = `${customDoc.documentName.trim()}(${programId}).${fileExtension}`;
            
            // Create a new File object with the renamed name
            const renamedFile = new File([customDoc.file], newFileName, { type: customDoc.file.type });
            
            const uploadRes = await uploadDocument(programId, renamedFile, user?.fullName || user?.full_name || '', 'custom');
            if (uploadRes.success) {
              console.log(`Successfully uploaded custom document: ${customDoc.documentName}`);
            } else {
              console.error('Failed to upload custom document:', customDoc.documentName, uploadRes.message);
            }
          } catch (error) {
            console.error('Failed to upload custom document:', customDoc.documentName, error);
            toast({ 
              title: t('common.error'), 
              description: `Failed to upload custom document: ${customDoc.documentName}`, 
              variant: "destructive" 
            });
          }
        }
      }

      toast({ title: t('common.success'), description: t('programs.updated_successfully') });
      // Refresh programs - use user-specific fetch for exco_user
      if (user?.role === 'exco_user') {
        fetchProgramsForUser(user.id);
      } else if (selectedExcoUser) {
        fetchProgramsForUser(selectedExcoUser.id);
      } else {
        getPrograms().then(res => {
          if (res.success && res.programs) setPrograms(res.programs);
        });
      }
      setIsEditModalOpen(false);
      setSelectedProgram(null);
      setEditFormData({ 
        programName: '', 
        budget: '', 
        recipientName: '', 
        excoLetterRef: '',
        suratAkuanPusatKhidmat: null,
        suratKelulusanPkn: null,
        suratProgram: null,
        suratExco: null,
        penyataAkaunBank: null,
        borangDaftarKod: null
      });
      setEditCustomDocuments([]);
    } else {
      toast({ title: t('common.error'), description: res.message || t('programs.update_failed'), variant: "destructive" });
    }
  };

  const handleSubmitProgram = async (programId: string) => {
    try {
      const res = await changeProgramStatus(programId, 'under_review');
      
      if (res.success) {
        toast({ title: t('common.success'), description: t('programs.submitted_for_review') });
        // Refresh programs - use user-specific fetch for exco_user
        if (user?.role === 'exco_user') {
          fetchProgramsForUser(user.id);
        } else if (selectedExcoUser) {
          fetchProgramsForUser(selectedExcoUser.id);
        } else {
          getPrograms().then(res => {
            if (res.success && res.programs) setPrograms(res.programs);
          });
        }
        setIsSubmitConfirmModalOpen(false);
        setProgramToSubmit(null);
      } else {
        toast({ title: t('common.error'), description: res.message || t('programs.submit_failed'), variant: "destructive" });
      }
    } catch (error) {
      toast({ title: t('common.error'), description: 'An error occurred while submitting the program', variant: "destructive" });
    }
  };

  const handleSubmitToMMK = async (programId: string) => {
    const res = await changeProgramStatus(programId, 'under_review_by_mmk');
    if (res.success) {
      toast({ title: t('common.success'), description: 'Program submitted to MMK office for review' });
      // Refresh programs
      if (user?.role === 'exco_user') {
        fetchProgramsForUser(user.id);
      } else if (selectedExcoUser) {
        fetchProgramsForUser(selectedExcoUser.id);
      } else {
        getPrograms().then(res => {
          if (res.success && res.programs) setPrograms(res.programs);
        });
      }
      setIsSubmitToMMKModalOpen(false);
      setProgramToSubmitToMMK(null);
    } else {
      toast({ title: "Error", description: res.message || "Failed to submit program to MMK", variant: "destructive" });
    }
  };

  const handleApproveByMMK = async (programId: string) => {
    const res = await changeProgramStatus(programId, 'document_accepted_by_mmk');
    if (res.success) {
      toast({ title: t('common.success'), description: 'Document accepted by MMK office' });
      // Refresh programs
      if (user?.role === 'exco_user') {
        fetchProgramsForUser(user.id);
      } else if (selectedExcoUser) {
        fetchProgramsForUser(selectedExcoUser.id);
      } else {
        getPrograms().then(res => {
          if (res.success && res.programs) setPrograms(res.programs);
        });
      }
      setIsApproveByMMKModalOpen(false);
      setProgramToApproveByMMK(null);
    } else {
      toast({ title: "Error", description: res.message || "Failed to approve document", variant: "destructive" });
    }
  };

  const handleStartPayment = async (programId: string) => {
    const res = await changeProgramStatus(programId, 'payment_in_progress');
    if (res.success) {
      toast({ title: t('common.success'), description: 'Payment process started' });
      // Refresh programs
      if (user?.role === 'exco_user') {
        fetchProgramsForUser(user.id);
      } else if (selectedExcoUser) {
        fetchProgramsForUser(selectedExcoUser.id);
      } else {
        getPrograms().then(res => {
          if (res.success && res.programs) setPrograms(res.programs);
        });
      }
      setIsStartPaymentModalOpen(false);
      setProgramToStartPayment(null);
    } else {
      toast({ title: "Error", description: res.message || "Failed to start payment process", variant: "destructive" });
    }
  };

  const handleCompletePayment = async (programId: string, voucherNumber: string, eftNumber: string, eftDate: string) => {
    const res = await changeProgramStatus(programId, 'payment_completed', voucherNumber, eftNumber, eftDate);
    if (res.success) {
      toast({ title: t('common.success'), description: 'Payment completed successfully' });
      // Refresh programs
      if (user?.role === 'exco_user') {
        fetchProgramsForUser(user.id);
      } else if (selectedExcoUser) {
        fetchProgramsForUser(selectedExcoUser.id);
      } else {
        getPrograms().then(res => {
          if (res.success && res.programs) setPrograms(res.programs);
        });
      }
      setIsCompletePaymentModalOpen(false);
      setProgramToCompletePayment(null);
    } else {
      toast({ title: "Error", description: res.message || "Failed to complete payment", variant: "destructive" });
    }
  };

  const handleRejectProgram = async (programId: string) => {
    const res = await changeProgramStatus(programId, 'rejected');
    if (res.success) {
      toast({ title: t('programs.rejected'), description: t('programs.rejected_successfully') });
      // Refresh programs - use user-specific fetch for exco_user
      if (user?.role === 'exco_user') {
        fetchProgramsForUser(user.id);
      } else if (selectedExcoUser) {
        fetchProgramsForUser(selectedExcoUser.id);
      } else {
        getPrograms().then(res => {
          if (res.success && res.programs) setPrograms(res.programs);
        });
      }
      setIsRejectConfirmModalOpen(false);
      setProgramToReject(null);
    } else {
      toast({ title: "Error", description: res.message || "Failed to reject program", variant: "destructive" });
    }
  };

  const handleQuery = async (programId: string, query: string) => {
    const res = await addRemark(programId, query);
    if (res.success) {
      toast({ title: t('programs.query_sent'), description: t('programs.query_sent_desc') });
      // Refresh programs - use user-specific fetch for exco_user
      if (user?.role === 'exco_user') {
        fetchProgramsForUser(user.id);
      } else if (selectedExcoUser) {
        fetchProgramsForUser(selectedExcoUser.id);
      } else {
      getPrograms().then(res => {
        if (res.success && res.programs) setPrograms(res.programs);
      });
      }
    } else {
      toast({ title: t('common.error'), description: res.message || t('programs.query_failed'), variant: "destructive" });
    }
  };



  const deleteDocumentFromProgram = async (documentId: string) => {
    try {
      const res = await deleteDocument(documentId);
        if (res.success) {
        toast({ title: t('common.success'), description: t('programs.document_deleted') });
        // Refresh the selected program with updated documents
        if (selectedProgram) {
          if (user?.role === 'exco_user') {
            const updatedPrograms = await fetch(`${BASE_URL}/programs.php?exco_user_id=${user.id}`);
            const data = await updatedPrograms.json();
            if (data.success) {
              const updatedProgram = data.programs.find((p: any) => p.id === selectedProgram.id);
            if (updatedProgram) {
              setSelectedProgram(updatedProgram);
            }
          }
          } else if (selectedExcoUser) {
            const updatedPrograms = await fetch(`${BASE_URL}/programs.php?exco_user_id=${selectedExcoUser.id}`);
            const data = await updatedPrograms.json();
            if (data.success) {
              const updatedProgram = data.programs.find((p: any) => p.id === selectedProgram.id);
              if (updatedProgram) {
                setSelectedProgram(updatedProgram);
              }
            }
          } else {
        const programsResponse = await getPrograms();
        if (programsResponse.success) {
            const updatedProgram = programsResponse.programs.find(p => p.id === selectedProgram.id);
            if (updatedProgram) {
              setSelectedProgram(updatedProgram);
              }
            }
          }
        }
      } else {
        toast({ title: t('common.error'), description: res.message || t('programs.delete_document_failed'), variant: "destructive" });
      }
    } catch (error) {
      console.error('Delete document error:', error);
              toast({ title: t('common.error'), description: t('programs.delete_document_failed'), variant: "destructive" });
    }
  };



  const submitQuery = async () => {
    if (!newQuery.trim()) {
      toast({
        title: t('common.error'),
        description: t('programs.enter_query'),
        variant: "destructive"
      });
      return;
    }

    if (!selectedProgram) {
      toast({
        title: t('common.error'),
        description: t('programs.no_program_selected'),
        variant: "destructive"
      });
      return;
    }

    try {
      const res = await createQuery(
        selectedProgram.id,
        newQuery.trim(),
        user?.fullName || user?.full_name || ''
      );
      if (res.success) {
        toast({ title: t('common.success'), description: t('programs.query_submitted') });
        // Refresh programs - use user-specific fetch for exco_user
        if (user?.role === 'exco_user') {
          fetchProgramsForUser(user.id);
        } else if (selectedExcoUser) {
          fetchProgramsForUser(selectedExcoUser.id);
        } else {
        const programsResponse = await getPrograms();
        if (programsResponse.success) {
          setPrograms(programsResponse.programs);
          }
        }
          // Update the selected program
        if (user?.role === 'exco_user') {
          const updatedPrograms = await fetch(`${BASE_URL}/programs.php?exco_user_id=${user.id}`);
          const data = await updatedPrograms.json();
          if (data.success) {
            const updatedProgram = data.programs.find((p: any) => p.id === selectedProgram.id);
            if (updatedProgram) {
              setSelectedProgram(updatedProgram);
            }
          }
        } else if (selectedExcoUser) {
          const updatedPrograms = await fetch(`${BASE_URL}/programs.php?exco_user_id=${selectedExcoUser.id}`);
          const data = await updatedPrograms.json();
          if (data.success) {
            const updatedProgram = data.programs.find((p: any) => p.id === selectedProgram.id);
            if (updatedProgram) {
              setSelectedProgram(updatedProgram);
            }
          }
        } else {
          const programsResponse = await getPrograms();
          if (programsResponse.success) {
          const updatedProgram = programsResponse.programs.find(p => p.id === selectedProgram.id);
          if (updatedProgram) {
            setSelectedProgram(updatedProgram);
            }
          }
        }
        setNewQuery('');
        setIsQueryModalOpen(false);
      } else {
        toast({ title: t('common.error'), description: res.message || t('programs.query_submit_failed'), variant: "destructive" });
      }
    } catch (error) {
      console.error('Submit query error:', error);
      toast({ title: t('common.error'), description: t('programs.query_submit_failed'), variant: "destructive" });
    }
  };

  const handleAnswerQuery = async () => {
    if (!queryAnswer.trim()) {
      toast({
        title: t('common.error'),
        description: t('programs.enter_answer'),
        variant: "destructive"
      });
      return;
    }

    if (!selectedQuery) {
      toast({
        title: t('common.error'),
        description: t('programs.no_query_selected'),
        variant: "destructive"
      });
      return;
    }

    try {
      const res = await answerQuery(
        selectedQuery.id,
        queryAnswer.trim(),
        user?.fullName || user?.full_name || ''
      );
      if (res.success) {
        toast({ title: t('common.success'), description: t('programs.query_answered') });
        // Refresh programs - use user-specific fetch for exco_user
        if (user?.role === 'exco_user') {
          fetchProgramsForUser(user.id);
        } else if (selectedExcoUser) {
          fetchProgramsForUser(selectedExcoUser.id);
        } else {
        const programsResponse = await getPrograms();
        if (programsResponse.success) {
          setPrograms(programsResponse.programs);
          }
        }
          // Update the selected program
        if (user?.role === 'exco_user') {
          const updatedPrograms = await fetch(`${BASE_URL}/programs.php?exco_user_id=${user.id}`);
          const data = await updatedPrograms.json();
          if (data.success) {
            const updatedProgram = data.programs.find((p: any) => p.id === selectedProgram.id);
            if (updatedProgram) {
              setSelectedProgram(updatedProgram);
            }
          }
        } else if (selectedExcoUser) {
          const updatedPrograms = await fetch(`${BASE_URL}/programs.php?exco_user_id=${selectedExcoUser.id}`);
          const data = await updatedPrograms.json();
          if (data.success) {
            const updatedProgram = data.programs.find((p: any) => p.id === selectedProgram.id);
            if (updatedProgram) {
              setSelectedProgram(updatedProgram);
            }
          }
        } else {
          const programsResponse = await getPrograms();
          if (programsResponse.success) {
            const updatedProgram = programsResponse.programs.find(p => p.id === selectedProgram.id);
            if (updatedProgram) {
              setSelectedProgram(updatedProgram);
            }
          }
        }
        setQueryAnswer('');
        setIsAnswerQueryModalOpen(false);
        setSelectedQuery(null);
      } else {
        toast({ title: t('common.error'), description: res.message || t('programs.answer_query_failed'), variant: "destructive" });
      }
    } catch (error) {
      console.error('Answer query error:', error);
      toast({ title: t('common.error'), description: t('programs.answer_query_failed'), variant: "destructive" });
    }
  };

  // Helper function to map documents to form data
  const mapDocumentsToFormData = (program: any) => {
    const documentMap: { [key: string]: any } = {
      suratAkuanPusatKhidmat: null,
      suratKelulusanPkn: null,
      suratProgram: null,
      suratExco: null,
      penyataAkaunBank: null,
      borangDaftarKod: null
    };
    
    if (program.documents && Array.isArray(program.documents)) {
      program.documents.forEach((doc: any) => {
        const docName = doc.original_name || doc.name;
        if (docName.includes('Surat Akuan Pusat Khidmat')) {
          documentMap.suratAkuanPusatKhidmat = doc;
        } else if (docName.includes('Surat Kelulusan Pkn')) {
          documentMap.suratKelulusanPkn = doc;
        } else if (docName.includes('Surat Program')) {
          documentMap.suratProgram = doc;
        } else if (docName.includes('Surat Exco')) {
          documentMap.suratExco = doc;
        } else if (docName.includes('Penyata Akaun Bank')) {
          documentMap.penyataAkaunBank = doc;
        } else if (docName.includes('Borang Daftar Kod')) {
          documentMap.borangDaftarKod = doc;
        }
      });
    }
    
    return documentMap;
  };

  const handleBudgetChange = async (userId: string, newBudget: number) => {
    const payload = { user_id: Number(userId), total_budget: Number(newBudget) };
    console.log('Setting budget:', payload);
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
    }
  };

  // Helper function to open query details modal
  const openQueryDetailsModal = (program: any) => {
    setSelectedQueryDetails(program);
    setIsQueryDetailsModalOpen(true);
  };

  // Helper function to open EFT details modal
  const openEftDetailsModal = (program: any) => {
    setSelectedQueryDetails(program);
    setIsEftDetailsModalOpen(true);
  };

  // Helper function to get payment completion timestamp
  const getPaymentCompletionTimestamp = (program: any) => {
    if (!program.status_history || !Array.isArray(program.status_history)) {
      return '-';
    }
    
    const paymentCompletedEntry = program.status_history.find((entry: any) => entry.status === 'payment_completed');
    if (paymentCompletedEntry) {
      return new Date(paymentCompletedEntry.changed_at).toLocaleDateString('en-MY', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }) + ' ' + new Date(paymentCompletedEntry.changed_at).toLocaleTimeString('en-MY', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    return '-';
  };

  // Status Timeline Component
  const StatusTimeline = ({ program }: { program: any }) => {
    const { t } = useLanguage();
    
    const statusFlow = [
      { key: 'draft', label: t('timeline.draft'), icon: FileText, color: 'bg-gray-500' },
      { key: 'under_review', label: t('timeline.under_review'), icon: Clock, color: 'bg-blue-500' },
      { key: 'query', label: t('timeline.query'), icon: AlertCircle, color: 'bg-orange-500' },
      { key: 'query_answered', label: t('timeline.query_answered'), icon: CheckCircle, color: 'bg-purple-500' },
      { key: 'complete_can_send_to_mmk', label: t('timeline.complete_can_send_to_mmk'), icon: Send, color: 'bg-yellow-500' },
      { key: 'under_review_by_mmk', label: t('timeline.under_review_by_mmk'), icon: Clock, color: 'bg-indigo-500' },
      { key: 'document_accepted_by_mmk', label: t('timeline.document_accepted_by_mmk'), icon: CheckCircle, color: 'bg-teal-500' },
      { key: 'payment_in_progress', label: t('timeline.payment_in_progress'), icon: Clock, color: 'bg-amber-500' },
      { key: 'payment_completed', label: t('timeline.payment_completed'), icon: CheckCircle, color: 'bg-green-500' }
    ];

    const currentStatusIndex = statusFlow.findIndex(status => status.key === program.status);
    const isExpanded = expandedStatusTimelines[program.id] || false;

    // Function to get status timestamp from status history
    const getStatusTimestamp = (statusKey: string) => {
      if (!program.status_history || !Array.isArray(program.status_history)) {
        // Fallback to creation date if no status history
        return new Date(program.created_at || program.createdAt);
      }
      
      const statusEntry = program.status_history.find((entry: any) => entry.status === statusKey);
      if (statusEntry) {
        return new Date(statusEntry.changed_at);
      }
      
      // For draft status, always use program creation time
      if (statusKey === 'draft') {
        // Use created_at if available, otherwise fallback to creation date
        const creationTime = program.created_at || program.createdAt || program.created_date;
        if (creationTime) {
          return new Date(creationTime);
        }
        // If no creation time found, use current time as fallback
        return new Date();
      }
      
      // For query and query_answered, if they don't exist in history but program is at complete_can_send_to_mmk or beyond,
      // use the timestamp of the next completed status
      if (statusKey === 'query' || statusKey === 'query_answered') {
        const currentStatus = program.status;
        if (['complete_can_send_to_mmk', 'under_review_by_mmk', 'document_accepted_by_mmk', 'payment_in_progress', 'payment_completed'].includes(currentStatus)) {
          // Find the timestamp of the next status that exists in history
          const nextStatusEntry = program.status_history.find((entry: any) => 
            ['complete_can_send_to_mmk', 'under_review_by_mmk', 'document_accepted_by_mmk', 'payment_in_progress', 'payment_completed'].includes(entry.status)
          );
          if (nextStatusEntry) {
            return new Date(nextStatusEntry.changed_at);
          }
        }
      }
      
      // Fallback to creation date if status not found in history
      return new Date(program.created_at || program.createdAt);
    };

    // Function to check if a status should be considered completed based on current status
    const isStatusCompleted = (statusKey: string) => {
      const currentStatus = program.status;
      
      // Draft is always considered completed (program exists)
      if (statusKey === 'draft') {
        return true;
      }
      
      // If program is at complete_can_send_to_mmk or beyond, consider query and query_answered as completed
      if (statusKey === 'query' || statusKey === 'query_answered') {
        if (['complete_can_send_to_mmk', 'under_review_by_mmk', 'document_accepted_by_mmk', 'payment_in_progress', 'payment_completed'].includes(currentStatus)) {
          return true;
        }
      }
      
      // Check if this status exists in status history
      if (program.status_history && Array.isArray(program.status_history)) {
        return program.status_history.some((entry: any) => entry.status === statusKey);
      }
      
      return false;
    };

    // Function to format timestamp
    const formatTimestamp = (date: Date) => {
      return date.toLocaleDateString('en-MY', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }) + ' ' + date.toLocaleTimeString('en-MY', {
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    return (
      <div className="p-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpandedStatusTimelines(prev => ({
                  ...prev,
                  [program.id]: !prev[program.id]
                }))}
                className="flex items-center gap-2 text-sm mb-3"
              >
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                {t('timeline.status_timeline')}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isExpanded ? 'Collapse' : 'Expand'} status timeline</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {isExpanded && (
          <div className="bg-gray-50 rounded-lg p-4 w-full">
            <div className="relative w-full overflow-x-auto">
              {/* Horizontal Timeline Line */}
              <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-300"></div>
              
              {/* Status Steps - Horizontal Layout */}
              <div className="flex justify-between items-center relative w-full min-w-[800px]">
                {statusFlow.map((status, index) => {
                  const Icon = status.icon;
                  const isCompleted = isStatusCompleted(status.key);
                  const isCurrent = program.status === status.key;
                  const isFuture = !isCompleted && !isCurrent;
                  
                  return (
                    <div key={status.key} className="flex flex-col items-center relative flex-shrink-0">
                      {/* Status Circle */}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div 
                              className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center ${
                                isCompleted ? status.color : 'bg-gray-300'
                              } ${isCurrent ? 'ring-4 ring-blue-200' : ''} ${
                                (status.key === 'query' || status.key === 'query_answered') && isCompleted && user?.role === 'finance_mmk'
                                  ? 'cursor-pointer hover:scale-110 transition-transform'
                                  : ''
                              }`}
                              onClick={() => {
                                if ((status.key === 'query' || status.key === 'query_answered') && isCompleted && user?.role === 'finance_mmk') {
                                  openQueryDetailsModal(program);
                                }
                              }}
                            >
                              <Icon className={`h-5 w-5 ${isCompleted ? 'text-white' : 'text-gray-500'}`} />
                            </div>
                          </TooltipTrigger>
                          {(status.key === 'query' || status.key === 'query_answered') && isCompleted && user?.role === 'finance_mmk' ? (
                            <TooltipContent>
                              <p>Click to view query details</p>
                            </TooltipContent>
                          ) : null}
                        </Tooltip>
                      </TooltipProvider>
                      
                      {/* Status Label */}
                      <div className="mt-2 text-center max-w-[140px] px-1">
                        <div className={`text-xs font-medium ${isCompleted ? 'text-gray-900' : 'text-gray-500'} whitespace-nowrap leading-tight`}>
                          {status.label}
                        </div>
                        {isCompleted && (
                          <div className="text-xs text-gray-600 mt-1">
                            {formatTimestamp(getStatusTimestamp(status.key))}
                          </div>
                        )}
                        {isCurrent && (
                          <div className="text-xs text-blue-600 font-medium mt-1">
                            {t('timeline.current')}
                          </div>
                        )}
                        {isCompleted && !isCurrent && (
                          <div className="text-xs text-green-600 font-medium mt-1">
                            {t('timeline.done')}
                          </div>
                        )}
                        {isFuture && (
                          <div className="text-xs text-gray-400 mt-1">
                            {t('timeline.pending')}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {/* EFT Number Circle - Right End */}
                <div className="flex flex-col items-center relative flex-shrink-0">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div 
                          className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center ${
                            (program.voucher_number || program.voucherNumber) && (program.eft_number || program.eftNumber) && (program.eft_date)
                              ? 'bg-green-500 cursor-pointer hover:scale-110 transition-transform'
                              : 'bg-gray-300'
                          }`}
                          onClick={() => {
                            if ((program.voucher_number || program.eft_number || program.eftNumber) && (program.voucher_number || program.voucherNumber) && (program.eft_date)) {
                              openEftDetailsModal(program);
                            }
                          }}
                        >
                          <Wallet className="h-5 w-5 text-white" />
                        </div>
                      </TooltipTrigger>
                      {(program.voucher_number || program.voucherNumber) && (program.eft_number || program.eftNumber) && (program.eft_date) ? (
                        <TooltipContent>
                          <p>Click to view EFT details</p>
                        </TooltipContent>
                      ) : (
                        <TooltipContent>
                          <p>EFT details not available</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                  
                  {/* EFT Label */}
                  <div className="mt-2 text-center max-w-[140px] px-1">
                    <div className={`text-xs font-medium ${
                      (program.voucher_number || program.voucherNumber) && (program.eft_number || program.eftNumber) && (program.eft_date)
                        ? 'text-gray-900'
                        : 'text-gray-500'
                    } whitespace-nowrap leading-tight`}>
                      EFT Details
                    </div>
                    {(program.voucher_number || program.voucherNumber) && (program.eft_number || program.eftNumber) && (program.eft_date) ? (
                      <div className="text-xs text-green-600 font-medium mt-1">
                        Available
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400 mt-1">
                        Not Available
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('programs.title')}</h1>
          <p className="text-muted-foreground">
                            {user?.role === 'finance_mmk'
              ? 'Set and manage EXCO user budgets. Click View to see programs for a user.'
              : t('programs.create_manage_desc')}
          </p>
        </div>
        {canCreateProgram && (user?.role !== 'exco_user' ? !selectedExcoUser : true) && (
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('programs.add_program')}
                    </Button>
                  </DialogTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Create a new program (documents are optional)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden">
              <DialogHeader>
                <DialogTitle>{t('programs.create_new_program')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 overflow-y-auto max-h-[calc(85vh-140px)] pr-4 pb-4 custom-scrollbar">
                <div>
                  <Label htmlFor="programName">{t('programs.program_name')} *</Label>
                  <Input
                    id="programName"
                    value={formData.programName}
                    onChange={(e) => setFormData({...formData, programName: e.target.value})}
                    placeholder={t('programs.enter_program_name')}
                  />
                </div>
                
                {/* Budget Information Display for EXCO Users */}
                {user?.role === 'exco_user' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">{t('budget.information')}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">{t('budget.total_budget')}:</span>
                        <span className="ml-2 font-medium text-blue-900">
                          RM {userBudgetInfo?.total_budget?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">{t('budget.remaining_budget')}:</span>
                        <span className="ml-2 font-medium text-blue-900">
                          RM {userBudgetInfo?.remaining_budget?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div>
                  <Label htmlFor="budget">{t('programs.budget_rm')} *</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({...formData, budget: e.target.value})}
                    placeholder={t('programs.enter_budget_amount')}
                  />
                  {/* Budget Warning for EXCO Users */}
                  {user?.role === 'exco_user' && formData.budget && userBudgetInfo?.remaining_budget && (
                    parseFloat(formData.budget) > userBudgetInfo.remaining_budget ? (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          <span>{t('budget.exceeds_remaining')}: RM {(parseFloat(formData.budget) - userBudgetInfo.remaining_budget).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          <span>{t('budget.available')}: RM {(userBudgetInfo.remaining_budget - parseFloat(formData.budget)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {t('budget.remaining_after_program')}</span>
                        </div>
                      </div>
                    )
                  )}
                </div>
                
                <div>
                  <Label htmlFor="recipientName">{t('programs.recipient_name')} *</Label>
                  <Input
                    id="recipientName"
                    value={formData.recipientName}
                    onChange={(e) => setFormData({...formData, recipientName: e.target.value})}
                    placeholder={t('programs.enter_recipient_name')}
                  />
                </div>
                
                <div>
                  <Label htmlFor="excoLetterRef">{t('programs.exco_letter_ref')} *</Label>
                  <Input
                    id="excoLetterRef"
                    value={formData.excoLetterRef}
                    onChange={(e) => setFormData({...formData, excoLetterRef: e.target.value})}
                    placeholder={t('programs.enter_reference_number')}
                  />
                </div>

                <div className="border rounded-lg p-4">
                  <Label className="text-base font-semibold mb-3">{t('programs.documents')} (Optional)</Label>
                  
                  <div className="space-y-3">
                    {/* Surat Akuan Pusat Khidmat */}
                    <div className="flex items-center gap-3">
                      <Label className="text-sm font-medium min-w-[200px]">Surat Akuan Pusat Khidmat</Label>
                      <Input
                        type="file"
                        className="flex-1"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setFormData({
                              ...formData,
                              suratAkuanPusatKhidmat: file
                            });
                          }
                        }}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.bmp,.webp"
                      />
                      {formData.suratAkuanPusatKhidmat && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setFormData({
                                    ...formData,
                                    suratAkuanPusatKhidmat: null
                                  });
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Clear selected file</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>

                    {/* Surat Kelulusan Pkn */}
                    <div className="flex items-center gap-3">
                      <Label className="text-sm font-medium min-w-[200px]">Surat Kelulusan Pkn</Label>
                            <Input
                        type="file"
                        className="flex-1"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setFormData({
                              ...formData,
                              suratKelulusanPkn: file
                            });
                          }
                        }}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.bmp,.webp"
                      />
                      {formData.suratKelulusanPkn && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setFormData({
                                    ...formData,
                                    suratKelulusanPkn: null
                                  });
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Clear selected file</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                          </div>

                    {/* Surat Program */}
                    <div className="flex items-center gap-3">
                      <Label className="text-sm font-medium min-w-[200px]">Surat Program</Label>
                            <Input
                              type="file"
                        className="flex-1"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setFormData({
                              ...formData,
                              suratProgram: file
                            });
                          }
                        }}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.bmp,.webp"
                      />
                      {formData.suratProgram && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setFormData({
                                    ...formData,
                                    suratProgram: null
                                  });
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Clear selected file</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                          </div>

                    {/* Surat Exco */}
                    <div className="flex items-center gap-3">
                      <Label className="text-sm font-medium min-w-[200px]">Surat Exco</Label>
                      <Input
                        type="file"
                        className="flex-1"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setFormData({
                              ...formData,
                              suratExco: file
                            });
                          }
                        }}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.bmp,.webp"
                      />
                      {formData.suratExco && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setFormData({
                                    ...formData,
                                    suratExco: null
                                  });
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Clear selected file</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                          </div>

                    {/* Penyata Akaun Bank */}
                    <div className="flex items-center gap-3">
                      <Label className="text-sm font-medium min-w-[200px]">Penyata Akaun Bank</Label>
                      <Input
                        type="file"
                        className="flex-1"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setFormData({
                              ...formData,
                              penyataAkaunBank: file
                            });
                          }
                        }}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.bmp,.webp"
                      />
                      {formData.penyataAkaunBank && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setFormData({
                                    ...formData,
                                    penyataAkaunBank: null
                                  });
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Clear selected file</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                  </div>
                  
                    {/* Borang Daftar Kod */}
                    <div className="flex items-center gap-3">
                      <Label className="text-sm font-medium min-w-[200px]">Borang Daftar Kod</Label>
                      <Input
                        type="file"
                        className="flex-1"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setFormData({
                              ...formData,
                              borangDaftarKod: file
                            });
                          }
                        }}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.bmp,.webp"
                      />
                      {formData.borangDaftarKod && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setFormData({
                                    ...formData,
                                    borangDaftarKod: null
                                  });
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Clear selected file</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                        </div>

                    {/* Custom Documents */}
                    {customDocuments.map((doc, index) => (
                      <div key={doc.id} className="flex items-center gap-3">
                        <div className="min-w-[200px]">
                          <Input
                            placeholder="Document name"
                            value={doc.documentName}
                            onChange={(e) => updateCustomDocument(doc.id, 'documentName', e.target.value)}
                            className={doc.file && !doc.documentName.trim() ? 'border-orange-400' : ''}
                          />
                          {doc.file && !doc.documentName.trim() && (
                            <p className="text-xs text-orange-600 mt-1">Document name required</p>
                          )}
                        </div>
                        <div className="flex-1">
                          <Input
                            type="file"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                updateCustomDocument(doc.id, 'file', file);
                              }
                            }}
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.bmp,.webp"
                          />
                          {doc.file && (
                            <p className="text-xs text-gray-600 mt-1 truncate">{doc.file.name}</p>
                          )}
                        </div>
                        {doc.file && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateCustomDocument(doc.id, 'file', null)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Clear selected file</p>
                            </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeCustomDocument(doc.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}

                    {/* Add More Button */}
                    <div className="flex justify-center mt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addCustomDocument}
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add More Document
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Budget Summary for EXCO Users */}
                {user?.role === 'exco_user' && userBudgetInfo && formData.budget && (
                  <div className="border-t pt-4 mt-4">
                    <div className="text-sm text-gray-600 mb-2">{t('budget.summary')}:</div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">{t('budget.program_budget')}:</span>
                        <span className="ml-2 font-medium">
                          RM {parseFloat(formData.budget).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">{t('budget.remaining_budget')}:</span>
                        <span className="ml-2 font-medium">
                          RM {userBudgetInfo.remaining_budget?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-600">{t('budget.after_this_program')}:</span>
                        <span className={`ml-2 font-medium ${parseFloat(formData.budget) > userBudgetInfo.remaining_budget ? 'text-red-600' : 'text-green-600'}`}>
                          RM {(userBudgetInfo.remaining_budget - parseFloat(formData.budget)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {t('budget.remaining_after_program')}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>{t('common.cancel')}</Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Cancel program creation</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          onClick={handleAddProgram}
                          disabled={user?.role === 'exco_user' && userBudgetInfo?.remaining_budget && parseFloat(formData.budget) > userBudgetInfo.remaining_budget}
                        >
                          {t('programs.create_program')}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {user?.role === 'exco_user' && userBudgetInfo?.remaining_budget && parseFloat(formData.budget) > userBudgetInfo.remaining_budget ? (
                          <p>{t('budget.cannot_create')}</p>
                        ) : (
                          <p>{t('budget.create_program')}</p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* EXCO Users Table (default view) */}
      {user?.role !== 'exco_user' && !selectedExcoUser && (
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>{t('exco.users.budgets')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <ExcoUserBudgetTable
                users={excoUsers}
                userRole={user?.role || ''}
                showViewButton={true}
                onViewUser={(excoUser) => {
                  setSelectedExcoUser(excoUser);
                  fetchProgramsForUser(excoUser.id);
                  fetchUserBudget(excoUser.id);
                }}
                onBudgetChange={handleBudgetChange}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Programs Table for selected user */}
      {selectedExcoUser && (
        <>
          <div className="flex items-center gap-4 mb-4">
            {user?.role !== 'exco_user' && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                                    <Button variant="outline" onClick={() => {
                  setSelectedExcoUser(null);
                  setUserBudgetInfo(null);
                }}>
                  &larr; {t('exco.users.back_to_exco_users')}
                </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Return to EXCO users list</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <h2 className="text-2xl font-semibold">{t('programs.title')} for {selectedExcoUser.name}</h2>
          </div>
          
          {/* Budget Summary for EXCO Users */}
          {user?.role === 'exco_user' && userBudgetInfo && (
            <Card className="mb-4">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      RM {userBudgetInfo.total_budget?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                    </div>
                    <div className="text-sm text-gray-600">{t('budget.total_budget')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      RM {userBudgetInfo.remaining_budget?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                    </div>
                    <div className="text-sm text-gray-600">{t('budget.remaining_budget')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      RM {userBudgetInfo.allocated_budget?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                    </div>
                    <div className="text-sm text-gray-600">{t('budget.allocated_programs')}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>{t('programs.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              {/* ... existing filters ... */}
              <div className="mb-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder={t('status.filter_by_status')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('status.all_status')}</SelectItem>
                    {isFinanceRole && (
                      <>
                        <SelectItem value="under_review">{t('status.under_review')}</SelectItem>
                        <SelectItem value="query">{t('status.query')}</SelectItem>
                        <SelectItem value="query_answered">{t('status.query_answered')}</SelectItem>
                        <SelectItem value="complete_can_send_to_mmk">{t('status.complete_can_send_to_mmk')}</SelectItem>
                        <SelectItem value="under_review_by_mmk">{t('status.under_review_by_mmk')}</SelectItem>
                        <SelectItem value="document_accepted_by_mmk">{t('status.document_accepted_by_mmk')}</SelectItem>
                        <SelectItem value="payment_in_progress">{t('status.payment_in_progress')}</SelectItem>
                        <SelectItem value="payment_completed">{t('status.payment_completed')}</SelectItem>
                        <SelectItem value="rejected">{t('status.rejected')}</SelectItem>
                      </>
                    )}
                    {!isFinanceRole && (
                      <>
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
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              {/* ... programs table ... */}
              <div className="rounded-md border overflow-x-auto">
                <Table className="min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">No.</TableHead>
                      <TableHead className="w-1/6">{t('programs.program_name')}</TableHead>
                      <TableHead className="w-1/12">{t('programs.budget_rm')}</TableHead>
                      <TableHead className="w-1/8">{t('programs.recipient_name')}</TableHead>
                      <TableHead className="w-1/8">{t('programs.exco_letter_ref')}</TableHead>
                      <TableHead className="w-1/8">{t('programs.status')}</TableHead>
                      <TableHead className="w-1/8">{t('status.voucher_no')}</TableHead>
                      <TableHead className="w-1/8">{t('status.eft_no')}</TableHead>
                      <TableHead className="w-1/8">EFT Date</TableHead>
                      <TableHead className="w-1/6">{t('programs.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentPrograms.map((program, index) => (
                      <>
                        <TableRow key={program.id} className="bg-gray-50">
                          <TableCell className="text-center font-medium">
                            {indexOfFirstProgram + index + 1}
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => {
                                        setSelectedProgram(program);
                                        setActiveDocumentTab('original');
                                        setIsViewDetailsModalOpen(true);
                                      }}
                                      className="h-6 w-6 p-0"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>View program details and documents</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <span>{program.program_name || program.programName}</span>
                            </div>
                          </TableCell>
                          <TableCell>{program.budget}</TableCell>
                          <TableCell>{program.recipient_name || program.recipientName}</TableCell>
                          <TableCell className="text-xs">{program.exco_letter_ref || program.excoLetterRef || '-'}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(program.status || '')}>
                              {t(getStatusLabel(program.status || ''))}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">{program.voucher_number || program.voucherNumber || '-'}</TableCell>
                          <TableCell className="text-xs">{program.eft_number || program.eftNumber || '-'}</TableCell>
                          <TableCell className="text-xs">
                            {program.eft_date ? new Date(program.eft_date).toLocaleDateString('en-MY') : '-'}
                          </TableCell>
                          <TableCell>
                          <div className="flex gap-2">
                            {/* EXCO user: always show remarks/details button */}
                            {user?.role === 'exco_user' && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedProgram(program);
                                        setIsDetailsModalOpen(true);
                                      }}
                                    >
                                      <MessageSquare className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>View remarks and program details</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            
                            {/* Super Admin and Finance Officer: only show remarks/details button, no other actions */}
                            {(user?.role === 'super_admin' || user?.role === 'finance_officer') && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedProgram(program);
                                        setIsDetailsModalOpen(true);
                                      }}
                                    >
                                      <MessageSquare className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>View remarks and program details</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            
                            {/* Finance MMK Role Actions - Keep existing functionality */}
                            {user?.role === 'finance_mmk' && (program.status === 'query') && (
                              <>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => {
                                          setSelectedProgram(program);
                                          setActiveDocumentTab('original');
                                          setIsDocumentsModalOpen(true);
                                        }}
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>View program documents</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => {
                                          setSelectedProgram(program);
                                          setIsDetailsModalOpen(true);
                                        }}
                                      >
                                        <MessageSquare className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>View remarks and program details</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => {
                                          setSelectedProgram(program);
                                          // Find the current query for this program
                                          try {
                                            const currentQuery = program.queries && Array.isArray(program.queries) 
                                              ? program.queries.find((q: any) => q && !q.answered)
                                              : null;
                                            if (currentQuery && currentQuery.question) {
                                              setSelectedQuery(currentQuery);
                                              setIsViewQueryModalOpen(true);
                                            } else {
                                          setIsQueryModalOpen(true);
                                            }
                                          } catch (error) {
                                            console.error('Error handling query button:', error);
                                            setIsQueryModalOpen(true);
                                          }
                                        }}
                                      >
                                        <HelpCircle className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>View or submit query</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </>
                            )}
                            {user?.role === 'finance_mmk' && (program.status === 'query_answered') && (
                              <>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => {
                                          setSelectedProgram(program);
                                          setActiveDocumentTab('original');
                                          setIsDocumentsModalOpen(true);
                                        }}
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>View program documents</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => {
                                          setSelectedProgram(program);
                                          setIsDetailsModalOpen(true);
                                        }}
                                      >
                                        <MessageSquare className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>View remarks and program details</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => {
                                          setSelectedProgram(program);
                                          setIsQueryModalOpen(true);
                                        }}
                                      >
                                        <HelpCircle className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Submit new query</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => {
                                          setProgramToCompleteSendToMMK(program);
                                          setIsCompleteSendToMMKModalOpen(true);
                                        }}
                                      >
                                        <Send className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Complete and send to MMK</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </>
                            )}
                            {user?.role === 'finance_mmk' && (program.status === 'under_review') && (
                              <>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => {
                                          setSelectedProgram(program);
                                          setActiveDocumentTab('original');
                                          setIsDocumentsModalOpen(true);
                                        }}
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>View program documents</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => {
                                          setSelectedProgram(program);
                                          setIsDetailsModalOpen(true);
                                        }}
                                      >
                                        <MessageSquare className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>View remarks and program details</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => {
                                          setSelectedProgram(program);
                                          setIsQueryModalOpen(true);
                                        }}
                                      >
                                        <HelpCircle className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Submit query</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => {
                                          setProgramToCompleteSendToMMK(program);
                                          setIsCompleteSendToMMKModalOpen(true);
                                        }}
                                      >
                                        <Check className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Mark as complete and ready for MMK</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => {
                                          setProgramToReject(program);
                                          setIsRejectConfirmModalOpen(true);
                                        }}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Reject program</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </>
                            )}
                            {user?.role === 'finance_mmk' && (program.status === 'complete_can_send_to_mmk') && (
                              <>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => {
                                          setSelectedProgram(program);
                                          setActiveDocumentTab('original');
                                          setIsDocumentsModalOpen(true);
                                        }}
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>View program documents</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => {
                                          setSelectedProgram(program);
                                          setIsDetailsModalOpen(true);
                                        }}
                                      >
                                        <MessageSquare className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>View remarks and program details</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => {
                                          setProgramToSubmitToMMK(program);
                                          setIsSubmitToMMKModalOpen(true);
                                        }}
                                      >
                                        <Send className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Submit to MMK office</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </>
                            )}
                            {user?.role === 'finance_mmk' && (program.status === 'under_review_by_mmk') && (
                              <>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => {
                                          setSelectedProgram(program);
                                          setActiveDocumentTab('original');
                                          setIsDocumentsModalOpen(true);
                                        }}
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>View program documents</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => {
                                          setSelectedProgram(program);
                                          setIsDetailsModalOpen(true);
                                        }}
                                      >
                                        <MessageSquare className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>View remarks and program details</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => {
                                          setProgramToApproveByMMK(program);
                                          setIsApproveByMMKModalOpen(true);
                                        }}
                                      >
                                        <Check className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Accept document</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => {
                                          setProgramToReject(program);
                                          setIsRejectConfirmModalOpen(true);
                                        }}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Reject program</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </>
                            )}
                            {user?.role === 'finance_mmk' && (program.status === 'document_accepted_by_mmk') && (
                              <>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => {
                                          setSelectedProgram(program);
                                          setActiveDocumentTab('original');
                                          setIsDocumentsModalOpen(true);
                                        }}
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>View program documents</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => {
                                          setSelectedProgram(program);
                                          setIsDetailsModalOpen(true);
                                        }}
                                      >
                                        <MessageSquare className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>View remarks and program details</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => {
                                          setProgramToStartPayment(program);
                                          setIsStartPaymentModalOpen(true);
                                        }}
                                      >
                                        <Send className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Start payment process</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </>
                            )}
                            {user?.role === 'finance_mmk' && (program.status === 'payment_in_progress') && (
                              <>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => {
                                          setSelectedProgram(program);
                                          setActiveDocumentTab('original');
                                          setIsDocumentsModalOpen(true);
                                        }}
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>View program documents</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => {
                                          setSelectedProgram(program);
                                          setIsDetailsModalOpen(true);
                                        }}
                                      >
                                        <MessageSquare className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>View remarks and program details</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => {
                                          setProgramToCompletePayment(program);
                                          setIsCompletePaymentModalOpen(true);
                                        }}
                                      >
                                        <Check className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Complete payment</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </>
                            )}
                            {user?.role === 'finance_mmk' && (program.status === 'payment_completed') && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => {
                                        setSelectedProgram(program);
                                        setActiveDocumentTab('original');
                                        setIsDocumentsModalOpen(true);
                                      }}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>View program documents</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            {user?.role === 'finance_mmk' && (program.status === 'rejected') && (
                              <>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => {
                                        setSelectedProgram(program);
                                        setActiveDocumentTab('original');
                                        setIsDocumentsModalOpen(true);
                                      }}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>View program documents</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => {
                                          setSelectedProgram(program);
                                          setIsDetailsModalOpen(true);
                                        }}
                                      >
                                        <MessageSquare className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>View remarks and program details</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </>
                            )}
                            {canCreateProgram && (program.status || program.status) === 'draft' && (
                              <>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => {
                                          setSelectedProgram(program);
                                          const existingDocuments = mapDocumentsToFormData(program);
                                          
                                          setEditFormData({
                                            programName: program.program_name || program.programName,
                                            budget: program.budget?.toString() || '',
                                            recipientName: program.recipient_name || program.recipientName,
                                            excoLetterRef: program.exco_letter_ref || program.excoLetterRef,
                                            suratAkuanPusatKhidmat: null,
                                            suratKelulusanPkn: null,
                                            suratProgram: null,
                                            suratExco: null,
                                            penyataAkaunBank: null,
                                            borangDaftarKod: null,
                                            ...existingDocuments
                                          });
                                          // Fetch and display existing custom documents
                                          const existingCustomDocs = fetchExistingCustomDocuments(program);
                                          setEditCustomDocuments(existingCustomDocs);
                                          setIsEditModalOpen(true);
                                        }}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Edit program details</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => {
                                          setProgramToSubmit(program);
                                          setIsSubmitConfirmModalOpen(true);
                                        }}
                                      >
                                        <Send className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Mark as complete and ready for MMK</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => {
                                          setProgramToDelete(program);
                                          setIsDeleteProgramModalOpen(true);
                                        }}
                                      >
                                        <Trash className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Delete program</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                      
                      {/* Status Timeline Row for EXCO Users, Finance Officers, Finance MMK, and Super Admins */}
                      {(user?.role === 'exco_user' || user?.role === 'finance_officer' || user?.role === 'finance_mmk' || user?.role === 'super_admin') && (
                        <TableRow className="border-t-0">
                          <TableCell colSpan={10} className="p-0 border-t-0">
                            <StatusTimeline program={program} />
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                </TableBody>
                </Table>
                
                {/* Pagination Controls for EXCO Users, Finance Officers, Finance MMK, and Super Admins */}
                {(user?.role === 'exco_user' || user?.role === 'finance_officer' || user?.role === 'finance_mmk' || user?.role === 'super_admin') && totalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Showing {indexOfFirstProgram + 1} to {indexOfFirstProgram + currentPrograms.length} of {filteredPrograms.length} programs
                    </div>
                    <div className="flex items-center space-x-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                              disabled={currentPage === 1}
                            >
                              Previous
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Go to previous page</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className="w-8 h-8 p-0"
                          >
                            {page}
                          </Button>
                        ))}
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                              disabled={currentPage === totalPages}
                            >
                              Next
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Go to next page</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Documents Modal */}
      <Dialog open={isDocumentsModalOpen} onOpenChange={setIsDocumentsModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Documents - {selectedProgram?.program_name || selectedProgram?.programName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">


            {/* Tabs */}
            <div className="border-b">
              <div className="flex space-x-8">
                <button
                  onClick={() => setActiveDocumentTab('original')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeDocumentTab === 'original'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Original Documents
                  {selectedProgram?.documents && (
                    <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                      {selectedProgram.documents.filter((doc: any) => doc.document_type === 'original' || !doc.document_type).length}
                    </span>
                  )}
                </button>
                
              </div>
            </div>

            {/* Original Documents Tab */}
            {activeDocumentTab === 'original' && (
            <div>
                {selectedProgram?.documents && selectedProgram.documents.filter((doc: any) => doc.document_type === 'original' || !doc.document_type).length > 0 ? (
                  selectedProgram.documents
                    .filter((doc: any) => doc.document_type === 'original' || !doc.document_type)
                    .map((doc: any) => {
                      const isImage = doc.original_name && /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(doc.original_name);
                      
                      return (
                        <div key={doc.id} className="flex items-center gap-2 p-2 border rounded mb-2">
                    <FileText className="h-4 w-4" />
                          <div className="flex-1">
                            <span className="font-medium">{doc.original_name}</span>
                            {doc.uploaded_by && (
                              <p className="text-xs text-gray-500">Uploaded by: {doc.uploaded_by}</p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            {isImage && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      onClick={async () => {
                                        try {
                                          const result = await viewDocument(doc.id, doc.original_name);
                                          toast({
                                            title: "Success",
                                            description: "Image opened in new tab",
                                          });
                                        } catch (error) {
                                          console.error('View error:', error);
                                          toast({
                                            title: "Error",
                                            description: "Failed to view image. Please try again.",
                                            variant: "destructive",
                                          });
                                        }
                                      }}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>View image in new tab</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={async () => {
                                      try {
                                        await downloadDocument(doc.id, doc.original_name);
                                        toast({
                                          title: "Success",
                                          description: "Document downloaded successfully",
                                        });
                                      } catch (error) {
                                        console.error('Download error:', error);
                                        toast({
                                          title: "Error",
                                          description: "Failed to download document. Please try again.",
                                          variant: "destructive",
                                        });
                                      }
                                    }}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Download document</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                      setSelectedDocumentForHistory(doc);
                                      setIsDocumentHistoryModalOpen(true);
                                    }}
                                  >
                                    <History className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>View document history</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                      );
                    })
              ) : (
                  <p className="text-muted-foreground">No original documents uploaded yet.</p>
              )}
            </div>
            )}


            
            {selectedProgram?.signedDocuments && selectedProgram.signedDocuments.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Signed Documents</h4>
                {selectedProgram.signedDocuments.map((doc: Document) => (
                  <div key={doc.id} className="flex items-center gap-2 p-2 border rounded">
                    <FileText className="h-4 w-4" />
                    <span>{doc.name}</span>
                    <Button variant="outline" size="sm" className="ml-auto">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>



      {/* Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Program Details - {selectedProgram?.program_name || selectedProgram?.programName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Budget</Label>
                <p className="font-medium">RM {selectedProgram?.budget || selectedProgram?.budget}</p>
              </div>
              <div>
                <Label>Recipient</Label>
                <p className="font-medium">{selectedProgram?.recipient_name || selectedProgram?.recipientName}</p>
              </div>
              <div>
                <Label>Letter Reference</Label>
                <p className="font-medium">{selectedProgram?.exco_letter_ref || selectedProgram?.excoLetterRef}</p>
              </div>
              <div>
                <Label>Status</Label>
                <Badge className={getStatusColor(selectedProgram?.status || '')}>
                  {t(getStatusLabel(selectedProgram?.status || ''))}
                </Badge>
              </div>
            </div>

            <div>
              <Label>Remarks</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {selectedProgram?.remarks?.map((remark: any) => (
                  <div key={remark.id} className="p-2 border rounded bg-muted">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-blue-600">{remark.created_by || remark.createdBy}</span>
                    </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(remark.created_at || remark.createdAt).toLocaleDateString()} at {new Date(remark.created_at || remark.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                    <p className="text-sm">{remark.remark || remark.message}</p>
                  </div>
                ))}
              </div>
              
              <div className="mt-4">
                <Textarea
                  placeholder="Add a remark..."
                  value={newRemark}
                  onChange={(e) => setNewRemark(e.target.value)}
                />
                                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          className="mt-2" 
                          onClick={async () => {
                            if (newRemark.trim() && selectedProgram) {
                              const res = await addRemark(selectedProgram.id, newRemark, user?.fullName || user?.full_name || '', user?.role || '');
                              if (res.success) {
                                toast({ title: "Success", description: "Remark added" });
                                  // Refresh programs - use user-specific fetch for exco_user
                                  if (user?.role === 'exco_user') {
                                    fetchProgramsForUser(user.id);
                                  } else if (selectedExcoUser) {
                                    fetchProgramsForUser(selectedExcoUser.id);
                                  } else {
                                getPrograms().then(res => {
                                  if (res.success && res.programs) setPrograms(res.programs);
                                });
                                  }
                                setNewRemark('');
                                setSelectedProgram({
                                  ...selectedProgram,
                                  remarks: [...selectedProgram.remarks, {
                                    id: Date.now().toString(),
                                    message: newRemark,
                                    createdBy: user?.fullName || '',
                                    createdAt: new Date().toISOString().split('T')[0],
                                    role: user?.role || ''
                                  }]
                                });
                              } else {
                                toast({ title: "Error", description: res.message || "Failed to add remark", variant: "destructive" });
                              }
                            }
                          }}
                        >
                          Add Remark
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Add a new remark to the program</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Program Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Edit Program</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto max-h-[calc(85vh-140px)] pr-4 pb-4 custom-scrollbar">
            <div>
              <Label htmlFor="edit-program-name">Program Name</Label>
              <Input
                id="edit-program-name"
                value={editFormData.programName}
                onChange={(e) => setEditFormData({...editFormData, programName: e.target.value})}
                placeholder="Enter program name"
              />
            </div>
            <div>
              <Label htmlFor="edit-budget">Budget (RM)</Label>
              <Input
                id="edit-budget"
                type="number"
                value={editFormData.budget}
                onChange={(e) => setEditFormData({...editFormData, budget: e.target.value})}
                placeholder="Enter budget amount"
              />
            </div>
            <div>
              <Label htmlFor="edit-recipient">Recipient Name</Label>
              <Input
                id="edit-recipient"
                value={editFormData.recipientName}
                onChange={(e) => setEditFormData({...editFormData, recipientName: e.target.value})}
                placeholder="Enter recipient name"
              />
            </div>
            <div>
              <Label htmlFor="edit-letter-ref">EXCO Letter Reference</Label>
              <Input
                id="edit-letter-ref"
                value={editFormData.excoLetterRef}
                onChange={(e) => setEditFormData({...editFormData, excoLetterRef: e.target.value})}
                placeholder="Enter letter reference"
              />
            </div>

            {/* Document Management Section */}
            <div className="border rounded-lg p-4">
              <Label className="text-base font-semibold mb-3">Documents</Label>
              
              <div className="space-y-3">
                {/* Surat Akuan Pusat Khidmat */}
                <div className="flex items-center gap-3">
                  <Label className="text-sm font-medium min-w-[200px]">Surat Akuan Pusat Khidmat</Label>
                  <div className="flex-1">
                    {editFormData.suratAkuanPusatKhidmat && typeof editFormData.suratAkuanPusatKhidmat === 'object' && 'id' in editFormData.suratAkuanPusatKhidmat ? (
                      // Existing document
                      <div className="flex items-center gap-2 p-2 border rounded bg-gray-50">
                          <FileText className="h-4 w-4" />
                        <span className="flex-1 text-sm">{editFormData.suratAkuanPusatKhidmat.original_name || editFormData.suratAkuanPusatKhidmat.name}</span>
                          <div className="flex gap-1">
                                                          <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={async () => {
                                      try {
                                    await downloadDocument(editFormData.suratAkuanPusatKhidmat.id, editFormData.suratAkuanPusatKhidmat.original_name || editFormData.suratAkuanPusatKhidmat.name);
                                    toast({ title: "Success", description: "Document downloaded successfully" });
                                      } catch (error) {
                                    toast({ title: "Error", description: "Failed to download document", variant: "destructive" });
                                      }
                                    }}
                                  >
                                <Download className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Download document</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    deleteDocumentFromProgram(editFormData.suratAkuanPusatKhidmat.id);
                                    setEditFormData({
                                      ...editFormData,
                                      suratAkuanPusatKhidmat: null
                                    });
                                  }}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Delete document</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    ) : (
                      // New file upload
                      <Input
                        type="file"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setEditFormData({
                              ...editFormData,
                              suratAkuanPusatKhidmat: file
                            });
                          }
                        }}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.bmp,.webp"
                      />
                    )}
                  </div>
                                        {editFormData.suratAkuanPusatKhidmat && typeof editFormData.suratAkuanPusatKhidmat === 'object' && !('id' in editFormData.suratAkuanPusatKhidmat) && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditFormData({
                                    ...editFormData,
                                    suratAkuanPusatKhidmat: null
                                  });
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Clear selected file</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                </div>

                {/* Surat Kelulusan Pkn */}
                <div className="flex items-center gap-3">
                  <Label className="text-sm font-medium min-w-[200px]">Surat Kelulusan Pkn</Label>
                  <div className="flex-1">
                    {editFormData.suratKelulusanPkn && typeof editFormData.suratKelulusanPkn === 'object' && 'id' in editFormData.suratKelulusanPkn ? (
                      // Existing document
                      <div className="flex items-center gap-2 p-2 border rounded bg-gray-50">
                        <FileText className="h-4 w-4" />
                        <span className="flex-1 text-sm">{editFormData.suratKelulusanPkn.original_name || editFormData.suratKelulusanPkn.name}</span>
                        <div className="flex gap-1">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={async () => {
                                try {
                                await downloadDocument(editFormData.suratKelulusanPkn.id, editFormData.suratKelulusanPkn.original_name || editFormData.suratKelulusanPkn.name);
                                  toast({ title: "Success", description: "Document downloaded successfully" });
                                } catch (error) {
                                  toast({ title: "Error", description: "Failed to download document", variant: "destructive" });
                                }
                              }}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                            onClick={() => {
                              deleteDocumentFromProgram(editFormData.suratKelulusanPkn.id);
                              setEditFormData({
                                ...editFormData,
                                suratKelulusanPkn: null
                              });
                            }}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                    ) : (
                      // New file upload
                      <Input
                        type="file"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setEditFormData({
                              ...editFormData,
                              suratKelulusanPkn: file
                            });
                          }
                        }}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.bmp,.webp"
                      />
                    )}
                  </div>
                  {editFormData.suratKelulusanPkn && typeof editFormData.suratKelulusanPkn === 'object' && !('id' in editFormData.suratKelulusanPkn) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditFormData({
                          ...editFormData,
                          suratKelulusanPkn: null
                        });
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Surat Program */}
                <div className="flex items-center gap-3">
                  <Label className="text-sm font-medium min-w-[200px]">Surat Program</Label>
                  <div className="flex-1">
                    {editFormData.suratProgram && typeof editFormData.suratProgram === 'object' && 'id' in editFormData.suratProgram ? (
                      // Existing document
                      <div className="flex items-center gap-2 p-2 border rounded bg-gray-50">
                        <FileText className="h-4 w-4" />
                        <span className="flex-1 text-sm">{editFormData.suratProgram.original_name || editFormData.suratProgram.name}</span>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                await downloadDocument(editFormData.suratProgram.id, editFormData.suratProgram.original_name || editFormData.suratProgram.name);
                                toast({ title: "Success", description: "Document downloaded successfully" });
                              } catch (error) {
                                toast({ title: "Error", description: "Failed to download document", variant: "destructive" });
                              }
                            }}
                          >
                            <Download className="h-4 w-4" />
                      </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              deleteDocumentFromProgram(editFormData.suratProgram.id);
                              setEditFormData({
                                ...editFormData,
                                suratProgram: null
                              });
                            }}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // New file upload
                          <Input
                            type="file"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setEditFormData({
                              ...editFormData,
                              suratProgram: file
                            });
                          }
                        }}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.bmp,.webp"
                      />
                    )}
                        </div>
                  {editFormData.suratProgram && typeof editFormData.suratProgram === 'object' && !('id' in editFormData.suratProgram) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditFormData({
                          ...editFormData,
                          suratProgram: null
                        });
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                        </div>

                {/* Surat Exco */}
                <div className="flex items-center gap-3">
                  <Label className="text-sm font-medium min-w-[200px]">Surat Exco</Label>
                  <div className="flex-1">
                    {editFormData.suratExco && typeof editFormData.suratExco === 'object' && 'id' in editFormData.suratExco ? (
                      // Existing document
                      <div className="flex items-center gap-2 p-2 border rounded bg-gray-50">
                        <FileText className="h-4 w-4" />
                        <span className="flex-1 text-sm">{editFormData.suratExco.original_name || editFormData.suratExco.name}</span>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                await downloadDocument(editFormData.suratExco.id, editFormData.suratExco.original_name || editFormData.suratExco.name);
                                toast({ title: "Success", description: "Document downloaded successfully" });
                              } catch (error) {
                                toast({ title: "Error", description: "Failed to download document", variant: "destructive" });
                              }
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              deleteDocumentFromProgram(editFormData.suratExco.id);
                              setEditFormData({
                                ...editFormData,
                                suratExco: null
                              });
                            }}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                      </div>
                </div>
                    ) : (
                      // New file upload
                      <Input
                        type="file"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setEditFormData({
                              ...editFormData,
                              suratExco: file
                            });
                          }
                        }}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.bmp,.webp"
                      />
                    )}
                  </div>
                  {editFormData.suratExco && typeof editFormData.suratExco === 'object' && !('id' in editFormData.suratExco) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditFormData({
                          ...editFormData,
                          suratExco: null
                        });
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Penyata Akaun Bank */}
                <div className="flex items-center gap-3">
                  <Label className="text-sm font-medium min-w-[200px]">Penyata Akaun Bank</Label>
                  <div className="flex-1">
                    {editFormData.penyataAkaunBank && typeof editFormData.penyataAkaunBank === 'object' && 'id' in editFormData.penyataAkaunBank ? (
                      // Existing document
                      <div className="flex items-center gap-2 p-2 border rounded bg-gray-50">
                        <FileText className="h-4 w-4" />
                        <span className="flex-1 text-sm">{editFormData.penyataAkaunBank.original_name || editFormData.penyataAkaunBank.name}</span>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                await downloadDocument(editFormData.penyataAkaunBank.id, editFormData.penyataAkaunBank.original_name || editFormData.penyataAkaunBank.name);
                                toast({ title: "Success", description: "Document downloaded successfully" });
                              } catch (error) {
                                toast({ title: "Error", description: "Failed to download document", variant: "destructive" });
                              }
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              deleteDocumentFromProgram(editFormData.penyataAkaunBank.id);
                              setEditFormData({
                                ...editFormData,
                                penyataAkaunBank: null
                              });
                            }}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // New file upload
                      <Input
                        type="file"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setEditFormData({
                              ...editFormData,
                              penyataAkaunBank: file
                            });
                          }
                        }}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.bmp,.webp"
                      />
                    )}
                  </div>
                  {editFormData.penyataAkaunBank && typeof editFormData.penyataAkaunBank === 'object' && !('id' in editFormData.penyataAkaunBank) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditFormData({
                          ...editFormData,
                          penyataAkaunBank: null
                        });
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Borang Daftar Kod */}
                <div className="flex items-center gap-3">
                  <Label className="text-sm font-medium min-w-[200px]">Borang Daftar Kod</Label>
                  <div className="flex-1">
                    {editFormData.borangDaftarKod && typeof editFormData.borangDaftarKod === 'object' && 'id' in editFormData.borangDaftarKod ? (
                      // Existing document
                      <div className="flex items-center gap-2 p-2 border rounded bg-gray-50">
                        <FileText className="h-4 w-4" />
                        <span className="flex-1 text-sm">{editFormData.borangDaftarKod.original_name || editFormData.borangDaftarKod.name}</span>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                await downloadDocument(editFormData.borangDaftarKod.id, editFormData.borangDaftarKod.original_name || editFormData.borangDaftarKod.name);
                                toast({ title: "Success", description: "Document downloaded successfully" });
                              } catch (error) {
                                toast({ title: "Error", description: "Failed to download document", variant: "destructive" });
                              }
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              deleteDocumentFromProgram(editFormData.borangDaftarKod.id);
                              setEditFormData({
                                ...editFormData,
                                borangDaftarKod: null
                              });
                            }}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // New file upload
                      <Input
                        type="file"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setEditFormData({
                              ...editFormData,
                              borangDaftarKod: file
                            });
                          }
                        }}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.bmp,.webp"
                      />
                    )}
                  </div>
                  {editFormData.borangDaftarKod && typeof editFormData.borangDaftarKod === 'object' && !('id' in editFormData.borangDaftarKod) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditFormData({
                          ...editFormData,
                          borangDaftarKod: null
                        });
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Custom Documents */}
                {editCustomDocuments.map((doc, index) => (
                  <div key={doc.id} className="flex items-center gap-3">
                    <div className="min-w-[200px]">
                      {doc.isExisting ? (
                        <Label className="text-sm font-medium min-w-[200px]">{doc.documentName}</Label>
                      ) : (
                        <>
                          <Input
                            placeholder="Document name"
                            value={doc.documentName}
                            onChange={(e) => updateEditCustomDocument(doc.id, 'documentName', e.target.value)}
                            className={doc.file && !doc.documentName.trim() ? 'border-orange-400' : ''}
                          />
                          {doc.file && !doc.documentName.trim() && (
                            <p className="text-xs text-orange-600 mt-1">Document name required</p>
                          )}
                        </>
                      )}
                    </div>
                    <div className="flex-1">
                      {doc.isExisting ? (
                        // Show existing document info
                        <div className="flex items-center gap-2 p-2 border rounded bg-gray-50">
                          <FileText className="h-4 w-4" />
                          <span className="flex-1 text-sm">{doc.documentName}</span>
                          <div className="flex gap-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={async () => {
                                      try {
                                        await downloadDocument(doc.documentId, doc.documentName);
                                        toast({ title: "Success", description: "Document downloaded successfully" });
                                      } catch (error) {
                                        toast({ title: "Error", description: "Failed to download document", variant: "destructive" });
                                      }
                                    }}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Download document</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      deleteDocumentFromProgram(doc.documentId);
                                      removeEditCustomDocument(doc.id);
                                    }}
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Delete document</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                      ) : (
                        // Show file upload for new custom documents
                        <Input
                          type="file"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              updateEditCustomDocument(doc.id, 'file', file);
                            }
                          }}
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.bmp,.webp"
                        />
                      )}
                    </div>
                    {!doc.isExisting && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeEditCustomDocument(doc.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}

                {/* Add More Button for Edit Mode */}
                <div className="flex justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addEditCustomDocument}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add More Document
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                      Cancel
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Cancel program editing</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={handleEditProgram}>
                      Update Program
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Save program changes</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </DialogContent>
      </Dialog>



      {/* Delete Program Confirmation Modal */}
      <Dialog open={isDeleteProgramModalOpen} onOpenChange={setIsDeleteProgramModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Program</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Are you sure you want to delete the program "{programToDelete?.program_name || programToDelete?.programName}"?</p>
            <p className="text-sm text-muted-foreground">This will permanently delete:</p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>The program and all its data</li>
              <li>All associated documents and files</li>
              <li>All remarks and queries</li>
            </ul>
            <p className="text-sm text-red-600 font-medium">This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsDeleteProgramModalOpen(false);
                  setProgramToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={async () => {
                  try {
                    const response = await deleteProgram(programToDelete.id);
                    if (response.success) {
                      toast({
                        title: "Success",
                        description: "Program deleted successfully",
                      });
                      // Refresh the programs to update the UI
                      if (user?.role === 'exco_user') {
                        fetchProgramsForUser(user.id);
                      } else {
                        const programsResponse = await getPrograms();
                        if (programsResponse.success) {
                          setPrograms(programsResponse.programs);
                        }
                      }
                    } else {
                      toast({
                        title: "Error",
                        description: response.message || "Failed to delete program",
                        variant: "destructive",
                      });
                    }
                  } catch (error) {
                    console.error('Delete program error:', error);
                    toast({
                      title: "Error",
                      description: "Failed to delete program. Please try again.",
                      variant: "destructive",
                    });
                  } finally {
                    setIsDeleteProgramModalOpen(false);
                    setProgramToDelete(null);
                  }
                }}
              >
                Delete Program
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Submit Program Confirmation Modal */}
      <Dialog open={isSubmitConfirmModalOpen} onOpenChange={setIsSubmitConfirmModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Program for Review</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Are you sure you want to submit the program "{programToSubmit?.program_name || programToSubmit?.programName}" for review?</p>

            <p className="text-sm text-muted-foreground">This will:</p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>Change the program status to "Under Review"</li>
              <li>Send the program to Finance for approval</li>
              <li>Lock the program from further editing</li>
            </ul>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsSubmitConfirmModalOpen(false);
                  setProgramToSubmit(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (programToSubmit && programToSubmit.id) {
                    handleSubmitProgram(programToSubmit.id);
                  }
                }}
              >
                Submit for Review
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>



      {/* Submit to MMK Confirmation Modal */}
      <Dialog open={isSubmitToMMKModalOpen} onOpenChange={setIsSubmitToMMKModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit to MMK Office</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Are you sure you want to submit the program "{programToSubmitToMMK?.program_name || programToSubmitToMMK?.programName}" to MMK office for review?</p>
            <p className="text-sm text-muted-foreground">This will change the program status to "Under Review by MMK office".</p>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsSubmitToMMKModalOpen(false);
                  setProgramToSubmitToMMK(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => handleSubmitToMMK(programToSubmitToMMK.id)}
              >
                Submit to MMK
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Approve by MMK Confirmation Modal */}
      <Dialog open={isApproveByMMKModalOpen} onOpenChange={setIsApproveByMMKModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Are you sure you want to accept the document for program "{programToApproveByMMK?.program_name || programToApproveByMMK?.programName}"?</p>
            <p className="text-sm text-muted-foreground">This will change the program status to "Document Accepted by MMK Office".</p>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsApproveByMMKModalOpen(false);
                  setProgramToApproveByMMK(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => handleApproveByMMK(programToApproveByMMK.id)}
              >
                Accept Document
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Start Payment Confirmation Modal */}
      <Dialog open={isStartPaymentModalOpen} onOpenChange={setIsStartPaymentModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Payment Process</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Are you sure you want to start the payment process for program "{programToStartPayment?.program_name || programToStartPayment?.programName}"?</p>
            <p className="text-sm text-muted-foreground">This will change the program status to "Payment in Progress".</p>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsStartPaymentModalOpen(false);
                  setProgramToStartPayment(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => handleStartPayment(programToStartPayment.id)}
              >
                Start Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Complete Payment Modal */}
      <Dialog open={isCompletePaymentModalOpen} onOpenChange={setIsCompletePaymentModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Complete payment for program "{programToCompletePayment?.program_name || programToCompletePayment?.programName}"</p>
            <p className="text-sm text-muted-foreground">Please enter the voucher and EFT numbers to complete the payment.</p>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="voucherNumber">Voucher Number *</Label>
                <Input
                  id="voucherNumber"
                  placeholder="Enter voucher number (e.g., V2024001)"
                  value={voucherNumber}
                  onChange={(e) => setVoucherNumber(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="eftNumber">EFT Number *</Label>
                <Input
                  id="eftNumber"
                  placeholder="Enter EFT number (e.g., EFT2024001)"
                  value={eftNumber}
                  onChange={(e) => setEftNumber(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="eftDate">EFT Date *</Label>
                <Input
                  id="eftDate"
                  type="date"
                  value={eftDate}
                  onChange={(e) => setEftDate(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsCompletePaymentModalOpen(false);
                  setProgramToCompletePayment(null);
                  setVoucherNumber('');
                  setEftNumber('');
                  setEftDate('');
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (!voucherNumber.trim() || !eftNumber.trim() || !eftDate.trim()) {
                    toast({
                      title: "Error",
                      description: "Please enter voucher number, EFT number, and EFT date",
                      variant: "destructive"
                    });
                    return;
                  }
                  handleCompletePayment(programToCompletePayment.id, voucherNumber.trim(), eftNumber.trim(), eftDate.trim());
                  setVoucherNumber('');
                  setEftNumber('');
                  setEftDate('');
                }}
              >
                Complete Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Program Confirmation Modal */}
      <Dialog open={isRejectConfirmModalOpen} onOpenChange={setIsRejectConfirmModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Program</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Are you sure you want to reject the program "{programToReject?.program_name || programToReject?.programName}"?</p>
            <p className="text-sm text-muted-foreground">This will:</p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>Change the program status to "Rejected"</li>
            </ul>
            <p className="text-sm text-red-600 font-medium">The program creator will be notified of the rejection.</p>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsRejectConfirmModalOpen(false);
                  setProgramToReject(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={() => handleRejectProgram(programToReject.id)}
              >
                Reject Program
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Complete & Send to MMK Confirmation Modal */}
      <Dialog open={isCompleteSendToMMKModalOpen} onOpenChange={setIsCompleteSendToMMKModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Program as Complete</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Are you sure you want to mark the program "{programToCompleteSendToMMK?.program_name || programToCompleteSendToMMK?.programName}" as complete and ready for MMK submission?</p>
            <p className="text-sm text-muted-foreground">This will:</p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>Change the program status to "Complete & Can Send to MMK"</li>
              <li>Mark the program as approved and complete</li>
              <li>Enable the next step to submit to MMK office</li>
            </ul>
            <p className="text-sm text-blue-600 font-medium">The program will be marked as complete and ready for MMK office submission.</p>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsCompleteSendToMMKModalOpen(false);
                  setProgramToCompleteSendToMMK(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="default"
                onClick={() => {
                  // Change status to complete_can_send_to_mmk
                  changeProgramStatus(programToCompleteSendToMMK.id, 'complete_can_send_to_mmk').then(res => {
                    if (res.success) {
                      toast({ title: t('common.success'), description: 'Program marked as complete and ready for MMK submission' });
                      // Refresh programs
                      if (user?.role === 'exco_user') {
                        fetchProgramsForUser(user.id);
                      } else if (selectedExcoUser) {
                        fetchProgramsForUser(selectedExcoUser.id);
                      } else {
                        getPrograms().then(res => {
                          if (res.success && res.programs) setPrograms(res.programs);
                        });
                      }
                    } else {
                      toast({ title: t('common.error'), description: res.message || 'Failed to update status', variant: "destructive" });
                    }
                  });
                  setIsCompleteSendToMMKModalOpen(false);
                  setProgramToCompleteSendToMMK(null);
                }}
              >
                Mark as Complete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Query Details Modal */}
      <Dialog open={isQueryDetailsModalOpen} onOpenChange={setIsQueryDetailsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Queries - {selectedQueryDetails?.program_name || selectedQueryDetails?.programName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedQueryDetails && selectedQueryDetails.queries && selectedQueryDetails.queries.length > 0 ? (
              selectedQueryDetails.queries.map((query: any, index: number) => (
                <div key={query.id || index}>
                  <Label>Query Details</Label>
                  <div className="p-4 border rounded bg-muted">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-medium text-sm">Query:</p>
                        <p className="text-sm mt-1">{query.question || query.message || 'No question text available'}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {(query.answered === 1 || query.is_answered) ? 'Answered' : 'Pending'}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <p>Asked by: {query.created_by || 'Unknown'}</p>
                      <p>Date: {query.created_at ? new Date(query.created_at).toLocaleDateString() : 'Unknown'} at {query.created_at ? new Date(query.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Unknown'}</p>
                    </div>
                  </div>
                  
                  {/* Show Answer if available */}
                  {(query.answered === 1 || query.is_answered) && query.answer && (
                    <div className="mt-4">
                      <Label>Answer</Label>
                      <div className="p-3 border rounded bg-green-50 border-l-4 border-green-500">
                        <p className="text-sm">{query.answer}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Answered by: {query.answered_by || 'EXCO User'} on {query.answered_at ? new Date(query.answered_at).toLocaleDateString() : 'Unknown'}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Debug info - remove this later */}
                  <div className="mt-2 text-xs text-gray-400">
                    <p>Debug: answered={query.answered}, is_answered={query.is_answered}, has_answer={!!query.answer}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>No queries found for this program</p>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" onClick={() => {
                      setIsQueryDetailsModalOpen(false);
                      setSelectedQueryDetails(null);
                    }}>
                      Close
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Close query details</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* EFT Details Modal */}
      <Dialog open={isEftDetailsModalOpen} onOpenChange={setIsEftDetailsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>EFT Details - {selectedQueryDetails?.program_name || selectedQueryDetails?.programName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedQueryDetails && (
              <>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-2">
                    Program: {selectedQueryDetails.program_name || selectedQueryDetails.programName}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Budget: RM {(selectedQueryDetails.budget || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>

                {/* EFT Information */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-md border-b pb-2">Payment Information</h4>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label>Voucher Number</Label>
                      <div className="p-3 border rounded bg-muted">
                        <p className="text-sm font-medium">
                          {selectedQueryDetails.voucher_number || selectedQueryDetails.voucherNumber || 'Not available'}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <Label>EFT Number</Label>
                      <div className="p-3 border rounded bg-muted">
                        <p className="text-sm font-medium">
                          {selectedQueryDetails.eft_number || selectedQueryDetails.eftNumber || 'Not available'}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <Label>EFT Date</Label>
                      <div className="p-3 border rounded bg-muted">
                        <p className="text-sm font-medium">
                          {selectedQueryDetails.eft_date ? new Date(selectedQueryDetails.eft_date).toLocaleDateString('en-MY') : 'Not available'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
            
            <div className="flex justify-end gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" onClick={() => {
                      setIsEftDetailsModalOpen(false);
                      setSelectedQueryDetails(null);
                    }}>
                      Close
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Close EFT details</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Details Modal */}
      <Dialog open={isViewDetailsModalOpen} onOpenChange={setIsViewDetailsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Program Details - {selectedProgram?.program_name || selectedProgram?.programName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto max-h-[calc(90vh-120px)] pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {/* Program Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Program Name</Label>
                <p className="font-medium">{selectedProgram?.program_name || selectedProgram?.programName}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Budget (RM)</Label>
                <p className="font-medium">RM {selectedProgram?.budget || selectedProgram?.budget}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Recipient Name</Label>
                <p className="font-medium">{selectedProgram?.recipient_name || selectedProgram?.recipientName}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">EXCO Letter Reference</Label>
                <p className="font-medium">{selectedProgram?.exco_letter_ref || selectedProgram?.excoLetterRef}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                <Badge className={getStatusColor(selectedProgram?.status || '')}>
                  {t(getStatusLabel(selectedProgram?.status || ''))}
                </Badge>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Created By</Label>
                <p className="font-medium">{userMap[selectedProgram?.created_by || selectedProgram?.createdBy] || selectedProgram?.created_by || selectedProgram?.createdBy}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Created Date</Label>
                <p className="font-medium">{new Date(selectedProgram?.created_at || selectedProgram?.createdAt).toLocaleDateString()}</p>
              </div>
              {selectedProgram?.voucher_number && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Voucher Number</Label>
                  <p className="font-medium">{selectedProgram.voucher_number}</p>
                </div>
              )}
              {selectedProgram?.eft_number && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">EFT Number</Label>
                  <p className="font-medium">{selectedProgram.eft_number}</p>
                </div>
              )}
            </div>

            {/* Documents Section */}
            <div>
              <Label className="text-base font-semibold">Documents</Label>
              
              {/* Tabs */}
              <div className="border-b mt-2">
                <div className="flex space-x-8">
                  <button
                    onClick={() => setActiveDocumentTab('original')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeDocumentTab === 'original'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Original Documents
                    {selectedProgram?.documents && (
                      <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                        {selectedProgram.documents.filter((doc: any) => doc.document_type === 'original' || !doc.document_type).length}
                      </span>
                    )}
                  </button>

                </div>
              </div>

              {/* Original Documents Tab */}
              {activeDocumentTab === 'original' && (
                <div className="space-y-2 mt-2">
                  {selectedProgram?.documents && selectedProgram.documents.filter((doc: any) => doc.document_type === 'original' || !doc.document_type).length > 0 ? (
                    <div className="border rounded p-2 space-y-1">
                      {selectedProgram.documents
                        .filter((doc: any) => doc.document_type === 'original' || !doc.document_type)
                        .map((doc: any) => {
                          const isImage = doc.original_name && /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(doc.original_name);
                          return (
                            <div key={doc.id} className="flex items-center gap-2 p-2 border rounded">
                              <FileText className="h-4 w-4" />
                              <div className="flex-1">
                                <span className="font-medium">{doc.original_name || doc.name}</span>
                                {doc.uploaded_by && (
                                  <p className="text-xs text-gray-500">Uploaded by: {doc.uploaded_by}</p>
                                )}
                              </div>
                              <div className="flex gap-1">
                                {isImage && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button 
                                          variant="outline" 
                                          size="sm" 
                                          onClick={async () => {
                                            try {
                                              await viewDocument(doc.id, doc.original_name || doc.name);
                                              toast({ title: "Success", description: "Document opened in new tab" });
                                            } catch (error) {
                                              toast({ title: "Error", description: "Failed to view document", variant: "destructive" });
                                            }
                                          }}
                                        >
                                          <Eye className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>View image in new tab</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={async () => {
                                          try {
                                            await downloadDocument(doc.id, doc.original_name || doc.name);
                                            toast({ title: "Success", description: "Document downloaded successfully" });
                                          } catch (error) {
                                            toast({ title: "Error", description: "Failed to download document", variant: "destructive" });
                                          }
                                        }}
                                      >
                                        <Download className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Download document</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => {
                                          setSelectedDocumentForHistory(doc);
                                          setIsDocumentHistoryModalOpen(true);
                                        }}
                                      >
                                        <History className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>View document history</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No original documents uploaded yet.</p>
                  )}
                </div>
              )}


            </div>

            {/* Queries Section */}
            <div>
              <Label className="text-base font-semibold">Queries</Label>
              <div className="space-y-2">
                {selectedProgram?.queries && selectedProgram.queries.length > 0 ? (
                  <div className="border rounded p-2 space-y-1 max-h-32 overflow-y-auto">
                    {selectedProgram.queries.map((query: any) => (
                      <div key={query.id} className="p-2 border rounded bg-muted">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-blue-600">{query.created_by}</span>
                            <Badge variant={query.answered ? "default" : "secondary"}>
                              {query.answered ? "Answered" : "Pending"}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(query.created_at).toLocaleDateString()} at {new Date(query.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                        <p className="text-sm font-medium">Q: {query.question}</p>
                        {query.answer && (
                          <div className="mt-2 p-2 bg-white rounded border-l-4 border-green-500">
                            <p className="text-sm"><span className="font-medium">A:</span> {query.answer}</p>
                          </div>
                        )}
                        {!query.answered && user?.role === 'exco_user' && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="mt-2"
                                  onClick={() => {
                                    setSelectedQuery(query);
                                    setIsAnswerQueryModalOpen(true);
                                  }}
                                >
                                  Answer Query
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Provide an answer to this query</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No queries yet.</p>
                )}
              </div>
            </div>

            {/* Remarks Section */}
            <div>
              <Label className="text-base font-semibold">Remarks</Label>
              <div className="space-y-2">
                {selectedProgram?.remarks && selectedProgram.remarks.length > 0 ? (
                  <div className="border rounded p-2 space-y-1 max-h-32 overflow-y-auto">
                    {selectedProgram.remarks.map((remark: any) => (
                      <div key={remark.id} className="p-2 border rounded bg-muted">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-blue-600">{remark.created_by || remark.createdBy}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(remark.created_at || remark.createdAt).toLocaleDateString()} at {new Date(remark.created_at || remark.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                        <p className="text-sm">{remark.remark || remark.message}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No remarks yet.</p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" onClick={() => setIsViewDetailsModalOpen(false)}>
                      Close
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Close program details</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Query Modal */}
      <Dialog open={isQueryModalOpen} onOpenChange={setIsQueryModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Query - {selectedProgram?.program_name || selectedProgram?.programName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="query">Query</Label>
              <Textarea
                id="query"
                placeholder="Enter your query about missing documents or any other concerns..."
                value={newQuery}
                onChange={(e) => setNewQuery(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" onClick={() => {
                      setIsQueryModalOpen(false);
                      setNewQuery('');
                    }}>
                      Cancel
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Cancel query submission</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={submitQuery}>
                      Submit Query
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Submit query about the program</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Query Modal */}
      <Dialog open={isViewQueryModalOpen} onOpenChange={setIsViewQueryModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Current Query - {selectedProgram?.program_name || selectedProgram?.programName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedQuery && selectedQuery.question && (
              <div>
                <Label>Query Details</Label>
                <div className="p-4 border rounded bg-muted">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-medium text-sm">Query:</p>
                      <p className="text-sm mt-1">{selectedQuery.question}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Pending
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <p>Asked by: {selectedQuery.created_by || 'Unknown'}</p>
                    <p>Date: {selectedQuery.created_at ? new Date(selectedQuery.created_at).toLocaleDateString() : 'Unknown'} at {selectedQuery.created_at ? new Date(selectedQuery.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Unknown'}</p>
                  </div>
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" onClick={() => {
                      setIsViewQueryModalOpen(false);
                      setSelectedQuery(null);
                    }}>
                      Close
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Close query details</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Answer Query Modal */}
      <Dialog open={isAnswerQueryModalOpen} onOpenChange={setIsAnswerQueryModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Answer Query</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedQuery && selectedQuery.question && (
              <div>
                <Label>Original Query</Label>
                <div className="p-3 border rounded bg-muted">
                  <p className="text-sm">{selectedQuery.question}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Asked by: {selectedQuery.created_by || 'Unknown'} on {selectedQuery.created_at ? new Date(selectedQuery.created_at).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
              </div>
            )}
            <div>
              <Label htmlFor="answer">Answer</Label>
              <Textarea
                id="answer"
                placeholder="Enter your answer to the query..."
                value={queryAnswer}
                onChange={(e) => setQueryAnswer(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" onClick={() => {
                      setIsAnswerQueryModalOpen(false);
                      setQueryAnswer('');
                      setSelectedQuery(null);
                    }}>
                      Cancel
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Cancel answer submission</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={handleAnswerQuery}>
                      Submit Answer
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Submit answer to the query</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Document History Modal */}
      <DocumentHistoryModal
        isOpen={isDocumentHistoryModalOpen}
        onClose={() => setIsDocumentHistoryModalOpen(false)}
        documentId={selectedDocumentForHistory?.id}
        programId={selectedProgram?.id}
        currentDocumentName={selectedDocumentForHistory?.original_name || selectedDocumentForHistory?.name}
      />
    </div>
  );
}