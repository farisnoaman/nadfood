

import React from 'react';
import { Shipment } from '../../../types/types';
import Badge from './Badge';
import Button from '../ui/Button';
import { Icons } from '../../Icons';

interface ShipmentListItemProps {
  shipment: Shipment;
  onSelect: (shipment: Shipment) => void;
  getRegionName: (id: string) => string;
  getDriverName: (id: number) => string;
  actionLabel: string;
  finalAmount: number;
}

const ShipmentListItem: React.FC<ShipmentListItemProps> = ({ shipment, onSelect, getRegionName, getDriverName, actionLabel, finalAmount }) => {
  const isPending = shipment.isPendingSync;
  return (
    <div className={`grid grid-cols-6 gap-4 items-center p-3 bg-gradient-to-r from-white to-gray-50 dark:from-secondary-800 dark:to-secondary-700 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-secondary-600 hover:border-primary-500/30 rounded-lg text-sm ${isPending ? 'opacity-60' : ''}`}>
      <div className="font-semibold text-primary-600 dark:text-primary-400 truncate col-span-2 sm:col-span-1 flex items-center">
        {isPending && <Icons.AlertTriangle className="h-4 w-4 text-yellow-500 mr-2 flex-shrink-0" />}
        {shipment.salesOrder}
      </div>
      <div className="hidden sm:block truncate">{getRegionName(shipment.regionId)}</div>
      <div className="hidden sm:block truncate">{getDriverName(shipment.driverId)}</div>
      <div className="flex justify-center"><Badge status={shipment.status} /></div>
      <div className={`font-bold text-left truncate ${finalAmount < 0 ? 'text-red-600' : 'text-green-600'}`}>
        {finalAmount < 0 ? 'عليه ' : 'له '}
        {Math.abs(finalAmount).toLocaleString('en-US')} ر.ي
      </div>
      <div className="flex justify-end">
        <Button size="sm" onClick={() => onSelect(shipment)} variant="secondary" disabled={isPending}>
          <Icons.FileText className="ml-2 h-4 w-4" />
          {actionLabel}
        </Button>
      </div>
    </div>
  );
};

export default ShipmentListItem;