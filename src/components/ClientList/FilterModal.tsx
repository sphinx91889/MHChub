import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type FilterStatus = 'all' | 'active' | 'inactive';
type DateFilter = 'all' | '7days' | '30days' | '90days';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  statusFilter: FilterStatus;
  dateFilter: DateFilter;
  onStatusFilterChange: (value: FilterStatus) => void;
  onDateFilterChange: (value: DateFilter) => void;
  onReset: () => void;
  onApply: () => void;
}

export default function FilterModal({
  isOpen,
  onClose,
  statusFilter,
  dateFilter,
  onStatusFilterChange,
  onDateFilterChange,
  onReset,
  onApply
}: FilterModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Filter Clients</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select 
              className="w-full px-3 py-2 border rounded-md"
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value as FilterStatus)}
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Added
            </label>
            <select 
              className="w-full px-3 py-2 border rounded-md"
              value={dateFilter}
              onChange={(e) => onDateFilterChange(e.target.value as DateFilter)}
            >
              <option value="all">All Time</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onReset}>
              Reset
            </Button>
            <Button onClick={onApply}>
              Apply Filters
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}