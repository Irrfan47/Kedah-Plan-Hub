import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { MessageSquare, Edit, Eye, FileText, Download, Upload, HelpCircle, X, Plus, History } from '@/lib/icons';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { getPrograms, getQueries, downloadDocument, viewDocument, answerQuery, uploadDocument, deleteDocument, updateProgram, createQuery, getUsers, BASE_URL, replaceDocument } from '../api/backend';
import DocumentHistoryModal from '@/components/DocumentHistoryModal';

const getStatusColor = (status?: string) => {
  const colors = {
    query: 'bg-orange-100 text-orange-800',
    query_answered: 'bg-purple-100 text-purple-800',
    payment_completed: 'bg-green-100 text-green-800',
    draft: 'bg-gray-100 text-gray-800',
    under_review: 'bg-blue-100 text-blue-800',
    rejected: 'bg-red-100 text-red-800',
  };
  return colors[status as keyof typeof colors] || colors.draft;
};

export default function Query() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [programs, setPrograms] = useState<any[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<any | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isViewDetailsModalOpen, setIsViewDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDocumentsModalOpen, setIsDocumentsModalOpen] = useState(false);
  const [isQueryModalOpen, setIsQueryModalOpen] = useState(false);
  const [isDocumentHistoryModalOpen, setIsDocumentHistoryModalOpen] = useState(false);
  const [selectedDocumentForHistory, setSelectedDocumentForHistory] = useState<any>(null);
  const [queryAnswers, setQueryAnswers] = useState<Record<string, string>>({});
  const [activeDocumentTab, setActiveDocumentTab] = useState<'original' | 'finance'>('original');
  const [newQuery, setNewQuery] = useState('');
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
  const [userMap, setUserMap] = useState<{ [id: string]: string }>({});
  const [editCustomDocuments, setEditCustomDocuments] = useState<any[]>([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [currentHistoryPage, setCurrentHistoryPage] = useState(1);
  const itemsPerPage = 5;

  // Custom document functions for edit mode
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
    try {
      // Safety checks
      if (!program || !program.documents || !Array.isArray(program.documents)) {
        console.log('No documents found or invalid program structure:', program);
        return [];
      }
      
      // Define the 6 predefined document names to filter out (both full names and abbreviated types)
      const predefinedNames = [
        'Surat Akuan Pusat Khidmat',
        'Surat Kelulusan Pkn', 
        'Surat Program',
        'Surat Exco',
        'Penyata Akaun Bank',
        'Borang Daftar Kod'
      ];
      
      // Define the abbreviated document types used when uploading
      const predefinedTypes = [
        'surat_akuan',
        'surat_kelulusan',
        'surat_program',
        'surat_exco',
        'penyata_akaun',
        'borang_daftar'
      ];
      
      // Filter documents that are NOT in the predefined list
      const customDocs = program.documents
        .filter((doc: any) => {
          try {
            if (!doc || typeof doc !== 'object') return false;
            
            // Check document_type first - if it matches predefined names or types, it's NOT custom
            const docType = doc.document_type;
            if (docType) {
              // Check if document_type matches any predefined full names
              const isPredefinedByName = predefinedNames.some(predefined => docType === predefined);
              // Check if document_type matches any predefined abbreviated types
              const isPredefinedByType = predefinedTypes.some(predefined => docType === predefined);
              
              if (isPredefinedByName || isPredefinedByType) {
                return false; // This is a predefined document, not custom
              }
            }
            
            // Fallback to filename checking only if document_type is not available
            const docName = doc.original_name || doc.name || '';
            return !predefinedNames.some(predefined => docName.includes(predefined));
          } catch (error) {
            console.error('Error filtering document:', doc, error);
            return false;
          }
        })
        .map((doc: any) => {
          try {
            // Clean the document name by removing program ID and file extension
            let cleanName = doc.original_name || doc.name || 'Custom Document';
            
            // Remove program ID pattern (e.g., "(64)")
            cleanName = cleanName.replace(/\(\d+\)/g, '');
            
            // Remove file extensions
            cleanName = cleanName.replace(/\.(pdf|doc|docx|jpg|jpeg|png|gif|bmp|webp)$/i, '');
            
            // Trim whitespace
            cleanName = cleanName.trim();
            
            return {
              id: doc.id || `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              documentName: cleanName || 'Custom Document',
              file: null, // We don't have the actual file, just the document info
              isExisting: true, // Flag to identify existing documents
              documentId: doc.id // Store the original document ID for reference
            };
          } catch (error) {
            console.error('Error processing document:', doc, error);
            return null;
          }
        })
        .filter(doc => doc !== null); // Remove any null entries
      
      console.log('Successfully fetched custom documents:', customDocs);
      return customDocs;
    } catch (error) {
      console.error('Error in fetchExistingCustomDocuments:', error);
      return [];
    }
  };

  useEffect(() => {
    // For EXCO users, only fetch their own programs
    const excoUserId = user?.role === 'exco_user' ? user?.id : null;
    getPrograms(excoUserId).then(res => {
      if (res.success && res.programs) setPrograms(res.programs);
    });
    
    // Fetch all users to map IDs to names
    getUsers()
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
        console.error('Failed to fetch users:', error);
    });
  }, []);

  // Reset pagination when programs data changes
  useEffect(() => {
    setCurrentPage(1);
    setCurrentHistoryPage(1);
  }, [programs]);

  // Initialize custom documents when edit modal opens
  useEffect(() => {
    try {
      if (isEditModalOpen && selectedProgram) {
        console.log('Initializing custom documents for program:', selectedProgram);
        const customDocs = fetchExistingCustomDocuments(selectedProgram);
        setEditCustomDocuments(customDocs);
      } else if (!isEditModalOpen) {
        // Clear custom documents when modal closes
        setEditCustomDocuments([]);
      }
    } catch (error) {
      console.error('Error initializing custom documents:', error);
      setEditCustomDocuments([]);
    }
  }, [isEditModalOpen, selectedProgram]);

  const submitQuery = async () => {
    if (!selectedProgram || !newQuery.trim()) {
      toast({
        title: t('common.error'),
        description: t('queries.provide_message'),
        variant: "destructive"
      });
      return;
    }

    try {
      const res = await createQuery(selectedProgram.id, newQuery, user?.fullName || user?.full_name || '');
      if (res.success) {
        toast({ title: t('common.success'), description: t('queries.submitted_successfully') });
        setNewQuery('');
        setIsQueryModalOpen(false);
        // Refresh programs to get updated status
        const excoUserId = user?.role === 'exco_user' ? user?.id : null;
        const programsResponse = await getPrograms(excoUserId);
        if (programsResponse.success) {
          setPrograms(programsResponse.programs);
        }
      } else {
        toast({ title: t('common.error'), description: res.message || t('queries.submit_failed'), variant: "destructive" });
      }
    } catch (error) {
      console.error('Submit query error:', error);
      toast({ title: t('common.error'), description: t('queries.submit_failed'), variant: "destructive" });
    }
  };

  const handleAnswerQuery = async (programId: string, queryId: string, answer: string) => {
    if (!answer.trim()) {
      toast({
        title: t('common.error'),
        description: t('queries.provide_answer'),
        variant: "destructive"
      });
      return;
    }
    
    try {
      const res = await answerQuery(queryId, answer, user?.fullName || user?.full_name || 'EXCO User'); // Use actual user name from context
      if (res.success) {
        toast({ title: t('common.success'), description: t('queries.answered_successfully') });
        // Refresh the programs to get updated status and queries
        const excoUserId = user?.role === 'exco_user' ? user?.id : null;
        const programsResponse = await getPrograms(excoUserId);
        if (programsResponse.success) {
          setPrograms(programsResponse.programs);
        }
        setIsDetailsModalOpen(false); // Close the modal after answering
      } else {
        toast({ title: t('common.error'), description: res.message || t('queries.answer_failed'), variant: "destructive" });
      }
    } catch (error) {
      console.error('Answer query error:', error);
      toast({ title: t('common.error'), description: t('queries.answer_failed'), variant: "destructive" });
    }
  };

  const handleEditProgram = async () => {
    if (!editFormData.programName || !editFormData.budget || !editFormData.recipientName || !editFormData.excoLetterRef) {
      toast({
        title: t('common.error'),
        description: t('queries.fill_required_fields'),
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
      // Handle document replacements if any new documents are selected
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
        
        // Only process if user actually selected a new file
        if (file && file.size > 0) {
          console.log(`Processing new file for ${docField.name}:`, file.name, 'Size:', file.size);
          try {
            const programId = selectedProgram.id;
            
            // Check if there's an existing document of this type
            const existingDoc = selectedProgram.documents?.find((doc: any) => {
              // Try to match by document_type first, then by original_name
              if (doc.document_type && doc.document_type === docField.name) {
                return true;
              }
              const docName = doc.original_name || doc.name;
              return docName.includes(docField.name);
            });
            
            if (existingDoc) {
              console.log(`Replacing existing ${docField.name} document:`, existingDoc.id);
              
              try {
                // Use the new replaceDocument API
                const replaceResult = await replaceDocument(
                  existingDoc.id, 
                  programId, 
                  file, 
                  `Replaced ${docField.name} document`, 
                  user?.fullName || user?.full_name || 'Unknown User'
                );
                
                if (replaceResult.success) {
                  console.log(`Successfully replaced ${docField.name} document:`, replaceResult);
                  toast({ 
                    title: "Success", 
                    description: `${docField.name} document replaced successfully. Old version moved to history.` 
                  });
                  
                  // Immediately update the selected program to show the new document
                  const updatedProgram = { ...selectedProgram };
                  if (updatedProgram.documents) {
                    const docIndex = updatedProgram.documents.findIndex((doc: any) => doc.id === existingDoc.id);
                    if (docIndex !== -1) {
                      console.log('Updating document in UI:', {
                        old: existingDoc.original_name,
                        new: replaceResult.new_filename,
                        field: docField.field
                      });
                      
                      // Update the existing document with new info from backend response
                      updatedProgram.documents[docIndex] = {
                        ...existingDoc,
                        original_name: replaceResult.new_filename || file.name, // Use the versioned filename from backend
                        filename: replaceResult.new_filename || file.name, // Also update the filename
                        document_type: docField.name, // Ensure document type is set correctly
                        uploaded_at: new Date().toISOString(),
                        uploaded_by: user?.fullName || user?.full_name || 'Unknown User'
                      };
                      setSelectedProgram(updatedProgram);
                      
                      // Also update the edit form data to show the new document name
                      // We need to update it with the document object, not just the filename
                      const updatedDoc = {
                        ...existingDoc,
                        original_name: replaceResult.new_filename || file.name,
                        filename: replaceResult.new_filename || file.name,
                        document_type: docField.name
                      };
                      
                      setEditFormData(prev => ({
                        ...prev,
                        [docField.field]: updatedDoc
                      }));
                      
                      // Update the programs list so the change persists
                      setPrograms(prevPrograms => 
                        prevPrograms.map(prog => 
                          prog.id === selectedProgram.id ? updatedProgram : prog
                        )
                      );
                    }
                  }
                } else {
                  console.error(`Failed to replace ${docField.name}:`, replaceResult);
                  toast({ 
                    title: "Error", 
                    description: `Failed to replace ${docField.name}: ${replaceResult.message || 'Unknown error'}`, 
                    variant: "destructive" 
                  });
                }
              } catch (error) {
                console.error(`Error replacing ${docField.name}:`, error);
                toast({ 
                  title: "Error", 
                  description: `Error replacing ${docField.name}: ${error.message || 'Unknown error'}`, 
                  variant: "destructive" 
                });
              }
            } else {
              console.log(`No existing document for ${docField.name}, uploading new one directly`);
              
              // Create new filename with predefined name and program ID (same format as ProgramManagement)
              const fileExtension = file.name.split('.').pop();
              const newFileName = `${docField.name}(${programId}).${fileExtension}`;
              
              // Create a new File object with the renamed name
              const renamedFile = new File([file], newFileName, { type: file.type });
              
              // Upload new document using the uploadDocument API
              const uploadResult = await uploadDocument(
                programId, 
                renamedFile, 
                user?.fullName || user?.full_name || 'Unknown User', 
                docField.type  // Use the short type key (e.g., 'surat_program') instead of display name
              );
              
              if (uploadResult.success) {
                console.log(`Successfully uploaded ${docField.name} document`);
                toast({ 
                  title: "Success", 
                  description: `${docField.name} document uploaded successfully` 
                });
              } else {
                console.error(`Failed to upload ${docField.name}:`, uploadResult.message);
                toast({ 
                  title: "Error", 
                  description: `Failed to upload ${docField.name}: ${uploadResult.message}`, 
                  variant: "destructive" 
                });
              }
            }
          } catch (error) {
            console.error(`Error processing ${docField.name}:`, error);
            toast({ 
              title: t('common.error'), 
              description: `Failed to process ${docField.name}`, 
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
      
      // Refresh programs to get updated document list
      const excoUserId = user?.role === 'exco_user' ? user?.id : null;
      const programsResponse = await getPrograms(excoUserId);
      if (programsResponse.success) {
        setPrograms(programsResponse.programs);
        
        // Update the selected program with new documents
        const updatedProgram = programsResponse.programs.find(p => p.id === selectedProgram.id);
        if (updatedProgram) {
          setSelectedProgram(updatedProgram);
          
          // Update the edit form data to show the new documents in their correct positions
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
              console.log('Mapping documents for program (update):', program.id);
              program.documents.forEach((doc: any) => {
                console.log('Processing document (update):', doc);
                // Try to match by document_type first (both abbreviated and full names), then fallback to filename matching
                const docType = doc.document_type;
                const docName = doc.original_name || doc.name;
                
                console.log(`Document (update): ${docName}, Type: ${docType}`);
                
                // Check for abbreviated document types first (these are what get set during upload)
                if (docType === 'surat_akuan' || docType === 'Surat Akuan Pusat Khidmat' || docName.includes('Surat Akuan Pusat Khidmat')) {
                  console.log('Mapped to suratAkuanPusatKhidmat (update)');
                  documentMap.suratAkuanPusatKhidmat = doc;
                } else if (docType === 'surat_kelulusan' || docType === 'Surat Kelulusan Pkn' || docName.includes('Surat Kelulusan Pkn')) {
                  console.log('Mapped to suratKelulusanPkn (update)');
                  documentMap.suratKelulusanPkn = doc;
                } else if (docType === 'surat_program' || docType === 'Surat Program' || docName.includes('Surat Program')) {
                  console.log('Mapped to suratProgram (update)');
                  documentMap.suratProgram = doc;
                } else if (docType === 'surat_exco' || docType === 'Surat Exco' || docName.includes('Surat Exco')) {
                  console.log('Mapped to suratExco (update)');
                  documentMap.suratExco = doc;
                } else if (docType === 'penyata_akaun' || docType === 'Penyata Akaun Bank' || docName.includes('Penyata Akaun Bank')) {
                  console.log('Mapped to penyataAkaunBank (update)');
                  documentMap.penyataAkaunBank = doc;
                } else if (docType === 'borang_daftar' || docType === 'Borang Daftar Kod' || docName.includes('Borang Daftar Kod')) {
                  console.log('Mapped to borangDaftarKod (update)');
                  documentMap.borangDaftarKod = doc;
                } else {
                  console.log('Document not mapped to any predefined field (update):', docName, docType);
                }
              });
              console.log('Final document map (update):', documentMap);
            }
            
            return documentMap;
          };
          
          const updatedDocuments = mapDocumentsToFormData(updatedProgram);
          setEditFormData(prev => ({
            ...prev,
            programName: updatedProgram.program_name || updatedProgram.programName,
            budget: updatedProgram.budget.toString(),
            recipientName: updatedProgram.recipient_name || updatedProgram.recipientName,
            excoLetterRef: updatedProgram.exco_letter_ref || updatedProgram.excoLetterRef,
            suratAkuanPusatKhidmat: updatedDocuments.suratAkuanPusatKhidmat,
            suratKelulusanPkn: updatedDocuments.suratKelulusanPkn,
            suratProgram: updatedDocuments.suratProgram,
            suratExco: updatedDocuments.suratExco,
            penyataAkaunBank: updatedDocuments.penyataAkaunBank,
            borangDaftarKod: updatedDocuments.borangDaftarKod
          }));
        }
      }
      
      // Also refresh the selected program for the View Details Modal
      if (selectedProgram) {
        const excoUserId = user?.role === 'exco_user' ? user?.id : null;
        const refreshProgram = await getPrograms(excoUserId);
        if (refreshProgram.success) {
          const refreshedProgram = refreshProgram.programs.find(p => p.id === selectedProgram.id);
          if (refreshedProgram) {
            setSelectedProgram(refreshedProgram);
          }
        }
      }
      
      setIsEditModalOpen(false);
      setEditCustomDocuments([]);
    } else {
      toast({ title: t('common.error'), description: res.message || t('programs.update_failed'), variant: "destructive" });
    }
  };

  // Active queries - programs with 'query' status
  const activeQueries = programs.filter(p => p.status === 'query');
  
  // Answered queries - programs with 'query_answered' status (exclude payment_completed)
  const answeredQueries = programs.filter(p => p.status === 'query_answered');
  
  // For Query History table: show all programs with queries > 0 (regardless of status)
  const allProgramsWithQueries = programs.filter(p => p.queries && p.queries.length > 0);
  
  // Filter out programs with 0 queries from display (but keep them in the counts)
  const activeQueriesWithQueries = activeQueries.filter(p => p.queries && p.queries.length > 0);
  const answeredQueriesWithQueries = answeredQueries.filter(p => p.queries && p.queries.length > 0);
  
  // Pagination logic for active queries (using filtered data for display)
  const totalActivePages = Math.ceil(activeQueriesWithQueries.length / itemsPerPage);
  const startActiveIndex = (currentPage - 1) * itemsPerPage;
  const endActiveIndex = startActiveIndex + itemsPerPage;
  const paginatedActiveQueries = activeQueriesWithQueries.slice(startActiveIndex, endActiveIndex);
  
  // Pagination logic for query history (using filtered data for display)
  const totalHistoryPages = Math.ceil(allProgramsWithQueries.length / itemsPerPage);
  const startHistoryIndex = (currentHistoryPage - 1) * itemsPerPage;
  const endHistoryIndex = startHistoryIndex + itemsPerPage;
  const paginatedAnsweredQueries = allProgramsWithQueries.slice(startHistoryIndex, endHistoryIndex);

  const deleteDocumentFromProgram = async (documentId: string) => {
    if (!selectedProgram) {
      toast({
        title: t('common.error'),
        description: t('queries.no_program_selected'),
        variant: "destructive"
      });
      return;
    }

    try {
      const res = await deleteDocument(documentId);
      if (res.success) {
        toast({ title: t('common.success'), description: t('queries.document_deleted') });
        // Refresh the programs to get updated document list
        const excoUserId = user?.role === 'exco_user' ? user?.id : null;
        const programsResponse = await getPrograms(excoUserId);
        if (programsResponse.success) {
          setPrograms(programsResponse.programs);
          // Update the selected program with new documents
          const updatedProgram = programsResponse.programs.find(p => p.id === selectedProgram.id);
          if (updatedProgram) {
            setSelectedProgram(updatedProgram);
          }
        }
      } else {
        toast({ title: t('common.error'), description: res.message || t('queries.delete_document_failed'), variant: "destructive" });
      }
    } catch (error) {
      console.error('Delete document error:', error);
      toast({ title: t('common.error'), description: t('queries.delete_document_failed'), variant: "destructive" });
    }
  };

  const getStatusLabel = (status?: string) => {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t('queries.management')}</h1>
        <p className="text-muted-foreground">{t('queries.subtitle')}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('queries.active_queries')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{activeQueries.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('queries.answered_queries')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{allProgramsWithQueries.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('queries.total_programs')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{programs.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Active Queries */}
      <Card>
        <CardHeader>
          <CardTitle>{t('queries.active_queries')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('programs.program_name')}</TableHead>
                  <TableHead>{t('programs.budget_rm')}</TableHead>
                  <TableHead>{t('programs.status')}</TableHead>
                  <TableHead>{t('queries.title')}</TableHead>
                  <TableHead>{t('programs.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedActiveQueries.map((program) => (
                  <TableRow key={program.id}>
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
                              <p>View program details</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <span>{program.program_name || program.programName}</span>
                      </div>
                    </TableCell>
                    <TableCell>{program.budget.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(program.status || '')}>
                        {t(getStatusLabel(program.status || ''))}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-orange-600">{program.queries.filter(q => !q.answered).length} {t('queries.pending')}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                                {/* Finance MMK users: Show query button for 'query' status, all actions for 'query_answered' status */}
        {user?.role === 'finance_mmk' ? (
                          program.status === 'query' ? (
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
                                  <p>Answer query</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : program.status === 'query_answered' ? (
                            <>
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
                                        // Map existing documents to edit form data
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
                                            console.log('Mapping documents for program:', program.id);
                                            program.documents.forEach((doc: any) => {
                                              console.log('Processing document:', doc);
                                              // Try to match by document_type first (both abbreviated and full names), then fallback to filename matching
                                              const docType = doc.document_type;
                                              const docName = doc.original_name || doc.name;
                                              
                                              console.log(`Document: ${docName}, Type: ${docType}`);
                                              
                                              // Check for abbreviated document types first (these are what get set during upload)
                                              if (docType === 'surat_akuan' || docType === 'Surat Akuan Pusat Khidmat' || docName.includes('Surat Akuan Pusat Khidmat')) {
                                                console.log('Mapped to suratAkuanPusatKhidmat');
                                                documentMap.suratAkuanPusatKhidmat = doc;
                                              } else if (docType === 'surat_kelulusan' || docType === 'Surat Kelulusan Pkn' || docName.includes('Surat Kelulusan Pkn')) {
                                                console.log('Mapped to suratKelulusanPkn');
                                                documentMap.suratKelulusanPkn = doc;
                                              } else if (docType === 'surat_program' || docType === 'Surat Program' || docName.includes('Surat Program')) {
                                                console.log('Mapped to suratProgram');
                                                documentMap.suratProgram = doc;
                                              } else if (docType === 'surat_exco' || docType === 'Surat Exco' || docName.includes('Surat Exco')) {
                                                console.log('Mapped to suratExco');
                                                documentMap.suratExco = doc;
                                              } else if (docType === 'penyata_akaun' || docType === 'Penyata Akaun Bank' || docName.includes('Penyata Akaun Bank')) {
                                                console.log('Mapped to penyataAkaunBank');
                                                documentMap.penyataAkaunBank = doc;
                                              } else if (docType === 'borang_daftar' || docType === 'Borang Daftar Kod' || docName.includes('Borang Daftar Kod')) {
                                                console.log('Mapped to borangDaftarKod');
                                                documentMap.borangDaftarKod = doc;
                                              } else {
                                                console.log('Document not mapped to any predefined field:', docName, docType);
                                              }
                                            });
                                            console.log('Final document map:', documentMap);
                                          }
                                          
                                          return documentMap;
                                        };
                                        
                                        const existingDocuments = mapDocumentsToFormData(program);
                                        
                                        setEditFormData({
                                          programName: program.program_name || program.programName,
                                          budget: program.budget.toString(),
                                          recipientName: program.recipient_name || program.recipientName,
                                          excoLetterRef: program.exco_letter_ref || program.excoLetterRef,
                                          suratAkuanPusatKhidmat: existingDocuments.suratAkuanPusatKhidmat || null,
                                          suratKelulusanPkn: existingDocuments.suratKelulusanPkn || null,
                                          suratProgram: existingDocuments.suratProgram || null,
                                          suratExco: existingDocuments.suratExco || null,
                                          penyataAkaunBank: existingDocuments.penyataAkaunBank || null,
                                          borangDaftarKod: existingDocuments.borangDaftarKod || null
                                        });
                                        setActiveDocumentTab('original');
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
                                        setSelectedProgram(program);
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
                            </>
                          ) : null
                        ) : user?.role === 'exco_user' ? (
                          /* EXCO USER users: Show all actions */
                          <>
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
                                <HelpCircle className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>View query details</p>
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
                                  // Map existing documents to edit form data
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
                                        // Try to match by document_type first, then fallback to filename matching
                                        const docType = doc.document_type;
                                        const docName = doc.original_name || doc.name;
                                        
                                        // Check for abbreviated document types first (these are what get set during upload)
                                        // Check for abbreviated document types first (these are what get set during upload)
                                        if (docType === 'surat_akuan' || docType === 'Surat Akuan Pusat Khidmat' || docName.includes('Surat Akuan Pusat Khidmat')) {
                                          console.log('Mapped to suratAkuanPusatKhidmat (edit)');
                                          documentMap.suratAkuanPusatKhidmat = doc;
                                        } else if (docType === 'surat_kelulusan' || docType === 'Surat Kelulusan Pkn' || docName.includes('Surat Kelulusan Pkn')) {
                                          console.log('Mapped to suratKelulusanPkn (edit)');
                                          documentMap.suratKelulusanPkn = doc;
                                        } else if (docType === 'surat_program' || docType === 'Surat Program' || docName.includes('Surat Program')) {
                                          console.log('Mapped to suratProgram (edit)');
                                          documentMap.suratProgram = doc;
                                        } else if (docType === 'surat_exco' || docType === 'Surat Exco' || docName.includes('Surat Exco')) {
                                          console.log('Mapped to suratExco (edit)');
                                          documentMap.suratExco = doc;
                                        } else if (docType === 'penyata_akaun' || docType === 'Penyata Akaun Bank' || docName.includes('Penyata Akaun Bank')) {
                                          console.log('Mapped to penyataAkaunBank (edit)');
                                          documentMap.penyataAkaunBank = doc;
                                        } else if (docType === 'borang_daftar' || docType === 'Borang Daftar Kod' || docName.includes('Borang Daftar Kod')) {
                                          console.log('Mapped to borangDaftarKod (edit)');
                                          documentMap.borangDaftarKod = doc;
                                        } else {
                                          console.log('Document not mapped to any predefined field (edit):', docName, docType);
                                        }
                                      });
                                    }
                                    
                                    return documentMap;
                                  };
                                  
                                  const existingDocuments = mapDocumentsToFormData(program);
                                  
                                  setEditFormData({
                                    programName: program.program_name || program.programName,
                                    budget: program.budget.toString(),
                                    recipientName: program.recipient_name || program.recipientName,
                                    excoLetterRef: program.exco_letter_ref || program.excoLetterRef,
                                    suratAkuanPusatKhidmat: existingDocuments.suratAkuanPusatKhidmat || null,
                                    suratKelulusanPkn: existingDocuments.suratKelulusanPkn || null,
                                    suratProgram: existingDocuments.suratProgram || null,
                                    suratExco: existingDocuments.suratExco || null,
                                    penyataAkaunBank: existingDocuments.penyataAkaunBank || null,
                                    borangDaftarKod: existingDocuments.borangDaftarKod || null
                                  });
                                      setActiveDocumentTab('original');
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
                                  setSelectedProgram(program);
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
                          </>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination for Active Queries */}
          {totalActivePages > 1 && (
            <div className="mt-4 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalActivePages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(prev => Math.min(totalActivePages, prev + 1))}
                      className={currentPage === totalActivePages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Query History */}
      <Card>
        <CardHeader>
          <CardTitle>{t('queries.history')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('programs.program_name')}</TableHead>
                  <TableHead>{t('programs.budget_rm')}</TableHead>
                  <TableHead>{t('programs.status')}</TableHead>
                  <TableHead>{t('queries.total_queries')}</TableHead>
                  <TableHead>{t('programs.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedAnsweredQueries.map((program) => (
                  <TableRow key={program.id}>
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
                              <p>View program details</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <span>{program.program_name || program.programName}</span>
                      </div>
                    </TableCell>
                    <TableCell>{program.budget.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(program.status || '')}>
                        {t(getStatusLabel(program.status || ''))}
                      </Badge>
                    </TableCell>
                    <TableCell>{program.queries.length}</TableCell>
                    <TableCell>
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
                            <p>View query details</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination for Query History */}
          {totalHistoryPages > 1 && (
            <div className="mt-4 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentHistoryPage(prev => Math.max(1, prev - 1))}
                      className={currentHistoryPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalHistoryPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentHistoryPage(page)}
                        isActive={currentHistoryPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentHistoryPage(prev => Math.min(totalHistoryPages, prev + 1))}
                      className={currentHistoryPage === totalHistoryPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Query Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Queries - {selectedProgram?.program_name || selectedProgram?.programName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto max-h-[calc(85vh-140px)] pr-4 pb-4 custom-scrollbar">
            {selectedProgram?.queries.map((query) => (
              <div key={query.id} className="border rounded p-4 space-y-3">
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium">Query from {query.created_by || query.createdBy}</p>
                    <p className="text-sm text-muted-foreground">{new Date(query.created_at || query.createdAt).toLocaleDateString()}</p>
                  </div>
                  <Badge variant={query.answered ? "default" : "destructive"}>
                    {query.answered ? "Answered" : "Pending"}
                  </Badge>
                </div>
                
                <div className="bg-muted p-3 rounded">
                  <p className="text-sm">{query.question || query.message}</p>
                </div>
                
                {query.answered && query.answer && (
                  <div className="bg-green-50 p-3 rounded border-l-4 border-green-400">
                    <p className="text-sm font-medium text-green-800">Answer:</p>
                    <p className="text-sm text-green-700">{query.answer}</p>
                  </div>
                )}
                
                {!query.answered && selectedProgram?.status === 'query' && (
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Type your answer here..."
                      value={queryAnswers[query.id] || ''}
                      onChange={(e) => setQueryAnswers(prev => ({ ...prev, [query.id]: e.target.value }))}
                    />
                    <Button 
                      size="sm"
                      onClick={() => handleAnswerQuery(selectedProgram.id, query.id, queryAnswers[query.id] || '')}
                    >
                      Submit Answer
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Query Modal */}
      <Dialog open={isQueryModalOpen} onOpenChange={setIsQueryModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Submit Query - {selectedProgram?.program_name || selectedProgram?.programName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="queryMessage">Query Message *</Label>
              <Textarea
                id="queryMessage"
                placeholder="Type your query here..."
                value={newQuery}
                onChange={(e) => setNewQuery(e.target.value)}
                rows={4}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsQueryModalOpen(false);
                  setNewQuery('');
                }}
              >
                Cancel
              </Button>
              <Button onClick={submitQuery} disabled={!newQuery.trim()}>
                Submit Query
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Program Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Edit Program - {selectedProgram?.program_name || selectedProgram?.programName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto max-h-[calc(90vh-120px)] pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {/* Program Information */}
            <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="editProgramName">Program Name *</Label>
              <Input
                id="editProgramName"
                value={editFormData.programName}
                onChange={(e) => setEditFormData({...editFormData, programName: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="editBudget">Budget (RM) *</Label>
              <Input
                id="editBudget"
                type="text"
                value={editFormData.budget}
                onChange={(e) => setEditFormData({...editFormData, budget: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="editRecipientName">Recipient Name *</Label>
              <Input
                id="editRecipientName"
                value={editFormData.recipientName}
                onChange={(e) => setEditFormData({...editFormData, recipientName: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="editExcoLetterRef">EXCO Letter Reference Number *</Label>
              <Input
                id="editExcoLetterRef"
                value={editFormData.excoLetterRef}
                onChange={(e) => setEditFormData({...editFormData, excoLetterRef: e.target.value})}
              />
            </div>
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
                        <span className="flex-1 text-sm">Surat Akuan Pusat Khidmat</span>
                                                <div className="flex gap-1">
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Set the field to null to show file upload input
                              setEditFormData({
                                ...editFormData,
                                suratAkuanPusatKhidmat: null
                              });
                            }}
                          >
                            Replace
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
                              suratAkuanPusatKhidmat: file
                            });
                          }
                        }}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.bmp,.webp"
                      />
                              )}
                            </div>
                  {editFormData.suratAkuanPusatKhidmat && typeof editFormData.suratAkuanPusatKhidmat === 'object' && !('id' in editFormData.suratAkuanPusatKhidmat) && (
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
                        <span className="flex-1 text-sm">Surat Kelulusan Pkn</span>
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
                              // Set the field to null to show file upload input
                              setEditFormData({
                                ...editFormData,
                                suratKelulusanPkn: null
                              });
                            }}
                          >
                            Replace
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
                        <span className="flex-1 text-sm">Surat Program</span>
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
                              // Set the field to null to show file upload input
                              setEditFormData({
                                ...editFormData,
                                suratProgram: null
                              });
                            }}
                              >
                                Replace
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
                        <span className="flex-1 text-sm">Surat Exco</span>
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
                              // Set the field to null to show file upload input
                              setEditFormData({
                                ...editFormData,
                                suratExco: null
                              });
                            }}
                          >
                            Replace
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
                        <span className="flex-1 text-sm">Penyata Akaun Bank</span>
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
                              // Set the field to null to show file upload input
                              setEditFormData({
                                ...editFormData,
                                penyataAkaunBank: null
                              });
                            }}
                          >
                            Replace
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
                        <span className="flex-1 text-sm">Borang Daftar Kod</span>
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
                              // Set the field to null to show file upload input
                              setEditFormData({
                                ...editFormData,
                                borangDaftarKod: null
                              });
                            }}
                          >
                            Replace
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
                {(() => {
                  try {
                    console.log('Rendering custom documents section. editCustomDocuments:', editCustomDocuments);
                    
                    return (
                      <>
                        {/* Show existing custom documents if any */}
                        {editCustomDocuments && editCustomDocuments.length > 0 && editCustomDocuments.map((doc, index) => {
                          try {
                            if (!doc || typeof doc !== 'object') {
                              console.log('Invalid doc object:', doc);
                              return null;
                            }
                            
                            console.log('Rendering custom document:', doc);
                            
                            return (
                              <div key={doc.id || index} className="flex items-center gap-3">
                                <div className="min-w-[200px]">
                                  {doc.isExisting ? (
                                    <Label className="text-sm font-medium min-w-[200px]">{doc.documentName || 'Custom Document'}</Label>
                                  ) : (
                                    <>
                                      <Input
                                        placeholder="Document name"
                                        value={doc.documentName || ''}
                                        onChange={(e) => updateEditCustomDocument(doc.id, 'documentName', e.target.value)}
                                        className={doc.file && !doc.documentName?.trim() ? 'border-orange-400' : ''}
                                      />
                                      {doc.file && !doc.documentName?.trim() && (
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
                                      <span className="flex-1 text-sm">{doc.documentName || 'Custom Document'}</span>
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
                                                <X className="h-4 w-4" />
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
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            );
                          } catch (error) {
                            console.error('Error rendering individual custom document:', error, doc);
                            return null;
                          }
                        })}
                        
                        {/* Add More Button for Edit Mode - Always visible */}
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
                      </>
                    );
                  } catch (error) {
                    console.error('Error rendering custom documents section:', error);
                    return (
                      <div className="text-red-600 p-2 border border-red-300 rounded">
                        Error loading custom documents. Please try again.
                      </div>
                    );
                  }
                })()}
        

              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => {
                setIsEditModalOpen(false);
                setEditCustomDocuments([]);
              }}>
                Cancel
              </Button>
              <Button onClick={handleEditProgram}>Update Program</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Documents Modal */}
      <Dialog open={isDocumentsModalOpen} onOpenChange={setIsDocumentsModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Documents - {selectedProgram?.program_name || selectedProgram?.programName}</DialogTitle>
          </DialogHeader>
          
          {/* Existing Documents */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Existing Documents</h3>
            {selectedProgram?.documents?.map((doc) => {
              const isImage = doc.original_name && /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(doc.original_name);
              
              return (
              <div key={doc.id} className="flex items-center gap-2 p-2 border rounded">
                <FileText className="h-4 w-4" />
                <div className="flex-1">
                    <p className="font-medium">{doc.original_name || doc.name}</p>
                  <p className="text-sm text-muted-foreground">
                      Uploaded: {new Date(doc.uploaded_at || doc.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {isImage && (
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
                    )}
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
                  </div>
                </div>
              );
            })}
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
                <p className="font-medium">RM {selectedProgram?.budget?.toLocaleString()}</p>
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
              
              {/* Tab Buttons */}
              <div className="flex space-x-1 mb-3">
                <Button
                  variant={activeDocumentTab === 'original' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveDocumentTab('original')}
                  className="text-xs"
                >
                  Original Documents ({selectedProgram?.documents?.filter((doc: any) => doc.document_type === 'original' || !doc.document_type).length || 0})
                </Button>

              </div>

              <div className="space-y-2">
                {selectedProgram?.documents && selectedProgram.documents.length > 0 ? (
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
                              )}
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
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setSelectedDocumentForHistory(doc);
                                  setIsDocumentHistoryModalOpen(true);
                                }}
                                title="View Document History"
                              >
                                <History className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
                )}
              </div>
            </div>

            {/* Queries Section */}
            <div>
              <Label className="text-base font-semibold">Queries</Label>
              <div className="space-y-2">
                {selectedProgram?.queries && selectedProgram.queries.length > 0 ? (
                  <div className="border rounded p-2 space-y-1">
                    {selectedProgram.queries.map((query: any) => (
                      <div key={query.id} className="p-2 border rounded bg-muted">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-blue-600">{query.created_by || query.createdBy}</span>
                            <Badge variant={query.answered ? "default" : "secondary"}>
                              {query.answered ? "Answered" : "Pending"}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(query.created_at || query.createdAt).toLocaleDateString()} at {new Date(query.created_at || query.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                        <p className="text-sm font-medium">Q: {query.question || query.message}</p>
                        {query.answer && (
                          <div className="mt-2 p-2 bg-white rounded border-l-4 border-green-500">
                            <p className="text-sm"><span className="font-medium">A:</span> {query.answer}</p>
                          </div>
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
              <Button variant="outline" onClick={() => setIsViewDetailsModalOpen(false)}>
                Close
              </Button>
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