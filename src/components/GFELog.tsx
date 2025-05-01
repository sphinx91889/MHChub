import React from 'react';
import { Card, CardHeader } from "@/components/ui/card";
import { Clock, User, Building2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface GFETiming {
  id: string;
  gfe_id: number;
  patient_id: number;
  started_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
  score: string | null;
  provider_name: string | null;
  metadata: {
    company_name: string;
    room_no?: number;
  };
  patient_name: string;
  queued_at: string | null;
  wait_time_seconds: number | null;
}

export default function GFELog() {
  const [timings, setTimings] = React.useState<GFETiming[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchTimings = async () => {
      try {
        const { data, error } = await supabase
          .from('gfe_records')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;
        setTimings(data || []);

        setError(null);
      } catch (err) {
        console.error('Error fetching GFE timings:', err);
        setError('Failed to load GFE log');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTimings();
    const interval = setInterval(fetchTimings, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const formatTimestamp = (timestamp: string | null, completed: boolean) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return `${completed ? 'Completed' : 'Started'}: ${date.toLocaleTimeString()}`;
  };

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardHeader className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">GFE Log</h3>
          <div className="text-sm text-gray-500">
            Last {timings.length} GFEs
          </div>
        </div>

        <div className="space-y-4">
          {timings.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No GFE records found</p>
          ) : (
            timings.map((timing) => (
              <div
                key={timing.id}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">
                      {timing.patient_name || 'Unknown Patient'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="w-4 h-4" />
                    <span>Provider: {timing.provider_name || 'Not Assigned'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Building2 className="w-4 h-4" />
                    <span>{timing.metadata?.company_name || 'Unknown Company'}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span>{formatTimestamp(timing.started_at, false)}</span>
                  </div>
                  {timing.completed_at && (
                    <div className="text-sm text-green-600">
                      {formatTimestamp(timing.completed_at, true)}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardHeader>
    </Card>
  );
}
