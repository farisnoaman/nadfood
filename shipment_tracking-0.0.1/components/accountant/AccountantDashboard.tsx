import React, { useState, useMemo } from 'react';
import { Shipment, ShipmentStatus, Region } from '../../types';
import ShipmentList from './ShipmentList';
import { Icons } from '../Icons';
import Card from '../common/Card';
import Input from '../common/Input';
import Button from '../common/Button';
import { useAppContext } from '../../context/AppContext';
import { useShipmentFilter } from '../../hooks/useShipmentFilter';
import SearchableSelect from '../common/SearchableSelect';

type Tab = 'received' | 'sent' | 'reports';
type SortOption = 'newest' | 'oldest' | 'highest_due' | 'lowest_due';

const AccountantDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('received');
  const { shipments, regions, drivers } = useAppContext();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [isDateFilterVisible, setIsDateFilterVisible] = useState(false);
  const [isSearchFilterVisible, setIsSearchFilterVisible] = useState(false);
  
  const baseShipments = useMemo(() => {
    switch (activeTab) {
      case 'received':
        return shipments.filter((s: Shipment) => 
          s.status === ShipmentStatus.FROM_SALES || s.status === ShipmentStatus.DRAFT
        );
      case 'sent':
        return shipments.filter((s: Shipment) => 
          s.status === ShipmentStatus.SENT_TO_ADMIN || s.status === ShipmentStatus.FINAL || s.status === ShipmentStatus.FINAL_MODIFIED
        );
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
      <h1 className="text-2xl font-bold mb-6">لوحة تحكم المحاسب</h1>
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 border-b border-secondary-200 dark:border-secondary-700 pb-2">
            <TabButton tabId="received" label="المستلمة" icon={Icons.Bell} />
            <TabButton tabId="sent" label="المرحّلة" icon={Icons.Send} />
            <TabButton tabId="reports" label="التقارير" icon={Icons.FileText} />
        </div>
      </div>

      <Card className="mb-6">
        <div className="flex flex-wrap items-end gap-4">
            <div>
                 <Button variant="secondary" onClick={() => setIsSearchFilterVisible(prev => !prev)}>
                    <Icons.Search className="ml-2 h-4 w-4" />
                    بحث
                    <Icons.ChevronDown className={`mr-2 h-4 w-4 transition-transform ${isSearchFilterVisible ? 'rotate-180' : ''}`} />
                </Button>
            </div>
            <div>
                 <Button variant="secondary" onClick={() => setIsDateFilterVisible(prev => !prev)}>
                    <Icons.Calendar className="ml-2 h-4 w-4" />
                    تصفية بالتاريخ
                    <Icons.ChevronDown className={`mr-2 h-4 w-4 transition-transform ${isDateFilterVisible ? 'rotate-180' : ''}`} />
                </Button>
            </div>
        </div>

        {isSearchFilterVisible && (
            <div className="mt-4 pt-4 border-t border-secondary-200 dark:border-secondary-700">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Input
                        label="بحث"
                        placeholder="ابحث برقم الأمر أو اسم السائق..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        Icon={Icons.Search}
                    />
                    <SearchableSelect
                        label="المنطقة"
                        options={regionOptions}
                        value={regionFilter}
                        onChange={(val) => setRegionFilter(String(val))}
                    />
                    <SearchableSelect
                        label="ترتيب حسب"
                        options={sortOptions}
                        value={sortOption}
                        onChange={(val) => setSortOption(val as SortOption)}
                    />
                </div>
            </div>
        )}

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

        <div className="flex justify-end items-center mt-4 pt-4 border-t border-secondary-200 dark:border-secondary-700">
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

      <div>
        <ShipmentList shipments={processedShipments} viewType={activeTab} view={view} />
      </div>
    </div>
  );
};

export default AccountantDashboard;
