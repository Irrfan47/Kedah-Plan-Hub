import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Eye, Clock, User, MessageSquare, AlertTriangle } from 'lucide-react';
import { getDocumentHistorySimple, downloadHistoryDocumentSimple } from '@/api/backend';
import { useToast } from '@/hooks/use-toast';

interface DocumentHistoryItem {
  id: number;
  original_document_id: number;
  program_id: number;
  filename: string;
  original_name: string;
  uploaded_by: string;
  document_type: string;
  uploaded_at: string;
  replaced_at: string;
  replaced_by: string;
  replaced_by_name: string;
  version_number: number;
  change_reason: string;
  file_path: string;
  file_exists: boolean;
  current_document_name?: string;
  current_uploaded_at?: string;
}

interface DocumentHistoryModalSimpleProps {
  isOpen: boolean;
  onClose: () => void;
  documentId?: number;
  programId?: number;
  currentDocumentName?: string;
}

export default function DocumentHistoryModalSimple({ 
  isOpen, 
  onClose, 
  documentId, 
  programId, 
  currentDocumentName 
}: DocumentHistoryModalSimpleProps) {
  const [history, setHistory] = useState<DocumentHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
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
        setHistory(response.history);
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

  const handleDownload = async (item: DocumentHistoryItem) => {
    try {
      if (!item.file_exists) {
        toast({
          title: "File Missing",
          description: "This historical document file is no longer available",
          variant: "destructive"
        });
        return;
      }

      const result = await downloadHistoryDocumentSimple(item.file_path, item.original_name);
      if (result.success) {
        toast({
          title: "Download Started",
          description: "Historical document download has started",
        });
      } else {
        throw new Error('Download failed');
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
      if (!item.file_exists) {
        toast({
          title: "File Missing",
          description: "This historical document file is no longer available",
          variant: "destructive"
        });
        return;
      }

      // For viewing, we'll download and open in new tab
      const params = new URLSearchParams({
        file_path: item.file_path,
        original_name: item.original_name || ''
      });
      
      const viewUrl = `/api/download_history_document.php?${params}`;
      window.open(viewUrl, '_blank');
      
      toast({
        title: "Document Opened",
        description: "Historical document opened in new tab",
      });
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
                {history.map((item, index) => (
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
                          {!item.file_exists && (
                            <Badge variant="destructive" className="text-xs">
                              File Missing
                            </Badge>
                          )}
                        </div>
                        
                        <h4 className="font-medium text-gray-900 mb-1">
                          {item.original_name}
                        </h4>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>Uploaded by: {item.uploaded_by}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>Uploaded: {formatDate(item.uploaded_at)}</span>
                          </div>
                          {item.replaced_by && (
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              <span>Replaced by: {item.replaced_by_name || item.replaced_by}</span>
                            </div>
                          )}
                          {item.replaced_at && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>Replaced: {formatDate(item.replaced_at)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleView(item)}
                          title={item.file_exists ? "View Document" : "Document file is missing - cannot view"}
                          disabled={!item.file_exists}
                          className={!item.file_exists ? "opacity-50 cursor-not-allowed" : ""}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(item)}
                          title={item.file_exists ? "Download Document" : "Document file is missing - cannot download"}
                          disabled={!item.file_exists}
                          className={!item.file_exists ? "opacity-50 cursor-not-allowed" : ""}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
