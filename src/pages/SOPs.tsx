import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button'; 
import { Loader2, FileText, Upload, Eye, Archive, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Worker, Viewer } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

interface SOP {
  id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
  created_by_user_id: string;
  attachment_url: string | null;
  attachment_type: string | null;
  attachment_name: string | null;
  archived: boolean;
  archived_at: string | null;
  archived_by_user_id: string | null;
}

interface SOPFormData {
  title: string;
  content: string;
  category: string;
  file?: File;
}

export default function SOPs() {
  const { user } = useAuth();
  const [sops, setSOPs] = useState<SOP[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSOP, setSelectedSOP] = useState<SOP | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [showArchived, setShowArchived] = useState(false);

  const fetchSOPs = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('sops')
        .select('*')
        .eq('archived', showArchived)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSOPs(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching SOPs:', err);
      setError('Failed to load SOPs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file || !file.type.includes('pdf')) {
      setError('Please upload a PDF file');
      return null;
    }

    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).slice(2)}.${fileExt}`;
      const filePath = `sop-attachments/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('sop-attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('sop-attachments')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err) {
      console.error('Error uploading file:', err);
      setError('Failed to upload file');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateSOP = async (data: SOPFormData) => {
    try {
      let attachmentUrl = null;
      if (data.file) {
        attachmentUrl = await handleFileUpload(data.file);
        if (!attachmentUrl) return;
      }

      const { error: insertError } = await supabase
        .from('sops')
        .insert({
          title: data.title,
          content: data.content || '', // Ensure content is never null
          category: data.category,
          created_by_user_id: user?.id,
          attachment_url: attachmentUrl,
          attachment_type: data.file ? 'pdf' : null,
          attachment_name: data.file?.name || null
        });

      if (insertError) throw insertError;
      
      setIsCreateModalOpen(false);
      fetchSOPs();
    } catch (err) {
      console.error('Error creating SOP:', err);
      setError('Failed to create SOP');
    }
  };

  const handleArchiveToggle = async (sop: SOP) => {
    try {
      const { error } = await supabase
        .from('sops')
        .update({
          archived: !sop.archived,
          archived_at: !sop.archived ? new Date().toISOString() : null,
          archived_by_user_id: !sop.archived ? user?.id : null
        })
        .eq('id', sop.id);

      if (error) throw error;
      fetchSOPs();
    } catch (err) {
      console.error('Error toggling archive status:', err);
      setError('Failed to update SOP archive status');
    }
  };

  useEffect(() => {
    fetchSOPs();
  }, [showArchived]);

  const handleSOPClick = (sop: SOP) => {
    setSelectedSOP(sop);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-12 pt-5 md:pt-10">
        <div>
          <h2 className="text-2xl font-bold">Standard Operating Procedures</h2>
          <p className="text-gray-500 mt-1">
            {showArchived ? 'Archived SOPs' : 'Active SOPs'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowArchived(!showArchived)}
            className="flex items-center gap-2"
          >
            <Archive className="w-4 h-4" />
            {showArchived ? 'Show Active' : 'Show Archived'}
          </Button>
          {!showArchived && (
            <Button onClick={() => setIsCreateModalOpen(true)}>
              Add New SOP
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : sops.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No SOPs found. Create your first SOP to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sops.map((sop) => (
            <div 
              key={sop.id} 
              className="bg-white rounded-lg border overflow-hidden cursor-pointer hover:shadow-lg transition-all"
              onClick={() => handleSOPClick(sop)}
            >
              {sop.attachment_url && (
                <div className="h-48 bg-gray-100 flex items-center justify-center">
                  <FileText className="w-12 h-12 text-gray-400" />
                </div>
              )}
              <div className="p-4">
                <h3 className="font-medium text-lg mb-2">{sop.title}</h3>
                <span className="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 mb-2">
                  {sop.category === 'onboarding' ? 'Patient Onboarding' :
                   sop.category === 'clinical' ? 'Clinical Procedures' :
                   sop.category === 'administrative' ? 'Administrative' :
                   sop.category === 'compliance' ? 'Compliance' : 
                   'Other'}
                </span>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {new Date(sop.created_at).toLocaleDateString()}
                  </span>
                  {sop.attachment_url && (
                    <Eye className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleArchiveToggle(sop);
                  }}
                  className="mt-2"
                >
                  <Archive className="w-4 h-4 mr-2" />
                  {sop.archived ? 'Unarchive' : 'Archive'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create SOP Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New SOP</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const data: SOPFormData = {
              title: formData.get('title') as string,
              content: formData.get('content') as string || '', // Ensure content is never null
              category: formData.get('category') as string,
              file: formData.get('file') as File || undefined
            };
            handleCreateSOP(data);
          }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                name="title"
                required
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                name="category"
                required
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Select a category</option>
                <option value="onboarding">Patient Onboarding</option>
                <option value="clinical">Clinical Procedures</option>
                <option value="administrative">Administrative</option>
                <option value="compliance">Compliance</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
              <textarea
                name="content"
                required
                rows={5}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Enter SOP content"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PDF Document</label>
              <input
                type="file"
                name="file"
                accept=".pdf"
                ref={fileInputRef}
                className="w-full"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isUploading}>
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Create SOP'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View PDF Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>{selectedSOP?.title}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {selectedSOP?.attachment_url ? (
              <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                <div style={{ height: 'calc(80vh - 100px)' }}>
                  <Viewer fileUrl={selectedSOP.attachment_url} />
                </div>
              </Worker>
            ) : (
              <div className="p-4">
                <p className="text-gray-600">{selectedSOP?.content || 'No content available'}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}