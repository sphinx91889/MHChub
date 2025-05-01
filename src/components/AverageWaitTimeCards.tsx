import React from 'react';
import { Card, CardHeader } from "@/components/ui/card";
import { Clock } from 'lucide-react';
import { format } from 'date-fns';
import { fetchApi, API_BASE_URL, API_TOKEN } from '@/lib/api-config';

// Helper function to format duration in minutes and seconds
const formatWaitTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
};

export default function AverageWaitTimeCards() {
  const [monthlyAvgWait, setMonthlyAvgWait] = React.useState<string>('Calculating...');
  const [yearlyAvgWait, setYearlyAvgWait] = React.useState<string>('Calculating...');
  const [todayAvgWait, setTodayAvgWait] = React.useState<string>('Calculating...');
  const [completedCount, setCompletedCount] = React.useState<number>(0);
  const [error, setError] = React.useState<string | null>(null);

  const fetchAverages = async () => {
    try {
      const today = new Date();
      const startOfToday = format(today, "yyyy-MM-dd'T'00:00:00xxx");
      const endOfToday = format(today, "yyyy-MM-dd'T'23:59:59xxx");

      // First, get the total count of completed GFEs for today
      const countResponse = await fetch(`${API_BASE_URL}/gfe/count-report?fromCompletedAt=${encodeURIComponent(startOfToday)}&toCompletedAt=${encodeURIComponent(endOfToday)}`, {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Accept': 'application/json'
        }
      });

      if (!countResponse.ok) {
        throw new Error('Failed to fetch GFE count');
      }

      const countData = await countResponse.json();
      const totalGFEs = countData.payload.completedGfeCount || 0;
      setCompletedCount(totalGFEs);

      // Now fetch all completed GFEs for today with the correct page size
      const gfeResponse = await fetchApi('/gfe', {
        fromCompletedAt: startOfToday,
        toCompletedAt: endOfToday,
        pageSize: Math.max(totalGFEs, 100) // Ensure we get at least 100 records
      });

      const completedGFEs = gfeResponse.payload || [];

      // Sort GFEs by completion time (most recent first)
      const sortedGFEs = [...completedGFEs].sort((a, b) => 
        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      );

      // Calculate wait times for the N most recent GFEs, where N is the number of completed GFEs today
      const waitTimes = sortedGFEs
        .slice(0, completedGFEs.length) // Only take as many as were completed today
        .filter(gfe => gfe.queuedAt && gfe.startedAt)
        .map(gfe => {
          const queuedAt = new Date(gfe.queuedAt);
          const startedAt = new Date(gfe.startedAt);
          const waitTime = Math.round((startedAt.getTime() - queuedAt.getTime()) / 1000);
          return { waitTime, gfeId: gfe.id };
        })
        .filter(({ waitTime }) => !isNaN(waitTime) && waitTime >= 0);

      if (waitTimes.length > 0) {
        const totalWaitTime = waitTimes.reduce((sum, { waitTime }) => sum + waitTime, 0);
        const avgWaitTime = Math.round(totalWaitTime / waitTimes.length);
        setTodayAvgWait(formatWaitTime(avgWaitTime));

        console.log('Wait Time Calculation:', {
          completedGFEs: completedGFEs.length,
          validWaitTimes: waitTimes.length,
          waitTimes: waitTimes.map(wt => ({ 
            gfeId: wt.gfeId, 
            waitTime: formatWaitTime(wt.waitTime) 
          })),
          totalWaitTimeSeconds: totalWaitTime,
          averageWaitSeconds: avgWaitTime
        });
      } else {
        setTodayAvgWait('No data');
      }

      // Monthly data
      const monthResponse = await fetchApi('/gfe', {
        fromCompletedAt: format(new Date(today.getFullYear(), today.getMonth(), 1), "yyyy-MM-dd'T'00:00:00-04:00"),
        toCompletedAt: endOfToday,
        pageSize: 1000 // Use a large page size for historical data
      });

      const monthlyGFEs = monthResponse.payload || [];

      const monthlyWaitTimes = monthlyGFEs
        .filter(gfe => gfe.queuedAt && gfe.startedAt)
        .map(gfe => {
          const queuedAt = new Date(gfe.queuedAt);
          const startedAt = new Date(gfe.startedAt);
          return Math.round((startedAt.getTime() - queuedAt.getTime()) / 1000);
        })
        .filter(time => !isNaN(time) && time >= 0);

      if (monthlyWaitTimes.length > 0) {
        const totalMonthly = monthlyWaitTimes.reduce((sum, time) => sum + time, 0);
        const monthlyAverage = Math.round(totalMonthly / monthlyWaitTimes.length);
        setMonthlyAvgWait(formatWaitTime(monthlyAverage));
      } else {
        setMonthlyAvgWait('No data');
      }

      // Yearly data
      const yearResponse = await fetchApi('/gfe', {
        fromCompletedAt: format(new Date(today.getFullYear(), 0, 1), "yyyy-MM-dd'T'00:00:00-04:00"),
        toCompletedAt: endOfToday,
        pageSize: 5000 // Use a large page size for historical data
      });

      const yearlyGFEs = yearResponse.payload || [];

      const yearlyWaitTimes = yearlyGFEs
        .filter(gfe => gfe.queuedAt && gfe.startedAt)
        .map(gfe => {
          const queuedAt = new Date(gfe.queuedAt);
          const startedAt = new Date(gfe.startedAt);
          return Math.round((startedAt.getTime() - queuedAt.getTime()) / 1000);
        })
        .filter(time => !isNaN(time) && time >= 0);

      if (yearlyWaitTimes.length > 0) {
        const totalYearly = yearlyWaitTimes.reduce((sum, time) => sum + time, 0);
        const yearlyAverage = Math.round(totalYearly / yearlyWaitTimes.length);
        setYearlyAvgWait(formatWaitTime(yearlyAverage));
      } else {
        setYearlyAvgWait('No data');
      }
    } catch (err) {
      console.error('Error fetching averages:', err);
      setError('Failed to load wait times');
      setMonthlyAvgWait('Error');
      setTodayAvgWait('Error');
      setYearlyAvgWait('Error');
      setCompletedCount(0);
    }
  };

  React.useEffect(() => {
    fetchAverages();
    const interval = setInterval(fetchAverages, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card className="glass hover:shadow-glass-hover transition-all duration-300">
        <CardHeader className="border-l-4 border-l-yellow-500 p-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-2xl font-bold">{todayAvgWait}</div>
              <div className="text-gray-500">Today's Avg Wait ({completedCount} GFEs)</div>
            </div>
            <Clock className="w-5 h-5 text-yellow-500" />
          </div>
        </CardHeader>
      </Card>

      <Card className="glass hover:shadow-glass-hover transition-all duration-300">
        <CardHeader className="border-l-4 border-l-blue-500 p-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-2xl font-bold">{monthlyAvgWait}</div>
              <div className="text-gray-500">Month-to-date Avg Wait</div>
            </div>
            <Clock className="w-5 h-5 text-blue-500" />
          </div>
        </CardHeader>
      </Card>

      <Card className="glass hover:shadow-glass-hover transition-all duration-300">
        <CardHeader className="border-l-4 border-l-green-500 p-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-2xl font-bold">{yearlyAvgWait}</div>
              <div className="text-gray-500">Year-to-date Avg Wait</div>
            </div>
            <Clock className="w-5 h-5 text-green-500" />
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}