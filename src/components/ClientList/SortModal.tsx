import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type SortField = 'name' | 'date';
type SortOrder = 'asc' | 'desc';

interface SortModalProps {
  isOpen: boolean;
  onClose: () => void;
  sortField: SortField;
  sortOrder: SortOrder;
  onSortChange: (field: SortField, order: SortOrder) => void;
}

export default function SortModal({
  isOpen,
  onClose,
  sortField,
  sortOrder,
  onSortChange
}: SortModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sort Clients</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div 
            className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
            onClick={() => onSortChange('name', 'asc')}
          >
            <input 
              type="radio" 
              checked={sortField === 'name' && sortOrder === 'asc'} 
              readOnly
            />
            <label className="flex-1 cursor-pointer">Name (A-Z)</label>
          </div>
          <div 
            className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
            onClick={() => onSortChange('name', 'desc')}
          >
            <input 
              type="radio" 
              checked={sortField === 'name' && sortOrder === 'desc'} 
              readOnly
            />
            <label className="flex-1 cursor-pointer">Name (Z-A)</label>
          </div>
          <div 
            className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
            onClick={() => onSortChange('date', 'desc')}
          >
            <input 
              type="radio" 
              checked={sortField === 'date' && sortOrder === 'desc'} 
              readOnly
            />
            <label className="flex-1 cursor-pointer">Date Added (Newest)</label>
          </div>
          <div 
            className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
            onClick={() => onSortChange('date', 'asc')}
          >
            <input 
              type="radio" 
              checked={sortField === 'date' && sortOrder === 'asc'} 
              readOnly
            />
            <label className="flex-1 cursor-pointer">Date Added (Oldest)</label>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}