import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchApi } from '@/lib/api-config';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRef, useCallback } from 'react';

interface GFE {
  id: number;
  status: string;
  gfeId: string;
  patientId: number;
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
  formattedDirectorComment: string | null;
  directorComment: string | null;
  evaluatedBy: string | null;
  completedAt: string | null;
  startedAt: string;
  roomNo: number;
  roomDate: string;
  location: {
    customerLocationId: number;
    stateId: number;
    state: string;
    streetname: string;
    appartmentNumber: string;
    city: string;
    zip: string;
  };
  treatments: Array<{
    id: number;
    name: string;
    categoryId: number;
    categoryName: string;
    status: string | null;
    statusText: string | null;
  }>;
  providerId: number;
  providerName: string;
}

interface GFETiming {
  wait_time_seconds: number | null;
  queued_at: string | null;
}

export default function InProgressGFEs() {
  const [gfes, setGFEs] = useState<GFE[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGFE, setSelectedGFE] = useState<GFE | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [gfeTimings, setGfeTimings] = useState<Record<number, GFETiming>>({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollPosition = useRef(0);
  const contentRef = useRef<HTMLDivElement>(null);

  // Track GFE timing data
  const trackGFETiming = async (gfe: GFE) => {
    try {
      const { data: timings, error } = await supabase
        .from('gfe_timings')
        .select('*')
        .eq('gfe_id', gfe.id)
        .limit(1);

      const existingTiming = timings?.[0];

      if (!existingTiming) {
        // Create new timing record with patient name
        await supabase.from('gfe_timings').insert({
          gfe_id: gfe.id,
          patient_id: gfe.patientId,
          started_at: gfe.startedAt,
          patient_name: `${gfe.firstname} ${gfe.lastname}`,
          provider_id: gfe.providerId,
          provider_name: gfe.providerName,
          metadata: {
            company_name: gfe.companyName,
            room_no: gfe.roomNo
          }
        });
      } else if (gfe.completedAt && !existingTiming.completed_at) {
        // Calculate duration and update timing record
        const duration = Math.round(
          (new Date(gfe.completedAt).getTime() - new Date(gfe.startedAt).getTime()) / 1000
        );

        const { data: scoreData } = await supabase
          .rpc('calculate_gfe_score', { duration_seconds: duration });

        // Update with completed_at timestamp
        await supabase
          .from('gfe_timings')
          .update({
            completed_at: gfe.completedAt,
            duration_seconds: duration,
            score: scoreData,
          })
          .eq('id', existingTiming.id);
      }
    } catch (err) {
      console.error('Error tracking GFE timing:', err);
    }
  };

  const fetchGFEs = useCallback(async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setIsLoading(true);
      } else {
        setIsUpdating(true);
        // Store current scroll position before update
        if (contentRef.current) {
          scrollPosition.current = contentRef.current.scrollTop;
        }
      }
      setError(null);
      
      // Fetch GFEs with all details
      const response = await fetchApi('/gfe/joined?status=in_progress');
      
      // Get all GFEs that are either in progress or just completed
      const inProgressGFEs = (response.payload || []).filter((gfe: GFE) => gfe.startedAt);
      
      // Fetch wait times from Supabase
      const { data: waitTimeData } = await supabase
        .from('gfe_timings')
        .select('gfe_id, wait_time_seconds, queued_at')
        .in('gfe_id', inProgressGFEs.map(gfe => gfe.id));

      if (waitTimeData) {
        const timingsMap = waitTimeData.reduce((acc, timing) => ({
          ...acc,
          [timing.gfe_id]: {
            wait_time_seconds: timing.wait_time_seconds,
            queued_at: timing.queued_at
          }
        }), {});
        setGfeTimings(timingsMap);
      }
      
      // Track timing for each GFE
      await Promise.all(inProgressGFEs.map(trackGFETiming));
      
      setGFEs(inProgressGFEs);
    } catch (err) {
      console.error('Error fetching GFEs:', err);
      // When no GFEs are found, just set an empty array
      setError('Failed to load GFE data');
      setGFEs([]);
    } finally {
      if (isInitialLoad) {
        setIsLoading(false);
      } else {
        setIsUpdating(false);
        // Restore scroll position after update
        if (contentRef.current) {
          contentRef.current.scrollTop = scrollPosition.current;
        }
      }
    }
  }, []);

  useEffect(() => {
    // Initial load
    fetchGFEs(true);
    
    // Set up interval for updates
    const interval = setInterval(() => fetchGFEs(false), 5000);

    return () => clearInterval(interval);
  }, [fetchGFEs]);

  const handleGFEClick = (gfe: GFE) => {
    setSelectedGFE(gfe);
    setIsModalOpen(true);
  };
  
  const calculateWaitTime = (queuedAt: string | null, startedAt: string): string => {
    if (!queuedAt) return 'N/A';
    const queueTime = new Date(queuedAt).getTime();
    const startTime = new Date(startedAt).getTime();
    const waitTimeMs = Math.abs(startTime - queueTime); // Use absolute value to prevent negative times
    
    if (isNaN(waitTimeMs)) return 'N/A';
    
    const minutes = Math.floor(waitTimeMs / (1000 * 60));
    const seconds = Math.floor((waitTimeMs % (1000 * 60)) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div ref={contentRef} className="h-full overflow-y-auto">
      <div className="flex flex-col gap-4 mb-8 pt-5 md:pt-10">
        <Button
          variant="outline"
          asChild
          className="w-fit"
        >
          <Link to="/gfes" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to GFEs
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold">In Progress GFEs</h2>
          <p className="text-gray-500 mt-1">Real-time view of GFEs currently being processed</p>
        </div>
      </div>
      
      {/* Loading overlay - only shown on initial load */}
      {isLoading && (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      )}

      {/* Content */}
      {!isLoading && gfes.length === 0 ? (
        <div className="bg-white rounded-lg border p-8 text-center">
          <p className="text-gray-500">{error || 'No GFEs currently in progress'}</p>
        </div>
      ) : !isLoading && (
        <div className="grid gap-4">
          {gfes.map((gfe) => (
            <div
              key={gfe.id}
              className="bg-white rounded-lg border p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleGFEClick(gfe)}
            >
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium">
                  {gfe.firstname[0]}{gfe.lastname[0]}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-medium">{gfe.firstname} {gfe.lastname}</h3>
                      <p className="text-gray-500">
                        {gfe.companyName}
                        <span className="text-sm text-gray-400 ml-2">ID: {gfe.gfeId}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Started: {formatDateTime(gfe.startedAt)}</p>
                      {gfe.startedAt && (
                        <p className="text-sm text-blue-600">
                          Elapsed: {formatDuration(Math.round((new Date().getTime() - new Date(gfe.startedAt).getTime()) / 1000))}
                        </p>
                      )}
                      {gfeTimings[gfe.id]?.queued_at && (
                        <p className="text-sm text-orange-600">
                          <Clock className="w-3 h-3 inline-block mr-1" />
                          Queue Wait: {calculateWaitTime(gfeTimings[gfe.id].queued_at, gfe.startedAt)}
                        </p>
                      )}
                      <p className="text-sm font-medium text-blue-600">Room #{gfe.roomNo}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="text-sm">
                        {gfe.location.streetname}
                        {gfe.location.appartmentNumber && `, Unit ${gfe.location.appartmentNumber}`}
                        <br />
                        {gfe.location.city}, {gfe.location.state} {gfe.location.zip}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Provider</p>
                      <p className="text-sm">{gfe.providerName || 'Not assigned'}</p>
                      <p className="text-sm text-gray-400 mt-1">DOB: {gfe.dob}</p>
                    </div>
                  </div>

                  {gfe.treatments && gfe.treatments.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-500 mb-2">Treatments</p>
                      <div className="grid grid-cols-2 gap-2">
                        {gfe.treatments.map((treatment) => (
                          <div
                            key={treatment.id}
                            className="p-2 bg-blue-50 rounded-lg"
                          >
                            <p className="text-sm font-medium text-blue-700">{treatment.name}</p>
                            <p className="text-xs text-gray-500">{treatment.categoryName}</p>
                            {treatment.status && (
                              <p className="text-xs text-blue-600 mt-1">{treatment.status}</p>
                            )}
                          </div>
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
                    <p><span className="font-medium">Street:</span> {selectedGFE.location.streetname}</p>
                    {selectedGFE.location.appartmentNumber && (
                      <p><span className="font-medium">Unit:</span> {selectedGFE.location.appartmentNumber}</p>
                    )}
                    <p><span className="font-medium">City:</span> {selectedGFE.location.city}</p>
                    <p><span className="font-medium">State:</span> {selectedGFE.location.state}</p>
                    <p><span className="font-medium">ZIP:</span> {selectedGFE.location.zip}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Exam Timeline</h3>
                  <div className="mt-2 space-y-2">
                    {gfeTimings[selectedGFE.id]?.queued_at && (
                      <p>
                        <span className="font-medium">Queued:</span> {formatDateTime(gfeTimings[selectedGFE.id].queued_at)}
                        <br />
                        <span className="text-orange-600 mt-1">
                          Queue Wait: {calculateWaitTime(gfeTimings[selectedGFE.id].queued_at, selectedGFE.startedAt)}
                        </span> 
                      </p>
                    )}
                    <p><span className="font-medium">Started:</span> {formatDateTime(selectedGFE.startedAt)}</p>
                    {selectedGFE.startedAt && (
                      <p className="text-sm text-blue-600">
                        Elapsed: {formatDuration(Math.round((new Date().getTime() - new Date(selectedGFE.startedAt).getTime()) / 1000))}
                      </p>
                    )}
                    {selectedGFE.completedAt && (
                      <p className="text-sm text-gray-500">Completed: {formatDateTime(selectedGFE.completedAt)}</p>
                    )}
                    <p><span className="font-medium">Provider:</span> {selectedGFE.providerName}</p>
                  </div>
                </div>
                {selectedGFE.treatments && selectedGFE.treatments.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Treatments</h3>
                    <div className="mt-2 space-y-2">
                      {selectedGFE.treatments.map((treatment) => (
                        <div key={treatment.id} className="p-2 bg-gray-50 rounded">
                          <p className="font-medium">{treatment.name}</p>
                          <p className="text-sm text-gray-500">{treatment.categoryName}</p>
                          {treatment.status && (
                            <p className="text-sm mt-1">Status: {treatment.status}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}