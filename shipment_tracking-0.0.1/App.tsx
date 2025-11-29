
import React, { useEffect, useState, useRef, lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './providers/ThemeContext';
import { AppProvider, useAppContext } from './providers/AppContext';
import { Role } from './types';
import Layout from './components/layout/Layout';
import SyncStatusIndicator from './components/common/display/SyncStatusIndicator';
import { Icons } from './components/Icons';
import { PageLoading } from './components/common/ui/LoadingComponents';

// Lazy load heavy components
const Login = lazy(() => import('./components/features/auth/Login'));
const FleetDashboard = lazy(() => import('./components/features/fleet/FleetDashboard'));
const AccountantDashboard = lazy(() => import('./components/features/accountant/AccountantDashboard'));
const AdminDashboard = lazy(() => import('./components/features/admin/AdminDashboard'));

const ProtectedRoute: React.FC<{ children: React.ReactNode, allowedRoles: Role[] }> = ({ children, allowedRoles }) => {
    const { currentUser } = useAppContext();

    if (!currentUser) {
        return <Navigate to="/login" />;
    }
    if (!allowedRoles.includes(currentUser.role)) {
        return <Navigate to="/login" />;
    }
    return <>{children}</>;
};

const AppRoutes: React.FC = () => {
    const { currentUser, loading, error, isProfileLoaded } = useAppContext();
    const [loadingTimeout, setLoadingTimeout] = useState(false);
    const loadingTimeoutRef = useRef<{ primary: NodeJS.Timeout; emergency: NodeJS.Timeout } | null>(null);

    // CRITICAL: Multiple safety timeouts to prevent infinite loading
    useEffect(() => {
        if (loading) {
            // Primary timeout (15s) - show retry screen
            const primaryTimeout = setTimeout(() => {
                console.warn('Primary loading timeout reached - showing retry screen');
                setLoadingTimeout(true);
            }, 15000);

            // Emergency timeout (30s) - force reload as last resort
            const emergencyTimeout = setTimeout(() => {
                console.error('Emergency loading timeout - forcing page reload');
                window.location.reload();
            }, 30000);

            // Store both timeouts for cleanup
            loadingTimeoutRef.current = { primary: primaryTimeout, emergency: emergencyTimeout };
        } else {
            // Clear all timeouts when loading completes
            if (loadingTimeoutRef.current) {
                clearTimeout(loadingTimeoutRef.current.primary);
                clearTimeout(loadingTimeoutRef.current.emergency);
                loadingTimeoutRef.current = null;
            }
            setLoadingTimeout(false);
        }

        return () => {
            if (loadingTimeoutRef.current) {
                clearTimeout(loadingTimeoutRef.current.primary);
                clearTimeout(loadingTimeoutRef.current.emergency);
            }
        };
    }, [loading]);

    // If loading times out, show the login screen
    if (loadingTimeout && loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-secondary-100 dark:bg-secondary-900">
                <div className="flex flex-col items-center text-center p-4">
                    <Icons.AlertTriangle className="h-16 w-16 text-amber-500" />
                    <p className="mt-4 text-lg font-semibold text-secondary-700 dark:text-secondary-300">
                        انتهت مهلة تحميل البيانات
                    </p>
                    <p className="mt-2 text-sm text-secondary-500 dark:text-secondary-400">
                        يرجى التحقق من الاتصال بالإنترنت
                    </p>
                    <button 
                        onClick={() => {
                            // Clear browser cache and reload
                            window.location.reload();
                        }}
                        className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                        إعادة المحاولة
                    </button>
                    <button 
                        onClick={() => {
                            // Clear IndexedDB and localStorage to reset the app
                            if ('indexedDB' in window) {
                                indexedDB.deleteDatabase('ShipmentTrackerDB');
                            }
                            localStorage.clear();
                            window.location.reload();
                        }}
                        className="mt-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        إعادة تعيين التطبيق
                    </button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-secondary-100 dark:bg-secondary-900">
                <div className="flex flex-col items-center">
                    <Icons.Truck className="h-16 w-16 text-primary-600 animate-pulse" />
                    <p className="mt-4 text-lg font-semibold text-secondary-700 dark:text-secondary-300">جاري تحميل البيانات...</p>
                </div>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-red-50 dark:bg-red-900/50">
                <div className="text-center p-8">
                    <Icons.AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
                    <h2 className="mt-4 text-xl font-bold text-red-800 dark:text-red-200">حدث خطأ في الاتصال</h2>
                    <p className="mt-2 text-red-600 dark:text-red-300">{error}</p>
                    <p className="mt-2 text-sm text-secondary-500">يرجى التحقق من إعدادات Supabase أو الاتصال بالدعم الفني.</p>
                </div>
            </div>
        )
    }

    return (
        <div className={`min-h-screen bg-secondary-100 dark:bg-secondary-900 text-secondary-800 dark:text-secondary-200 transition-colors duration-300`}>
            <HashRouter>
                <Suspense fallback={<PageLoading title="جاري تحميل التطبيق..." />}>
                    <Routes>
                        <Route path="/login" element={!currentUser ? <Login /> : <Navigate to="/" />} />
                        <Route path="/*" element={
                            currentUser ? (
                                <Layout>
                                    <Suspense fallback={<PageLoading title="جاري تحميل الصفحة..." />}>
                                        <Routes>
                                            <Route path="/" element={
                                                !isProfileLoaded ? (
                                                    <div className="flex items-center justify-center min-h-screen bg-secondary-100 dark:bg-secondary-900">
                                                        <div className="flex flex-col items-center">
                                                            <Icons.Truck className="h-16 w-16 text-primary-600 animate-pulse" />
                                                            <p className="mt-4 text-lg font-semibold text-secondary-700 dark:text-secondary-300">
                                                                جاري تحميل الملف الشخصي...
                                                            </p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        {currentUser.role === Role.SALES && <Navigate to="/fleet" />}
                                                        {currentUser.role === Role.ACCOUNTANT && <Navigate to="/accountant" />}
                                                        {currentUser.role === Role.ADMIN && <Navigate to="/manager" />}
                                                    </>
                                                )
                                            } />
                                            <Route path="/fleet/*" element={<ProtectedRoute allowedRoles={[Role.SALES]}><FleetDashboard /></ProtectedRoute>} />
                                            <Route path="/accountant/*" element={<ProtectedRoute allowedRoles={[Role.ACCOUNTANT]}><AccountantDashboard /></ProtectedRoute>} />
                                            <Route path="/manager/*" element={<ProtectedRoute allowedRoles={[Role.ADMIN]}><AdminDashboard /></ProtectedRoute>} />
                                        </Routes>
                                    </Suspense>
                                    {/* Sync Status Indicator - shown when logged in */}
                                    <SyncStatusIndicator />
                                </Layout>
                            ) : <Login />
                        } />
                    </Routes>
                </Suspense>
            </HashRouter>
        </div>
    );
};


const App: React.FC = () => (
    <ThemeProvider>
        <AppProvider>
            <AppRoutes />
        </AppProvider>
    </ThemeProvider>
);

export default App;
