
import React, { useState, useMemo } from 'react';
import { Shipment, ShipmentStatus } from '../../../types/types';
import Card from '../../common/display/Card';
import Button from '../../common/ui/Button';
import ArabicDatePicker from '../../common/ui/ArabicDatePicker';
import { Icons } from '../../Icons';
import { useAppContext } from '../../../providers/AppContext';
import SearchableSelect from '../../common/forms/SearchableSelect';

type ReportType = 'driver' | 'region';

const AdminReports: React.FC = () => {
  const { shipments, drivers, regions } = useAppContext();
  const [reportType, setReportType] = useState<ReportType>('driver');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'revenue', direction: 'desc' });
  const [isDateFilterVisible, setIsDateFilterVisible] = useState(false);
  
  // Drill-down state
  const [selectedEntity, setSelectedEntity] = useState<{ id: string | number; name: string } | null>(null);

  // 1. Filter Shipments based on Date and Status (Only Finalized count for Revenue)
  const filteredShipments = useMemo(() => {
    return shipments.filter((s: Shipment) => {
      const isFinal = s.status === ShipmentStatus.FINAL || s.status === ShipmentStatus.FINAL_MODIFIED;
      if (!isFinal) return false;

      const dateToCheck = s.orderDate;
      const matchesFrom = !fromDate || dateToCheck >= fromDate;
      const matchesTo = !toDate || dateToCheck <= toDate;

      return matchesFrom && matchesTo;
    });
  }, [shipments, fromDate, toDate]);

  // 2. Main Aggregate Data
  const reportData = useMemo(() => {
    const dataMap = new Map<string | number, { id: string | number; name: string; count: number; revenue: number }>();

    if (reportType === 'driver') {
      drivers.forEach(d => {
        if (d.isActive) {
            dataMap.set(d.id, { id: d.id, name: d.name, count: 0, revenue: 0 });
        }
      });
    } else {
      regions.forEach(r => {
        dataMap.set(r.id, { id: r.id, name: r.name, count: 0, revenue: 0 });
      });
    }

    filteredShipments.forEach(s => {
      const key = reportType === 'driver' ? s.driverId : s.regionId;
      
      if (!dataMap.has(key)) {
         const name = reportType === 'driver' 
            ? drivers.find(d => d.id === key)?.name || 'غير معروف'
            : regions.find(r => r.id === key)?.name || 'غير معروف';
         dataMap.set(key, { id: key, name, count: 0, revenue: 0 });
      }

      const entry = dataMap.get(key)!;
      entry.count += 1;
      entry.revenue += (s.totalDueAmount || 0);
    });

    return Array.from(dataMap.values());
  }, [filteredShipments, drivers, regions, reportType]);

  // 3. Drill-down Aggregate Data
  const detailData = useMemo(() => {
      if (!selectedEntity) return [];

      // Filter shipments for the selected entity
      const entityShipments = filteredShipments.filter(s => 
          reportType === 'driver' 
            ? s.driverId === selectedEntity.id 
            : s.regionId === selectedEntity.id
      );

      const dataMap = new Map<string | number, { id: string | number; name: string; count: number; revenue: number }>();

      entityShipments.forEach(s => {
          // If Report is Driver -> Group by Region
          // If Report is Region -> Group by Driver
          const targetKey = reportType === 'driver' ? s.regionId : s.driverId;
          
          if (!dataMap.has(targetKey)) {
              const name = reportType === 'driver'
                ? regions.find(r => r.id === targetKey)?.name || 'غير معروف' // Get Region Name
                : drivers.find(d => d.id === targetKey)?.name || 'غير معروف'; // Get Driver Name
              
              dataMap.set(targetKey, { id: targetKey, name, count: 0, revenue: 0 });
          }

          const entry = dataMap.get(targetKey)!;
          entry.count += 1;
          entry.revenue += (s.totalDueAmount || 0);
      });

      return Array.from(dataMap.values()).sort((a, b) => b.revenue - a.revenue);

  }, [selectedEntity, filteredShipments, reportType, drivers, regions]);


  // 4. Sort Data (Main View)
  const sortedData = useMemo(() => {
    if (!sortConfig) return reportData;
    return [...reportData].sort((a, b) => {
      if (a[sortConfig.key as keyof typeof a] < b[sortConfig.key as keyof typeof b]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key as keyof typeof a] > b[sortConfig.key as keyof typeof b]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [reportData, sortConfig]);

  // 5. Handle Export
  const handleExportCSV = (data: any[], isDetail: boolean) => {
    if (data.length === 0) {
        alert('لا توجد بيانات للتصدير');
        return;
    }

    let headers: string[] = [];
    let filename = '';

    if (isDetail && selectedEntity) {
        const entityLabel = reportType === 'driver' ? 'المنطقة' : 'السائق';
        headers = [entityLabel, 'عدد الشحنات', 'إجمالي الإيرادات', 'متوسط الإيراد'];
        filename = `details_${reportType}_${selectedEntity.name.replace(/\s/g, '_')}.csv`;
    } else {
        const entityLabel = reportType === 'driver' ? 'اسم السائق' : 'اسم المنطقة';
        headers = [entityLabel, 'عدد الشحنات', 'إجمالي الإيرادات', 'متوسط الإيراد'];
        filename = `report_${reportType}_${new Date().toISOString().split('T')[0]}.csv`;
    }

    const csvRows = [headers.join(',')];

    data.forEach(item => {
        const avg = item.count > 0 ? (item.revenue / item.count).toFixed(2) : '0';
        const row = [
            `"${item.name}"`,
            item.count,
            item.revenue,
            avg
        ];
        csvRows.push(row.join(','));
    });

    const csvString = '\uFEFF' + csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const clearDateFilters = () => {
    setFromDate('');
    setToDate('');
  };

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
      if (sortConfig?.key !== columnKey) return <Icons.ArrowUp className="h-4 w-4 text-gray-300 inline ml-1 opacity-0 group-hover:opacity-50" />;
      return sortConfig.direction === 'asc' 
        ? <Icons.ArrowUp className="h-4 w-4 text-primary-500 inline ml-1" /> 
        : <Icons.ArrowDown className="h-4 w-4 text-primary-500 inline ml-1" />;
  };

  const handleRowClick = (item: { id: string | number, name: string }) => {
      setSelectedEntity(item);
  };

  // Component for Mobile Cards
  const MobileCard = ({ item, isDetail }: { item: any, isDetail: boolean }) => (
    <div 
        onClick={() => !isDetail && handleRowClick(item)}
        className={`bg-white dark:bg-secondary-800 p-4 rounded-lg shadow-sm border border-secondary-200 dark:border-secondary-700 flex flex-col gap-3 ${!isDetail ? 'cursor-pointer active:bg-secondary-50 dark:active:bg-secondary-700 transition-colors' : ''}`}
    >
        <div className="flex justify-between items-start">
             <div>
                <h3 className="font-bold text-secondary-900 dark:text-secondary-100">{item.name}</h3>
             </div>
             <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap">
                {item.count} شحنة
            </span>
        </div>
        
        <div className="flex justify-between items-end border-t border-secondary-100 dark:border-secondary-700 pt-3 mt-1">
             <div>
                <p className="text-xs text-secondary-500 mb-1">إجمالي الإيرادات</p>
                <p className="font-bold text-green-600 dark:text-green-400 text-lg">{item.revenue.toLocaleString('en-US')} <span className="text-xs font-normal text-secondary-500">ر.ي</span></p>
             </div>
             {!isDetail && (
                 <div className="text-left">
                    <p className="text-xs text-secondary-500 mb-1">متوسط / شحنة</p>
                    <div className="flex items-center justify-end gap-2">
                         <p className="font-medium text-secondary-700 dark:text-secondary-300">
                             {(item.count > 0 ? item.revenue / item.count : 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                         </p>
                         <Icons.ChevronDown className="h-4 w-4 text-secondary-400 rotate-90" />
                    </div>
                 </div>
             )}
        </div>
    </div>
  );

  const dataToRender = selectedEntity ? detailData : sortedData;
  const totalCount = !selectedEntity 
        ? sortedData.reduce((a, b) => a + b.count, 0)
        : detailData.reduce((a, b) => a + b.count, 0);
  const totalRevenue = !selectedEntity
        ? sortedData.reduce((a, b) => a + b.revenue, 0)
        : detailData.reduce((a, b) => a + b.revenue, 0);


  return (
    <div className="space-y-6">
        {/* Filters Header - Improved Responsive Layout */}
        {!selectedEntity && (
            <Card>
                <div className="flex flex-wrap items-end gap-4">
                    <div className="flex-grow min-w-[200px] sm:flex-1">
                        <SearchableSelect
                            label="نوع التقرير"
                            options={[
                                { value: 'driver', label: 'تقرير السائقين' },
                                { value: 'region', label: 'تقرير المناطق' }
                            ]}
                            value={reportType}
                            onChange={(val) => setReportType(val as ReportType)}
                        />
                    </div>
                    <div>
                        <Button variant="secondary" onClick={() => setIsDateFilterVisible(prev => !prev)} className="w-full sm:w-auto">
                            <Icons.Calendar className="ml-2 h-4 w-4" />
                            تصفية بالتاريخ
                            <Icons.ChevronDown className={`mr-2 h-4 w-4 transition-transform ${isDateFilterVisible ? 'rotate-180' : ''}`} />
                        </Button>
                    </div>
                    <div>
                         <Button className="w-full sm:w-auto" onClick={() => handleExportCSV(sortedData, false)}>
                            <Icons.FileDown className="ml-2 h-4 w-4" />
                            تصدير CSV
                        </Button>
                    </div>
                </div>

                {isDateFilterVisible && (
                    <div className="mt-4 pt-4 border-t border-secondary-200 dark:border-secondary-700">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                            <ArabicDatePicker label="من تاريخ" value={fromDate} onChange={setFromDate} />
                            <ArabicDatePicker label="إلى تاريخ" value={toDate} onChange={setToDate} />
                            <Button variant="ghost" onClick={clearDateFilters} className="w-full sm:w-auto">
                                <Icons.X className="ml-2 h-4 w-4" />
                                مسح التواريخ
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        )}

        <Card title={
            selectedEntity 
                ? `تفاصيل ${reportType === 'driver' ? 'السائق' : 'المنطقة'}: ${selectedEntity.name}` 
                : (reportType === 'driver' ? 'أداء السائقين' : 'أداء المناطق')
        }>
            {selectedEntity && (
                <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-secondary-50 dark:bg-secondary-800/50 p-3 rounded-lg gap-3">
                    <Button variant="ghost" onClick={() => setSelectedEntity(null)} className="w-full sm:w-auto justify-center sm:justify-start">
                        <Icons.ArrowRight className="ml-2 h-5 w-5" />
                        عودة للقائمة الرئيسية
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => handleExportCSV(detailData, true)} className="w-full sm:w-auto justify-center">
                        <Icons.FileDown className="ml-2 h-4 w-4" />
                        تصدير التفاصيل
                    </Button>
                </div>
            )}

            {/* Mobile View (Cards) */}
            <div className="md:hidden space-y-4">
                {dataToRender.length > 0 ? (
                    dataToRender.map((item) => (
                        <MobileCard key={item.id} item={item} isDetail={!!selectedEntity} />
                    ))
                ) : (
                    <div className="p-8 text-center text-secondary-500 border border-dashed border-secondary-300 rounded-lg">
                         لا توجد بيانات للعرض.
                    </div>
                )}
                
                {/* Mobile Totals Footer */}
                {dataToRender.length > 0 && (
                    <div className="bg-secondary-100 dark:bg-secondary-900 p-4 rounded-lg border border-secondary-200 dark:border-secondary-700 mt-4">
                        <h4 className="font-bold text-secondary-900 dark:text-secondary-100 mb-2 text-center">المجموع الكلي</h4>
                        <div className="flex justify-between items-center">
                            <span className="text-secondary-600 dark:text-secondary-400">عدد الشحنات</span>
                            <span className="font-bold">{totalCount}</span>
                        </div>
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-secondary-200 dark:border-secondary-800">
                             <span className="text-secondary-600 dark:text-secondary-400">الإجمالي</span>
                             <span className="font-bold text-green-700 dark:text-green-400">{totalRevenue.toLocaleString('en-US')} ر.ي</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Tablet & Desktop View (Table) */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-right whitespace-nowrap">
                    <thead>
                        <tr className="bg-secondary-100 dark:bg-secondary-700/50 text-secondary-600 dark:text-secondary-300 border-b border-secondary-200 dark:border-secondary-700">
                            {!selectedEntity ? (
                                <>
                                    <th className="p-4 cursor-pointer group select-none hover:bg-secondary-200/50 transition-colors" onClick={() => requestSort('name')}>
                                        {reportType === 'driver' ? 'اسم السائق' : 'اسم المنطقة'}
                                        <SortIcon columnKey="name" />
                                    </th>
                                    <th className="p-4 cursor-pointer group select-none hover:bg-secondary-200/50 transition-colors" onClick={() => requestSort('count')}>
                                        عدد الشحنات (المنجزة)
                                        <SortIcon columnKey="count" />
                                    </th>
                                    <th className="p-4 cursor-pointer group select-none hover:bg-secondary-200/50 transition-colors" onClick={() => requestSort('revenue')}>
                                        إجمالي الإيرادات
                                        <SortIcon columnKey="revenue" />
                                    </th>
                                    <th className="p-4">
                                        متوسط الإيراد / شحنة
                                    </th>
                                </>
                            ) : (
                                <>
                                    <th className="p-4">
                                        {reportType === 'driver' ? 'المنطقة' : 'السائق'}
                                    </th>
                                    <th className="p-4">
                                        عدد الشحنات
                                    </th>
                                    <th className="p-4">
                                        الإجمالي
                                    </th>
                                </>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-secondary-200 dark:divide-secondary-700">
                        {dataToRender.length > 0 ? (
                            dataToRender.map((item) => (
                                <tr 
                                    key={item.id} 
                                    onClick={() => !selectedEntity && handleRowClick(item)}
                                    className={`${!selectedEntity ? 'hover:bg-secondary-50 dark:hover:bg-secondary-800/50 cursor-pointer group' : 'hover:bg-secondary-50 dark:hover:bg-secondary-800/50'} transition-colors`}
                                >
                                    <td className="p-4 font-medium text-primary-600 dark:text-primary-400 group-hover:underline underline-offset-4">
                                        {item.name}
                                        {!selectedEntity && <Icons.ChevronsRightLeft className="inline mr-2 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-secondary-400" />}
                                    </td>
                                    <td className="p-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                            {item.count}
                                        </span>
                                    </td>
                                    <td className="p-4 font-bold text-green-600 dark:text-green-400">
                                        {item.revenue.toLocaleString('en-US')} ر.ي
                                    </td>
                                    {!selectedEntity && (
                                        <td className="p-4 text-secondary-500">
                                            {item.count > 0 ? (item.revenue / item.count).toLocaleString('en-US', { maximumFractionDigits: 0 }) : 0} ر.ي
                                        </td>
                                    )}
                                </tr>
                            ))
                        ) : (
                             <tr>
                                <td colSpan={!selectedEntity ? 4 : 3} className="p-8 text-center text-secondary-500">
                                    {selectedEntity ? 'لا توجد تفاصيل إضافية للعرض.' : 'لا توجد بيانات للعرض في هذه الفترة.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                    {(dataToRender.length > 0) && (
                        <tfoot>
                            <tr className="bg-secondary-50 dark:bg-secondary-800 font-bold border-t-2 border-secondary-300 dark:border-secondary-600">
                                <td className="p-4">المجموع الكلي</td>
                                <td className="p-4">{totalCount}</td>
                                <td className="p-4 text-green-700 dark:text-green-400">
                                    {totalRevenue.toLocaleString('en-US')} ر.ي
                                </td>
                                {!selectedEntity && <td className="p-4">-</td>}
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>
        </Card>
    </div>
  );
};

export default AdminReports;
