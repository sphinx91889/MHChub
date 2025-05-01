import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserCheck, Clock, CheckCircle2 } from 'lucide-react';
import { fetchApi } from '@/lib/api-config';
import { format } from 'date-fns';

interface Provider {
  id: number;
  name: string;
  gfeCount: number;
  avgTimeInSeconds: number;
  lastGfeAt: string | null;
}

interface OnlineProvidersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OnlineProvidersModal({ isOpen, onClose }: OnlineProvidersModalProps) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get today's date range
        const today = new Date();
        const startOfDay = format(today, "yyyy-MM-dd'T'00:00:00xxx");
        const endOfDay = format(today, "yyyy-MM-dd'T'23:59:59xxx");

        // Fetch completed GFEs for today
        const response = await fetchApi('/gfe', {
          fromCompletedAt: startOfDay,
          toCompletedAt: endOfDay,
          pageSize: 1000
        });

        // Group GFEs by provider
        const providerMap = new Map<number, Provider>();
        
        response.payload?.forEach((gfe: any) => {
          if (!gfe.evaluatedBy) return;

          const providerId = gfe.providerId || gfe.evaluatedBy;
          const provider = providerMap.get(providerId) || {
            id: providerId,
            name: gfe.evaluatedBy,
            gfeCount: 0,
            avgTimeInSeconds: 0,
            lastGfeAt: null
          };

          // Calculate completion time
          if (gfe.startedAt && gfe.completedAt) {
            const completionTime = Math.round(
              (new Date(gfe.completedAt).getTime() - new Date(gfe.startedAt).getTime()) / 1000
            );
            
            // Update average time
            const totalTime = provider.avgTimeInSeconds * provider.gfeCount + completionTime;
            provider.gfeCount++;
            provider.avgTimeInSeconds = Math.round(totalTime / provider.gfeCount);
            
            // Update last GFE time
            if (!provider.lastGfeAt || new Date(gfe.completedAt) > new Date(provider.lastGfeAt)) {
              provider.lastGfeAt = gfe.completedAt;
            }
          }

          providerMap.set(providerId, provider);
        });

        // Convert map to array and sort by GFE count
        setProviders(
          Array.from(providerMap.values())
            .sort((a, b) => b.gfeCount - a.gfeCount)
        );

      } catch (err) {
        console.error('Error fetching providers:', err);
        setError('Failed to load provider data');
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchProviders();
    }
  }, [isOpen]);

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            Online Providers Today
          </DialogTitle>
        </DialogHeader>

        {error ? (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : providers.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600">No provider activity found today</p>
          </div>
        ) : (
          <div className="space-y-4">
            {providers.map((provider) => (
              <div
                key={provider.id}
                className="p-4 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-medium">{provider.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span>
                          {provider.lastGfeAt ? (
                            `Last GFE: ${format(new Date(provider.lastGfeAt), 'h:mm a')}`
                          ) : (
                            'No GFEs completed'
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="font-medium">{provider.gfeCount} GFEs</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      Avg Time: {formatDuration(provider.avgTimeInSeconds)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}