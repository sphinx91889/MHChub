import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchApi } from '@/lib/api-config';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Clock, Activity, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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

export default function ProviderInsights() {
  const [stats, setStats] = useState<ProviderStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortField, setSortField] = useState<'gfes' | 'efficiency' | 'monthly'>('gfes');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetchApi('/admin/dashboard?tz=-04:00', { cache: 'no-store' });
        // Filter out excluded providers
        const filteredStats = response.payload.filter(
          (provider: ProviderStats) => !excludedProviders.some(name => {
            const nameLower = name.toLowerCase();
            const providerNameLower = provider.providerName.toLowerCase();
            return providerNameLower.includes(nameLower) ||
                   providerNameLower === nameLower;
          })
        );
        setStats(filteredStats);
        setError(null);
      } catch (err) {
        console.error('Error fetching provider stats:', err);
        setError('Failed to load provider statistics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  const calculateEfficiency = (providerAvg: number, globalAvg: number) => {
    const difference = ((globalAvg - providerAvg) / globalAvg) * 100;
    return difference.toFixed(1);
  };

  const sortProviders = (providers: ProviderStats[]) => {
    return [...providers].sort((a, b) => {
      let aValue: number, bValue: number;
      
      switch (sortField) {
        case 'gfes':
          aValue = a.noOfGfes;
          bValue = b.noOfGfes;
          break;
        case 'efficiency':
          aValue = a.avgTimeInSeconds;
          bValue = b.avgTimeInSeconds;
          break;
        case 'monthly':
          aValue = a.noOfGfesCurrentMonth;
          bValue = b.noOfGfesCurrentMonth;
          break;
        default:
          return 0;
      }
      
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });
  };

  if (isLoading) {
    return <div className="min-h-[400px] flex items-center justify-center">Loading...</div>;
  }
  
  const sortedProviders = sortProviders(stats);

  return (
    <>
      <div className="flex justify-between items-center mb-8 pt-5 md:pt-10">
        <div>
          <Button
            variant="outline"
            asChild
            className="mb-4"
          >
            <Link to="/providers" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Provider Details
            </Link>
          </Button>
          <h2 className="text-2xl font-bold">Provider Insights</h2>
          <p className="text-gray-500 mt-1">Performance metrics and analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={`${sortField}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-') as ['gfes' | 'efficiency' | 'monthly', 'asc' | 'desc'];
              setSortField(field);
              setSortOrder(order);
            }}
            className="px-3 py-2 border rounded-md bg-white"
          >
            <option value="gfes-desc">Most GFEs</option>
            <option value="gfes-asc">Least GFEs</option>
            <option value="efficiency-asc">Most Efficient</option>
            <option value="efficiency-desc">Least Efficient</option>
            <option value="monthly-desc">Highest Monthly</option>
            <option value="monthly-asc">Lowest Monthly</option>
          </select>
        </div>
      </div>

      {error ? (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="glass hover:shadow-glass-hover transition-all duration-300">
              <CardHeader className="border-l-4 border-l-blue-500 p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-2xl font-bold">
                      {stats.reduce((sum, provider) => sum + provider.noOfGfes, 0).toLocaleString()}
                    </div>
                    <div className="text-gray-500">Total GFEs</div>
                    <div className="text-sm text-blue-600 mt-1">All providers</div>
                  </div>
                  <Activity className="w-5 h-5 text-blue-500" />
                </div>
              </CardHeader>
            </Card>

            <Card className="glass hover:shadow-glass-hover transition-all duration-300">
              <CardHeader className="border-l-4 border-l-green-500 p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-2xl font-bold">
                      {formatTime(stats[0]?.allProviderAvgGfeTimeInSeconds || 0)}
                    </div>
                    <div className="text-gray-500">Global Average</div>
                    <div className="text-sm text-green-600 mt-1">Per GFE</div>
                  </div>
                  <Clock className="w-5 h-5 text-green-500" />
                </div>
              </CardHeader>
            </Card>

            <Card className="glass hover:shadow-glass-hover transition-all duration-300">
              <CardHeader className="border-l-4 border-l-purple-500 p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-2xl font-bold">
                      {stats.reduce((sum, provider) => sum + provider.noOfGfesCurrentMonth, 0).toLocaleString()}
                    </div>
                    <div className="text-gray-500">This Month</div>
                    <div className="text-sm text-purple-600 mt-1">Total GFEs</div>
                  </div>
                  <Activity className="w-5 h-5 text-purple-500" />
                </div>
              </CardHeader>
            </Card>

            <Card className="glass hover:shadow-glass-hover transition-all duration-300">
              <CardHeader className="border-l-4 border-l-yellow-500 p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-2xl font-bold">
                      {stats.reduce((sum, provider) => sum + provider.noOfGfesToday, 0).toLocaleString()}
                    </div>
                    <div className="text-gray-500">Today</div>
                    <div className="text-sm text-yellow-600 mt-1">Total GFEs</div>
                  </div>
                  <Activity className="w-5 h-5 text-yellow-500" />
                </div>
              </CardHeader>
            </Card>
          </div>

          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Provider Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      GFEs Completed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      GFEs This Month
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Month
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Efficiency vs Avg
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sortedProviders.map((provider) => {
                    const efficiency = calculateEfficiency(
                      provider.avgTimeInSeconds,
                      provider.allProviderAvgGfeTimeInSeconds
                    );
                    const isMoreEfficient = parseFloat(efficiency) > 0;

                    return (
                      <tr key={provider.providerId} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="font-medium">{provider.providerName}</div>
                        </td>
                        <td className="px-6 py-4">
                          {provider.noOfGfes.toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          {formatTime(provider.avgTimeInSeconds)}
                        </td>
                        <td className="px-6 py-4">
                          {provider.noOfGfesCurrentMonth.toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          {provider.noOfGfeLastMonth.toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className={`flex items-center gap-1 ${
                            isMoreEfficient ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {isMoreEfficient ? (
                              <ArrowUpRight className="w-4 h-4" />
                            ) : (
                              <ArrowDownRight className="w-4 h-4" />
                            )}
                            <span>{Math.abs(parseFloat(efficiency))}% {isMoreEfficient ? 'better' : 'slower'}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  );
}