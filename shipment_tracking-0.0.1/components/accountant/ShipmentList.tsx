import React, { useState } from 'react';
import { Shipment } from '../../types';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { Icons } from '../Icons';
import AccountantShipmentModal from './AccountantShipmentModal';
import ShipmentListItem from '../common/ShipmentListItem';
import { useAppContext } from '../../context/AppContext';

interface ShipmentListProps {
  shipments: Shipment[];
  viewType: 'received' | 'sent' | 'reports';
  view: 'grid' | 'list';
}

const ShipmentList: React.FC<ShipmentListProps> = ({ shipments, viewType, view }) => {
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const { regions, drivers } = useAppContext();

  const getRegionName = (id: string) => regions.find((r: any) => r.id === id)?.name || 'غير معروف';
  const getDriverName = (id: number) => drivers.find((d: any) => d.id === id)?.name || 'غير معروف';

  if (shipments.length === 0) {
    return <div className="text-center py-10 text-secondary-500">لا توجد شحنات لعرضها.</div>;
  }
  
  const actionLabel = 'مراجعة';

  return (
    <div>
      {/* List View */}
      {view === 'list' && (
          <div className="space-y-2">
              {/* Mobile List View */}
              <div className="md:hidden">
                  {shipments.map((shipment) => (
                      <div key={shipment.id} className="bg-white dark:bg-secondary-800 rounded-lg shadow p-4">
                          <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                  <h3 className="font-bold text-primary-600 dark:text-primary-400 mb-2">{shipment.salesOrder}</h3>
                                  <div className="space-y-1 text-sm">
                                      <div className="flex items-center">
                                          <Icons.MapPin className="h-4 w-4 text-secondary-500 ml-2 flex-shrink-0" />
                                          <span>{getRegionName(shipment.regionId)}</span>
                                      </div>
                                      <div className="flex items-center">
                                          <Icons.User className="h-4 w-4 text-secondary-500 ml-2 flex-shrink-0" />
                                          <span>{getDriverName(shipment.driverId)}</span>
                                      </div>
                                      <div className="flex items-center">
                                          <Icons.Package className="h-4 w-4 text-secondary-500 ml-2 flex-shrink-0" />
                                          <span>{shipment.products.length} منتج</span>
                                      </div>
                                  </div>
                              </div>
                              <div className="text-left">
                                  <p className="text-xs text-secondary-500 mb-1">المبلغ المستحق</p>
                                  <p className="font-bold text-green-600">
                                      {(shipment.dueAmountAfterDiscount ?? shipment.dueAmount ?? 0).toLocaleString('en-US')} ر.ي
                                  </p>
                              </div>
                          </div>
                          <div className="flex justify-end">
                              <Button size="sm" onClick={() => setSelectedShipment(shipment)} disabled={shipment.isPendingSync}>
                                  <Icons.Edit className="ml-2 h-4 w-4" />
                                  {actionLabel}
                              </Button>
                          </div>
                      </div>
                  ))}
              </div>

              {/* Desktop List View */}
              <div className="hidden md:block">
                  <div className="grid grid-cols-6 gap-4 px-3 py-2 text-xs font-bold text-secondary-500 dark:text-secondary-400 uppercase">
                      <div className="col-span-2 sm:col-span-1">أمر المبيعات</div>
                      <div className="hidden sm:block">المنطقة</div>
                      <div className="hidden sm:block">السائق</div>
                      <div className="text-center">الحالة</div>
                      <div className="text-left">المبلغ المستحق</div>
                      <div className="text-right">الإجراء</div>
                  </div>
                  {shipments.map((shipment) => (
                      <ShipmentListItem
                          key={shipment.id}
                          shipment={shipment}
                          onSelect={setSelectedShipment}
                          getRegionName={getRegionName}
                          getDriverName={getDriverName}
                          actionLabel={actionLabel}
                          finalAmount={shipment.dueAmountAfterDiscount ?? shipment.dueAmount ?? 0}
                      />
                  ))}
              </div>
          </div>
      )}
      
      {/* Grid View (default for mobile, optional for desktop) */}
      <div className={view === 'list' ? 'hidden' : ''}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shipments.map((shipment) => (
            <div key={shipment.id} className={`bg-white dark:bg-secondary-800 shadow rounded-lg overflow-hidden flex flex-col transition-opacity ${shipment.isPendingSync ? 'opacity-60' : ''}`}>
              {/* Header */}
              <div className="px-4 py-3 bg-secondary-50 dark:bg-secondary-800/50 flex justify-between items-center border-b border-secondary-200 dark:border-secondary-700">
                <h3 className="font-bold text-lg text-primary-600 dark:text-primary-400 flex items-center">
                    {shipment.isPendingSync && <Icons.AlertTriangle className="h-4 w-4 text-yellow-500 mr-2 flex-shrink-0" title="معلق للمزامنة" />}
                    {shipment.salesOrder}
                </h3>
                <Badge status={shipment.status} />
              </div>

              {/* Body */}
              <div className="p-4 space-y-4 flex-grow">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center">
                        <Icons.MapPin className="h-5 w-5 text-secondary-500 ml-2 flex-shrink-0" />
                        <div>
                        <p className="text-secondary-500 text-xs">المنطقة</p>
                        <p className="font-semibold">{getRegionName(shipment.regionId)}</p>
                        </div>
                    </div>
                    <div className="flex items-center">
                        <Icons.User className="h-5 w-5 text-secondary-500 ml-2 flex-shrink-0" />
                        <div>
                        <p className="text-secondary-500 text-xs">السائق</p>
                        <p className="font-semibold">{getDriverName(shipment.driverId)}</p>
                        </div>
                    </div>
                    <div className="flex items-center col-span-full">
                        <Icons.Calendar className="h-5 w-5 text-secondary-500 ml-2 flex-shrink-0" />
                        <div>
                        <p className="text-secondary-500 text-xs">تاريخ الأمر</p>
                        <p className="font-semibold">{new Date(shipment.orderDate).toLocaleDateString('ar-EG')}</p>
                        </div>
                    </div>
                </div>
                
                <div className="pt-3 border-t border-dashed border-secondary-200 dark:border-secondary-700">
                  <p className="text-sm font-semibold mb-2">المنتجات:</p>
                  <div className="space-y-1 text-sm max-h-24 overflow-y-auto">
                    {shipment.products.map(product => (
                      <div key={product.productId} className="flex justify-between items-center text-secondary-700 dark:text-secondary-300">
                        <span>{product.productName}</span>
                        <span className="font-mono bg-secondary-100 dark:bg-secondary-700 px-2 py-0.5 rounded text-xs">{product.cartonCount} كرتون</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-4 py-3 bg-secondary-50 dark:bg-secondary-800/50 flex justify-between items-center border-t border-secondary-200 dark:border-secondary-700 mt-auto">
                <div>
                  <p className="text-xs text-secondary-500">المبلغ المستحق بعد الخصم</p>
                  <p className="font-bold text-lg text-green-600">
                    {(shipment.dueAmountAfterDiscount ?? shipment.dueAmount ?? 0).toLocaleString('en-US')} ر.ي
                  </p>
                </div>
                <Button size="sm" onClick={() => setSelectedShipment(shipment)} disabled={shipment.isPendingSync}>
                  <Icons.Edit className="ml-2 h-4 w-4" />
                  {actionLabel}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedShipment && (
        <AccountantShipmentModal
          shipment={selectedShipment}
          isOpen={!!selectedShipment}
          onClose={() => setSelectedShipment(null)}
          isEditable={viewType === 'received'}
        />
      )}
    </div>
  );
};

export default ShipmentList;