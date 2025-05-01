import React, { useState, useEffect } from 'react';
import { Filter, SortDesc, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { twMerge } from 'tailwind-merge';
import Modal from '../components/Modal';
import AverageWaitTimeCards from '@/components/AverageWaitTimeCards';
import { fetchApi } from '@/lib/api-config';
import GFEStats from '@/components/GFEStats';
import { format, subDays } from 'date-fns';
import { usePersistentState } from '@/hooks/usePersistentState';
import NoGfeClientsModal from '@/components/NoGfeClientsModal';
import InactiveClientsModal from '@/components/InactiveClientsModal';

type Client = {
  id: number;
  contactName: string;
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  isActive: boolean;
  createdat: string;
  updatedat: string | null;
};

type FilterStatus = 'all' | 'active' | 'inactive';
type DateFilter = 'all' | '7days' | '30days' | '90days';
type SortField = 'name' | 'date';
type SortOrder = 'asc' | 'desc';

export default function Dashboard() {
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [sortModalOpen, setSortModalOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [contractPendingCount, setContractPendingCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = usePersistentState('dashboardPage', 1);
  const [totalPages, setTotalPages] = useState(1);
  const [noGfeCount, setNoGfeCount] = useState(0);
  const [isNoGfeModalOpen, setIsNoGfeModalOpen] = useState(false);
  const [noGfeClients, setNoGfeClients] = useState<Client[]>([]);
  const [isLoadingNoGfe, setIsLoadingNoGfe] = useState(false);
  const [noGfeError, setNoGfeError] = useState<string | null>(null);
  const [isInactiveModalOpen, setIsInactiveModalOpen] = useState(false);
  const itemsPerPage = 5;
  const [newClientsCount, setNewClientsCount] = useState<number | null>(null);

  const handleInactiveClick = () => {
    setIsInactiveModalOpen(true);
  };

  const fetchNewClientsCount = async () => {
    try {
      const now = new Date();
      const startOfMonth = format(new Date(now.getFullYear(), now.getMonth(), 1), "yyyy-MM-dd'T'00:00:00xxx");
      const endOfMonth = format(new Date(now.getFullYear(), now.getMonth() + 1, 0), "yyyy-MM-dd'T'23:59:59xxx");
      
      const response = await fetchApi(`/customer/count-report?status=approved&fromCreatedAt=${startOfMonth}&toCreatedAt=${endOfMonth}`);
      setNewClientsCount(response.payload?.count || 0);
    } catch (err) {
      console.error('Error fetching new clients count:', err);
      setNewClientsCount(0);
    }
  };

  const handleNoGfeClick = async () => {
    try {
      setIsNoGfeModalOpen(true);
      setIsLoadingNoGfe(true);
      setNoGfeError(null);
      
      // Get all clients first
      const clientsResponse = await fetchApi('/customer');
      const allClients = clientsResponse.payload || [];
      const activeClients = allClients.filter(client => client.isActive);
      
      const fortyFiveDaysAgo = subDays(new Date(), 45);
      const startOfPeriod = format(fortyFiveDaysAgo, "yyyy-MM-dd'T'00:00:00xxx");
      const endOfPeriod = format(new Date(), "yyyy-MM-dd'T'23:59:59xxx");
      
      const gfeResponse = await fetchApi('/gfe', { 
        fromCompletedAt: startOfPeriod,
        toCompletedAt: endOfPeriod,
        pageSize: 5000 // Large page size to get all records
      });
      
      const activeCompanyIds = new Set(
        (gfeResponse.payload || [])
          .filter(gfe => gfe.completedAt)
          .map(gfe => gfe.createdby)
      );
      
      const noGfeClients = activeClients.filter(client => 
        !activeCompanyIds.has(client.id)
      );
      
      setNoGfeClients(noGfeClients);
      setNoGfeCount(noGfeClients.length);
    } catch (err) {
      console.error('Error fetching clients without GFEs:', err);
      setNoGfeError('Failed to load clients without recent GFEs');
    } finally {
      setIsLoadingNoGfe(false);
    }
  };

  const handleClientClick = (client: Client) => {
    // Handle client click in the NoGfeClientsModal
    console.log('Client clicked:', client);
  };

  const fetchClients = async () => {
    try {
      setIsRefreshing(true);
      
      // Fetch clients and calculate counts
      const response = await fetchApi('/customer');
      setClients(response.payload || []);
      
      // Calculate contract pending count
      const pendingContracts = (response.payload || []).filter(
        (client: any) => !client.isActive && !client.isContractSubmitted
      ).length;
      setContractPendingCount(pendingContracts);
      
      // Calculate no GFE count
      const fortyFiveDaysAgo = subDays(new Date(), 45);
      const startOfPeriod = format(fortyFiveDaysAgo, "yyyy-MM-dd'T'00:00:00xxx");
      const endOfPeriod = format(new Date(), "yyyy-MM-dd'T'23:59:59xxx");
      
      const gfeResponse = await fetchApi('/gfe', { 
        fromCompletedAt: startOfPeriod,
        toCompletedAt: endOfPeriod,
        pageSize: 5000
      });
      
      const activeClients = response.payload.filter((client: any) => client.isActive);
      const activeCompanyIds = new Set(
        (gfeResponse.payload || [])
          .filter((gfe: any) => gfe.completedAt)
          .map((gfe: any) => gfe.createdby)
      );
      
      const noGfeCount = activeClients.filter((client: any) => 
        !activeCompanyIds.has(client.id)
      ).length;
      
      setNoGfeCount(noGfeCount);
      setError(null);
    } catch (err) {
      setError('Failed to fetch clients');
      console.error('Error fetching clients:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchClients();
  };

  useEffect(() => {
    fetchClients();
    fetchNewClientsCount();
  }, []);

  // Get current page's clients
  const getCurrentPageClients = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const now = new Date();
    
    const filteredClients = clients.filter(client => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = (
        (client.contactName?.toLowerCase() || '').includes(searchLower) ||
        (client.companyEmail?.toLowerCase() || '').includes(searchLower) ||
        (client.companyPhone?.toLowerCase() || '').includes(searchLower) ||
        (client.companyName?.toLowerCase() || '').includes(searchLower)
      );
      
      // Status filter
      const matchesStatus = statusFilter === 'all' ? true :
        statusFilter === 'active' ? client.isActive :
        !client.isActive;
      
      // Date filter
      const createdDate = new Date(client.createdat);
      const daysDiff = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      
      const matchesDate = dateFilter === 'all' ? true :
        dateFilter === '7days' ? daysDiff <= 7 :
        dateFilter === '30days' ? daysDiff <= 30 :
        daysDiff <= 90;
      
      return matchesSearch && matchesStatus && matchesDate;
    });
    
    // Sort clients
    const sortedClients = [...filteredClients].sort((a, b) => {
      if (sortField === 'name') {
        const nameA = (a.contactName || '').toLowerCase();
        const nameB = (b.contactName || '').toLowerCase();
        return sortOrder === 'asc' 
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      } else { // date
        const dateA = new Date(a.createdat).getTime();
        const dateB = new Date(b.createdat).getTime();
        return sortOrder === 'asc'
          ? dateA - dateB
          : dateB - dateA;
      }
    });
    
    return sortedClients.slice(startIndex, endIndex);
  };

  const handleApplyFilters = () => {
    setCurrentPage(1); // Reset to first page when filters change
    setFilterModalOpen(false);
  };

  return (
    <>
      <div>
        <div className="flex justify-between items-center mb-12 pt-5 md:pt-12">
          <h2 className="text-2xl font-bold">Dashboard</h2>
        </div>
        <GFEStats />
        <AverageWaitTimeCards />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card
          className="glass hover:shadow-glass-hover transition-all duration-300"
        >
          <CardHeader className="border-l-4 border-l-blue-500 p-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-2xl font-bold">{clients.length}</div>
                <div className="text-gray-500">Total Clients</div>
                <div className="text-sm text-blue-600 mt-1">
                  {newClientsCount} new this month
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>
        <Card
          className="glass hover:shadow-glass-hover transition-all duration-300"
        >
          <CardHeader className="border-l-4 border-l-green-500 p-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-2xl font-bold">
                  {clients.filter(c => c.isActive).length}
                </div>
                <div className="text-gray-500">Active</div>
              </div>
            </div>
          </CardHeader>
        </Card>
        <Card
          className="glass hover:shadow-glass-hover transition-all duration-300"
        >
          <CardHeader 
            className="border-l-4 border-l-yellow-500 p-4 cursor-pointer"
            onClick={handleInactiveClick}
          >
            <div className="flex justify-between items-center">
              <div>
                <div className="text-2xl font-bold">
                  {clients.filter(c => !c.isActive).length}
                </div>
                <div className="text-gray-500">Inactive</div>
                <div className="text-sm text-yellow-600 mt-1">
                  {contractPendingCount} contracts pending
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>
        <Card 
          onClick={handleNoGfeClick}
          className="glass hover:shadow-glass-hover transition-all duration-300"
          style={{ cursor: 'pointer' }}
        >
          <CardHeader className="border-l-4 border-l-orange-500 p-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-2xl font-bold">
                  {noGfeCount}
                </div>
                <div className="text-gray-500">No GFEs</div>
                <div className="text-sm text-orange-600 mt-1">Last 45 days</div>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
        <div className="relative flex-1">
          <span className="absolute left-3 top-2.5">🔍</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search clients..."
            className="w-full pl-10 pr-4 py-2 border rounded-md bg-white mb-2 sm:mb-0"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setFilterModalOpen(true)}
            className="flex-1 sm:flex-none px-4 py-2 border rounded-md bg-white flex items-center justify-center gap-2 hover:bg-gray-50"
          >
            <Filter className="w-4 h-4" /> Filter
          </button>
          <button 
            onClick={() => setSortModalOpen(true)}
            className="flex-1 sm:flex-none px-4 py-2 border rounded-md bg-white flex items-center justify-center gap-2 hover:bg-gray-50"
          >
            <SortDesc className="w-4 h-4" /> Sort
          </button>
          <button 
            onClick={handleRefresh}
            className="flex-1 sm:flex-none p-2 border rounded-md bg-white hover:bg-gray-50"
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Modal */}
      <NoGfeClientsModal
        isOpen={isNoGfeModalOpen}
        onClose={() => setIsNoGfeModalOpen(false)}
        clients={noGfeClients}
        onClientClick={handleClientClick}
        isLoading={isLoadingNoGfe}
        error={noGfeError}
      />
      <InactiveClientsModal
        isOpen={isInactiveModalOpen}
        onClose={() => setIsInactiveModalOpen(false)}
        clients={clients.filter(c => !c.isActive)}
        isLoading={isRefreshing}
        error={error}
      />
      <Modal
        isOpen={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        title="Filter Clients"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select 
              className="w-full px-3 py-2 border rounded-md"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Added
            </label>
            <select 
              className="w-full px-3 py-2 border rounded-md"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as DateFilter)}
            >
              <option value="all">All Time</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button
              onClick={() => {
                setStatusFilter('all');
                setDateFilter('all');
                setCurrentPage(1);
                setFilterModalOpen(false);
              }}
              className="px-4 py-2 border rounded-md hover:bg-gray-50"
            >
              Reset Filters
            </button>
            <button
              onClick={handleApplyFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </Modal>

      {/* Sort Modal */}
      <Modal
        isOpen={sortModalOpen}
        onClose={() => setSortModalOpen(false)}
        title="Sort Clients"
      >
        <div className="space-y-4">
          <div 
            className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
            onClick={() => { setSortField('name'); setSortOrder('asc'); }}
          >
            <input 
              type="radio" 
              name="sort" 
              id="name-asc" 
              checked={sortField === 'name' && sortOrder === 'asc'} 
              onChange={() => {}}
            />
            <label htmlFor="name-asc" className="flex-1 cursor-pointer">Name (A-Z)</label>
          </div>
          <div 
            className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
            onClick={() => { setSortField('name'); setSortOrder('desc'); }}
          >
            <input 
              type="radio" 
              name="sort" 
              id="name-desc" 
              checked={sortField === 'name' && sortOrder === 'desc'} 
              onChange={() => {}}
            />
            <label htmlFor="name-desc" className="flex-1 cursor-pointer">Name (Z-A)</label>
          </div>
          <div 
            className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
            onClick={() => { setSortField('date'); setSortOrder('desc'); }}
          >
            <input 
              type="radio" 
              name="sort" 
              id="date-newest" 
              checked={sortField === 'date' && sortOrder === 'desc'} 
              onChange={() => {}}
            />
            <label htmlFor="date-newest" className="flex-1 cursor-pointer">Date Added (Newest)</label>
          </div>
          <div 
            className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
            onClick={() => { setSortField('date'); setSortOrder('asc'); }}
          >
            <input 
              type="radio" 
              name="sort" 
              id="date-oldest" 
              checked={sortField === 'date' && sortOrder === 'asc'} 
              onChange={() => {}}
            />
            <label htmlFor="date-oldest" className="flex-1 cursor-pointer">Date Added (Oldest)</label>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button
              onClick={() => setSortModalOpen(false)}
              className="px-4 py-2 border rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setCurrentPage(1); // Reset to first page when sort changes
                setSortModalOpen(false);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Apply Sort
            </button>
          </div>
        </div>
      </Modal>

      {/* Client Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          {error && (
            <div className="m-4 p-4 bg-red-50 text-red-700 rounded-lg">
              {error}
            </div>
          )}
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {getCurrentPageClients().map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-mono text-sm text-gray-600">{client.id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mr-3">
                        <span>{(client.contactName || 'NA').substring(0, 2).toUpperCase()}</span>
                      </div>
                      <div>
                        <div className="font-medium">{client.contactName || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{client.companyName || 'No Company'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{client.companyEmail || 'N/A'}</td>
                  <td className="px-6 py-4">{client.companyPhone || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      client.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {client.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {new Date(client.createdat).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <div className="flex items-center gap-2">
                        <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100" title="Edit">
                          ✏️
                        </button>
                        <a
                          href={`mailto:${client.companyEmail}`}
                          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer"
                          title={client.companyEmail ? `Send email to ${client.companyEmail}` : 'No email available'}
                          onClick={(e) => !client.companyEmail && e.preventDefault()}
                        >
                          {client.companyEmail ? '📧' : '✉️'}
                        </a>
                        <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100" title="More Options">
                          ⋯
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t">
          <button 
            className={`px-4 py-2 border rounded hover:bg-gray-50 ${
              currentPage === 1 ? 'text-gray-400' : 'text-gray-700 hover:bg-gray-50'
            }`}
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          >
            Previous
          </button>
          <div className="flex gap-2 order-first sm:order-none">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`px-4 py-2 rounded ${
                  currentPage === pageNum
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-50'
                }`}
              >
                {pageNum}
              </button>
            ))}
          </div>
          <button
            className={`px-4 py-2 border rounded hover:bg-gray-50 ${
              currentPage === totalPages ? 'text-gray-400' : 'text-gray-700 hover:bg-gray-50'
            }`}
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          >
            Next
          </button>
        </div>
      </div>
      </div>
    </>
  );
}