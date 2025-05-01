import React from 'react';
import { API_TOKEN } from '@/lib/api-config';
import {
  Dialog,
  DialogContent,
  DialogHeader, 
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, DollarSign, AlertCircle, ArrowLeft, FileText } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface Client {
  id: number;
  contactName: string;
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  isActive: boolean;
  stripePaymentMethodId: string | null;
  contract: string | null;
  isContractSubmitted: boolean;
  businessWebsite: string | null;
  createdat: string;
}

interface GFE {
  id: number;
  gfeId: string;
  firstname: string;
  lastname: string;
  dob: string;
  status: string;
  evaluatedBy: string | null;
  queuedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  approvedTreatments: string | null;
  deniedTreatments: string | null;
}

interface ClientDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  source?: 'no-gfe' | 'client-list';
  client: Client | null;
  gfes: GFE[];
  isLoading: boolean;
  error: string | null;
  onInvoiceClick: (client: Client) => void;
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

export default function ClientDetailsModal({
  isOpen,
  onClose,
  source = 'client-list',
  client,
  gfes,
  isLoading,
  error,
  onInvoiceClick
}: ClientDetailsModalProps) {
  const [hasRecentGFE, setHasRecentGFE] = React.useState(false);
  const [clientDetails, setClientDetails] = React.useState<any>(null);

  const calculateGrade = (startedAt: string, completedAt: string) => {
    const durationSeconds = Math.round(
      (new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 1000
    );
    
    if (durationSeconds <= 120) return { grade: 'A', color: 'bg-green-100 text-green-800' };
    if (durationSeconds <= 240) return { grade: 'B', color: 'bg-blue-100 text-blue-800' };
    if (durationSeconds <= 360) return { grade: 'C', color: 'bg-yellow-100 text-yellow-800' };
    if (durationSeconds <= 480) return { grade: 'D', color: 'bg-orange-100 text-orange-800' };
    return { grade: 'F', color: 'bg-red-100 text-red-800' };
  };

  const FORTY_FIVE_DAYS_MS = 45 * 24 * 60 * 60 * 1000; // 45 days in milliseconds

  const fetchClientDetails = async (clientId: number) => {
    try {
      const response = await fetch(`https://app.healthcoversonline.com/api/customer/${clientId}`, {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Accept': 'application/json'
        }
      });
      const data = await response.json();
      setClientDetails(data.payload);
    } catch (err) {
      console.error('Error fetching client details:', err);
    }
  };

  React.useEffect(() => {
    if (gfes.length > 0) {
      const fortyFiveDaysAgo = Date.now() - FORTY_FIVE_DAYS_MS;
      const recentGFE = gfes.some(gfe => {
        const gfeDate = new Date(gfe.completedAt || gfe.startedAt || '').getTime();
        return !isNaN(gfeDate) && gfeDate > fortyFiveDaysAgo;
      });
      setHasRecentGFE(recentGFE);
    } else {
      setHasRecentGFE(false);
    }
  }, [gfes]);

  React.useEffect(() => {
    if (client?.id) {
      fetchClientDetails(client.id);
    }
  }, [client?.id]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex flex-col gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onClose();
              if (source === 'no-gfe') {
                // Don't close the NoGfeClientsModal
                return;
              }
            }}
            className="w-fit -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {source === 'no-gfe' ? 'Back to Clients without Recent GFEs' : 'Back to Client List'}
          </Button>
          <DialogTitle>Client Details & Good Faith Exams (GFEs)</DialogTitle>
        </DialogHeader>
        
        {client && (
          <div className="space-y-6 overflow-y-auto flex-1 pr-2">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Client Details</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Customer ID:</span> <span className="font-mono">{client.id}</span></p>
                  <p><span className="font-medium">Name:</span> {client.contactName}</p>
                  <p><span className="font-medium">Email:</span> {client.companyEmail}</p>
                  <p><span className="font-medium">Phone:</span> {client.companyPhone}</p>
                  {client.clientId && (
                    <p><span className="font-medium">Client ID:</span> <span className="font-mono">{client.clientId}</span></p>
                  )}
                  {client.secretId && (
                    <p><span className="font-medium">Secret ID:</span> <span className="font-mono">{client.secretId}</span></p>
                  )}
                  {client.businessWebsite && (
                    <p>
                      <span className="font-medium">Website:</span>{' '}
                      <a 
                        href={client.businessWebsite}
                        target="_blank"
                        rel="noopener noreferrer" 
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {client.businessWebsite}
                      </a>
                    </p>
                  )}
                  {client.stripePaymentMethodId && (
                    <p>
                      <span className="font-medium">Payment Method ID:</span>{' '}
                      <span className="font-mono text-sm">{client.stripePaymentMethodId}</span>
                    </p>
                  )}
                  <p>
                    <span className="font-medium">Contract Status:</span>{' '}
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                      client.isContractSubmitted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {client.isContractSubmitted ? 'Submitted' : 'Pending'}
                    </span>
                  </p>
                  {client.contract && (
                    <p>
                      <span className="font-medium">Contract:</span>{' '}
                      <a 
                        href={client.contract}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <FileText className="w-4 h-4" />
                        View Contract
                      </a>
                    </p>
                  )}
                  <div className="mt-4">
                    <Button
                      onClick={() => onInvoiceClick(client)}
                      className="flex items-center gap-2"
                    >
                      <DollarSign className="w-4 h-4" />
                      View Invoices
                    </Button>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Company Details</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Company:</span> {client.companyName}</p>
                  <p><span className="font-medium">Status:</span> {client.isActive ? 'Active' : 'Inactive'}</p>
                  <p><span className="font-medium">Created:</span> {new Date(client.createdat).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {clientDetails?.medicalDirector && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Medical Director</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Name:</span> {clientDetails.medicalDirector.firstname} {clientDetails.medicalDirector.lastname}</p>
                  <p><span className="font-medium">License:</span> {clientDetails.medicalDirector.licenseType}</p>
                  <p><span className="font-medium">Email:</span> {clientDetails.medicalDirector.email}</p>
                  <p><span className="font-medium">Phone:</span> {clientDetails.medicalDirector.phone}</p>
                </div>
              </div>
            )}

            {clientDetails?.companyAddress && clientDetails.companyAddress.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Locations & Tiers</h3>
                <div className="space-y-4">
                  {clientDetails.companyAddress.map((location: any) => (
                    <div key={location.customerLocationId} className="p-4 bg-gray-50 rounded-lg">
                      <p className="font-medium mb-2">{location.city}, {location.state}</p>
                      <p className="text-sm text-gray-600">{location.streetname} {location.appartmentNumber}</p>
                      
                      {location.tiers.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-700 mb-1">Treatment Tiers:</p>
                          <div className="grid grid-cols-3 gap-2">
                            {location.tiers.map((tier: any) => (
                              <div key={tier.id} className="p-2 bg-blue-50 rounded">
                                <p className="text-xs font-medium text-blue-700">{tier.tier}</p>
                                <p className="text-xs text-gray-600">Rate: ${tier.rate}</p>
                                <p className="text-xs text-gray-600">Count: {tier.treatmentCount}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {location.discountTiers.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-700 mb-1">Discount Tiers:</p>
                          <div className="grid grid-cols-2 gap-2">
                            {location.discountTiers.map((tier: any) => (
                              <div key={tier.id} className="p-2 bg-green-50 rounded">
                                <p className="text-xs font-medium text-green-700">{tier.tier}</p>
                                <p className="text-xs text-gray-600">Discount: {tier.discount}%</p>
                                <p className="text-xs text-gray-600">GFE Count: {tier.gfeCount}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-lg font-medium mb-4">Good Faith Exams (GFEs)</h3>
              {!hasRecentGFE && gfes.length > 0 && (
                <div className="flex items-center gap-2 p-4 mb-4 bg-yellow-50 text-yellow-700 rounded-lg">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>No GFEs completed in the last 45 days</span>
                </div>
              )}
              
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                </div>
              ) : error ? (
                <div className="p-4 bg-red-50 text-red-700 rounded-lg">
                  {error}
                </div>
              ) : gfes.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-600">No GFEs found for this client</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {gfes.map((gfe) => (
                    <div key={gfe.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">GFE #{gfe.gfeId}</div>
                          <div className="text-sm text-gray-500">
                            Patient: {gfe.firstname} {gfe.lastname}
                          </div>
                          <div className="text-sm text-gray-500">
                            DOB: {gfe.dob}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            gfe.status === 'completed' ? 'bg-green-100 text-green-800' :
                            gfe.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {gfe.status}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p><span className="font-medium">Provider:</span> {gfe.evaluatedBy || 'Not assigned'}</p>
                          {gfe.queuedAt && (
                            <p><span className="font-medium">Queued:</span> {new Date(gfe.queuedAt).toLocaleString()}</p>
                          )}
                          {gfe.startedAt && (
                            <>
                              <p><span className="font-medium">Started:</span> {new Date(gfe.startedAt).toLocaleString()}</p>
                              {gfe.completedAt && (
                                <>
                                  <p><span className="font-medium">Completed:</span> {new Date(gfe.completedAt).toLocaleString()}</p>
                                  <p>
                                    <span className="font-medium">Duration:</span>{' '}
                                    {(() => {
                                      const durationSeconds = Math.round(
                                        (new Date(gfe.completedAt).getTime() - new Date(gfe.startedAt).getTime()) / 1000
                                      );
                                      const minutes = Math.floor(durationSeconds / 60);
                                      const seconds = durationSeconds % 60;
                                      return `${minutes}m ${seconds}s`;
                                    })()}
                                  </p>
                                  <p>
                                    <span className="font-medium">Grade:</span>{' '}
                                    {(() => {
                                      const { grade, color } = calculateGrade(gfe.startedAt, gfe.completedAt);
                                      return (
                                        <span className={`px-2 py-1 rounded-full text-xs ${color}`}>
                                          {grade}
                                        </span>
                                      );
                                    })()}
                                  </p>
                                </>
                              )}
                            </>
                          )}
                        </div>
                        <div>
                          {gfe.approvedTreatments && (
                            <div>
                              <p className="font-medium mb-1">Approved Treatments:</p>
                              <div className="flex flex-wrap gap-1">
                                {gfe.approvedTreatments.split(',').map((treatment, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs"
                                  >
                                    {treatment.trim()}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {gfe.deniedTreatments && (
                            <div className="mt-2">
                              <p className="font-medium mb-1">Denied Treatments:</p>
                              <div className="flex flex-wrap gap-1">
                                {gfe.deniedTreatments.split(',').map((treatment, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-1 bg-red-50 text-red-700 rounded-full text-xs"
                                  >
                                    {treatment.trim()}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}