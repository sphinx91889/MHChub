import React from 'react';
import { RefreshCw, Filter, SortDesc, AlertTriangle, DollarSign } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface ClientListHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  customerIdSearchTerm: string;
  onCustomerIdSearchChange: (value: string) => void;
  onFilterClick: () => void;
  onSortClick: () => void;
  onRefresh: () => void;
  onNoGfeClick: () => void;
  onNoPaymentMethodClick: () => void;
  isRefreshing: boolean;
}

export default function ClientListHeader({
  searchTerm,
  onSearchChange,
  customerIdSearchTerm,
  onCustomerIdSearchChange,
  onFilterClick,
  onSortClick,
  onRefresh,
  onNoGfeClick,
  onNoPaymentMethodClick,
  isRefreshing
}: ClientListHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
      <div className="flex flex-1 gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3 top-2.5">🔍</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search clients..."
            className="w-full pl-10 pr-4 py-2 border rounded-md bg-white"
          />
        </div>
        <div className="relative w-48">
          <input
            type="number"
            value={customerIdSearchTerm}
            onChange={(e) => onCustomerIdSearchChange(e.target.value)}
            placeholder="Customer ID"
            className="w-full px-4 py-2 border rounded-md bg-white"
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button 
          variant="outline"
          onClick={onFilterClick}
          className="flex items-center gap-2"
        >
          <Filter className="w-4 h-4" /> Filter
        </Button>
        <Button 
          variant="outline"
          onClick={onNoGfeClick}
          className="flex items-center gap-2"
        >
          <AlertTriangle className="w-4 h-4" /> No GFEs (45 Days)
        </Button>
        <Button 
          variant="outline"
          onClick={onNoPaymentMethodClick}
          className="flex items-center gap-2"
        >
          <DollarSign className="w-4 h-4" /> No Payment Method
        </Button>
        <Button 
          variant="outline"
          onClick={onSortClick}
          className="flex items-center gap-2"
        >
          <SortDesc className="w-4 h-4" /> Sort
        </Button>
        <Button 
          variant="outline"
          onClick={onRefresh}
          className="p-2"
          disabled={isRefreshing}
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    </div>
  );
}