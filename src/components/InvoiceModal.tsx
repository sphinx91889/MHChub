import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"; 
import { fetchApi } from '@/lib/api-config';
import { Loader2, FileText, Download, ArrowLeft } from 'lucide-react';
import { format, subMonths } from 'date-fns';
import { Button } from "@/components/ui/button";
import { jsPDF } from 'jspdf';
import { formatDuration } from '@/lib/utils';

interface Invoice {
  id: number;
  customerId: number;
  companyName: string;
  currency: string;
  streetname: string;
  gfeCount: number;
  locations: string;
  duedate: string;
  payableAmount: number;
  paidAmount: number;
  invoiceDate: string;
  paymentDate: string | null;
  refNo: string | null;
  discount: number | null;
  status: string;
  amountDue: number;
}

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: number;
  companyName: string;
}

interface GFE {
  id: number;
  gfeId: string;
  firstname: string;
  lastname: string;
  status: string;
  evaluatedBy: string | null;
  startedAt: string | null;
  completedAt: string | null;
  approvedTreatments: string | null;
  deniedTreatments: string | null;
  queuedAt: string | null;
}

interface GFEModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  gfes: GFE[];
  isLoading: boolean;
  error: string | null;
}

const generatePDF = (invoice: Invoice, gfes: GFE[]) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Add header
  doc.setFontSize(14);
  doc.text(`GFE Report - Invoice #${invoice.id}`, pageWidth / 2, 20, { align: 'center' });
  
  // Add invoice details
  doc.setFontSize(10);
  doc.text(`Company: ${invoice.companyName}`, 20, 40);
  doc.text(`Invoice Date: ${new Date(invoice.invoiceDate).toLocaleDateString()}`, 20, 50);
  doc.text(`Amount: $${invoice.payableAmount.toFixed(2)}`, 20, 60);
  doc.text(`Status: ${invoice.status}`, 20, 70);
  
  // Add GFE table
  let yPos = 90;
  doc.setFontSize(12);
  doc.text('Good Faith Exams', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;
  
  gfes.forEach((gfe, index) => {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(10);
    doc.text(`GFE #${gfe.gfeId}`, 20, yPos);
    yPos += 7;
    doc.setFontSize(8);
    doc.text(`Patient: ${gfe.firstname} ${gfe.lastname}`, 30, yPos);
    yPos += 7;
    doc.text(`Status: ${gfe.status}`, 30, yPos);
    yPos += 7;
    if (gfe.evaluatedBy) {
      doc.text(`Provider: ${gfe.evaluatedBy}`, 30, yPos);
      yPos += 7;
    }
    if (gfe.startedAt) {
      doc.text(`Started: ${new Date(gfe.startedAt).toLocaleString()}`, 30, yPos);
      yPos += 7;
    }
    if (gfe.completedAt) {
      doc.text(`Completed: ${new Date(gfe.completedAt).toLocaleString()}`, 30, yPos);
      yPos += 7;
    }
    if (gfe.approvedTreatments) {
      doc.text('Approved Treatments:', 30, yPos);
      yPos += 7;
      const treatments = gfe.approvedTreatments.split(',').map(t => t.trim());
      treatments.forEach(treatment => {
        doc.text(`• ${treatment}`, 35, yPos);
        yPos += 7;
      });
    }
    if (gfe.deniedTreatments) {
      doc.text('Denied Treatments:', 30, yPos);
      yPos += 7;
      const treatments = gfe.deniedTreatments.split(',').map(t => t.trim());
      treatments.forEach(treatment => {
        doc.text(`• ${treatment}`, 35, yPos);
        yPos += 7;
      });
    }
    yPos += 10;
  });
  
  // Save the PDF
  doc.save(`invoice-${invoice.id}-gfes.pdf`);
};

