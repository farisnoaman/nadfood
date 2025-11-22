import React, { useState, useMemo } from 'react';
import { Shipment, ShipmentStatus } from '../../types';
import { useAppContext } from '../../context/AppContext';
import NewShipmentForm from './NewShipmentForm';
import FleetShipmentModal from './FleetShipmentModal';
import ReturnedShipmentsTab from './ReturnedShipmentsTab';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { IconsWithFallback } from '../Icons';

type Tab = 'create' | 'returned';

const SalesDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('create');
  const { shipments, drivers, regions, refreshAllData, isSyncing } = useAppContext();
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Helper functions to get display names
  const getDriverName = (driverId: number) => {
    if (!drivers || !Array.isArray(drivers)) return 'غير محدد';
    const driver = drivers.find(d => d && d.id === driverId);
    return driver ? driver.name : 'غير محدد';
  };

  const getRegionName = (regionId: string) => {
    if (!regions || !Array.isArray(regions)) return 'غير محدد';
    const region = regions.find(r => r && r.id === regionId);
    return region ? region.name : 'غير محدد';
  };

  const calculateFinalAmount = (shipment: Shipment) => {
    if (!shipment) return 0;
    return shipment.totalDueAmount || shipment.dueAmountAfterDiscount || shipment.dueAmount || 0;
  };

  // Filter returned shipments with comprehensive validation
  const returnedShipments = useMemo(() => {
    try {
      // Comprehensive validation
      if (!shipments || !Array.isArray(shipments) || shipments.length === 0) {
        return [];
      }
      
      const filtered = shipments
        .filter((s: Shipment) => {
          // Validate shipment object
          if (!s || typeof s !== 'object') return false;
          if (s.status !== ShipmentStatus.RETURNED_TO_FLEET) return false;
          return true;
        })
        .sort((a: Shipment, b: Shipment) => {
          // Safe date comparison
          const dateA = new Date(a?.entryTimestamp || a?.createdAt || 0).getTime();
          const dateB = new Date(b?.entryTimestamp || b?.createdAt || 0).getTime();
          return dateB - dateA;
        });
      
      return filtered;
    } catch (error) {
      console.error('Error filtering returned shipments:', error);
      return [];
    }
  }, [shipments]);

  const handleEditShipment = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedShipment(null);
  };

  const TabButton: React.FC<{ tabId: Tab; label: string; icon: React.ElementType; badge?: number }> = ({ 
    tabId, 
    label, 
    icon: Icon, 
    badge 
  }) => {
    // Comprehensive icon validation
    if (!Icon || typeof Icon !== 'function') {
      console.warn('Invalid icon component for tab:', tabId, Icon);
      return null;
    }
    
    const handleClick = () => {
      try {
        setActiveTab(tabId);
      } catch (error) {
        console.error('Error clicking tab:', error);
      }
    };
    
    return (
      <button
        onClick={handleClick}
        className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors relative ${
          activeTab === tabId
            ? 'bg-primary-600 text-white'
            : 'text-secondary-600 dark:text-secondary-300 hover:bg-secondary-200 dark:hover:bg-secondary-700'
        }`}
      >
        <Icon className="ml-2 h-5 w-5" />
        {label}
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">لوحة تحكم مسؤول الحركة</h1>
        
        {/* Refresh Button */}
        <button
          onClick={refreshAllData}
          disabled={isSyncing}
          className="flex items-center px-3 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 disabled:text-secondary-400 dark:text-primary-400 dark:hover:text-primary-300 dark:disabled:text-secondary-600"
        >
          <IconsWithFallback.RefreshCw className={`ml-1 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'جاري التحديث...' : 'تحديث'}
        </button>
      </div>
      
      {/* Tabs */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 border-b border-secondary-200 dark:border-secondary-700 pb-2">
          <TabButton tabId="create" label="إنشاء شحنة جديدة" icon={IconsWithFallback.FilePlus} />
          <TabButton 
            tabId="returned" 
            label="المرتجعة" 
            icon={IconsWithFallback.Undo2} 
            badge={returnedShipments.length} 
          />
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'create' && (
        <div>
          <NewShipmentForm />
        </div>
      )}

      {activeTab === 'returned' && (
        <ReturnedShipmentsTab 
          returnedShipments={returnedShipments}
          drivers={drivers}
          regions={regions}
          onEditShipment={handleEditShipment}
          getDriverName={getDriverName}
          getRegionName={getRegionName}
          calculateFinalAmount={calculateFinalAmount}
        />
      )}

      {/* Edit Modal */}
      {selectedShipment && (
        <FleetShipmentModal
          shipment={selectedShipment}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default SalesDashboard;
