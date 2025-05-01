import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader, 
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Building2, Calendar, Mail, Phone, ArrowLeft } from 'lucide-react';

interface Client {
  id: number;
  contactName: string;
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  isActive: boolean;
  createdat: string;
  status: string;
  isContractSubmitted: boolean | null;
  contract: string | null;
  stripePaymentMethodId: string | null;
}

interface InactiveClientsModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  isLoading: boolean;
  error: string | null;
}

interface InactiveStats {
  total: number;
  noContract: number;
  noPayment: number;
  pendingApproval: number;
}

type FilterType = 'all' | 'no-contract' | 'no-payment';

export default function InactiveClientsModal({
  isOpen,
  onClose,
  clients,
  isLoading,
  error
}: InactiveClientsModalProps) {
  const [activeFilter, setActiveFilter] = React.useState<FilterType>('all');

  const stats: InactiveStats = React.useMemo(() => {
    return {
      total: clients.length,
      noContract: clients.filter(c => !c.isContractSubmitted).length,
      noPayment: clients.filter(c => !c.stripePaymentMethodId).length,
      pendingApproval: clients.filter(c => c.status === 'pending').length
    };
  }, [clients]);

  const filteredClients = React.useMemo(() => {
    switch (activeFilter) {
      case 'no-contract':
        return clients.filter(c => !c.isContractSubmitted);
      case 'no-payment':
        return clients.filter(c => !c.stripePaymentMethodId);
      default:
        return clients;
    }
  }, [clients, activeFilter]);

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
            Back to Dashboard
          </Button>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              Inactive Clients
              {activeFilter !== 'all' && (
                <span className="text-sm font-normal text-gray-500">
                  ({activeFilter === 'no-contract' ? 'No Contract' : 'No Payment Method'})
                </span>
              )}
            </DialogTitle>
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {filteredClients.length} clients
            </span>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Inactive</div>
          </div>
          <div 
            className="bg-red-50 p-4 rounded-lg cursor-pointer hover:bg-red-100 transition-colors"
            onClick={() => setActiveFilter(activeFilter === 'no-contract' ? 'all' : 'no-contract')}
          >
            <div className="text-2xl font-bold text-red-700">{stats.noContract}</div>
            <div className="text-sm text-red-600">No Contract</div>
            {activeFilter === 'no-contract' && (
              <div className="text-xs text-red-500 mt-1">✓ Filtered</div>
            )}
          </div>
          <div 
            className="bg-yellow-50 p-4 rounded-lg cursor-pointer hover:bg-yellow-100 transition-colors"
            onClick={() => setActiveFilter(activeFilter === 'no-payment' ? 'all' : 'no-payment')}
          >
            <div className="text-2xl font-bold text-yellow-700">{stats.noPayment}</div>
            <div className="text-sm text-yellow-600">No Payment Method</div>
            {activeFilter === 'no-payment' && (
              <div className="text-xs text-yellow-500 mt-1">✓ Filtered</div>
            )}
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-orange-700">{stats.pendingApproval}</div>
            <div className="text-sm text-orange-600">Pending Approval</div>
          </div>
        </div>

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
            <p className="text-gray-600">No inactive clients found</p>
          </div>
        ) : (
          <div className="space-y-4 overflow-y-auto flex-1 pr-2">
            {filteredClients.map((client) => (
              <div
                key={client.id}
                className="p-4 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
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
                      <div className="col-span-2 mt-2 flex flex-wrap gap-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          client.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          Status: {client.status || 'Pending'}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          client.isContractSubmitted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          Contract: {client.isContractSubmitted ? 'Submitted' : 'Pending'}
                        </span>
                        <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                          Status: Inactive
                        </span>
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