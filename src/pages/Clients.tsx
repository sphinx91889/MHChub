import React, { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api-config';
import { subDays, format } from 'date-fns';
import { usePersistentState } from '@/hooks/usePersistentState';
import InvoiceModal from '@/components/InvoiceModal';
import NoGfeClientsModal from '@/components/NoGfeClientsModal';
import NoPaymentMethodClientsModal from '@/components/ClientList/NoPaymentMethodClientsModal';
import {
  ClientListHeader,
  ClientListTable,
  ClientListPagination,
  ClientDetailsModal,
  FilterModal,
  SortModal,
} from '@/components/ClientList';

interface Client {
  id: number;
  contactName: string;
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  isActive: boolean;
  createdat: string;
  updatedat: string | null;
  invoice_status: string | null;
}

interface GFE {
  id: number;
  status: string;
  patientId: number;
  gfeId: string;
  firstname: string;
  lastname: string;
  dob: string;
  companyName: string;
  evaluatedBy: string | null;
  queuedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  approvedTreatments: string | null;
  deniedTreatments: string | null;
}

type FilterStatus = 'all' | 'active' | 'inactive';
type DateFilter = 'all' | '7days' | '30days' | '90days';
type SortField = 'name' | 'date';
type SortOrder = 'asc' | 'desc';

export default function Clients() {
  const [currentPage, setCurrentPage] = usePersistentState('clientsPage', 1);
  const [totalPages, setTotalPages] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [customerIdSearchTerm, setCustomerIdSearchTerm] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [sortModalOpen, setSortModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientGFEs, setClientGFEs] = useState<GFE[]>([]);
  const [isLoadingGFEs, setIsLoadingGFEs] = useState(false);
  const [gfeError, setGfeError] = useState<string | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isNoGfeModalOpen, setIsNoGfeModalOpen] = useState(false);
  const [noGfeClients, setNoGfeClients] = useState<Client[]>([]);
  const [isLoadingNoGfe, setIsLoadingNoGfe] = useState(false);
  const [isNoPaymentMethodModalOpen, setIsNoPaymentMethodModalOpen] = useState(false);
  const [noPaymentMethodClients, setNoPaymentMethodClients] = useState<Client[]>([]);
  const [isLoadingNoPaymentMethod, setIsLoadingNoPaymentMethod] = useState(false);
  const [noPaymentMethodError, setNoPaymentMethodError] = useState<string | null>(null);
  const [modalSource, setModalSource] = useState<'no-gfe' | 'client-list'>('client-list');
  const [noGfeError, setNoGfeError] = useState<string | null>(null);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const newScrollLeft = event.currentTarget.scrollLeft;
    setScrollLeft(newScrollLeft);
    
    // Sync all scroll positions
    if (topScrollRef.current && event.currentTarget !== topScrollRef.current) {
      topScrollRef.current.scrollLeft = newScrollLeft;
    }
    if (tableScrollRef.current && event.currentTarget !== tableScrollRef.current) {
      tableScrollRef.current.scrollLeft = newScrollLeft;
    }
    if (bottomScrollRef.current && event.currentTarget !== bottomScrollRef.current) {
      bottomScrollRef.current.scrollLeft = newScrollLeft;
    }
  };

  const handleApplyFilters = () => {
    setCurrentPage(1);
    setFilterModalOpen(false);
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
    } catch (err) {
      console.error('Error fetching clients without GFEs:', err);
      setNoGfeError('Failed to load clients without recent GFEs');
    } finally {
      setIsLoadingNoGfe(false);
    }
  };

  const handleNoPaymentMethodClick = async () => {
    try {
      setIsNoPaymentMethodModalOpen(true);
      setIsLoadingNoPaymentMethod(true);
      setNoPaymentMethodError(null);
      
      // Get all clients
      const response = await fetchApi('/customer');
      const allClients = response.payload || [];
      
      // Filter clients without payment method
      const clientsWithoutPayment = allClients.filter((client: Client) => 
        client.isActive && !client.stripePaymentMethodId
      );
      
      setNoPaymentMethodClients(clientsWithoutPayment);
    } catch (err) {
      console.error('Error fetching clients without payment method:', err);
      setNoPaymentMethodError('Failed to load clients without payment method');
    } finally {
      setIsLoadingNoPaymentMethod(false);
    }
  };

  const fetchClients = async () => {
    try {
      setIsRefreshing(true);
      const response = await fetchApi('/customer');
      setClients(response.payload || []);
      setTotalPages(Math.ceil((response.payload?.length || 0) / itemsPerPage));
      setError(null);
    } catch (err) {
      console.error('Error fetching clients:', err);
      setError('Failed to fetch clients');
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchClientGFEs = async (customerId: number) => {
    try {
      setIsLoadingGFEs(true);
      setGfeError(null);
      const response = await fetchApi(`/gfe/?customerid=${customerId}`);
      setClientGFEs(response.payload || []);
    } catch (err) {
      console.error('Error fetching client GFEs:', err);
      setGfeError('Failed to load GFEs');
      setClientGFEs([]);
    } finally {
      setIsLoadingGFEs(false);
    }
  };

  const handleClientClick = async (client: Client) => {
    setSelectedClient(client);
    setIsModalOpen(true);
    setModalSource('client-list');
    await fetchClientGFEs(client.id);
  };

  // Get current page's clients with filtering and sorting
  const getCurrentPageClients = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const now = new Date();
    
    const filteredClients = clients.filter(client => {
      // First check customer ID if it's provided
      if (customerIdSearchTerm) {
        return client.id === parseInt(customerIdSearchTerm);
      }

      // Otherwise use the general search term
      const searchLower = searchTerm.toLowerCase();
      
      if (!searchLower) return true;
      
      return (
        (client.contactName?.toLowerCase() || '').includes(searchLower) ||
        (client.companyName?.toLowerCase() || '').includes(searchLower) ||
        (client.companyEmail?.toLowerCase() || '').includes(searchLower) ||
        (client.companyPhone?.toLowerCase() || '').includes(searchLower)
      );
    });
      
    // Apply status filter
    const statusFiltered = filteredClients.filter(client => {
      return statusFilter === 'all' ? true :
             statusFilter === 'active' ? client.isActive :
             !client.isActive;
    });
      
    // Apply date filter
    const dateFiltered = statusFiltered.filter(client => {
      const createdDate = new Date(client.createdat);
      const daysDiff = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      
      return dateFilter === 'all' ? true :
             dateFilter === '7days' ? daysDiff <= 7 :
             dateFilter === '30days' ? daysDiff <= 30 :
             daysDiff <= 90;
    });
      
    // Sort clients
    const sortedClients = [...dateFiltered].sort((a, b) => {
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

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleSortChange = (field: SortField, order: SortOrder) => {
    setSortField(field);
    setSortOrder(order);
    setCurrentPage(1);
    setSortModalOpen(false);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleRefresh = () => {
    fetchClients();
  };

  return (
    <>
      <div className="flex justify-between items-center mb-12 pt-5 md:pt-10">
        <h2 className="text-2xl font-bold">Client List</h2>
      </div>

      <div className="bg-white rounded-lg border p-6 relative">
        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        
        <ClientListHeader
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          customerIdSearchTerm={customerIdSearchTerm}
          onCustomerIdSearchChange={setCustomerIdSearchTerm}
          onFilterClick={() => setFilterModalOpen(true)}
          onSortClick={() => setSortModalOpen(true)}
          onNoGfeClick={handleNoGfeClick}
          onNoPaymentMethodClick={handleNoPaymentMethodClick}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />

        <ClientListTable
          clients={getCurrentPageClients()}
          onClientClick={handleClientClick}
          onInvoiceClick={(client) => {
            setSelectedClient(client);
            setIsInvoiceModalOpen(true);
          }}
        />

        <ClientListPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={clients.length}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={(newSize) => {
            setItemsPerPage(newSize);
            setCurrentPage(1);
          }}
          onPageChange={handlePageChange}
        />
      </div>

      <FilterModal
        isOpen={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        statusFilter={statusFilter}
        dateFilter={dateFilter}
        onStatusFilterChange={setStatusFilter}
        onDateFilterChange={setDateFilter}
        onReset={() => {
          setStatusFilter('all');
          setDateFilter('all');
          setCurrentPage(1);
          setFilterModalOpen(false);
        }}
        onApply={handleApplyFilters}
      />

      <NoGfeClientsModal
        isOpen={isNoGfeModalOpen}
        onClose={() => {
          if (!isModalOpen) {
            setIsNoGfeModalOpen(false);
          }
        }}
        clients={noGfeClients}
        onClientClick={(client) => {
          setSelectedClient(client);
          setIsModalOpen(true);
          setModalSource('no-gfe');
          setIsNoGfeModalOpen(true);
          fetchClientGFEs(client.id);
        }}
        isLoading={isLoadingNoGfe}
        error={noGfeError}
      />

      <NoPaymentMethodClientsModal
        isOpen={isNoPaymentMethodModalOpen}
        onClose={() => {
          setIsNoPaymentMethodModalOpen(false);
          setModalSource('client-list');
        }}
        clients={noPaymentMethodClients}
        onClientClick={(client) => {
          setSelectedClient(client);
          setIsModalOpen(true);
          setModalSource('client-list');
        }}
        isLoading={isLoadingNoPaymentMethod}
        error={noPaymentMethodError}
      />

      <SortModal
        isOpen={sortModalOpen}
        onClose={() => setSortModalOpen(false)}
        sortField={sortField}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
      />

      <ClientDetailsModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          if (modalSource === 'no-gfe') {
            setIsNoGfeModalOpen(true);
          }
        }}
        source={modalSource}
        client={selectedClient}
        gfes={clientGFEs}
        isLoading={isLoadingGFEs}
        error={gfeError}
        onInvoiceClick={(client) => {
          setSelectedClient(client);
          setIsInvoiceModalOpen(true);
        }}
      />
                
      {/* Invoice Modal */}
      {selectedClient && (
        <InvoiceModal
          isOpen={isInvoiceModalOpen}
          onClose={() => setIsInvoiceModalOpen(false)}
          customerId={selectedClient.id}
          companyName={selectedClient.companyName || ''}
        />
      )}
    </>
  );
}