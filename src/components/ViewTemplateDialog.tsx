import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ViewTemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  template: {
    title: string;
    subject: string;
    body: string;
    send_instructions?: string;
    created_at: string;
  };
}

export default function ViewTemplateDialog({ isOpen, onClose, template }: ViewTemplateDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{template.title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Subject</h3>
            <p className="text-gray-900">{template.subject}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Message</h3>
            <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
              {template.body}
            </div>
          </div>

          {template.send_instructions && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Send Instructions</h3>
              <p className="text-gray-600">{template.send_instructions}</p>
            </div>
          )}

          <div className="text-sm text-gray-500">
            Created on {new Date(template.created_at).toLocaleDateString()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}