import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Loader2, Upload } from 'lucide-react';

const formSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  content: z.string().min(10, {
    message: "Content must be at least 10 characters.",
  }),
  category: z.string().min(1, {
    message: "Please select a category.",
  }),
  attachment_url: z.string().optional(),
  attachment_type: z.string().optional(),
  attachment_name: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface SOPFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: FormData) => void;
  sop?: {
    id: string;
    title: string;
    content: string;
    category: string;
  };
}

export default function SOPForm({ isOpen, onClose, onSubmit, sop }: SOPFormProps) {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: sop?.title || "",
      content: sop?.content || "",
      category: sop?.category || "",
    },
  });

  const handleSubmit = (values: FormData) => {
    onSubmit(values);
    onClose();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const isPDF = file.type === 'application/pdf';
    const isImage = file.type.startsWith('image/');
    
    if (!isPDF && !isImage) {
      setUploadError('Only PDF and image files are allowed');
      return;
    }

    try {
      setIsUploading(true);
      setUploadError(null);

      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).slice(2)}.${fileExt}`;
      const filePath = `sop-attachments/${fileName}`;

      const { data, error } = await supabase.storage
        .from('sop-attachments')
        .upload(filePath, file);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('sop-attachments')
        .getPublicUrl(filePath);

      // Update form data
      form.setValue('attachment_url', publicUrl);
      form.setValue('attachment_type', isPDF ? 'pdf' : 'image');
      form.setValue('attachment_name', file.name);

    } catch (err) {
      console.error('Error uploading file:', err);
      setUploadError('Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] w-[90vw] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{sop ? "Edit SOP" : "Create New SOP"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 overflow-y-auto flex-1 pr-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              {...form.register("title")}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Enter SOP title"
            />
            {form.formState.errors.title && (
              <p className="mt-1 text-sm text-red-600">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              {...form.register("category")}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">Select a category</option>
              <option value="onboarding">Patient Onboarding and Registration Procedures</option>
              <option value="clinical">Clinical Treatment and Care Protocols</option>
              <option value="administrative">Administrative and Business Operations</option>
              <option value="compliance">Regulatory Compliance and Documentation</option>
              <option value="emergency">Emergency Response and Safety Protocols</option>
              <option value="quality">Quality Assurance and Management System</option>
            </select>
            {form.formState.errors.category && (
              <p className="mt-1 text-sm text-red-600">{form.formState.errors.category.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content
            </label>
            <textarea
              {...form.register("content")}
              rows={10}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Enter SOP content"
            />
            {form.formState.errors.content && (
              <p className="mt-1 text-sm text-red-600">{form.formState.errors.content.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Attachment (PDF or Image)
            </label>
            <div className="mt-1 flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-2"
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {isUploading ? 'Uploading...' : 'Upload File'}
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".pdf,image/*"
                className="hidden"
              />
              {form.watch('attachment_name') && (
                <span className="text-sm text-gray-600">
                  {form.watch('attachment_name')}
                </span>
              )}
            </div>
            {uploadError && (
              <p className="mt-1 text-sm text-red-600">{uploadError}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 sticky bottom-0 bg-white border-t mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {sop ? "Update SOP" : "Create SOP"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}