import React, { useState, useEffect } from 'react';
import { RefreshCw, ChevronLeft, ChevronRight, FileText, Calendar, MapPin } from 'lucide-react';
import { fetchApi } from '@/lib/api-config';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import GFEStats from '@/components/GFEStats';
import AverageWaitTimeCards from '@/components/AverageWaitTimeCards';
import { usePersistentState } from '@/hooks/usePersistentState';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';

interface GFE {
  id: number;
  status: string;
  patientId: number;
  gfeId: string;
  firstname: string;
  lastname: string;
  dob: string;
  completedBy: number | null;
  companyName: string;
  bookingDate: string | null;
  providerComment: string | null;
  clinicalConsideration: string | null;
  reviewedBy: number | null;
  reviewedAt: string | null;
  directorComment: string | null;
  formattedDirectorComment: string | null;
  customerLocationId: number;
  stateId: number;
  state: string;
  streetname: string;
  appartmentNumber: string | null;
  city: string;
  zip: string;
  evaluatedBy: string | null;
  queuedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  link: string | null;
  createdby: number;
  createdat: string;
  expireAt: string;
  approvedTreatments: string | null;
  deniedTreatments: string | null;
  deferTreatments: string | null;
  roomNo: number;
  roomDate: string | null;
  updatedby: number | null;
  updatedat: string | null;
}

interface PaginationData {
  totalRecords: number;
  totalPages: number;
  pageNo: number;
  pageSize: number;
}

