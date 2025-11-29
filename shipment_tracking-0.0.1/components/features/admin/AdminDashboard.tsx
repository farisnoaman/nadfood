
import React, { useState, useMemo } from 'react';
import AdminShipmentList from './AdminShipmentList';
import ManageData from './ManageData';
import ManageUsers from './ManageUsers';
import { Icons } from '../../Icons';
import { Shipment, ShipmentStatus } from '../../../types';
import AdminSettings from './AdminSettings';
import AdminReports from './AdminReports';
import { useAppContext } from '../../../providers/AppContext';

type Tab = 'reports' | 'received' | 'all_shipments' | 'data_management' | 'user_management' | 'settings';

const AdminDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('received');
    const { shipments } = useAppContext();

    const receivedShipments = useMemo(() =>
        shipments.filter((s: Shipment) => s.status === ShipmentStatus.SENT_TO_ADMIN),
    [shipments]);

    const draftAndFinalShipments = useMemo(() =>
        shipments.filter((s: Shipment) =>
            s.status === ShipmentStatus.DRAFT ||
            s.status === ShipmentStatus.FINAL ||
            s.status === ShipmentStatus.FINAL_MODIFIED
        ),
    [shipments]);

    const TabButton: React.FC<{tabId: Tab; label: string; icon: React.ElementType}> = ({ tabId, label, icon: Icon }) => (
        <button
           onClick={() => setActiveTab(tabId)}
           className={`flex items-center px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-colors w-full sm:w-auto ${
             activeTab === tabId
               ? 'bg-primary-600 text-white'
               : 'text-secondary-600 dark:text-secondary-300 hover:bg-secondary-200 dark:hover:bg-secondary-700'
           }`}
         >
           <Icon className="ml-1 sm:ml-2 h-4 w-4 sm:h-5 sm:w-5" />
           {label}
       </button>
     );

    return (
        <div>
            <h1 className="text-lg sm:text-2xl font-bold mb-4 sm:mb-6">لوحة تحكم المدير</h1>
            <div className="mb-6">
                {/* Mobile: 2x3 grid layout */}
                <div className="sm:hidden">
                    <div className="grid grid-cols-3 gap-2 border-b border-secondary-200 dark:border-secondary-700 pb-2">
                        <TabButton tabId="received" label="المستلمة" icon={Icons.Archive} />
                                <TabButton tabId="all_shipments" label="الشحنات" icon={Icons.Truck} />
                        <TabButton tabId="reports" label="التقارير" icon={Icons.BarChart3} />
                        <TabButton tabId="data_management" label="البيانات" icon={Icons.Package} />
                        <TabButton tabId="user_management" label="المستخدمين" icon={Icons.Users} />
                        <TabButton tabId="settings" label="الإعدادات" icon={Icons.Settings} />
                    </div>
                </div>

                {/* Desktop: Original flex layout */}
                <div className="hidden sm:flex flex-wrap gap-2 border-b border-secondary-200 dark:border-secondary-700 pb-2">
                    <TabButton tabId="received" label="المستلمة" icon={Icons.Archive} />
                    <TabButton tabId="all_shipments" label="الشحنات" icon={Icons.Truck} />
                    <TabButton tabId="reports" label="التقارير" icon={Icons.BarChart3} />
                    <TabButton tabId="data_management" label="إدارة البيانات" icon={Icons.Package} />
                    <TabButton tabId="user_management" label="إدارة المستخدمين" icon={Icons.Users} />
                    <TabButton tabId="settings" label="الإعدادات" icon={Icons.Settings} />
                </div>
            </div>
            <div>
                {activeTab === 'reports' && <AdminReports />}
                {activeTab === 'received' && <AdminShipmentList shipments={receivedShipments} />}
                 {activeTab === 'all_shipments' && <AdminShipmentList shipments={shipments} defaultStatusFilter={[ShipmentStatus.DRAFT, ShipmentStatus.FINAL, ShipmentStatus.FINAL_MODIFIED]} />}
                {activeTab === 'data_management' && <ManageData />}
                {activeTab === 'user_management' && <ManageUsers />}
                {activeTab === 'settings' && <AdminSettings />}
            </div>
        </div>
    );
};

export default AdminDashboard;