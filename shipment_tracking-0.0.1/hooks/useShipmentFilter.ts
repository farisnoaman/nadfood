import { useState, useMemo } from 'react';
import { Shipment, Driver, ShipmentStatus } from '../types';
import { isDateBetween } from '../utils/dateFormatter';

interface UseShipmentFilterProps {
  baseShipments: Shipment[];
  drivers: Driver[];
  initialSortOption?: 'newest' | 'oldest' | 'highest_due' | 'lowest_due';
}

export const useShipmentFilter = ({ baseShipments, drivers, initialSortOption = 'newest' }: UseShipmentFilterProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<ShipmentStatus | 'all'>('all');
  const [sortOption, setSortOption] = useState(initialSortOption);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const getDriverName = (driverId: number): string => {
    return drivers.find((d: Driver) => d.id === driverId)?.name || 'غير معروف';
  };

  const processedShipments = useMemo(() => {
    // Apply filters
    const filtered = baseShipments.filter(shipment => {
      const lowerSearchTerm = searchTerm.toLowerCase();
      const matchesSearch = lowerSearchTerm === '' ||
        shipment.salesOrder.toLowerCase().includes(lowerSearchTerm) ||
        getDriverName(shipment.driverId).toLowerCase().includes(lowerSearchTerm);

      const matchesRegion = regionFilter === 'all' || shipment.regionId === regionFilter;
      const matchesStatus = statusFilter === 'all' || shipment.status === statusFilter;
      
      // Fix M-05: Improved date filtering with proper timezone handling
      const matchesDate = isDateBetween(
        shipment.orderDate,
        fromDate || null,
        toDate || null
      );

      return matchesSearch && matchesRegion && matchesStatus && matchesDate;
    });

    // Apply sorting
    return [...filtered].sort((a, b) => {
      switch (sortOption) {
        case 'oldest':
          return new Date(a.entryTimestamp).getTime() - new Date(b.entryTimestamp).getTime();
        case 'highest_due':
          const dueA = a.totalDueAmount ?? a.dueAmountAfterDiscount ?? a.dueAmount ?? 0;
          const dueB = b.totalDueAmount ?? b.dueAmountAfterDiscount ?? b.dueAmount ?? 0;
          return dueB - dueA;
        case 'lowest_due':
          const dueALow = a.totalDueAmount ?? a.dueAmountAfterDiscount ?? a.dueAmount ?? 0;
          const dueBLow = b.totalDueAmount ?? b.dueAmountAfterDiscount ?? b.dueAmount ?? 0;
          return dueALow - dueBLow;
        case 'newest':
        default:
          return new Date(b.entryTimestamp).getTime() - new Date(a.entryTimestamp).getTime();
      }
    });
  }, [baseShipments, searchTerm, regionFilter, statusFilter, sortOption, drivers, fromDate, toDate]);

  const clearDateFilters = () => {
    setFromDate('');
    setToDate('');
  };

  return {
    processedShipments,
    searchTerm,
    setSearchTerm,
    regionFilter,
    setRegionFilter,
    statusFilter,
    setStatusFilter,
    sortOption,
    setSortOption,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    clearDateFilters,
  };
};
