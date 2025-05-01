import React, { useState, useEffect } from 'react';
import { Card, CardHeader } from "@/components/ui/card";
import { fetchApi } from '@/lib/api-config';
import { Clock, Activity, Award, TrendingUp } from 'lucide-react';

interface ProviderStats {
  providerId: number;
  providerName: string;
  noOfGfes: number;
  gfeTimeInSeconds: number;
  avgTimeInSeconds: number;
  noOfGfesToday: number;
  gfeTimeToday: number;
  avgGfeTimeTodayInSeconds: number;
  noOfGfesCurrentMonth: number;
  gfeTimeCurrentMonth: number;
  avgGfeTimeCurrentMonthInSeconds: number;
  noOfGfeLastMonth: number;
  allProviderAvgGfeTimeInSeconds: number;
}

export default function ProviderStats() {
  const [stats, setStats] = useState<ProviderStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const response = await fetchApi('/admin/dashboard?tz=-04:00');
        setStats(response.payload);
        setError(null);
      } catch (err) {
        console.error('Error fetching provider stats:', err);
        setError('Failed to load provider statistics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getTotalGFEs = () => stats.reduce((sum, provider) => sum + provider.noOfGfes, 0);
  const getAverageTime = () => {
    const totalTime = stats.reduce((sum, provider) => sum + provider.avgTimeInSeconds, 0);
    return stats.length ? totalTime / stats.length : 0;
  };
  const getFastestProvider = () => {
    return stats.reduce((fastest, current) => 
      !fastest || (current.avgTimeInSeconds < fastest.avgTimeInSeconds) ? current : fastest
    , stats[0]);
  };
  const getMostProductiveProvider = () => {
    return stats.reduce((most, current) => 
      !most || (current.noOfGfes > most.noOfGfes) ? current : most
    , stats[0]);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="h-24 bg-gray-100" />
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">
        {error}
      </div>
    );
  }

  const fastestProvider = getFastestProvider();
  const mostProductive = getMostProductiveProvider();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card className="glass hover:shadow-glass-hover transition-all duration-300">
        <CardHeader className="border-l-4 border-l-blue-500 p-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-2xl font-bold">{getTotalGFEs().toLocaleString()}</div>
              <div className="text-gray-500">Total GFEs</div>
              <div className="text-sm text-blue-600 mt-1">
                Across all providers
              </div>
            </div>
            <Activity className="w-5 h-5 text-blue-500" />
          </div>
        </CardHeader>
      </Card>

      <Card className="glass hover:shadow-glass-hover transition-all duration-300">
        <CardHeader className="border-l-4 border-l-green-500 p-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-2xl font-bold">{formatTime(getAverageTime())}</div>
              <div className="text-gray-500">Average Time</div>
              <div className="text-sm text-green-600 mt-1">
                Per GFE
              </div>
            </div>
            <Clock className="w-5 h-5 text-green-500" />
          </div>
        </CardHeader>
      </Card>

      <Card className="glass hover:shadow-glass-hover transition-all duration-300">
        <CardHeader className="border-l-4 border-l-purple-500 p-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-lg font-bold truncate">{fastestProvider?.providerName}</div>
              <div className="text-gray-500">Fastest Provider</div>
              <div className="text-sm text-purple-600 mt-1">
                Avg: {formatTime(fastestProvider?.avgTimeInSeconds || 0)}
              </div>
            </div>
            <Award className="w-5 h-5 text-purple-500" />
          </div>
        </CardHeader>
      </Card>

      <Card className="glass hover:shadow-glass-hover transition-all duration-300">
        <CardHeader className="border-l-4 border-l-yellow-500 p-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-lg font-bold truncate">{mostProductive?.providerName}</div>
              <div className="text-gray-500">Most Productive</div>
              <div className="text-sm text-yellow-600 mt-1">
                {mostProductive?.noOfGfes.toLocaleString()} GFEs
              </div>
            </div>
            <TrendingUp className="w-5 h-5 text-yellow-500" />
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}