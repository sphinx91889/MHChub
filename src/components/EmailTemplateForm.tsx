import React from 'react';
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
import { useEffect } from "react";

const formSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  subject: z.string().min(2, {
    message: "Subject must be at least 2 characters.",
  }),
  body: z.string().min(10, {
    message: "Body must be at least 10 characters.",
  }),
  send_instructions: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface EmailTemplateFormProps {
  isOpen: boolean;
  onClose: () => void;
  template?: {
    id: string;
    title: string;
    subject: string;
    body: string;
    send_instructions?: string;
  };
  onSubmit: (values: FormData) => void;
}

export default function EmailTemplateForm({ isOpen, onClose, template, onSubmit }: EmailTemplateFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (template) {
      form.reset({
        title: template.title,
        subject: template.subject,
        body: template.body,
        send_instructions: template.send_instructions || "",
      });
    } else {
      form.reset({
      title: template?.title || "",
      subject: template?.subject || "",
      body: template?.body || "",
      send_instructions: template?.send_instructions || "",
      });
    }
  }, [template, form]);

  const handleSubmit = (values: FormData) => {
    onSubmit(values);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{template ? "Edit Template" : "Create Template"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name
                </label>
                <input
                  {...form.register("title")}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Enter template name"
                />
                {form.formState.errors.title && (
                  <p className="mt-1 text-sm text-red-600">{form.formState.errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject Line
                </label>
                <input
                  {...form.register("subject")}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Enter email subject"
                />
                {form.formState.errors.subject && (
                  <p className="mt-1 text-sm text-red-600">{form.formState.errors.subject.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  {...form.register("body")}
                  rows={4}
                  className="w-full px-3 py-2 border rounded-md resize-none"
                  placeholder="Enter email message"
                />
                {form.formState.errors.body && (
                  <p className="mt-1 text-sm text-red-600">{form.formState.errors.body.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                When to Send
              </label>
              <textarea
                {...form.register("send_instructions")}
                rows={8}
                className="w-full px-3 py-2 border rounded-md resize-none"
                placeholder="Enter instructions for when this email should be sent (e.g., '3 days after client onboarding' or 'When client hasn't responded in 2 weeks')"
              />
              <p className="mt-1 text-sm text-gray-500">
                Provide clear instructions for when staff should send this email
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {template ? "Update Template" : "Create Template"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}