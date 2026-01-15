
import React, { useEffect, useState, useRef, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import logger from './utils/logger';
import { ThemeProvider } from './providers/ThemeContext';
import { TenantProvider, useTenant } from './providers/TenantContext';
import { AppProvider, useAppContext } from './providers/AppContext';
import { Role } from './types';
import Layout from './components/layout/Layout';
import SyncStatusIndicator from './components/common/display/SyncStatusIndicator';
import { Icons } from './components/Icons';
import { PageLoading } from './components/common/ui/LoadingComponents';
import { Toaster } from 'react-hot-toast';

// Lazy load heavy components
const Login = lazy(() => import('./components/features/auth/Login'));
const CompanySignup = lazy(() => import('./components/features/auth/CompanySignup'));
const UserInvite = lazy(() => import('./components/features/auth/UserInvite'));
const PasswordResetRequest = lazy(() => import('./components/features/auth/PasswordResetRequest'));
const PasswordResetConfirm = lazy(() => import('./components/features/auth/PasswordResetConfirm'));
const FleetDashboard = lazy(() => import('./components/features/fleet/FleetDashboard'));
const AccountantDashboard = lazy(() => import('./components/features/accountant/AccountantDashboard'));
const AdminDashboard = lazy(() => import('./components/features/admin/AdminDashboard'));
const PlatformDashboard = lazy(() => import('./components/features/platform/Dashboard'));
const CreateTenant = lazy(() => import('./components/features/platform/CreateTenant'));
const MasterCatalog = lazy(() => import('./components/features/platform/MasterCatalog'));
const PlatformCompanies = lazy(() => import('./components/features/platform/Companies'));
const PlatformPlans = lazy(() => import('./components/features/platform/Plans'));
const PlatformBackups = lazy(() => import('./components/features/platform/Backups'));
const PlatformLayout = lazy(() => import('./components/layout/PlatformLayout'));

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

import SEO from './components/common/SEO';

const AppRoutes: React.FC = () => {
    const { currentUser, loading, error, isProfileLoaded, syncOfflineMutations, isSubscriptionActive, companyName } = useAppContext();
    const { subdomain } = useTenant();
    const [loadingTimeout, setLoadingTimeout] = useState(false);
    const loadingTimeoutRef = useRef<{ primary: NodeJS.Timeout; emergency: NodeJS.Timeout } | null>(null);

    // CRITICAL: Multiple safety timeouts to prevent infinite loading
    useEffect(() => {
        if (loading) {
            // Primary timeout (15s) - show retry screen
            const primaryTimeout = setTimeout(() => {
                logger.warn('Primary loading timeout reached - showing retry screen');
                setLoadingTimeout(true);
            }, 15000);

            // Emergency timeout (30s) - force reload as last resort
            const emergencyTimeout = setTimeout(() => {
                logger.error('Emergency loading timeout - forcing page reload');
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

    // Default title for platform/root
    const pageTitle = companyName || 'نظام تتبع الشحنات';

    return (
        <div className={`min-h-screen bg-secondary-100 dark:bg-secondary-900 text-secondary-800 dark:text-secondary-200 transition-colors duration-300`}>
            <SEO
                companyName={pageTitle}
                description="منصة متكاملة لإدارة عمليات النقل وتتبع الشحنات"
            />
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <Suspense fallback={<PageLoading title="جاري تحميل التطبيق..." />}>
                    <Routes>
                        {/* Auth Routes */}
                        <Route path="/login" element={!currentUser ? <Login /> : <Navigate to="/" />} />
                        <Route path="/signup" element={!currentUser ? <CompanySignup /> : <Navigate to="/" />} />
                        <Route path="/invite" element={!currentUser ? <UserInvite /> : <Navigate to="/" />} />
                        <Route path="/reset-password" element={!currentUser ? <PasswordResetRequest /> : <Navigate to="/" />} />
                        <Route path="/reset-password/confirm" element={!currentUser ? <PasswordResetConfirm /> : <Navigate to="/" />} />

                        {/* Platform Admin Routes - Accessible on Root Domain (Platform Mode) */}
                        <Route path="/platform/*" element={
                            <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN]}>
                                <Suspense fallback={<PageLoading title="جاري تحميل لوحة التحكم..." />}>
                                    <PlatformLayout>
                                        <Routes>
                                            <Route index element={<PlatformDashboard />} />
                                            <Route path="create-tenant" element={<CreateTenant />} />
                                            <Route path="catalog" element={<MasterCatalog />} />
                                            <Route path="companies" element={<PlatformCompanies />} />
                                            <Route path="plans" element={<PlatformPlans />} />
                                            <Route path="backups" element={<PlatformBackups />} />
                                        </Routes>
                                    </PlatformLayout>
                                </Suspense>
                            </ProtectedRoute>
                        } />

                        {/* Main App Routes */}
                        <Route path="/*" element={
                            currentUser ? (
                                !isSubscriptionActive && currentUser.role !== Role.SUPER_ADMIN ? (
                                    <div className="flex items-center justify-center min-h-screen bg-secondary-100 dark:bg-secondary-900">
                                        <div className="flex flex-col items-center text-center p-8 bg-white dark:bg-secondary-800 rounded-lg shadow-lg max-w-md mx-4">
                                            <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-full mb-4">
                                                <Icons.AlertCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
                                            </div>
                                            <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-2">
                                                الحساب متوقف
                                            </h2>
                                            <p className="text-secondary-600 dark:text-secondary-300 mb-6">
                                                عذراً، تم إيقاف حساب الشركة أو انتهاء فترة الاشتراك. يرجى التواصل مع الإدارة لإعادة التفعيل.
                                            </p>
                                            <button
                                                onClick={() => window.location.reload()}
                                                className="px-6 py-2 bg-secondary-200 dark:bg-secondary-700 text-secondary-800 dark:text-white rounded-lg hover:bg-secondary-300 dark:hover:bg-secondary-600 transition-colors"
                                            >
                                                تحديث الصفحة
                                            </button>
                                        </div>
                                    </div>
                                ) : (
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

                                                            {/* On Root Domain (Platform), redirect Super Admin to /platform */}
                                                            {/* Only do this if we are NOT on a tenant subdomain */}
                                                            {!subdomain && currentUser.role === Role.SUPER_ADMIN && <Navigate to="/platform" />}
                                                        </>
                                                    )
                                                } />

                                                {/* Tenant Routes */}
                                                <Route path="/fleet/*" element={<ProtectedRoute allowedRoles={[Role.SALES]}><FleetDashboard /></ProtectedRoute>} />
                                                <Route path="/accountant/*" element={<ProtectedRoute allowedRoles={[Role.ACCOUNTANT]}><AccountantDashboard /></ProtectedRoute>} />
                                                <Route path="/manager/*" element={<ProtectedRoute allowedRoles={[Role.ADMIN, Role.SUPER_ADMIN]}><AdminDashboard /></ProtectedRoute>} />
                                            </Routes>
                                        </Suspense>
                                        <SyncStatusIndicator onSync={syncOfflineMutations} />
                                    </Layout>
                                )) : (
                                <Login />
                            )
                        } />
                    </Routes>
                </Suspense>
            </BrowserRouter>
        </div>
    );
};



const TenantGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { loading, error, company, subdomain } = useTenant();

    // If no subdomain (Root/Platform), skip tenant check
    if (!subdomain) {
        return <>{children}</>;
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-secondary-100 dark:bg-secondary-900">
                <div className="flex flex-col items-center">
                    <Icons.Truck className="h-16 w-16 text-primary-600 animate-pulse" />
                    <p className="mt-4 text-lg font-semibold text-secondary-700 dark:text-secondary-300">
                        جاري تحميل بيانات الشركة...
                    </p>
                </div>
            </div>
        );
    }

    if (error || !company) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-red-50 dark:bg-red-900/50">
                <div className="text-center p-8">
                    <Icons.AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
                    <h2 className="mt-4 text-xl font-bold text-red-800 dark:text-red-200">
                        خطأ في تحميل الشركة
                    </h2>
                    <p className="mt-2 text-red-600 dark:text-red-300">
                        {error || 'الشركة غير موجودة'}
                    </p>
                    <p className="mt-2 text-sm text-secondary-500">
                        تأكد من صحة رابط الشركة أو تواصل مع الدعم الفني.
                    </p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};

const App: React.FC = () => (
    <TenantProvider>
        <TenantGuard>
            <ThemeProvider>
                <AppProvider>
                    <AppRoutes />
                    <Toaster
                        position="top-center"
                        toastOptions={{
                            duration: 4000,
                            style: {
                                direction: 'rtl',
                                fontFamily: 'inherit',
                            },
                            success: {
                                iconTheme: {
                                    primary: '#10b981',
                                    secondary: '#fff',
                                },
                            },
                            error: {
                                iconTheme: {
                                    primary: '#ef4444',
                                    secondary: '#fff',
                                },
                            },
                        }}
                    />
                </AppProvider>
            </ThemeProvider>
        </TenantGuard>
    </TenantProvider>
);

export default App;

