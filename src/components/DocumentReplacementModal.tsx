import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Upload, X } from 'lucide-react';
import { replaceDocument } from '@/api/backend';
import { useToast } from '@/hooks/use-toast';

interface DocumentReplacementModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: number;
  programId: number;
  currentDocumentName: string;
  onSuccess: () => void;
}

export default function DocumentReplacementModal({
  isOpen,
  onClose,
  documentId,
  programId,
  currentDocumentName,
  onSuccess
}: DocumentReplacementModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [changeReason, setChangeReason] = useState('');
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    // Reset the file input
    const fileInput = document.getElementById('document-file') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a new document to replace the current one",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      const result = await replaceDocument(
        documentId,
        programId,
        selectedFile,
        changeReason || 'Document replaced',
        'Current User' // You'll need to get this from your auth context
      );

      if (result.success) {
        if (result.action === 'replaced') {
          toast({
            title: "Success",
            description: "Document replaced successfully. Previous version saved to history.",
          });
          onSuccess();
          onClose();
        } else {
          toast({
            title: "No Replacement",
            description: "No new document was selected. Original document preserved.",
          });
          onClose();
        }
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to replace document",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Document replacement error:', error);
      toast({
        title: "Error",
        description: "Failed to replace document",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setChangeReason('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Replace Document
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Current Document Info */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <Label className="text-sm font-medium text-gray-700">Current Document</Label>
            <p className="text-sm text-gray-600 mt-1">{currentDocumentName}</p>
          </div>

          {/* File Selection */}
          <div className="space-y-2">
            <Label htmlFor="document-file">Select New Document</Label>
            <div className="flex items-center gap-2">
              <Input
                id="document-file"
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                className="flex-1"
              />
              {selectedFile && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveFile}
                  className="shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {selectedFile && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Upload className="h-4 w-4" />
                <span>{selectedFile.name}</span>
                <span className="text-xs">({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
              </div>
            )}
          </div>

          {/* Change Reason */}
          <div className="space-y-2">
            <Label htmlFor="change-reason">Reason for Replacement (Optional)</Label>
            <Textarea
              id="change-reason"
              placeholder="e.g., Updated version, corrected information, etc."
              value={changeReason}
              onChange={(e) => setChangeReason(e.target.value)}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!selectedFile || uploading}
              className="flex-1"
            >
              {uploading ? 'Replacing...' : 'Replace Document'}
            </Button>
          </div>

          {/* Info */}
          <div className="text-xs text-gray-500 text-center">
            The current document will be saved to history before replacement.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

