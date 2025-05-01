import React from 'react';
import { DollarSign } from 'lucide-react';

interface Client {
  id: number;
  contactName: string;
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  isActive: boolean;
  createdat: string;
  invoice_status: string | null;
}

interface ClientListTableProps {
  clients: Client[];
  onClientClick: (client: Client) => void;
  onInvoiceClick: (client: Client) => void;
}

export default function ClientListTable({
  clients,
  onClientClick,
  onInvoiceClick
}: ClientListTableProps) {
  return (
    <table className="w-full">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created At</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {clients.map((client) => (
          <tr key={client.id} className="hover:bg-gray-50">
            <td className="px-6 py-4">
              <div className="font-mono text-sm text-gray-600">{client.id}</div>
            </td>
            <td className="px-6 py-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mr-3">
                  <span className="cursor-pointer" onClick={() => onClientClick(client)}>
                    {(client.contactName || 'NA').substring(0, 2).toUpperCase()}
                  </span>
                </div>
                <div 
                  className="cursor-pointer group" 
                  onClick={() => onClientClick(client)}
                >
                  <div className="font-medium text-blue-600 group-hover:text-blue-800 transition-colors">
                    {client.contactName || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-500 truncate max-w-[200px]">{client.companyName || 'No Company'}</div>
                </div>
              </div>
            </td>
            <td className="px-6 py-4">
              <div className="truncate max-w-[200px]">{client.companyEmail || 'N/A'}</div>
            </td>
            <td className="px-6 py-4">
              <div className="truncate max-w-[150px]">{client.companyPhone || 'N/A'}</div>
            </td>
            <td className="px-6 py-4">
              <div className="truncate max-w-[200px]">{client.companyName || 'N/A'}</div>
            </td>
            <td className="px-6 py-4">
              {new Date(client.createdat).toLocaleDateString()}
            </td>
            <td className="px-6 py-4">
              <span className={`px-2 py-1 text-xs rounded-full ${
                client.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {client.isActive ? 'Active' : 'Inactive'}
              </span>
            </td>
            <td className="px-6 py-4">
              <div className="flex gap-2">
                <button 
                  className="p-2 hover:bg-gray-100 rounded-full" 
                  title="View Invoices"
                  onClick={(e) => {
                    e.stopPropagation();
                    onInvoiceClick(client);
                  }}
                >
                  <DollarSign className="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}