import React, { useState, useEffect, useRef } from 'react';
import { fetchApi } from '@/lib/api-config';
import { Card, CardHeader } from "@/components/ui/card";
import { Users, Clock, Building2, Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { format, startOfDay, startOfMonth, startOfYear, parseISO, isValid } from 'date-fns';
import { supabase } from '@/lib/supabase';

interface QueuedGFE {
  id: number;
  firstname: string;
  lastname: string;
  companyName: string;
  queuedAt: string;
  dob: string;
  location: {
    city: string;
    state: string;
  };
}

interface QueuedCustomer {
  id: number;
  firstname: string;
  lastname: string;
  companyName: string;
  queuedAt: string;
  dob: string;
  location: {
    city: string;
    state: string;
  };
}

interface WaitTimeStats {
  hour: number;
  avgWaitTime: number;
  count: number;
}

const formatDuration = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
};

export default function CustomerQueue() {
  const [queue, setQueue] = useState<QueuedCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [queueTimings, setQueueTimings] = useState<any[]>([]);
  const [waitTimeStats, setWaitTimeStats] = useState<WaitTimeStats[]>([]);
  const [queueTimer, setQueueTimer] = useState<number>(0);
  const [lastQueueTime, setLastQueueTime] = useState<string | null>(localStorage.getItem('lastQueueTime'));
  const [lastQueueWaitTime, setLastQueueWaitTime] = useState<number | null>(null);
  const prevQueueLengthRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);

  // Calculate average wait time for a given time period
  const calculateAverageWaitTime = (queue: QueuedCustomer[], since: Date): string => {
    if (queue.length === 0) return '0m 0s';

    const now = new Date();
    const totalWaitTime = queue.reduce((sum, customer) => {
      const queuedAt = new Date(customer.queuedAt);
      if (queuedAt >= since && !isNaN(queuedAt.getTime())) {
        return sum + (now.getTime() - queuedAt.getTime());
      }
      return sum;
    }, 0);

    const customersInPeriod = queue.filter(customer => {
      const queuedAt = new Date(customer.queuedAt);
      return queuedAt >= since && !isNaN(queuedAt.getTime());
    }).length;

    if (customersInPeriod === 0) return '0m 0s';
    return formatDuration(totalWaitTime / customersInPeriod);
  };

  // Combined fetch function for both queue and timings
  const fetchData = async () => {
    try {
      // Fetch queue data first
      let queueData: QueuedCustomer[] = [];
      try {
        const queueResponse = await fetchApi('/gfe/queue');
        queueData = queueResponse?.payload || [];
      } catch (queueErr: any) {
        // If queue is not found, treat it as empty rather than an error
        if (queueErr.message === 'not found') {
          queueData = [];
        } else {
          throw queueErr; // Re-throw other errors
        }
      }
      
      // Fetch timing data
      let timingData: any[] = [];
      try {
        const timingsResponse = await fetchApi('/gfe/timings');
        timingData = timingsResponse?.payload || [];
      } catch (timingErr: any) {
        // If timings are not found, treat as empty rather than an error
        if (timingErr.message === 'not found') {
          timingData = [];
        } else {
          throw timingErr; // Re-throw other errors
        }
      }
      
      // Get historical wait times from Supabase
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: waitTimes } = await supabase
        .from('gfe_timings')
        .select('queued_at, wait_time_seconds')
        .gte('queued_at', today.toISOString())
        .not('wait_time_seconds', 'is', null)
        .order('queued_at', { ascending: true });

      if (waitTimes) {
        // Group wait times by hour
        const hourlyStats: Record<number, { total: number; count: number }> = {};
        
        waitTimes.forEach(timing => {
          const hour = new Date(timing.queued_at).getHours();
          if (!hourlyStats[hour]) {
            hourlyStats[hour] = { total: 0, count: 0 };
          }
          hourlyStats[hour].total += timing.wait_time_seconds;
          hourlyStats[hour].count++;
        });

        // Convert to array and calculate averages
        const stats = Object.entries(hourlyStats).map(([hour, stats]) => ({
          hour: parseInt(hour),
          avgWaitTime: Math.round(stats.total / stats.count),
          count: stats.count
        }));

        setWaitTimeStats(stats);
      }
      
      setQueue(queueData);
      
      // Handle queue timer logic
      if (queueData.length > 0) {
        // Queue just became active, start or restart timer
        if (timerRef.current) clearInterval(timerRef.current);
        // Calculate initial timer value based on oldest queued patient
        const oldestQueueTime = Math.min(...queueData.map(patient => new Date(patient.queuedAt).getTime()));
        const initialTimer = Math.floor((Date.now() - oldestQueueTime) / 1000);
        setQueueTimer(initialTimer);
        timerRef.current = setInterval(() => {
          setQueueTimer(prev => prev + 1);
        }, 1000);
      } else if (queueData.length === 0) {
        // Queue is empty, stop timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          setQueueTimer(0);
        }
      } else if (queueData.length === 0 && prevQueueLengthRef.current > 0) {
        // Queue just became empty, stop timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          
          // Store the current time as last queue time
          const now = new Date().toLocaleString();
          setLastQueueTime(now);
          localStorage.setItem('lastQueueTime', now);
          
          // Get the last wait time from the most recent timing
          if (waitTimes && waitTimes.length > 0) {
            const lastWaitTime = waitTimes[waitTimes.length - 1].wait_time_seconds;
            setLastQueueWaitTime(lastWaitTime);
          }
        }
      }
      
      prevQueueLengthRef.current = queueData.length;
      
      setQueueTimings(timingData);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setQueue([]);
      setQueueTimings([]);
      setError('Failed to load queue data. Please try again later.');
    }
  };

  // Single useEffect for data fetching
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds
    return () => {
      clearInterval(interval);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const formatQueueTimer = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <>
      <div className="flex justify-between items-center mb-8 pt-5 md:pt-10">
        <div>
          <h2 className="text-2xl font-bold">Patient Queue</h2>
          <p className="text-gray-500 mt-1">Real-time view of patients waiting for GFE processing</p>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-semibold">Current Queue</h3>
              {queue.length > 0 && (
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-red-600 font-medium">Current Wait: {formatQueueTimer(queueTimer)}</span>
                  {lastQueueTime && (
                    <span className="text-xs text-gray-600">
                      Last Queue Wait: {lastQueueWaitTime ? formatDuration(lastQueueWaitTime * 1000) : 'N/A'}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="text-sm text-gray-500">
              {queue.length} {queue.length === 1 ? 'Patient' : 'Patients'} Waiting
            </div>
          </div>

          {error ? (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg">
              {error}
            </div>
          ) : queue.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No customers in GFE Queue</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {queue.map((customer) => {
                  const queuedAt = new Date(customer.queuedAt);
                  const waitingTimeMilliseconds = !isNaN(queuedAt.getTime()) 
                    ? new Date().getTime() - queuedAt.getTime()
                    : 0;
                  const formattedWaitingTime = formatDuration(waitingTimeMilliseconds);

                  return (
                    <div
                      key={customer.id}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-medium">
                        {customer.firstname[0]}{customer.lastname[0]}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium truncate">
                            {customer.firstname} {customer.lastname}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Building2 className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{customer.companyName}</span>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div className="flex items-center gap-2 mb-1 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>
                            {!isNaN(queuedAt.getTime()) 
                              ? queuedAt.toLocaleTimeString()
                              : 'Invalid Time'}
                          </span>
                          {customer.dob && (
                            <div className="text-sm text-gray-500 mt-1">
                              DOB: {
                                (() => {
                                  try {
                                    const date = parseISO(customer.dob);
                                    return isValid(date) ? format(date, 'MM/dd/yyyy') : 'Invalid Date';
                                  } catch {
                                    return 'Invalid Date';
                                  }
                                })()
                              }
                            </div>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {customer.location.city}, {customer.location.state}
                        </div>
                        <div className="text-sm text-gray-600">Wait Time: {formattedWaitingTime}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 space-y-2">
                <div>
                  Current Average Wait Time: {calculateAverageWaitTime(queue, startOfDay(new Date()))}
                </div>
                <div>
                  Historical Average: {
                    queueTimings.length > 0
                      ? formatDuration(
                          queueTimings.reduce((sum, t) => sum + (t.wait_time_seconds || 0) * 1000, 0) / queueTimings.length
                        )
                      : '0m 0s'
                  }
                </div>
              </div>
            </>
          )}
        </CardHeader>
      </Card>
    </>
  );
}