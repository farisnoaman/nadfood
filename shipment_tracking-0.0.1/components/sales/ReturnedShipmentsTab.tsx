import React from 'react';
import { Shipment } from '../../types';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { IconsWithFallback } from '../Icons';



interface ReturnedShipmentsTabProps {
  returnedShipments: Shipment[];
  drivers: any[];
  regions: any[];
  onEditShipment: (shipment: Shipment) => void;
  getDriverName: (driverId: number) => string;
  getRegionName: (regionId: string) => string;
  calculateFinalAmount: (shipment: Shipment) => number;
}

const ReturnedShipmentsTab: React.FC<ReturnedShipmentsTabProps> = ({
  returnedShipments,
  drivers,
  regions,
  onEditShipment,
  getDriverName,
  getRegionName,
  calculateFinalAmount
}) => {


  // Debug logging
  console.log('ReturnedShipmentsTab render:', {
    returnedShipmentsCount: returnedShipments?.length || 0,
    returnedShipments,
    driversCount: drivers?.length || 0,
    regionsCount: regions?.length || 0
  });

  // Validate data and handle empty state
  if (!returnedShipments || returnedShipments.length === 0) {
    return (
      <Card className="text-center py-12">
        <IconsWithFallback.Undo2 className="mx-auto h-16 w-16 text-secondary-300 dark:text-secondary-600 mb-4" />
        <h3 className="text-lg font-semibold text-secondary-700 dark:text-secondary-300 mb-2">
          لا توجد شحنات مرتجعة
        </h3>
        <p className="text-secondary-500 dark:text-secondary-400">
          عندما يقوم المحاسب بإرجاع شحنة للتعديل، ستظهر هنا
        </p>
      </Card>
    );
  }

  const handleEditClick = (shipment: Shipment) => {
    console.log('Edit clicked for shipment:', shipment);
    onEditShipment(shipment);
  };



  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card className="p-4">
        <div className="flex items-start mb-4">
          <IconsWithFallback.AlertTriangle className="h-5 w-5 text-yellow-500 ml-3 mt-0.5" />
          <div>
            <h3 className="font-bold text-secondary-800 dark:text-secondary-200">
              الشحنات المرتجعة ({returnedShipments.length})
            </h3>
            <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">
              تم إرجاع هذه الشحنات من قبل المحاسب. يرجى مراجعتها وتحديث البيانات المطلوبة.
            </p>
          </div>
        </div>
      </Card>

      {/* Shipments List */}
      <div className="space-y-3">
        {returnedShipments
          .filter(shipment => shipment && typeof shipment === 'object' && shipment.id)
          .map((shipment, index) => {
            try {
              console.log(`Rendering shipment ${index + 1}:`, shipment);
              
              return (
                <div key={shipment.id} className="bg-white dark:bg-secondary-800 shadow rounded-lg overflow-hidden flex flex-col border border-red-200 dark:border-red-800">
                  <div className="px-4 py-3 bg-secondary-50 dark:bg-secondary-800/50 flex justify-between items-center border-b border-secondary-200 dark:border-secondary-700">
                    <h3 className="font-bold text-lg text-primary-600 dark:text-primary-400">{shipment.salesOrder || `شحنة ${index + 1}`}</h3>
                    <div className="flex items-center gap-2">
                      <Badge status={shipment.status} />
                      <span className="text-xs px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full">
                        مرتجعة
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-4 flex-grow">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center">
                        <IconsWithFallback.MapPin className="h-5 w-5 text-secondary-500 ml-2 flex-shrink-0" />
                        <div>
                          <p className="text-secondary-500 text-xs">المنطقة</p>
                          <p className="font-semibold">{getRegionName(shipment.regionId)}</p>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <IconsWithFallback.User className="h-5 w-5 text-secondary-500 ml-2 flex-shrink-0" />
                        <div>
                          <p className="text-secondary-500 text-xs">السائق</p>
                          <p className="font-semibold">{getDriverName(shipment.driverId)}</p>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <IconsWithFallback.Truck className="h-5 w-5 text-secondary-500 ml-2 flex-shrink-0" />
                        <div>
                          <p className="text-secondary-500 text-xs">رقم الشحنة</p>
                          <p className="font-semibold">{shipment.id}</p>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <div className="w-7 h-5 flex items-center justify-center ml-2">
                          <span className="text-green-500 font-bold text-sm">ر.ي</span>
                        </div>
                        <div>
                          <p className="text-secondary-500 text-xs">المبلغ الإجمالي</p>
                          <p className="font-bold text-green-600 dark:text-green-400">
                            {calculateFinalAmount(shipment).toLocaleString('en-US')}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2 border-t border-secondary-200 dark:border-secondary-700">
                      <Button
                        onClick={() => handleEditClick(shipment)}
                        variant="primary"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <IconsWithFallback.Edit className="ml-2 h-4 w-4" />
                        تعديل
                      </Button>
                    </div>
                  </div>
                </div>
              );
            } catch (error) {
              console.error('Error rendering shipment:', error, shipment);
              return (
                <Card 
                  key={`error-${shipment.id || index}`}
                  className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                >
                  <div className="text-red-600 dark:text-red-400">
                    <p className="font-semibold">خطأ في عرض الشحنة</p>
                    <p className="text-sm">قد تكون البيانات غير مكتملة أو تالفة</p>
                  </div>
                </Card>
              );
            }
          })}
      </div>

      {/* Editable Fields Info */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
          الحقول القابلة للتعديل
        </h4>
        <p className="text-sm text-blue-600 dark:text-blue-300">
          يمكنك تعديل: رقم الطلب، المنطقة، السائق، والمنتجات
        </p>
      </Card>
    </div>
  );
};

export default ReturnedShipmentsTab;