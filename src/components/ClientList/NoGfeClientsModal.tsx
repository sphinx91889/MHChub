import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader, 
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Building2, Calendar, Mail, Phone, ArrowLeft, Send, Loader2 } from 'lucide-react';

interface Client {
  id: number;
  contactName: string;
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  isActive: boolean;
  createdat: string;
}

interface NoGfeClientsModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  onClientClick: (client: Client) => void;
  isLoading: boolean;
  error: string | null;
}

export default function NoGfeClientsModal({
  isOpen,
  onClose,
  clients,
  onClientClick,
  isLoading,
  error
}: NoGfeClientsModalProps) {
  const [isSending, setIsSending] = React.useState(false);
  const [webhookError, setWebhookError] = React.useState<string | null>(null);
  const [webhookSuccess, setWebhookSuccess] = React.useState(false);

  const handleSendToWebhook = async () => {
    try {
      setIsSending(true);
      setWebhookError(null);
      setWebhookSuccess(false);

      // Prepare the data for the webhook
      const payload = {
        type: 'no_gfe_clients',
        timestamp: new Date().toISOString(),
        description: 'Active clients without GFEs in last 45 days',
        total_clients: clients.length,
        clients: clients.map(client => ({
          id: client.id,
          contact_name: client.contactName,
          company_name: client.companyName,
          email: client.companyEmail,
          phone: client.companyPhone,
          created_at: client.createdat,
          is_active: client.isActive
        }))
      };

      // Send to webhook
      const response = await fetch('https://services.leadconnectorhq.com/hooks/TeyeZ3MtpfxIZIDzupOT/webhook-trigger/f5b6dffa-e73a-4497-a12e-d0be418655f5', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.statusText}`);
      }

      setWebhookSuccess(true);
      setTimeout(() => setWebhookSuccess(false), 3000);
    } catch (err) {
      console.error('Error sending to webhook:', err);
      setWebhookError(err instanceof Error ? err.message : 'Failed to send data to webhook');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex flex-col gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="w-fit -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Client List
          </Button>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Clients without GFEs (45 Days)
            </DialogTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {clients.length} clients
              </span>
              <Button
                onClick={handleSendToWebhook}
                disabled={isSending || clients.length === 0}
                className={`flex items-center gap-2 ${webhookSuccess ? 'bg-green-600 hover:bg-green-700' : ''}`}
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {webhookSuccess ? 'Sent!' : 'Send to Webhook'}
              </Button>
            </div>
          </div>
        </DialogHeader>

        {webhookError && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg text-sm">
            {webhookError}
          </div>
        )}

        {error ? (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600">All clients have recent GFEs!</p>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-700">
              The following clients haven't had any GFEs completed in the last 45 days.
              Consider reaching out to schedule follow-ups.
            </p>

            {clients.map((client) => (
              <div
                key={client.id}
                className="p-4 bg-white border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => onClientClick(client)}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium">
                    {(client.contactName || 'NA').substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-lg">{client.contactName || 'N/A'}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Building2 className="w-4 h-4" />
                        <span>{client.companyName || 'No Company'}</span>
                      </div>
                      {client.companyEmail && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail className="w-4 h-4" />
                          <a
                            href={`mailto:${client.companyEmail}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {client.companyEmail}
                          </a>
                        </div>
                      )}
                      {client.companyPhone && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="w-4 h-4" />
                          <span>{client.companyPhone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>Created: {new Date(client.createdat).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}