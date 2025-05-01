import React, { useState, useEffect } from 'react';
import { RefreshCw, BarChart2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchApi } from '@/lib/api-config';
import ProviderStats from '@/components/ProviderStats';
import { Button } from '@/components/ui/button';

type Provider = {
  id: number;
  type: string;
  firstname: string;
  lastname: string;
  phone: string;
  email: string;
  address: string;
  licenseInfo: string;
  status: string;
  isContractSubmitted: boolean;
  contract: string | null;
  signature: string | null;
  rate: number | null;
  createdby: number | null;
  createdat: string;
  updatedby: number | null;
  updatedat: string | null;
  isActive: boolean;
};

export default function ProviderDirectory() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  const excludedProviders = [
    'Sally Provider',
    'SP',
    'Carley Cassity',
    'Jennifer',
    'Desirae',
    'Nadine',
    'Janice',
    'Lauren',
    'Jason Trujillo',
    'Shu',
    'Crystal',
    'Shruti'
  ];

  const fetchProviders = async () => {
    try {
      setIsRefreshing(true);
      const response = await fetchApi('/provider', { cache: 'no-store' });
      // Filter out excluded providers
      const filteredProviders = (response.payload || []).filter(
        (provider: Provider) => {
          const fullName = `${provider.firstname} ${provider.lastname}`.toLowerCase();
          return !excludedProviders.some(name => {
            const nameLower = name.toLowerCase();
            return fullName.includes(nameLower) || 
                   provider.firstname.toLowerCase() === nameLower ||
                   provider.lastname.toLowerCase() === nameLower;
          });
        }
      );
      setProviders(filteredProviders);
      setError(null);
    } catch (err) {
      setError('Failed to fetch providers');
      console.error('Error fetching providers:', err);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Fetch on mount only
  useEffect(() => { fetchProviders(); }, []);

  const filteredProviders = providers.filter(provider => {
    const searchLower = searchTerm.toLowerCase();
    return (
      provider.firstname.toLowerCase().includes(searchLower) ||
      provider.lastname.toLowerCase().includes(searchLower) ||
      provider.email.toLowerCase().includes(searchLower) ||
      provider.phone.toLowerCase().includes(searchLower) ||
      provider.address.toLowerCase().includes(searchLower)
    );
  });

  return (
    <>
      <div className="flex justify-between items-center mb-12 pt-5 md:pt-10">
        <h2 className="text-2xl font-bold">Provider Directory</h2>
        <Button asChild>
          <Link to="/provider-insights" className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4" />
            Provider Insights
          </Link>
        </Button>
      </div>
      
      <ProviderStats />

      <div className="bg-white rounded-lg border p-6 relative">
        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1">
            <span className="absolute left-3 top-2.5">🔍</span>
            <input
              type="text"
              placeholder="Search providers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-md"
            />
          </div>
          <button 
            onClick={fetchProviders}
            className="p-2 border rounded-md bg-white hover:bg-gray-50"
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  License Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Contract
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProviders.map((provider) => (
                <tr key={provider.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mr-3">
                        <span>{`${provider.firstname[0]}${provider.lastname[0]}`}</span>
                      </div>
                      <div>
                        <div className="font-medium">{`${provider.firstname} ${provider.lastname}`}</div>
                        <div className="text-sm text-gray-500">{provider.type}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div>{provider.email}</div>
                      <div className="text-sm text-gray-500">{provider.phone}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">{provider.address}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">{provider.licenseInfo}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      provider.status === 'Active' ? 'bg-green-100 text-green-800' :
                      provider.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {provider.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {provider.isContractSubmitted ? (
                        <span className="text-green-600">✓ Submitted</span>
                      ) : (
                        <span className="text-gray-400">Pending</span>
                      )}
                      {provider.contract && (
                        <button 
                          onClick={() => window.open(provider.contract, '_blank')}
                          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                          title="View Contract"
                        >
                          📄
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}