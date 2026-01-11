import React, { useState } from 'react';
import Card from '../../common/display/Card';
import { Icons } from '../../Icons';
import ProductManager from './manage-data/ProductManager';
import DriverManager from './manage-data/DriverManager';
import RegionManager from './manage-data/RegionManager';
import PriceManager from './manage-data/PriceManager';
import DeductionPriceManager from './manage-data/DeductionPriceManager';
import SearchableSelect from '../../common/forms/SearchableSelect';
import { supabase } from '../../../utils/supabaseClient';

type DataType = 'products' | 'drivers' | 'regions' | 'prices' | 'deductionPrices';

const TABS: { id: DataType; label: string; icon: React.ElementType }[] = [
    { id: 'products', label: 'المنتجات', icon: Icons.Package },
    { id: 'drivers', label: 'السائقون', icon: Icons.User },
    { id: 'regions', label: 'المناطق', icon: Icons.MapPin },
    { id: 'prices', label: 'الأسعار', icon: Icons.ChevronsRightLeft },
    { id: 'deductionPrices', label: 'أسعار العقوبات', icon: Icons.AlertTriangle },
];



// Download CSV file
const downloadCSV = (filename: string, headers: string[], rows: string[][]) => {
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
};

const ManageData: React.FC = () => {
    const [activeType, setActiveType] = useState<DataType>('products');

    const handleExport = async () => {
        try {
            const data = await exportData(activeType);
            if (data.rows.length === 0) {
                alert("لا توجد بيانات للتصدير.");
                return;
            }
            downloadCSV(`${activeType}_export.csv`, data.headers, data.rows);
        } catch (error) {
            console.error("Error exporting data:", error);
            alert("حدث خطأ أثناء تصدير البيانات.");
        }
    };

    const exportData = async (type: DataType): Promise<{ headers: string[]; rows: string[][] }> => {
        switch (type) {
            case 'products':
                return await exportProducts();
            case 'drivers':
                return await exportDrivers();
            case 'regions':
                return await exportRegions();
            case 'prices':
                return await exportPrices();
            default:
                return { headers: [], rows: [] };
        }
    };

    const exportProducts = async () => {
        const { data, error } = await supabase.from('products').select('*');
        if (error) throw error;
        if (data.length === 0) return { headers: [], rows: [] };
        const headers = Object.keys(data[0]);
        const rows = data.map(item => headers.map(key => item[key]?.toString() || ''));
        return { headers, rows };
    };

    const exportDrivers = async () => {
        const { data, error } = await supabase.from('drivers').select('*');
        if (error) throw error;
        if (data.length === 0) return { headers: [], rows: [] };
        const headers = Object.keys(data[0]);
        const rows = data.map(item => headers.map(key => item[key]?.toString() || ''));
        return { headers, rows };
    };

    const exportRegions = async () => {
        const { data, error } = await supabase.from('regions').select('*');
        if (error) throw error;
        if (data.length === 0) return { headers: [], rows: [] };
        const headers = Object.keys(data[0]);
        const rows = data.map(item => headers.map(key => item[key]?.toString() || ''));
        return { headers, rows };
    };

    const exportPrices = async () => {
        const { data, error } = await supabase.from('product_prices').select('*');
        if (error) throw error;
        if (data.length === 0) return { headers: [], rows: [] };
        const headers = Object.keys(data[0]);
        const rows = data.map(item => headers.map(key => item[key]?.toString() || ''));
        return { headers, rows };
    };

    const contentMap: Record<DataType, React.ReactNode> = {
        products: <ProductManager />,
        drivers: <DriverManager />,
        regions: <RegionManager onExport={handleExport} />,
        prices: <PriceManager />,
        deductionPrices: <DeductionPriceManager />,
    };

    return (
        <Card title="إدارة البيانات الرئيسية">
            {/* Mobile Dropdown */}
            <div className="md:hidden mb-4">
                <SearchableSelect
                    label="عرض بيانات"
                    id="data-type-select"
                    options={TABS.map(tab => ({ value: tab.id, label: tab.label }))}
                    value={activeType}
                    onChange={(val) => setActiveType(val as DataType)}
                />
            </div>

            {/* Desktop Tabs */}
            <div className="hidden md:block border-b border-secondary-200 dark:border-secondary-700">
                <nav className="-mb-px flex space-x-6 rtl:space-x-reverse overflow-x-auto" aria-label="Tabs">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveType(tab.id)}
                            className={`whitespace-nowrap flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors
                                ${activeType === tab.id
                                    ? 'border-primary-500 text-primary-600'
                                    : 'border-transparent text-secondary-500 hover:text-secondary-700 dark:hover:text-secondary-300 hover:border-secondary-300 dark:hover:border-secondary-600'
                                }
                            `}
                        >
                            <tab.icon className="ml-2 h-5 w-5" />
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="pt-6">
                {contentMap[activeType]}
            </div>
        </Card>
    );
};

export default ManageData;