function GFEModal({ isOpen, onClose, invoice, gfes, isLoading, error }: GFEModalProps) {
  const formatWaitTime = (queuedAt: string | null, startedAt: string | null): string => {
    if (!queuedAt || !startedAt) return 'N/A';
    const waitTimeMs = new Date(startedAt).getTime() - new Date(queuedAt).getTime();
    return formatDuration(Math.round(waitTimeMs / 1000));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Invoices
              </Button>
              <DialogTitle>GFEs for Invoice #{invoice?.id}</DialogTitle>
            </div>
            {invoice && gfes.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => generatePDF(invoice, gfes)}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </Button>
            )}
          </div>
        </DialogHeader>
        
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
            <p className="text-gray-600">No GFEs found for this invoice period</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {gfes.map((gfe) => (
              <div key={gfe.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">GFE #{gfe.gfeId}</div>
                    <div className="text-sm text-gray-500">
                      Patient: {gfe.firstname} {gfe.lastname}
                    </div>
                    <div className="text-sm text-gray-500">
                      Wait Time: {formatWaitTime(gfe.queuedAt, gfe.startedAt)}
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
                    {gfe.startedAt && (
                      <>
                        <p><span className="font-medium">Started:</span> {new Date(gfe.startedAt).toLocaleString()}</p>
                        {gfe.completedAt && (
                          <p><span className="font-medium">Completed:</span> {new Date(gfe.completedAt).toLocaleString()}</p>
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
      </DialogContent>
    </Dialog>
  );
}

export default function InvoiceModal({ isOpen, onClose, customerId, companyName }: InvoiceModalProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isGFEModalOpen, setIsGFEModalOpen] = useState(false);
  const [gfes, setGFEs] = useState<GFE[]>([]);
  const [isLoadingGFEs, setIsLoadingGFEs] = useState(false);
  const [gfeError, setGFEError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setIsLoading(true);
        const response = await fetchApi(`/invoice/?customerid=${customerId}`);
        setInvoices(response.payload || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching invoices:', err);
        setError('Failed to load invoices');
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen && customerId) {
      fetchInvoices();
    }
  }, [isOpen, customerId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleViewGFEs = async (invoice: Invoice) => {
    try {
      setSelectedInvoice(invoice);
      setIsGFEModalOpen(true);
      setIsLoadingGFEs(true);
      setGFEError(null);
      setGFEs([]); // Reset GFEs before fetching new ones

      // Get the start and end of the PREVIOUS month relative to the invoice date
      const invoiceDate = new Date(invoice.invoiceDate);
      const previousMonth = subMonths(invoiceDate, 1);
      const startOfMonth = format(new Date(previousMonth.getFullYear(), previousMonth.getMonth(), 1), "yyyy-MM-dd'T'00:00:00xxx");
      const endOfMonth = format(new Date(previousMonth.getFullYear(), previousMonth.getMonth() + 1, 0), "yyyy-MM-dd'T'23:59:59xxx");

      console.log('Fetching GFEs with params:', {
        startOfMonth,
        endOfMonth,
        customerId
      });

      try {
        const response = await fetchApi('/gfe', {
          fromCompletedAt: startOfMonth,
          toCompletedAt: endOfMonth,
          customerid: customerId.toString(),
          pageSize: 100
        });

        // Handle both successful responses and "not found" cases
        if (response && response.payload) {
          setGFEs(response.payload);
        } else {
          setGFEs([]);
        }
        setGFEError(null);
      } catch (err: any) {
        // If the error is a 404, treat it as "no GFEs found"
        if (err.status === 404) {
          setGFEs([]);
          setGFEError(null);
        } else {
          console.error('Error fetching GFEs:', err);
          setGFEError('Failed to load GFEs. Please try again.');
          setGFEs([]);
        }
      }
    } catch (err) {
      console.error('Error in handleViewGFEs:', err);
      setGFEError('An unexpected error occurred. Please try again.');
      setGFEs([]);
    } finally {
      setIsLoadingGFEs(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Invoices - {companyName}</DialogTitle>
        </DialogHeader>

        {error ? (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600">No invoices found for this client</p>
          </div>
        ) : (
          <div className="overflow-x-auto flex-1">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Invoice #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Due Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    GFEs
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="font-mono">{invoice.id}</div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewGFEs(invoice)}
                        className="mt-1 text-xs flex items-center gap-1 text-primary-600"
                      >
                        <FileText className="w-3 h-3" />
                        View GFEs
                      </Button>
                      {invoice.refNo && (
                        <div className="text-xs text-gray-500 mt-1">
                          Ref: {invoice.refNo}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {formatDate(invoice.invoiceDate)}
                    </td>
                    <td className="px-4 py-4">
                      {formatDate(invoice.duedate)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium">
                        {formatCurrency(invoice.payableAmount)}
                      </div>
                      {invoice.discount && (
                        <div className="text-sm text-green-600">
                          -{formatCurrency(invoice.discount)} discount
                        </div>
                      )}
                      {invoice.paidAmount > 0 && (
                        <div className="text-sm text-gray-500">
                          Paid: {formatCurrency(invoice.paidAmount)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        invoice.status === 'paid' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {invoice.status}
                      </span>
                      {invoice.paymentDate && (
                        <div className="text-xs text-gray-500 mt-1">
                          Paid on {formatDate(invoice.paymentDate)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm">
                        {invoice.gfeCount} GFEs
                      </div>
                      <div className="text-xs text-gray-500">
                        {invoice.locations}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
      
      <GFEModal
        isOpen={isGFEModalOpen}
        onClose={() => setIsGFEModalOpen(false)}
        invoice={selectedInvoice}
        gfes={gfes}
        isLoading={isLoadingGFEs}
        error={gfeError}
      />
    </Dialog>
  );
}