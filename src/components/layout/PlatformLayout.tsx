import React from 'react';
import PlatformNavbar from './PlatformNavbar';
import SessionWarning from '../common/components/SessionWarning';
import { Toaster } from 'react-hot-toast';

const PlatformLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
            <PlatformNavbar />
            <SessionWarning />
            <main className="p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto">
                {children}
            </main>
            <Toaster position="bottom-right" />
        </div>
    );
};

export default PlatformLayout;
