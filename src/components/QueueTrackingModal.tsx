import React from 'react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Users, Clock, AlertTriangle, Activity } from 'lucide-react';

interface QueueTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  queueCount: number | null;
  lastQueueTime: string | null;
}

export default function QueueTrackingModal({
  isOpen,
  onClose,
  queueCount,
  lastQueueTime,
}: QueueTrackingModalProps) {
  const isCurrentlyInQueue = queueCount && queueCount > 0;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass border-0 shadow-glass hover:shadow-glass-hover transition-all duration-300">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Users className="w-6 h-6" />
            Queue Status Monitor
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Current Queue Status */}
          <div className={cn(
            "flex items-center gap-4 p-4 rounded-lg transition-colors",
            isCurrentlyInQueue ? "bg-blue-50" : "bg-green-50"
          )}>
            <Users className="w-8 h-8 text-blue-600" />
            <div>
              <h3 className="font-medium">Current Queue</h3>
              <p className={cn(
                "text-2xl font-bold",
                isCurrentlyInQueue ? "text-blue-600" : "text-green-600"
              )}>
                {queueCount ?? '...'} {queueCount === 1 ? 'Patient' : 'Patients'}
              </p>
            </div>
          </div>

          {/* Last Queue Time */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <Clock className="w-8 h-8 text-gray-600" />
            <div>
              <h3 className="font-medium">Last Patient in Queue</h3>
              <p className="text-lg text-gray-700 mt-1">
                {isCurrentlyInQueue ? (
                  <span className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                    </span>
                    Active Now
                  </span>
                ) : lastQueueTime ? (
                  <span>Last active: {lastQueueTime}</span>
                ) : (
                  'No recent activity'
                )}
              </p>
            </div>
          </div>

          {/* Queue Warning */}
          {queueCount && queueCount > 1 && (
            <div className="flex items-center gap-4 p-4 bg-yellow-50 rounded-lg">
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
              <div>
                <h3 className="font-medium text-yellow-800">High Queue Load</h3>
                <p className="text-sm text-yellow-700">
                  Multiple patients in queue. Consider allocating additional resources.
                </p>
              </div>
            </div>
          )}

          {/* Queue Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-green-600" />
                <h3 className="font-medium text-green-800">Average Wait Time</h3>
              </div>
              <p className="text-2xl font-bold text-green-600">~3.5 min</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-purple-600" />
                <h3 className="font-medium text-purple-800">Peak Hours</h3>
              </div>
              <p className="text-2xl font-bold text-purple-600">2PM - 4PM</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}