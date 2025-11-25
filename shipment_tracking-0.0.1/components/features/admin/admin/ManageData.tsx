import React, { useState, useRef } from 'react';
import Card from '../../../common/display/Card';
import Button from '../../../common/ui/Button';
import { Icons } from '../../../Icons';
import ProductManager from './manage-data/ProductManager';
import DriverManager from './manage-data/DriverManager';
import RegionManager from './manage-data/RegionManager';
import PriceManager from './manage-data/PriceManager';
import SearchableSelect from '../../../common/forms/SearchableSelect';

type DataType = 'products' | 'drivers' | 'regions' | 'prices';

const TABS: { id: DataType; label: string; icon: React.ElementType }[] = [
    { id: 'products', label: 'المنتجات', icon: Icons.Package },
    { id: 'drivers', label: 'السائقون', icon: Icons.User },
    { id: 'regions', label: 'المناطق', icon: Icons.MapPin },
    { id: 'prices', label: 'الأسعار', icon: Icons.ChevronsRightLeft },
];

// Dummy excel utility function
const readExcelFile = async (file: File): Promise<any[]> => {
    console.log(`Reading Excel file: ${file.name}`);
    alert(`تمت قراءة الملف ${file.name}. (هذه وظيفة وهمية)`);
    return [];
};

const ManageData: React.FC = () => {
    const [activeType, setActiveType] = useState<DataType>('products');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            await readExcelFile(file);
        } catch (error) {
            console.error("Error reading excel file:", error);
            alert("حدث خطأ أثناء قراءة الملف.");
        }
        
        if(fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };
    
    const handleDownloadSample = () => {
        alert('هذه وظيفة وهمية لتنزيل نموذج CSV/Excel.');
    };

    const handleExport = () => {
        alert('هذه وظيفة وهمية لتصدير البيانات الحالية إلى CSV/Excel.');
    };

    const contentMap: Record<DataType, React.ReactNode> = {
        products: <ProductManager />,
        drivers: <DriverManager />,
        regions: <RegionManager />,
        prices: <PriceManager />,
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
                 <div className="flex flex-wrap justify-end gap-2 mb-4">
                    <Button onClick={handleDownloadSample}>
                        <Icons.FileDown className="ml-2 h-4 w-4" />
                        تحميل نموذج
                    </Button>
                    <input type="file" ref={fileInputRef} onChange={handleFileImport} accept=".csv, .xlsx, .xls" className="hidden" />
                    <Button onClick={() => fileInputRef.current?.click()}>
                        <Icons.FileInput className="ml-2 h-4 w-4" />
                        استيراد
                    </Button>
                    <Button onClick={handleExport}>
                        <Icons.FileOutput className="ml-2 h-4 w-4" />
                        تصدير
                    </Button>
                </div>
                
                {contentMap[activeType]}
            </div>
        </Card>
    );
};

export default ManageData;
