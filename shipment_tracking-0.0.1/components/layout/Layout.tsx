import React from 'react';
import Navbar from './Navbar';
import TimeWidget from '../common/display/TimeWidget';
import InstallPrompt from '../common/components/InstallPrompt';
import { useAppContext } from '../../providers/AppContext';
import { Icons } from '../Icons';

const OfflineBanner: React.FC = () => {
    const { isOnline, isSyncing } = useAppContext();

    if (isOnline && !isSyncing) return null;

    return (
        <div className={`py-2 px-4 text-center text-sm font-semibold text-white sticky top-0 z-50 ${
            isSyncing ? 'bg-blue-500' : 'bg-secondary-500'
        }`}>
            <div className="flex items-center justify-center">
                 {isSyncing ? (
                    <>
                        <Icons.ChevronsRightLeft className="h-4 w-4 ml-2 animate-pulse" />
                        جاري مزامنة البيانات...
                    </>
                 ) : (
                    <>
                        <Icons.AlertTriangle className="h-4 w-4 ml-2" />
                        أنت غير متصل بالإنترنت. بعض الوظائف قد تكون محدودة.
                    </>
                 )}
            </div>
        </div>
    );
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isTimeWidgetVisible } = useAppContext();
  return (
    <div className="min-h-screen">
      <OfflineBanner />
      <Navbar />
      {isTimeWidgetVisible && <TimeWidget />}
      <main className="p-3 sm:p-6 lg:p-8">
        {children}
      </main>
      <InstallPrompt />
    </div>
  );
};

export default Layout;