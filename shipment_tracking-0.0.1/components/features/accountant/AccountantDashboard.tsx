import React, { useState, useMemo } from 'react';
import { Shipment, ShipmentStatus, Region } from '../../../types';
import ShipmentList from './ShipmentList';
import { Icons } from '../../Icons';
import Card from '../../common/display/Card';
import Input from '../../common/ui/Input';
import Button from '../../common/ui/Button';
import ArabicDatePicker from '../../common/ui/ArabicDatePicker';
import { useAppContext } from '../../../providers/AppContext';
import { useShipmentFilter } from '../../../hooks/useShipmentFilter';
import SearchableSelect from '../../common/forms/SearchableSelect';

type Tab = 'received' | 'sent' | 'reports';
type SortOption = 'newest' | 'oldest' | 'highest_due' | 'lowest_due';

const AccountantDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('received');
  const { shipments, regions, drivers } = useAppContext();
  const [view, setView] = useState<'grid' | 'list'>(window.innerWidth < 768 ? 'list' : 'grid');
  const [isDateFilterVisible, setIsDateFilterVisible] = useState(false);
  const [isSearchFilterVisible, setIsSearchFilterVisible] = useState(false);
  
  const baseShipments = useMemo(() => {
    let filtered: Shipment[] = [];

    switch (activeTab) {
      case 'received':
        // Only show shipments from fleet/sales (FROM_SALES status)
        // Exclude DRAFT shipments which are work-in-progress by accountant
        filtered = shipments.filter((s: Shipment) => s.status === ShipmentStatus.FROM_SALES);
        console.log('AccountantDashboard - Received tab filtering:', {
          totalShipments: shipments.length,
          fromSalesShipments: shipments.filter(s => s.status === ShipmentStatus.FROM_SALES).length,
          draftShipments: shipments.filter(s => s.status === ShipmentStatus.DRAFT).length,
          filteredCount: filtered.length,
          shipmentStatuses: shipments.map(s => ({ id: s.id, status: s.status, salesOrder: s.salesOrder }))
        });
        return filtered;
      case 'sent':
        filtered = shipments.filter((s: Shipment) =>
          s.status === ShipmentStatus.SENT_TO_ADMIN || s.status === ShipmentStatus.FINAL || s.status === ShipmentStatus.FINAL_MODIFIED
        );
        return filtered;
      case 'reports':
        return shipments;
      default:
        return [];
    }
  }, [shipments, activeTab]);

  const {
    processedShipments,
    searchTerm, setSearchTerm,
    regionFilter, setRegionFilter,
    sortOption, setSortOption,
    fromDate, setFromDate,
    toDate, setToDate,
    clearDateFilters,
  } = useShipmentFilter({ baseShipments, drivers, initialSortOption: 'newest' });

  const TabButton: React.FC<{tabId: Tab; label: string; icon: React.ElementType}> = ({ tabId, label, icon: Icon }) => (
     <button
        onClick={() => setActiveTab(tabId)}
        className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          activeTab === tabId
            ? 'bg-primary-600 text-white'
            : 'text-secondary-600 dark:text-secondary-300 hover:bg-secondary-200 dark:hover:bg-secondary-700'
        }`}
      >
        <Icon className="ml-2 h-5 w-5" />
        {label}
    </button>
  );

  const sortOptions = [
    { value: 'newest', label: 'الأحدث أولاً' },
    { value: 'oldest', label: 'الأقدم أولاً' },
    { value: 'highest_due', label: 'الأعلى مبلغ مستحق' },
    { value: 'lowest_due', label: 'الأقل مبلغ مستحق' },
  ];

  const regionOptions = [
    { value: 'all', label: 'كل المناطق' },
    ...regions.map((region: Region) => ({
      value: region.id,
      label: region.name,
    })),
  ];

  return (
    <div>
      <h1 className="hidden sm:block text-2xl font-bold mb-6">لوحة تحكم المحاسب</h1>
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 border-b border-secondary-200 dark:border-secondary-700 pb-2">
            <TabButton tabId="received" label="المستلمة" icon={Icons.Bell} />
            <TabButton tabId="sent" label="المرحّلة" icon={Icons.Send} />
            <TabButton tabId="reports" label="التقارير" icon={Icons.FileText} />
        </div>
      </div>

       <Card className="mb-6">
         <div className="flex flex-wrap items-center gap-2 sm:gap-4">
             <Button variant="secondary" size="sm" onClick={() => setIsSearchFilterVisible(prev => !prev)} className="text-xs sm:text-sm">
                <Icons.Search className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">بحث</span>
                <Icons.ChevronDown className={`mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 transition-transform ${isSearchFilterVisible ? 'rotate-180' : ''}`} />
            </Button>
             <Button variant="secondary" size="sm" onClick={() => setIsDateFilterVisible(prev => !prev)} className="text-xs sm:text-sm">
                <Icons.Calendar className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">تصفية بالتاريخ</span>
                <Icons.ChevronDown className={`mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 transition-transform ${isDateFilterVisible ? 'rotate-180' : ''}`} />
            </Button>
         </div>

        {isSearchFilterVisible && (
            <div className="mt-2 sm:mt-4 pt-2 sm:pt-4 border-t border-secondary-200 dark:border-secondary-700">
                <div className="grid grid-cols-1 gap-2 sm:gap-4 sm:grid-cols-3">
                    <Input
                        label="بحث"
                        placeholder="ابحث برقم الأمر أو اسم السائق..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        Icon={Icons.Search}
                        className="text-sm"
                    />
                    <SearchableSelect
                        label="المنطقة"
                        options={regionOptions}
                        value={regionFilter}
                        onChange={(val) => setRegionFilter(String(val))}
                        className="text-sm"
                    />
                    <SearchableSelect
                        label="ترتيب حسب"
                        options={sortOptions}
                        value={sortOption}
                        onChange={(val) => setSortOption(val as SortOption)}
                        className="text-sm"
                    />
                </div>
            </div>
        )}

        {isDateFilterVisible && (
            <div className="mt-2 sm:mt-4 pt-2 sm:pt-4 border-t border-secondary-200 dark:border-secondary-700">
                <div className="grid grid-cols-1 gap-2 sm:gap-4 sm:grid-cols-3 items-end">
                    <ArabicDatePicker label="من تاريخ" value={fromDate} onChange={setFromDate} className="text-sm" />
                    <ArabicDatePicker label="إلى تاريخ" value={toDate} onChange={setToDate} className="text-sm" />
                    <Button variant="ghost" size="sm" onClick={clearDateFilters} className="w-full sm:w-auto text-xs sm:text-sm">
                        <Icons.X className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">مسح التواريخ</span>
                    </Button>
                </div>
            </div>
        )}

        <div className="flex justify-between sm:justify-end items-center mt-2 sm:mt-4 pt-2 sm:pt-4 border-t border-secondary-200 dark:border-secondary-700">
            <span className="text-xs sm:text-sm font-medium text-secondary-600 dark:text-secondary-400 ml-2 sm:ml-3 hidden sm:inline">طريقة العرض:</span>
            <div className="inline-flex rounded-md shadow-sm bg-secondary-100 dark:bg-secondary-900 p-0.5 sm:p-1">
                 <button onClick={() => setView('grid')} className={`p-1 sm:p-1.5 rounded-md transition-colors ${view === 'grid' ? 'bg-white dark:bg-secondary-700' : 'text-secondary-500 hover:bg-white/50 dark:hover:bg-secondary-700/50'}`} aria-label="عرض شبكي">
                    <Icons.Grid className="h-4 w-4 sm:h-5 sm:w-5" />
                 </button>
                 <button onClick={() => setView('list')} className={`p-1 sm:p-1.5 rounded-md transition-colors ${view === 'list' ? 'bg-white dark:bg-secondary-700' : 'text-secondary-500 hover:bg-white/50 dark:hover:bg-secondary-700/50'}`} aria-label="عرض قائمة">
                    <Icons.List className="h-4 w-4 sm:h-5 sm:w-5" />
                 </button>
            </div>
        </div>
      </Card>

      <div>
        <ShipmentList shipments={processedShipments} viewType={activeTab} view={view} />
      </div>
    </div>
  );
};

export default AccountantDashboard;
