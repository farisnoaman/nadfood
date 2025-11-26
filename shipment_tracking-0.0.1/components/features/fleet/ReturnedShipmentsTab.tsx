import React from 'react';
import { Shipment } from '../../../types';
import Card from '../../common/display/Card';
import Badge from '../../common/display/Badge';
import Button from '../../common/ui/Button';
import { IconsWithFallback } from '../../Icons';



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
       <div className="space-y-2 sm:space-y-3">
        {returnedShipments
          .filter(shipment => shipment && typeof shipment === 'object' && shipment.id)
          .map((shipment, index) => {
            try {
              console.log(`Rendering shipment ${index + 1}:`, shipment);
              
              return (
                 <div key={shipment.id} className="bg-white dark:bg-secondary-800 shadow rounded-lg overflow-hidden flex flex-col border border-red-200 dark:border-red-800">
                   <div className="px-3 py-2 sm:px-4 sm:py-3 bg-secondary-50 dark:bg-secondary-800/50 flex justify-between items-center border-b border-secondary-200 dark:border-secondary-700">
                     <h3 className="font-bold text-base sm:text-lg text-primary-600 dark:text-primary-400 truncate">{shipment.salesOrder || `شحنة ${index + 1}`}</h3>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge status={shipment.status} />
                      </div>
                   </div>

                   <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 flex-grow">
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-sm">
                       <div className="flex items-center">
                         <IconsWithFallback.MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-secondary-500 ml-1 sm:ml-2 flex-shrink-0" />
                         <div className="min-w-0 flex-1">
                           <p className="text-secondary-500 text-xs truncate">المنطقة</p>
                           <p className="font-semibold truncate">{getRegionName(shipment.regionId)}</p>
                         </div>
                       </div>

                       <div className="flex items-center">
                         <IconsWithFallback.User className="h-4 w-4 sm:h-5 sm:w-5 text-secondary-500 ml-1 sm:ml-2 flex-shrink-0" />
                         <div className="min-w-0 flex-1">
                           <p className="text-secondary-500 text-xs truncate">السائق</p>
                           <p className="font-semibold truncate">{getDriverName(shipment.driverId)}</p>
                         </div>
                       </div>

                       <div className="flex items-center">
                         <IconsWithFallback.Truck className="h-4 w-4 sm:h-5 sm:w-5 text-secondary-500 ml-1 sm:ml-2 flex-shrink-0" />
                         <div className="min-w-0 flex-1">
                           <p className="text-secondary-500 text-xs truncate">رقم الأمر</p>
                           <p className="font-semibold truncate">{shipment.salesOrder || shipment.id}</p>
                         </div>
                       </div>

                       <div className="flex items-center">
                         <div className="w-6 h-4 sm:w-7 sm:h-5 flex items-center justify-center ml-1 sm:ml-2 flex-shrink-0">
                           <span className="text-green-500 font-bold text-xs sm:text-sm">ر.ي</span>
                         </div>
                         <div className="min-w-0 flex-1">
                           <p className="text-secondary-500 text-xs truncate">المبلغ الإجمالي</p>
                           <p className="font-bold text-green-600 dark:text-green-400 text-sm sm:text-base">
                             {calculateFinalAmount(shipment).toLocaleString('en-US')}
                           </p>
                         </div>
                       </div>
                    </div>

                     <div className="flex justify-end pt-2 sm:pt-3 border-t border-secondary-200 dark:border-secondary-700">
                       <Button
                         onClick={() => handleEditClick(shipment)}
                         variant="primary"
                         size="sm"
                         className="bg-blue-600 hover:bg-blue-700 text-white text-sm"
                       >
                         <IconsWithFallback.Edit className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                         <span className="hidden xs:inline">تعديل</span>
                         <span className="xs:hidden">✏️</span>
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