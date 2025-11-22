

import React, { useState, useMemo } from 'react';
import { Shipment, ShipmentStatus, Driver, Region } from '../../types';
import Card from '../common/Card';
import Input from '../common/Input';
import Button from '../common/Button';
import { Icons } from '../Icons';
import Badge from '../common/Badge';
import { useAppContext } from '../../context/AppContext';

/**
 * A simple, dependency-free bar chart component to visualize monthly revenue.
 * It uses flexbox for layout and CSS for styling and hover effects.
 */
const MonthlyRevenueChart: React.FC<{ data: { name: string, revenue: number }[] }> = ({ data }) => {
    const maxRevenue = useMemo(() => {
        if (!data || data.length === 0) return 1;
        const revenues = data.map(d => d.revenue);
        const max = Math.max(...revenues);
        // Round up to the nearest clean number for a better scale, or set a minimum if all are 0.
        return max > 0 ? Math.ceil(max / 1000) * 1000 : 1;
    }, [data]);

    if (data.every(d => d.revenue === 0)) {
        return (
            <div className="flex items-center justify-center h-64 bg-secondary-50 dark:bg-secondary-800/50 rounded-lg">
                <p className="text-secondary-500">لا توجد بيانات إيرادات لعرضها في الرسم البياني.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto pb-2">
            <div className="min-w-[600px] h-80 bg-secondary-50 dark:bg-secondary-800/50 p-4 rounded-lg flex gap-2 items-end">
                {data.map((item, index) => (
                    <div key={index} className="flex-1 h-full flex flex-col items-center justify-end group relative">
                        <div
                            className="w-full bg-primary-300 dark:bg-primary-700 hover:bg-primary-400 dark:hover:bg-primary-600 rounded-t-md transition-all duration-300 relative"
                            style={{ height: `${(item.revenue / maxRevenue) * 100}%` }}
                        >
                           <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-secondary-800 dark:bg-secondary-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                                {item.revenue.toLocaleString('en-US')} ر.ي
                            </div>
                        </div>
                        <span className="text-xs mt-2 text-secondary-600 dark:text-secondary-400 whitespace-nowrap">{item.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};


const AdminSummary: React.FC = () => {
  const { users, regions, drivers, products, shipments } = useAppContext();
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [activeListTab, setActiveListTab] = useState<'new' | 'pending' | 'transferred'>('new');
  const [isDateFilterVisible, setIsDateFilterVisible] = useState(false);

  const { newShipments, pendingShipments, transferredShipments } = useMemo(() => {
    const newS = shipments.filter((s: Shipment) => s.status === ShipmentStatus.FROM_SALES);
    
    const pendingS = shipments.filter((s: Shipment) => 
        [ShipmentStatus.DRAFT, ShipmentStatus.RETURNED_FOR_EDIT, ShipmentStatus.SENT_TO_ADMIN].includes(s.status)
    );

    const transferredS = shipments.filter((s: Shipment) =>
        [ShipmentStatus.FINAL, ShipmentStatus.FINAL_MODIFIED].includes(s.status)
    );

    return { newShipments: newS, pendingShipments: pendingS, transferredShipments: transferredS };
  }, [shipments]);

  const {
    finalizedForPeriod,
    totalTransferredAmount,
    summaryData,
  } = useMemo(() => {
    // Financial Summary Calculations for shipments that are final and have a transfer date
    const finalized = shipments.filter((s: Shipment) =>
      (s.status === ShipmentStatus.FINAL || s.status === ShipmentStatus.FINAL_MODIFIED) &&
      s.transferDate && 
      (!fromDate || s.transferDate >= fromDate) &&
      (!toDate || s.transferDate <= toDate)
    );
    const total = finalized.reduce((acc, s) => acc + (s.totalDueAmount || 0), 0);

    // General Summary Calculations
    const summary = {
      users: users.length,
      regions: regions.length,
      drivers: drivers.length,
      products: products.length,
      pendingAccountant: shipments.filter((s: Shipment) => s.status === ShipmentStatus.FROM_SALES || s.status === ShipmentStatus.DRAFT).length,
      sentToAdmin: shipments.filter((s: Shipment) => s.status === ShipmentStatus.SENT_TO_ADMIN).length,
      returnedForEdit: shipments.filter((s: Shipment) => s.status === ShipmentStatus.RETURNED_FOR_EDIT).length,
      final: shipments.filter((s: Shipment) => s.status === ShipmentStatus.FINAL || s.status === ShipmentStatus.FINAL_MODIFIED).length,
    };
    
    return {
      finalizedForPeriod: finalized,
      totalTransferredAmount: total,
      summaryData: summary,
    };
  }, [shipments, fromDate, toDate, users, regions, drivers, products]);

  const monthlyChartData = useMemo(() => {
    const today = new Date();
    const last12Months: { year: number, month: number, label: string }[] = [];
    const monthFormatter = new Intl.DateTimeFormat('ar-SA', { month: 'short', year: 'numeric' });

    for (let i = 11; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        last12Months.push({
            year: date.getFullYear(),
            month: date.getMonth(),
            label: monthFormatter.format(date)
        });
    }

    const revenueByMonth: { [key: string]: number } = {};

    shipments
        .filter((s: Shipment) =>
            (s.status === ShipmentStatus.FINAL || s.status === ShipmentStatus.FINAL_MODIFIED) && s.transferDate
        )
        .forEach((s: Shipment) => {
            const transferDate = new Date(s.transferDate!);
            const year = transferDate.getFullYear();
            const month = transferDate.getMonth();
            const key = `${year}-${month}`;

            // Check if the date is within the last 12 months range
            const firstMonthOfChart = new Date(last12Months[0].year, last12Months[0].month, 1);
            if (transferDate >= firstMonthOfChart) {
                if (revenueByMonth[key] === undefined) {
                    revenueByMonth[key] = 0;
                }
                revenueByMonth[key] += s.totalDueAmount || 0;
            }
        });

    return last12Months.map(m => {
        const key = `${m.year}-${m.month}`;
        return {
            name: m.label,
            revenue: revenueByMonth[key] || 0,
        };
    });
  }, [shipments]);


  const getDriverName = (id: number) => drivers.find((d: Driver) => d.id === id)?.name || 'N/A';
  const getRegionName = (id: string) => regions.find((r: Region) => r.id === id)?.name || 'N/A';

  const handleExportToExcel = () => {
    if (finalizedForPeriod.length === 0) {
      alert('لا توجد بيانات لتصديرها في الفترة المحددة.');
      return;
    }

    const headers = ['أمر المبيعات', 'تاريخ الحوالة', 'رقم الحوالة', 'السائق', 'المنطقة', 'المبلغ النهائي المحول'];
    
    const csvRows = [headers.join(',')];

    finalizedForPeriod.forEach(shipment => {
      const rowData = [
        shipment.salesOrder,
        shipment.transferDate ?? 'N/A',
        shipment.transferNumber ?? 'N/A',
        getDriverName(shipment.driverId),
        getRegionName(shipment.regionId),
        shipment.totalDueAmount ?? 0,
      ];
      
      const row = rowData.map(value => `"${String(value ?? '').replace(/"/g, '""')}"`);
      csvRows.push(row.join(','));
    });

    const csvString = '\uFEFF' + csvRows.join('\n'); // BOM for UTF-8 Excel compatibility
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `financial_summary_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const clearDateFilters = () => {
    setFromDate('');
    setToDate('');
  };

  const SummaryCard: React.FC<{ title: string; value: number | string; icon: React.ElementType }> = ({ title, value, icon: Icon }) => (
    <Card className="flex-1 min-w-[200px]">
      <div className="flex items-center">
        <div className="p-3 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300 me-4">
            <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-medium text-secondary-500 dark:text-secondary-400">{title}</p>
          <p className="text-3xl font-bold text-secondary-900 dark:text-secondary-100">{value}</p>
        </div>
      </div>
    </Card>
  );

  const ShipmentStatusListItem: React.FC<{shipment: Shipment, amountLabel: string, amountValue?: number}> = ({ shipment, amountLabel, amountValue = 0 }) => (
    <div className="flex flex-col sm:flex-row justify-between sm:items-center p-3 hover:bg-secondary-100/50 dark:hover:bg-secondary-800/50 rounded-md border-b border-secondary-200 dark:border-secondary-700 last:border-b-0">
        <div>
            <p className="font-semibold text-primary-600 dark:text-primary-400">{shipment.salesOrder} - <span className="text-sm font-normal text-secondary-600 dark:text-secondary-400">{getDriverName(shipment.driverId)}</span></p>
            <Badge status={shipment.status} />
        </div>
        <div className="text-right sm:text-left mt-2 sm:mt-0">
            <p className="text-xs text-secondary-500">{amountLabel}</p>
            <p className="font-bold text-lg text-green-600">
                {amountValue.toLocaleString('en-US')} ر.ي
            </p>
        </div>
    </div>
  );
  
  const TABS = [
    { id: 'new', label: 'الجديدة', count: newShipments.length },
    { id: 'pending', label: 'المعلقات', count: pendingShipments.length },
    { id: 'transferred', label: 'المحولة', count: transferredShipments.length },
  ];

  return (
    <div className="space-y-6">
      <Card title="ملخص التحويلات المالية">
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <Button variant="secondary" onClick={() => setIsDateFilterVisible(prev => !prev)}>
                        <Icons.Calendar className="ml-2 h-4 w-4" />
                        تصفية بالتاريخ
                        <Icons.ChevronDown className={`mr-2 h-4 w-4 transition-transform ${isDateFilterVisible ? 'rotate-180' : ''}`} />
                    </Button>
                </div>
                <div>
                    <Button onClick={handleExportToExcel}>
                        <Icons.FileDown className="ml-2 h-4 w-4" />
                        تصدير إلى Excel
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

            <div className="pt-4 mt-4 border-t border-secondary-200 dark:border-secondary-700">
                 <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-lg">
                    <div className="flex flex-col sm:flex-row justify-between items-center text-center sm:text-right gap-2">
                        <span className="font-bold text-xl text-secondary-800 dark:text-secondary-100">إجمالي المبالغ المحولة في الفترة المحددة</span>
                        <span className="font-extrabold text-3xl text-green-700 dark:text-green-400">
                            {totalTransferredAmount.toLocaleString('en-US')} ر.ي
                        </span>
                    </div>
                </div>
            </div>
        </div>
      </Card>

      <Card title="إجمالي الإيرادات الشهرية (آخر 12 شهر)">
        <MonthlyRevenueChart data={monthlyChartData} />
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard title="إجراءات محاسب معلقة" value={summaryData.pendingAccountant} icon={Icons.FilePlus} />
        <SummaryCard title="بانتظار مراجعة المدير" value={summaryData.sentToAdmin} icon={Icons.Archive} />
        <SummaryCard title="طلبات تعديل معلقة" value={summaryData.returnedForEdit} icon={Icons.Edit} />
        <SummaryCard title="إجمالي الشحنات النهائية" value={summaryData.final} icon={Icons.Check} />
        <SummaryCard title="عدد المستخدمين" value={summaryData.users} icon={Icons.Users} />
        <SummaryCard title="عدد المناطق" value={summaryData.regions} icon={Icons.MapPin} />
        <SummaryCard title="عدد السائقين" value={summaryData.drivers} icon={Icons.User} />
        <SummaryCard title="عدد المنتجات" value={summaryData.products} icon={Icons.Package} />
      </div>

       <Card title="تتبع الشحنات">
        <div className="border-b border-secondary-200 dark:border-secondary-700">
          <nav className="-mb-px flex space-x-6 rtl:space-x-reverse overflow-x-auto" aria-label="Tabs">
            {TABS.map(tab => (
                 <button
                    key={tab.id}
                    onClick={() => setActiveListTab(tab.id as any)}
                    className={`whitespace-nowrap flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors
                        ${activeListTab === tab.id
                            ? 'border-primary-500 text-primary-600'
                            : 'border-transparent text-secondary-500 hover:text-secondary-700 dark:hover:text-secondary-300 hover:border-secondary-300 dark:hover:border-secondary-600'
                        }
                    `}
                >
                    {tab.label}
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeListTab === tab.id ? 'bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-200' : 'bg-secondary-100 text-secondary-600 dark:bg-secondary-700 dark:text-secondary-200'}`}>
                        {tab.count}
                    </span>
                </button>
            ))}
          </nav>
        </div>
        <div className="pt-4 max-h-96 overflow-y-auto">
          {activeListTab === 'new' && (
            newShipments.length > 0 ? (
                newShipments.map(s => <ShipmentStatusListItem key={s.id} shipment={s} amountLabel="المبلغ المستحق المبدئي" amountValue={s.dueAmount} />)
            ) : <p className="text-center text-secondary-500 py-4">لا توجد شحنات جديدة.</p>
          )}
          {activeListTab === 'pending' && (
             pendingShipments.length > 0 ? (
                pendingShipments.map(s => <ShipmentStatusListItem key={s.id} shipment={s} amountLabel="المبلغ المستحق بعد الخصم" amountValue={s.dueAmountAfterDiscount} />)
            ) : <p className="text-center text-secondary-500 py-4">لا توجد شحنات معلقة.</p>
          )}
          {activeListTab === 'transferred' && (
             transferredShipments.length > 0 ? (
                transferredShipments.map(s => <ShipmentStatusListItem key={s.id} shipment={s} amountLabel="إجمالي المبلغ المستحق النهائي" amountValue={s.totalDueAmount} />)
            ) : <p className="text-center text-secondary-500 py-4">لا توجد شحنات محولة.</p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AdminSummary;
