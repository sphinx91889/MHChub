import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import EmailTemplateForm from '@/components/EmailTemplateForm';
import ViewTemplateDialog from '@/components/ViewTemplateDialog';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';
import { MoreHorizontal, Calendar, Mail } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface EmailTemplate {
  id: string;
  title: string;
  subject: string;
  body: string;
  user_id: string;
  send_instructions?: string;
  created_at: string;
  updated_at: string;
}

export default function EmailTemplates() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setIsLoading(true);
        if (!user) return;

        const { data, error } = await supabase
          .from('email_templates')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setTemplates(data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching email templates:', err);
        setError('Failed to load email templates');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, [user]);

  const handleCreateTemplate = async (values: any) => {
    try {
      if (!user) return;

      const { error } = await supabase
        .from('email_templates')
        .insert({
          ...values,
          user_id: user.id,
        });

      if (error) throw error;

      // Refresh templates
      const { data } = await supabase
        .from('email_templates')
        .select('*')
        .order('created_at', { ascending: false });

      setTemplates(data || []);
    } catch (err) {
      console.error('Error creating email template:', err);
      setError('Failed to create email template');
    } finally {
      setIsCreateModalOpen(false);
    }
  };

  const handleUpdateTemplate = async (values: any) => {
    try {
      if (!user || !selectedTemplate?.id) return;

      const { error } = await supabase
        .from('email_templates')
        .update(values)
        .eq('id', selectedTemplate.id);

      if (error) throw error;

      // Refresh templates
      const { data } = await supabase
        .from('email_templates')
        .select('*')
        .order('created_at', { ascending: false });

      setTemplates(data || []);
    } catch (err) {
      console.error('Error updating email template:', err);
      setError('Failed to update email template');
    } finally {
      setIsEditModalOpen(false);
      setSelectedTemplate(null);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTemplates(prev => prev.filter(template => template.id !== id));
    } catch (err) {
      console.error('Error deleting email template:', err);
      setError('Failed to delete email template');
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-12 pt-5 md:pt-10">
        <h2 className="text-2xl font-bold">Email Templates</h2>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          Create Template
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 bg-gray-100 rounded-lg animate-pulse" />
          ))
        ) : templates.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg">
            <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No email templates found. Create your first template!</p>
          </div>
        ) : (
          templates.map((template) => (
            <div key={template.id} className="bg-white rounded-lg border p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{template.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{template.subject}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => {
                      setSelectedTemplate(template);
                      setIsViewModalOpen(true);
                    }}>
                      View Template
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      setSelectedTemplate(template);
                      setIsEditModalOpen(true);
                    }}>
                      Edit Template
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      setSelectedTemplate(template);
                      setIsDeleteModalOpen(true);
                    }}>
                      Delete Template
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      Send Test Email
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="text-sm text-gray-600 line-clamp-3 mb-4">
                {template.body}
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="w-4 h-4 mr-1" />
                  {template.send_instructions ? (
                    <span className="whitespace-normal break-words">{template.send_instructions}</span>
                  ) : (
                    <span>No send instructions</span>
                  )}
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(template.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <EmailTemplateForm
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateTemplate}
      />

      <EmailTemplateForm
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedTemplate(null);
        }}
        template={selectedTemplate || undefined}
        onSubmit={handleUpdateTemplate}
      />

      {selectedTemplate && (
        <>
          <ViewTemplateDialog
            isOpen={isViewModalOpen}
            onClose={() => {
              setIsViewModalOpen(false);
              setSelectedTemplate(null);
            }}
            template={selectedTemplate}
          />

          <DeleteConfirmDialog
            isOpen={isDeleteModalOpen}
            onClose={() => {
              setIsDeleteModalOpen(false);
              setSelectedTemplate(null);
            }}
            onConfirm={() => handleDeleteTemplate(selectedTemplate.id)}
            title={selectedTemplate.title}
          />
        </>
      )}
    </>
  );
}