import React, { useState } from 'react';
import { Shipment, ShipmentStatus, Driver, Region } from '../../types';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { Icons } from '../Icons';
import AdminShipmentModal from './AdminShipmentModal';
import Input from '../common/Input';
import Card from '../common/Card';
import { calculateAdminValues } from '../../utils/calculations';
import ShipmentListItem from '../common/ShipmentListItem';
import { useAppContext } from '../../context/AppContext';
import { useShipmentFilter } from '../../hooks/useShipmentFilter';
import SearchableSelect from '../common/SearchableSelect';

interface AdminShipmentListProps {
  shipments: Shipment[];
}

const AdminShipmentList: React.FC<AdminShipmentListProps> = ({ shipments }) => {
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const { regions, drivers } = useAppContext();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [isDateFilterVisible, setIsDateFilterVisible] = useState(false);

  const {
    processedShipments: filteredShipments,
    searchTerm, setSearchTerm,
    regionFilter, setRegionFilter,
    statusFilter, setStatusFilter,
    fromDate, setFromDate,
    toDate, setToDate,
    clearDateFilters,
  } = useShipmentFilter({ baseShipments: shipments, drivers });


  const getRegionName = (id: string) => regions.find((r: Region) => r.id === id)?.name || 'غير معروف';
  const getDriverName = (id: number) => drivers.find((d: Driver) => d.id === id)?.name || 'غير معروف';

  const handleExportToCSV = () => {
    if (filteredShipments.length === 0) {
      alert('لا توجد بيانات لتصديرها.');
      return;
    }

    const headers = [
      'المعرف', 'أمر المبيعات', 'تاريخ الأمر', 'وقت الإدخال', 'المنطقة', 'السائق', 'رقم اللوحة', 'الحالة',
      'المنتجات', 'إجمالي أجر المنتجات', 'إجمالي الديزل', 'رسوم زعيتري', 'مصروفات إدارية', 'المبلغ المستحق',
      'قيمة التالف', 'قيمة النقص', 'خرج الطريق', 'المبلغ المستحق بعد الخصم',
      'مبالغ أخرى', 'سندات تحسين', 'ممسى', 'نسبة الضريبة (%)', 'إجمالي الضريبة', 'إجمالي المبلغ المستحق النهائي',
      'رقم الحوالة', 'تاريخ الحوالة', 'تم التعديل بواسطة', 'وقت التعديل'
    ];

    const csvRows = [headers.join(',')];

    filteredShipments.forEach(shipment => {
      const regionName = getRegionName(shipment.regionId);
      const driver = drivers.find((d: Driver) => d.id === shipment.driverId);
      const driverName = driver?.name || 'غير معروف';
      const driverPlateNumber = driver?.plateNumber || 'غير معروف';
      const productsString = shipment.products.map(p => `${p.productName} (${p.cartonCount})`).join('; ');
      
      const rowData = [
        shipment.id,
        shipment.salesOrder,
        shipment.orderDate,
        shipment.entryTimestamp,
        regionName,
        driverName,
        driverPlateNumber,
        shipment.status,
        productsString,
        shipment.totalWage ?? 0,
        shipment.totalDiesel ?? 0,
        shipment.zaitriFee ?? 0,
        shipment.adminExpenses ?? 0,
        shipment.dueAmount ?? 0,
        shipment.damagedValue ?? 0,
        shipment.shortageValue ?? 0,
        shipment.roadExpenses ?? 0,
        shipment.dueAmountAfterDiscount ?? 0,
        shipment.otherAmounts ?? 0,
        shipment.improvementBonds ?? 0,
        shipment.eveningAllowance ?? 0,
        shipment.taxRate ?? 0,
        shipment.totalTax ?? 0,
        shipment.totalDueAmount ?? 0,
        shipment.transferNumber ?? '',
        shipment.transferDate ?? '',
        shipment.modifiedBy ?? '',
        shipment.modifiedAt ?? '',
      ];

      const row = rowData.map(value => `"${String(value ?? '').replace(/"/g, '""')}"`);
      csvRows.push(row.join(','));
    });

    const csvString = '\uFEFF' + csvRows.join('\n'); // BOM for UTF-8 Excel compatibility
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'shipments_export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const statusOptions = [
    { value: 'all', label: 'كل الحالات' },
    ...Object.values(ShipmentStatus).map(status => ({
        value: status,
        label: status,
    })),
  ];
  
  const regionOptions = [
    { value: 'all', label: 'كل المناطق' },
    ...regions.map((region: Region) => ({
        value: region.id,
        label: region.name,
    })),
  ];

  return (
    <div className="space-y-4">
        <Card>
            <div className="flex flex-wrap items-end gap-4">
                <div className="flex-grow min-w-[250px] sm:flex-1">
                    <Input 
                        label="بحث"
                        placeholder="ابحث برقم الأمر أو اسم السائق..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        Icon={Icons.Search}
                    />
                </div>
                <div className="flex-grow min-w-[150px] sm:flex-auto">
                    <SearchableSelect 
                        label="الحالة"
                        options={statusOptions}
                        value={statusFilter} 
                        onChange={val => setStatusFilter(val as ShipmentStatus | 'all')}
                    />
                </div>
                <div className="flex-grow min-w-[150px] sm:flex-auto">
                    <SearchableSelect
                        label="المنطقة"
                        options={regionOptions}
                        value={regionFilter}
                        onChange={val => setRegionFilter(String(val))}
                    />
                </div>
                 <div>
                    <Button variant="secondary" onClick={() => setIsDateFilterVisible(prev => !prev)}>
                        <Icons.Calendar className="ml-2 h-4 w-4" />
                        تصفية بالتاريخ
                        <Icons.ChevronDown className={`mr-2 h-4 w-4 transition-transform ${isDateFilterVisible ? 'rotate-180' : ''}`} />
                    </Button>
                </div>
                <div>
                    <Button onClick={handleExportToCSV}>
                        <Icons.FileOutput className="ml-2 h-4 w-4" />
                        تصدير
                    </Button>
                </div>
            </div>

            {isDateFilterVisible && (
                <div className="mt-4 pt-4 border-t border-secondary-200 dark:border-secondary-700">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                        <Input label="من تاريخ" type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
                        <Input label="إلى تاريخ" type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
                        <Button variant="ghost" onClick={clearDateFilters} className="w-full sm:w-auto">
                            <Icons.X className="ml-2 h-4 w-4" />
                            مسح التواريخ
                        </Button>
                    </div>
                </div>
            )}

            <div className="hidden md:flex justify-end items-center mt-4 pt-4 border-t border-secondary-200 dark:border-secondary-700">
                <span className="text-sm font-medium text-secondary-600 dark:text-secondary-400 ml-3">طريقة العرض:</span>
                <div className="inline-flex rounded-md shadow-sm bg-secondary-100 dark:bg-secondary-900 p-1">
                     <button onClick={() => setView('grid')} className={`p-1.5 rounded-md transition-colors ${view === 'grid' ? 'bg-white dark:bg-secondary-700' : 'text-secondary-500 hover:bg-white/50 dark:hover:bg-secondary-700/50'}`} aria-label="عرض شبكي">
                        <Icons.Grid className="h-5 w-5" />
                    </button>
                     <button onClick={() => setView('list')} className={`p-1.5 rounded-md transition-colors ${view === 'list' ? 'bg-white dark:bg-secondary-700' : 'text-secondary-500 hover:bg-white/50 dark:hover:bg-secondary-700/50'}`} aria-label="عرض قائمة">
                        <Icons.List className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </Card>

        {filteredShipments.length > 0 ? (
            <div>
                 {/* List View for Desktop */}
                <div className="hidden md:block">
                    {view === 'list' && (
                        <div className="space-y-2">
                             <div className="grid grid-cols-6 gap-4 px-3 py-2 text-xs font-bold text-secondary-500 dark:text-secondary-400 uppercase">
                                <div className="col-span-2 sm:col-span-1">أمر المبيعات</div>
                                <div className="hidden sm:block">المنطقة</div>
                                <div className="hidden sm:block">السائق</div>
                                <div className="text-center">الحالة</div>
                                <div className="text-left">المبلغ النهائي</div>
                                <div className="text-right">الإجراء</div>
                            </div>
                            {filteredShipments.map((shipment) => (
                                <ShipmentListItem
                                    key={shipment.id}
                                    shipment={shipment}
                                    onSelect={setSelectedShipment}
                                    getRegionName={getRegionName}
                                    getDriverName={getDriverName}
                                    actionLabel="عرض وتعديل"
                                    finalAmount={shipment.totalDueAmount ?? calculateAdminValues(shipment).totalDueAmount ?? 0}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Grid View (default for mobile, optional for desktop) */}
                <div className={view === 'list' ? 'md:hidden' : ''}>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredShipments.map((shipment) => {
                            const finalAmount = shipment.totalDueAmount ?? calculateAdminValues(shipment).totalDueAmount ?? 0;
                            return (
                                <div key={shipment.id} className="bg-white dark:bg-secondary-800 shadow rounded-lg overflow-hidden flex flex-col">
                                    <div className="px-4 py-3 bg-secondary-50 dark:bg-secondary-800/50 flex justify-between items-center border-b border-secondary-200 dark:border-secondary-700">
                                        <h3 className="font-bold text-lg text-primary-600 dark:text-primary-400">{shipment.salesOrder}</h3>
                                        <Badge status={shipment.status} />
                                    </div>
                        
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
                        
                                    <div className="px-4 py-3 bg-secondary-50 dark:bg-secondary-800/50 flex justify-between items-center border-t border-secondary-200 dark:border-secondary-700 mt-auto">
                                        <div>
                                        <p className="text-xs text-secondary-500">إجمالي المبلغ المستحق النهائي</p>
                                        <p className="font-bold text-lg text-purple-600">
                                            {finalAmount.toLocaleString('en-US')} ر.ي
                                        </p>
                                        </div>
                                        <Button size="sm" onClick={() => setSelectedShipment(shipment)}>
                                            <Icons.Edit className="ml-2 h-4 w-4" />
                                            عرض وتعديل
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        ) : (
            <div className="text-center py-10 text-secondary-500">لا توجد شحنات تطابق البحث.</div>
        )}
        
        {selectedShipment && (
            <AdminShipmentModal
            shipment={selectedShipment}
            isOpen={!!selectedShipment}
            onClose={() => setSelectedShipment(null)}
            />
        )}
    </div>
  );
};

export default AdminShipmentList;
