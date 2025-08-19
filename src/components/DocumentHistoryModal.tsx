import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Eye, AlertTriangle, RefreshCw } from 'lucide-react';
import { getDocumentHistorySimple, downloadHistoryDocumentSimple, viewDocument, checkOrphanedDocuments, recoverLostDocument } from '@/api/backend';
import { useToast } from '@/hooks/use-toast';

interface DocumentHistoryItem {
  id: number;
  original_document_id: number;
  program_id: number;
  filename: string;
  original_name: string;
  document_type: 'original' | 'finance';
  replaced_at: string;
  replaced_by: string;
  replaced_by_name: string;
  version_number: number;
  change_reason: string;
  file_path?: string;
  current_document_name?: string;
}

interface DocumentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId?: number;
  programId?: number;
  currentDocumentName?: string;
}

export default function DocumentHistoryModal({ 
  isOpen, 
  onClose, 
  documentId, 
  programId, 
  currentDocumentName 
}: DocumentHistoryModalProps) {
  const [history, setHistory] = useState<DocumentHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkingOrphaned, setCheckingOrphaned] = useState(false);
  const [orphanedDocuments, setOrphanedDocuments] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && (documentId || programId)) {
      fetchHistory();
    }
  }, [isOpen, documentId, programId]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await getDocumentHistorySimple(documentId, programId);
      if (response.success) {
        setHistory(response.history || []);
        // Check for orphaned documents after fetching history
        checkForOrphanedDocuments();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to fetch document history",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching document history:', error);
      toast({
        title: "Error",
        description: "Failed to fetch document history",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const checkForOrphanedDocuments = async () => {
    setCheckingOrphaned(true);
    try {
      const result = await checkOrphanedDocuments();
      if (result.success) {
        setOrphanedDocuments(result.orphaned_records || []);
        if (result.total_orphaned > 0) {
          toast({
            title: "Warning",
            description: `Found ${result.total_orphaned} orphaned document history records`,
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('Error checking orphaned documents:', error);
    } finally {
      setCheckingOrphaned(false);
    }
  };

  const handleRecoverDocument = async (historyId: number) => {
    try {
      const result = await recoverLostDocument(historyId);
      if (result.success) {
        toast({
          title: "Success",
          description: result.message || "Document recovered successfully",
        });
        // Refresh the orphaned documents list
        checkForOrphanedDocuments();
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to recover document",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error recovering document:', error);
      toast({
        title: "Error",
        description: "Failed to recover document",
        variant: "destructive"
      });
    }
  };

  const handleDownload = async (item: DocumentHistoryItem) => {
    try {
      if (item.file_path) {
        // Download historical document from history folder using the new API
        const result = await downloadHistoryDocumentSimple(item.file_path, item.original_name);
        if (result.success) {
          toast({
            title: "Download Started",
            description: "Historical document download has started",
          });
        } else {
          throw new Error('Download failed');
        }
      } else {
        // Fallback to old method for backward compatibility
        const downloadUrl = `/api/download_document.php?filename=${encodeURIComponent(item.filename)}&original_name=${encodeURIComponent(item.original_name)}`;
        
        // Create a temporary link element and trigger download
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = item.original_name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: "Download Started",
          description: "Document download has started",
        });
      }
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive"
      });
    }
  };

  const handleView = async (item: DocumentHistoryItem) => {
    try {
      if (item.file_path) {
        // View historical document from history folder using the new API
        const result = await downloadHistoryDocumentSimple(item.file_path, item.original_name);
        if (result.success) {
          toast({
            title: "Document Opened",
            description: "Historical document opened successfully",
          });
        } else {
          throw new Error('Failed to open historical document');
        }
      } else {
        // Fallback to old method for backward compatibility
        const viewUrl = `/api/view_document.php?filename=${encodeURIComponent(item.filename)}&original_name=${encodeURIComponent(item.original_name)}`;
        
        // Open document in new tab for viewing
        window.open(viewUrl, '_blank');
        
        toast({
          title: "Document Opened",
          description: "Document opened in new tab",
        });
      }
    } catch (error) {
      console.error('View error:', error);
      toast({
        title: "Error",
        description: "Failed to view document",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getDocumentTypeColor = (type: string) => {
    return type === 'original' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document History
            {currentDocumentName && (
              <span className="text-sm font-normal text-muted-foreground">
                - {currentDocumentName}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 overflow-y-auto max-h-[calc(90vh-120px)] pr-2">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading document history...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No document history found</p>
            </div>
          ) : (
            <>
              {/* Warning for Orphaned Documents */}
              {orphanedDocuments.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <h3 className="font-medium text-red-800">Missing Historical Documents</h3>
                  </div>
                  <p className="text-sm text-red-700 mb-3">
                    {orphanedDocuments.length} historical document{orphanedDocuments.length > 1 ? 's' : ''} {orphanedDocuments.length > 1 ? 'are' : 'is'} missing from storage but exist in the database.
                  </p>
                  <div className="space-y-2">
                    {orphanedDocuments.map((orphaned) => (
                      <div key={orphaned.id} className="flex items-center justify-between bg-white p-2 rounded border">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{orphaned.original_name}</p>
                          <p className="text-xs text-red-600">Missing file: {orphaned.file_path}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRecoverDocument(orphaned.id)}
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Try Recovery
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={checkForOrphanedDocuments}
                    disabled={checkingOrphaned}
                    className="mt-3 text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <RefreshCw className={`h-4 w-4 mr-1 ${checkingOrphaned ? 'animate-spin' : ''}`} />
                    {checkingOrphaned ? 'Checking...' : 'Refresh Status'}
                  </Button>
                </div>
              )}

              {/* Current Document (if viewing by document ID) */}
              {documentId && currentDocumentName && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="bg-blue-100 text-blue-800">
                      Current Version
                    </Badge>
                    <span className="font-medium">{currentDocumentName}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    This is the current active document
                  </p>
                </div>
              )}

              {/* History Timeline */}
              <div className="space-y-3">
                {history.map((item, index) => {
                  console.log('History item:', item); // Debug log to see what data we're getting
                  return (
                    <div key={item.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getDocumentTypeColor(item.document_type)}>
                              {item.document_type === 'original' ? 'Original' : 'Finance'}
                            </Badge>
                            <Badge variant="outline">
                              Version {item.version_number}
                            </Badge>
                            {item.change_reason && (
                              <Badge variant="secondary" className="text-xs">
                                {item.change_reason}
                              </Badge>
                            )}
                          </div>
                          
                          <h4 className="font-medium text-gray-900 mb-1">
                            {item.original_name}
                            {item.replaced_at && (
                              <span className="text-sm text-muted-foreground ml-2">
                                • Replaced: {formatDate(item.replaced_at)}
                              </span>
                            )}
                          </h4>
                          
                          {/* Removed replaced_by display to eliminate the "0" */}
                        </div>
                        
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleView(item)}
                            title={orphanedDocuments.some(o => o.original_document_id === item.original_document_id) ? "Document file is missing - cannot view" : "View Document"}
                            disabled={orphanedDocuments.some(o => o.original_document_id === item.original_document_id)}
                            className={orphanedDocuments.some(o => o.original_document_id === item.original_document_id) ? "opacity-50 cursor-not-allowed" : ""}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(item)}
                            title={orphanedDocuments.some(o => o.original_document_id === item.original_document_id) ? "Document file is missing - cannot download" : "Download Document"}
                            disabled={orphanedDocuments.some(o => o.original_document_id === item.original_document_id)}
                            className={orphanedDocuments.some(o => o.original_document_id === item.original_document_id) ? "opacity-50 cursor-not-allowed" : ""}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          {orphanedDocuments.some(o => o.original_document_id === item.original_document_id) && (
                            <div className="flex items-center gap-1 text-xs text-red-600">
                              <AlertTriangle className="h-3 w-3" />
                              <span>File Missing</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
