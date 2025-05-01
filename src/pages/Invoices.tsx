import React, { useState, useEffect } from 'react';
import { RefreshCw, DollarSign, Building2, Calendar, Upload } from 'lucide-react';
import { fetchApi } from '@/lib/api-config';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface Invoice {
  id: number;
  customerId: number;
  companyName: string;
  clientEmail?: string;
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

interface Client {
  id: number;
  contactName: string;
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  isActive: boolean;
  createdat: string;
  updatedat: string | null;
}

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [webhookError, setWebhookError] = useState<string | null>(null);

  const fetchInvoices = async () => {
    try {
      setIsRefreshing(true);
      console.log('Fetching invoices and clients...');
      
      // Fetch both invoices and clients in parallel
      const [invoicesResponse, clientsResponse] = await Promise.all([
        fetchApi('/invoice/?status=unpaid'),
        fetchApi('/customer')
      ]);
      
      console.log('API Response - Invoices:', invoicesResponse);
      console.log('API Response - Clients:', clientsResponse);

      const invoicesData = invoicesResponse.payload || [];
      const clientsData = clientsResponse.payload || [];

      // Create a map of client IDs to emails for quick lookup
      const clientEmailMap = clientsData.reduce((map: Record<number, string>, client: Client) => {
        map[client.id] = client.companyEmail;
        return map;
      }, {});

      // Merge invoice data with client emails
      const invoicesWithEmails = invoicesData.map((invoice: Invoice) => ({
        ...invoice,
        clientEmail: clientEmailMap[invoice.customerId]
      }));

      setInvoices(invoicesWithEmails);
      setError(null);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError('Failed to load invoices');
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      setError(null);
      setWebhookError(null);
      
      // Transform invoices into the format for invoice_sync table
      const syncData = invoices.map(invoice => ({
        invoice_id: invoice.id,
        customer_id: invoice.customerId,
        company_name: invoice.companyName,
        amount: invoice.payableAmount,
        due_date: invoice.duedate,
        status: invoice.status,
        email: invoice.clientEmail,
        metadata: {
          locations: invoice.locations,
          gfe_count: invoice.gfeCount,
          paid_amount: invoice.paidAmount,
          discount: invoice.discount,
          ref_no: invoice.refNo
        }
      }));
      
      // Upsert records to invoice_sync table
      const { error: upsertError } = await supabase
        .from('invoice_sync')
        .upsert(syncData, {
          onConflict: 'invoice_id',
          ignoreDuplicates: false
        });

      if (upsertError) {
        throw upsertError;
      }
      
      // Call the sync-invoice-status edge function
      const response = await fetch(`${supabaseUrl}/functions/v1/sync-invoice-status`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabase.supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to sync invoices');
      }
      
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3000);
    } catch (err) {
      setError(`Failed to sync invoices: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-8 pt-5 md:pt-10">
        <div>
          <h2 className="text-2xl font-bold">Unpaid Invoices</h2>
          <p className="text-gray-500 mt-1">Manage and track unpaid invoices</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleSync} 
            disabled={isSyncing || isRefreshing}
            className={cn(
              "flex items-center gap-2",
              syncSuccess && "bg-green-600 hover:bg-green-700"
            )}
          >
            {isSyncing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {syncSuccess ? "Synced!" : "Sync Invoices"}
          </Button>
          <Button onClick={fetchInvoices} disabled={isRefreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="glass hover:shadow-glass-hover transition-all duration-300">
          <div className="p-6 border-l-4 border-l-blue-500">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-2xl font-bold">
                  {invoices.length}
                </div>
                <div className="text-gray-500">Total Invoices</div>
                <div className="text-sm text-blue-600 mt-1">Pending Payment</div>
              </div>
              <DollarSign className="w-5 h-5 text-blue-500" />
            </div>
          </div>
        </Card>

        <Card className="glass hover:shadow-glass-hover transition-all duration-300">
          <div className="p-6 border-l-4 border-l-green-500">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-2xl font-bold">
                  {formatCurrency(invoices.reduce((sum, inv) => sum + inv.amountDue, 0))}
                </div>
                <div className="text-gray-500">Total Amount Due</div>
                <div className="text-sm text-green-600 mt-1">Outstanding Balance</div>
              </div>
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
          </div>
        </Card>

        <Card className="glass hover:shadow-glass-hover transition-all duration-300">
          <div className="p-6 border-l-4 border-l-purple-500">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-2xl font-bold">
                  {invoices.reduce((sum, inv) => sum + inv.gfeCount, 0)}
                </div>
                <div className="text-gray-500">Total GFEs</div>
                <div className="text-sm text-purple-600 mt-1">Across All Invoices</div>
              </div>
              <Building2 className="w-5 h-5 text-purple-500" />
            </div>
          </div>
        </Card>

        <Card className="glass hover:shadow-glass-hover transition-all duration-300">
          <div className="p-6 border-l-4 border-l-yellow-500">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-2xl font-bold">
                  {formatCurrency(invoices.reduce((sum, inv) => sum + (inv.discount || 0), 0))}
                </div>
                <div className="text-gray-500">Total Discounts</div>
                <div className="text-sm text-yellow-600 mt-1">Applied Credits</div>
              </div>
              <Calendar className="w-5 h-5 text-yellow-500" />
            </div>
          </div>
        </Card>
      </div>

      {error ? (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
          {webhookError && (
            <div className="mt-2 text-sm">
              <pre className="whitespace-pre-wrap text-red-600">{webhookError}</pre>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium">
                            {invoice.companyName.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {invoice.companyName}
                          </div>
                          {invoice.clientEmail && (
                            <a 
                              href={`mailto:${invoice.clientEmail}`}
                              className="text-sm text-blue-600 hover:text-blue-800"
                            >
                              {invoice.clientEmail}
                            </a>
                          )}
                          <div className="text-sm text-gray-500">
                            {invoice.locations}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        Invoice #{invoice.id}
                      </div>
                      <div className="text-sm text-gray-500">
                        {invoice.gfeCount} GFEs
                      </div>
                      <div className="text-sm text-gray-500">
                        Created: {formatDate(invoice.invoiceDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(invoice.amountDue)}
                      </div>
                      {invoice.discount && (
                        <div className="text-sm text-green-600">
                          -{formatCurrency(invoice.discount)} discount
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {formatDate(invoice.duedate)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(invoice.duedate) < new Date() ? 'Overdue' : 'Due'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        {invoice.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}