export default function GFEs() {
  const [gfes, setGFEs] = useState<GFE[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortField, setSortField] = useState<'name' | 'date' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = usePersistentState('gfesPage', 1);
  const [selectedGFE, setSelectedGFE] = useState<GFE | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [gfeTimings, setGfeTimings] = useState<Record<number, { wait_time_seconds: number | null; score: string | null }>>({});
  const [pagination, setPagination] = useState<PaginationData>({
    totalRecords: 0,
    totalPages: 0,
    pageNo: currentPage,
    pageSize: 10,
  });

  const fetchGFEs = async (page: number = 1, size: number = 10) => {
    try {
      setIsLoading(true);
      
      // Get today's date in the correct format
      const today = new Date();
      const startOfDay = format(today, "yyyy-MM-dd'T'00:00:00xxx");
      const endOfDay = format(today, "yyyy-MM-dd'T'23:59:59xxx");
      
      // Fetch GFEs from API
      const response = await fetchApi('/gfe', { 
        pageNo: page, 
        pageSize: size,
        fromCompletedAt: startOfDay,
        toCompletedAt: endOfDay
      });
      
      if (response && response.payload) {
        setGFEs(response.payload);
        setPagination({
          ...response.pagination,
          pageNo: page,
          pageSize: size,
        });
        
        // Fetch timing data from Supabase
        const { data: timingData } = await supabase
          .from('gfe_timings')
          .select('gfe_id, wait_time_seconds, score')
          .in('gfe_id', response.payload.map((gfe: GFE) => gfe.id));
        
        if (timingData) {
          const timingsMap = timingData.reduce((acc, timing) => ({
            ...acc,
            [timing.gfe_id]: {
              wait_time_seconds: timing.wait_time_seconds,
              score: timing.score
            }
          }), {});
          setGfeTimings(timingsMap);
        }
        
        setError(null);
      } else {
        setError('Failed to fetch GFE data: Invalid response format');
        setGFEs([]);
        setPagination({ totalRecords: 0, totalPages: 0, pageNo: 1, pageSize: size });
      }
    } catch (err) {
      setError('Failed to fetch GFE data');
      console.error('Error fetching GFEs:', err);
      setGFEs([]);
      setPagination({ totalRecords: 0, totalPages: 0, pageNo: 1, pageSize: 10 });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchGFEs(pagination.pageNo, pagination.pageSize);
  };

  const handleGFEClick = (gfe: GFE) => {
    setSelectedGFE(gfe);
    setIsModalOpen(true);
  };
  
  const sortGFEs = (gfes: GFE[]) => {
    return [...gfes].sort((a, b) => {
      switch (sortField) {
        case 'name':
          const nameA = `${a.firstname} ${a.lastname}`.toLowerCase();
          const nameB = `${b.firstname} ${b.lastname}`.toLowerCase();
          return sortOrder === 'asc' 
            ? nameA.localeCompare(nameB)
            : nameB.localeCompare(nameA);
        
        case 'status':
          return sortOrder === 'asc'
            ? a.status.localeCompare(b.status)
            : b.status.localeCompare(a.status);
        
        case 'date':
        default:
          const dateA = new Date(a.queuedAt || a.createdat).getTime();
          const dateB = new Date(b.queuedAt || b.createdat).getTime();
          return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      }
    });
  };

  useEffect(() => {
    fetchGFEs();
  }, []);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage);
      fetchGFEs(newPage, pagination.pageSize);
    }
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'queued':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredGFEs = gfes.filter(gfe => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (gfe.firstname?.toLowerCase() || '').includes(searchLower) ||
      (gfe.lastname?.toLowerCase() || '').includes(searchLower) ||
      (gfe.gfeId?.toLowerCase() || '').includes(searchLower) ||
      (gfe.companyName?.toLowerCase() || '').includes(searchLower) ||
      (gfe.evaluatedBy?.toLowerCase() || '').includes(searchLower)
    );
  });
  const sortedAndFilteredGFEs = sortGFEs(filteredGFEs);

  const formatWaitTime = (seconds: number | null) => {
    if (!seconds && seconds !== 0) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };
  
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getGrade = (seconds: number) => {
    if (seconds < 180) return 'A';
    if (seconds < 420) return 'B';
    if (seconds < 540) return 'C';
    if (seconds < 900) return 'D';
    return 'F';
  };

  const gradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return "bg-green-100 text-green-800";
      case 'B': return "bg-blue-100 text-blue-800";
      case 'C': return "bg-yellow-100 text-yellow-800";
      case 'D': return "bg-orange-100 text-orange-800";
      case 'F': return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8 pt-5 md:pt-10">
        <div>
          <h2 className="text-2xl font-bold">Good Faith Exams (GFEs)</h2>
          <p className="text-gray-500 mt-1">Real-time exam tracking and management</p>
        </div>
      </div>

      <GFEStats />
      <AverageWaitTimeCards gfes={gfes} />

      <div className="bg-white rounded-lg border shadow-sm">
        {error && (
          <div className="m-6 p-4 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="p-6 border-b">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3 top-2.5">🔍</span>
              <input
                type="text"
                placeholder="Search by name, GFE ID, company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-md"
              />
            </div>
            <div className="flex gap-2">
              <select
                className="px-3 py-2 border rounded-md bg-white"
                value={`${sortField}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-') as ['name' | 'date' | 'status', 'asc' | 'desc'];
                  setSortField(field);
                  setSortOrder(order);
                }}
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="status-asc">Status (A-Z)</option>
                <option value="status-desc">Status (Z-A)</option>
              </select>
              <select
                className="px-3 py-2 border rounded-md bg-white"
                value={pagination.pageSize}
                onChange={(e) => {
                  const newSize = Number(e.target.value);
                  fetchGFEs(1, newSize);
                }}
              >
                <option value="10">10 per page</option>
                <option value="25">25 per page</option>
                <option value="50">50 per page</option>
                <option value="100">100 per page</option>
              </select>
              <button
                onClick={handleRefresh}
                className="p-2 border rounded-md bg-white hover:bg-gray-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Wait Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Provider
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Started At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
  {isLoading ? (
    [...Array(5)].map((_, i) => (
      <tr key={i}>
        <td colSpan={7} className="px-6 py-4">
          <div className="h-20 bg-gray-100 animate-pulse rounded"></div>
        </td>
      </tr>
    ))
  ) : (
    sortedAndFilteredGFEs.map((gfe) => {
      let durationSeconds = 0;
      if (gfe.startedAt && gfe.completedAt) {
        durationSeconds = Math.round((new Date(gfe.completedAt).getTime() - new Date(gfe.startedAt).getTime()) / 1000);
      }

      const grade = durationSeconds > 0 ? getGrade(durationSeconds) : 'N/A';

      return (
        <tr key={gfe.id} className="hover:bg-gray-50">
          <td className="px-6 py-4">
            <div 
              className="flex items-start gap-3 cursor-pointer"
              onClick={() => handleGFEClick(gfe)}
            >
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium">
                {gfe.firstname[0]}{gfe.lastname[0]}
              </div>
              <div>
                <div className="font-medium text-blue-600 hover:text-blue-800">{`${gfe.firstname} ${gfe.lastname}`}</div>
                <div className="text-sm text-gray-500">DOB: {gfe.dob}</div>
                <div className="text-sm text-gray-500 truncate max-w-[200px]">{gfe.companyName}</div>
              </div>
            </div>
          </td>
          <td className="px-6 py-4">
            <div className="text-sm text-gray-600">
              {gfe.queuedAt && gfe.startedAt
                ? formatWaitTime(Math.round(
                    (new Date(gfe.startedAt).getTime() - new Date(gfe.queuedAt).getTime()) / 1000
                  ))
                : 'N/A'
              }
            </div>
          </td>
          <td className="px-6 py-4">
            <div className="font-medium">{gfe.evaluatedBy || 'Not Assigned'}</div>
          </td>
          <td className="px-6 py-4">
            <div className="text-sm text-gray-600">
              {gfe.startedAt ? formatDateTime(gfe.startedAt) : 'Not Started'}
            </div>
          </td>
          <td className="px-6 py-4">
            <div className="text-sm text-gray-600">
              {gfe.startedAt && gfe.completedAt ? (
                formatDuration(durationSeconds)
              ) : (
                'In Progress'
              )}
            </div>
          </td>
          <td className="px-6 py-4">
            <div className={cn(
              "px-2 py-1 text-xs rounded-full inline-flex items-center justify-center",
              gradeColor(grade)
            )}>
              {grade}
            </div>
          </td>
          <td className="px-6 py-4">
            <div>
              <span className={cn("px-2 py-1 text-xs rounded-full", getStatusColor(gfe.status))}>
                {gfe.status}
              </span>
              <div className="mt-1 text-sm text-gray-600">
                {gfe.completedAt ? formatDateTime(gfe.completedAt) : 'Not Completed'}
              </div>
            </div>
          </td>
          <td className="px-6 py-4">
            <div>
              <div className="font-medium truncate max-w-[150px]">{gfe.city}</div>
              <div className="text-sm text-gray-500">{gfe.state}</div>
            </div>
          </td>
        </tr>
      );
    })
  )}
</tbody>

          </table>
        </div>

        {/* Pagination Controls */}
        <div className="px-6 py-4 border-t">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-500 order-2 sm:order-1">
              Showing {((pagination.pageNo - 1) * pagination.pageSize) + 1} to {Math.min(pagination.pageNo * pagination.pageSize, pagination.totalRecords)} of {pagination.totalRecords} results
            </div>
            <div className="flex items-center gap-2 order-1 sm:order-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.pageNo - 1)}
                disabled={pagination.pageNo === 1 || isLoading}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const pageNumber = i + 1;
                  return (
                    <Button
                      key={i}
                      variant={pagination.pageNo === pageNumber ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNumber)}
                      disabled={isLoading}
                    >
                      {pageNumber}
                    </Button>
                  );
                })}
                {pagination.totalPages > 5 && (
                  <>
                    <span className="px-2">...</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.totalPages)}
                      disabled={isLoading}
                    >
                      {pagination.totalPages}
                    </Button>
                  </>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.pageNo + 1)}
                disabled={pagination.pageNo === pagination.totalPages || isLoading}
                className="flex items-center gap-1"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* GFE Details Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>GFE Details</DialogTitle>
            </DialogHeader>
            {selectedGFE && (
              <div className="grid grid-cols-2 gap-6 py-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Patient Information</h3>
                    <div className="mt-2 space-y-2">
                      <p><span className="font-medium">Name:</span> {selectedGFE.firstname} {selectedGFE.lastname}</p>
                      <p><span className="font-medium">DOB:</span> {selectedGFE.dob}</p>
                      <p><span className="font-medium">GFE ID:</span> {selectedGFE.gfeId}</p>
                      <p><span className="font-medium">Company:</span> {selectedGFE.companyName}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Location Details</h3>
                    <div className="mt-2 space-y-2">
                      <p><span className="font-medium">Street:</span> {selectedGFE.streetname}</p>
                      {selectedGFE.appartmentNumber && (
                        <p><span className="font-medium">Unit:</span> {selectedGFE.appartmentNumber}</p>
                      )}
                      <p><span className="font-medium">City:</span> {selectedGFE.city}</p>
                      <p><span className="font-medium">State:</span> {selectedGFE.state}</p>
                      <p><span className="font-medium">ZIP:</span> {selectedGFE.zip}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Exam Timeline</h3>
                    <div className="mt-2 space-y-2">
                      <p><span className="font-medium">Queued:</span> {formatDateTime(selectedGFE.queuedAt)}</p>
                      <p><span className="font-medium">Wait Time:</span> {
                        selectedGFE.queuedAt && selectedGFE.startedAt
                          ? formatWaitTime(Math.round(
                              (new Date(selectedGFE.startedAt).getTime() - new Date(selectedGFE.queuedAt).getTime()) / 1000
                            ))
                          : 'N/A'
                      }</p>
                      <p><span className="font-medium">Started:</span> {formatDateTime(selectedGFE.startedAt)}</p>
                      <p><span className="font-medium">Completed:</span> {formatDateTime(selectedGFE.completedAt)}</p>
                      <p><span className="font-medium">Status:</span> {selectedGFE.status}</p>
                      {selectedGFE.evaluatedBy && (
                        <p><span className="font-medium">Evaluated By:</span> {selectedGFE.evaluatedBy}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Treatment Details</h3>
                    <div className="mt-2 space-y-2">
                      {selectedGFE.approvedTreatments && (
                        <div>
                          <p className="font-medium mb-1">Approved Treatments:</p>
                          <div className="flex flex-wrap gap-1">
                            {selectedGFE.approvedTreatments.split(',').map((treatment, index) => (
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
                      {selectedGFE.deniedTreatments && (
                        <div>
                          <p className="font-medium mb-1">Denied Treatments:</p>
                          <div className="flex flex-wrap gap-1">
                            {selectedGFE.deniedTreatments.split(',').map((treatment, index) => (
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
                  {selectedGFE.providerComment && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Provider Comments</h3>
                      <p className="mt-2 text-gray-600">{selectedGFE.providerComment}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}