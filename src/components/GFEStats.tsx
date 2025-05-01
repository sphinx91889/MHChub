import React, { useState, useEffect } from 'react';
import { Card, CardHeader } from "@/components/ui/card";
import { Clock } from 'lucide-react';
import { API_TOKEN } from '@/lib/api-config';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface GFEStats {
  providerId: number;
  providerName: string;
  avgWaitTimeSeconds: number;
  noOfGfes: number;
  gfeTimeInSeconds: number;
  avgTimeInSeconds: number;
}

export default function GFEStats() {
  const navigate = useNavigate();
  const [dailyCompletedCount, setDailyCompletedCount] = useState<number | null>(null);
  const [dailyAvgDuration, setDailyAvgDuration] = useState<number | null>(null);
  const [monthlyCompletedCount, setMonthlyCompletedCount] = useState<number | null>(null);
  const [monthlyAvgDuration, setMonthlyAvgDuration] = useState<number | null>(null);
  const [pendingGfeCount, setPendingGfeCount] = useState<number | null>(null);
  const [inProgressCount, setInProgressCount] = useState<number | null>(null);
  const [avgWaitTime, setAvgWaitTime] = useState<number | null>(null);
  const [inProgressGfes, setInProgressGfes] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [totalGFEs, setTotalGFEs] = useState<number | null>(null);
  const [pastDueAmount, setPastDueAmount] = useState<number | null>(null);

  const fetchTotalGFEs = async () => {
    try {
      const response = await fetch('https://app.healthcoversonline.com/api/gfe/count-report', {
        headers: { 'Authorization': `Bearer ${API_TOKEN}` }
      });
      const data = await response.json();
      
      if (data?.payload) {
        // Sum up all GFE counts
        const total = (
          (data.payload.completedGfeCount || 0) + 
          (data.payload.reviewedGfeCount || 0) + 
          (data.payload.inProgressGfeCount || 0)
        );
        setTotalGFEs(total);
      } else {
        setTotalGFEs(0);
      }
    } catch (err) {
      console.error('Error fetching total GFEs:', err);
      setTotalGFEs(0);
    }
  };

  useEffect(() => {
    // Fetch total GFEs and past due amount
    const fetchTotalStats = async () => {
      try {
        const [invoiceResponse] = await Promise.all([
          fetch('https://app.healthcoversonline.com/api/invoice/unpaid/amount', {
            headers: { 'Authorization': `Bearer ${API_TOKEN}` }
          })
        ]);

        const invoiceData = await invoiceResponse.json();

        setPastDueAmount(invoiceData?.payload?.amount ?? 0);
        
        // Fetch total GFEs separately
        await fetchTotalGFEs();
      } catch (err) {
        console.error('Error fetching total stats:', err);
        setTotalGFEs(0);
        setPastDueAmount(0);
      }
    };

    // Fetch daily stats
    const fetchDailyStats = async () => {
      try {
        const today = new Date();
        const startOfDay = format(today, "yyyy-MM-dd'T'00:00:00xxx");
        const endOfDay = format(today, "yyyy-MM-dd'T'23:59:59xxx");
        
        const response = await fetch(
          `https://app.healthcoversonline.com/api/gfe/count-report?fromCompletedAt=${encodeURIComponent(startOfDay)}&toCompletedAt=${encodeURIComponent(endOfDay)}&`,
          { headers: { 'Authorization': `Bearer ${API_TOKEN}` } }
        );
        const data = await response.json();
        
        // Add null checks for data and data.payload
        if (data && data.payload && typeof data.payload === 'object') {
          setDailyCompletedCount(data.payload.completedGfeCount ?? 0);
          setDailyAvgDuration(data.payload.completedGfesAvgDurationInSeconds ?? 0);
        } else {
          setDailyCompletedCount(0);
          setDailyAvgDuration(0);
        }
        
        // Fetch average wait time from Supabase
        const { data: waitTimeData, error: waitTimeError } = await supabase
          .from('gfe_timings')
          .select('wait_time_seconds')
          .not('wait_time_seconds', 'is', null)
          .gte('queued_at', startOfDay)
          .lte('queued_at', endOfDay);

        if (!waitTimeError && waitTimeData && waitTimeData.length > 0) {
          const avgWait = waitTimeData.reduce((sum, record) => sum + (record.wait_time_seconds || 0), 0) / waitTimeData.length;
          setAvgWaitTime(Math.round(avgWait));
        } else {
          setAvgWaitTime(0);
        }
        
        setErrors(prev => ({ ...prev, daily: null }));
      } catch (err) {
        console.error('Error fetching daily GFE stats:', err);
        setErrors(prev => ({ ...prev, daily: 'Failed to load daily stats' }));
        setDailyCompletedCount(0);
        setDailyAvgDuration(0);
        setAvgWaitTime(0);
      }
    };

    // Fetch monthly stats
    const fetchMonthlyStats = async () => {
      try {
        const response = await fetch(
          'https://app.healthcoversonline.com/api/gfe/count-report?fromCompletedAt=2025-04-01T00:00:00-04:00&toCompletedAt=2025-04-30T23:59:59-04:00&',
          { headers: { 'Authorization': `Bearer ${API_TOKEN}` } }
        );
        const data = await response.json();
        
        // Add null checks for data and data.payload
        if (data && data.payload && typeof data.payload === 'object') {
          // Sum completedGfeCount and reviewedGfeCount
          const monthlyTotal = (data.payload.completedGfeCount || 0) + (data.payload.reviewedGfeCount || 0);
          setMonthlyCompletedCount(monthlyTotal);
          setMonthlyAvgDuration(data.payload.completedGfesAvgDurationInSeconds ?? 0);
        } else {
          setMonthlyCompletedCount(0);
          setMonthlyAvgDuration(0);
        }
        
        setErrors(prev => ({ ...prev, monthly: null }));
      } catch (err) {
        console.error('Error fetching monthly GFE stats:', err);
        setErrors(prev => ({ ...prev, monthly: 'Failed to load monthly stats' }));
        setMonthlyCompletedCount(0);
        setMonthlyAvgDuration(0);
      }
    };

    // Fetch pending count
    const fetchPendingCount = async () => {
      try {
        // First fetch pending count from patient/online
        const pendingResponse = await fetch(
          'https://app.healthcoversonline.com/api/patient/online', 
          { headers: { 'Authorization': `Bearer ${API_TOKEN}` } });
        const pendingData = await pendingResponse.json();
        
        // Add null check for pendingData and pendingData.payload
        setPendingGfeCount(pendingData?.payload?.count ?? 0);
        
        // Then fetch in-progress GFEs from gfe/joined
        const joinedResponse = await fetch(
          'https://app.healthcoversonline.com/api/gfe/joined',
          { headers: { 'Authorization': `Bearer ${API_TOKEN}` } });
        const joinedData = await joinedResponse.json();
        
        // Add null check for joinedData and joinedData.payload
        const inProgressGFEs = (joinedData?.payload || []).filter((gfe: any) => 
          gfe.startedAt && !gfe.completedAt
        );
        
        setInProgressCount(inProgressGFEs.length);
        setInProgressGfes(inProgressGFEs);
        setErrors(prev => ({ ...prev, pending: null }));
      } catch (err) {
        console.error('Error fetching pending GFE count:', err);
        setErrors(prev => ({ ...prev, pending: 'Failed to load pending count' }));
        setPendingGfeCount(0);
        setInProgressCount(0);
        setInProgressGfes([]);
      }
    };

    // Initial fetch
    fetchTotalStats();
    fetchDailyStats();
    fetchMonthlyStats();
    fetchPendingCount();

    // Set up intervals for each fetch
    const totalStatsInterval = setInterval(() => {
      fetchTotalStats();
      fetchTotalGFEs();
    }, 30000);
    const dailyInterval = setInterval(fetchDailyStats, 5000);
    const monthlyInterval = setInterval(fetchMonthlyStats, 5000);
    const pendingInterval = setInterval(fetchPendingCount, 5000);

    return () => {
      clearInterval(totalStatsInterval);
      clearInterval(dailyInterval);
      clearInterval(monthlyInterval);
      clearInterval(pendingInterval);
    };
  }, []);

  const formatDuration = (seconds: number) => {
    if (!seconds && seconds !== 0) return '...';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card className="glass hover:shadow-glass-hover transition-all duration-300">
        <CardHeader className="border-l-4 border-l-blue-500 p-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-2xl font-bold">{totalGFEs ?? '...'}</div>
              <div className="text-gray-500">Total GFEs</div>
              <div className="text-sm text-indigo-600 mt-1">
                Past Due: {pastDueAmount ? `$${pastDueAmount.toLocaleString()}` : '...'}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className={`glass hover:shadow-glass-hover transition-all duration-300 ${errors.daily ? 'border-red-300' : ''}`}>
        <CardHeader 
          className="border-l-4 border-l-yellow-500 p-4 cursor-pointer hover:bg-gray-50/50 transition-all"
          onClick={() => navigate('/gfes')}
        >
          <div className="flex justify-between items-center">
            <div>
              <div className="text-2xl font-bold">{dailyCompletedCount ?? '...'}</div>
              <div className="text-gray-500">Today's GFEs</div>
              <div className="flex flex-col text-sm mt-1 space-y-1">
                <span className="text-yellow-600">Average GFE Time: {formatDuration(dailyAvgDuration ?? 0)}</span> 
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className={`glass hover:shadow-glass-hover transition-all duration-300 ${errors.monthly ? 'border-red-300' : ''}`}>
        <CardHeader className="border-l-4 border-l-green-500 p-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-2xl font-bold">{monthlyCompletedCount ?? '...'}</div>
              <div className="text-gray-500">Monthly GFEs</div>
              <div className="text-sm text-blue-600 mt-1">
                Avg: {formatDuration(monthlyAvgDuration)}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="glass hover:shadow-glass-hover transition-all duration-300">
        <CardHeader className="border-l-4 border-l-purple-500 p-4">
          <div className="flex justify-between items-center">
            <div 
              className="cursor-pointer w-full hover:opacity-80 transition-opacity"
              onClick={() => navigate('/in-progress-gfes')}
            >
              <div className="text-2xl font-bold">{inProgressCount ?? 0}</div>
              <div className="text-gray-500">In Progress GFEs</div>
            </div>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}