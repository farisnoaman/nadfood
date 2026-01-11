
import React from 'react';
import { ShipmentStatus } from '../../../types/types';

interface BadgeProps {
  status: ShipmentStatus;
  className?: string;
}

const statusColors: Record<ShipmentStatus, string> = {
    [ShipmentStatus.FROM_SALES]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    [ShipmentStatus.DRAFT]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    [ShipmentStatus.SENT_TO_ADMIN]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    [ShipmentStatus.RETURNED_FOR_EDIT]: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    [ShipmentStatus.RETURNED_TO_FLEET]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    [ShipmentStatus.FINAL]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    [ShipmentStatus.FINAL_MODIFIED]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    [ShipmentStatus.INSTALLMENTS]: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
};

const getStatusDisplayText = (status: ShipmentStatus): string => {
  switch (status) {
    case ShipmentStatus.SENT_TO_ADMIN:
      return 'مرسلة للمدير';
    case ShipmentStatus.INSTALLMENTS:
      return 'تسديد دين';
    default:
      return status;
  }
};

const Badge: React.FC<BadgeProps> = ({ status, className }) => {
  const colorClass = statusColors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  const displayText = getStatusDisplayText(status);

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass} ${className}`}>
      {displayText}
    </span>
  );
};

export default Badge;
