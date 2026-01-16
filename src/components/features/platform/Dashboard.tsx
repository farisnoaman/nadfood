import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../../Icons';
import { supabase } from '../../../utils/supabaseClient';
import logger from '../../../utils/logger';
import SubscriptionRequestsManager from './SubscriptionRequestsManager';

const PlatformDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalCompanies: 0,
        activeCompanies: 0,
        totalUsers: 0,
        revenue: 0,
        loading: true
    });

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const { count: companiesCount } = await supabase.from('companies' as any).select('*', { count: 'exact', head: true });
            const { count: activeCount } = await supabase.from('companies' as any).select('*', { count: 'exact', head: true }).eq('is_active', true);
            const { count: usersCount } = await supabase.from('users').select('*', { count: 'exact', head: true });

            setStats({
                totalCompanies: companiesCount || 0,
                activeCompanies: activeCount || 0,
                totalUsers: usersCount || 0,
                revenue: (activeCount || 0) * 5000,
                loading: false
            });
        } catch (err) {
            logger.error('Error fetching dashboard stats:', err);
            setStats(prev => ({ ...prev, loading: false }));
        }
    };

    if (stats.loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Icons.Loader className="animate-spin h-10 w-10 text-emerald-500" />
            </div>
        );
    }

    const StatCard = ({ title, value, icon: Icon, gradient, subtext }: any) => (
        <div className="relative overflow-hidden bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-2xl transition-all group">
            <div className={`absolute -top-6 -right-6 w-24 h-24 ${gradient} rounded-full opacity-20 group-hover:scale-150 transition-transform duration-500`} />
            <div className="relative flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</p>
                    <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{value}</p>
                    {subtext && <p className="mt-1 text-xs text-slate-400 font-medium">{subtext}</p>}
                </div>
                <div className={`p-4 rounded-2xl ${gradient} shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all`}>
                    <Icon className="h-7 w-7 text-white" />
                </div>
            </div>
        </div>
    );

    const QuickAction = ({ title, desc, icon: Icon, onClick, color }: any) => (
        <button
            onClick={onClick}
            className="flex items-center p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all group text-right w-full"
        >
            <div className={`p-4 ${color} rounded-2xl group-hover:rotate-6 group-hover:scale-110 transition-all`}>
                <Icon className="h-7 w-7" />
            </div>
            <div className="mr-4">
                <p className="font-black text-slate-900 dark:text-white text-lg">{title}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{desc}</p>
            </div>
            <Icons.ArrowLeft className="h-5 w-5 text-slate-300 mr-auto group-hover:text-emerald-500 group-hover:-translate-x-2 transition-all" />
        </button>
    );

    return (
        <div className="space-y-8 pb-12">
            {/* Header with Welcome */}
            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl p-8 text-white shadow-xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
                <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">مرحباً بك في لوحة التحكم</h1>
                        <p className="text-emerald-100 mt-1 font-medium">النظام المركزي لإدارة منصة نادفود</p>
                    </div>
                    <button
                        onClick={() => navigate('/platform/create-tenant')}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-white text-emerald-600 font-bold rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                    >
                        <Icons.Plus className="w-5 h-5" />
                        شركة جديدة
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="الشركات المسجلة"
                    value={stats.totalCompanies}
                    icon={Icons.Building}
                    gradient="bg-gradient-to-br from-blue-500 to-blue-600"
                />
                <StatCard
                    title="الشركات النشطة"
                    value={stats.activeCompanies}
                    icon={Icons.CheckCircle}
                    gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
                    subtext={`${((stats.activeCompanies / (stats.totalCompanies || 1)) * 100).toFixed(0)}% من الإجمالي`}
                />
                <StatCard
                    title="إجمالي المستخدمين"
                    value={stats.totalUsers}
                    icon={Icons.Users}
                    gradient="bg-gradient-to-br from-violet-500 to-violet-600"
                />
                <StatCard
                    title="العائد المتوقع"
                    value={`${stats.revenue.toLocaleString()} ر.ي`}
                    icon={Icons.CreditCard}
                    gradient="bg-gradient-to-br from-amber-500 to-amber-600"
                />
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
                <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                    <div className="w-2 h-7 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-full" />
                    وصول سريع
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <QuickAction
                        title="إدارة الشركات"
                        desc="عرض وتعديل جميع الشركات"
                        icon={Icons.Building}
                        color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
                        onClick={() => navigate('/platform/companies')}
                    />
                    <QuickAction
                        title="النسخ الاحتياطي"
                        desc="إدارة نسخ البيانات"
                        icon={Icons.Database}
                        color="bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
                        onClick={() => navigate('/platform/backups')}
                    />
                    <QuickAction
                        title="خطط الاشتراك"
                        desc="تعديل الباقات والأسعار"
                        icon={Icons.CreditCard}
                        color="bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400"
                        onClick={() => navigate('/platform/plans')}
                    />
                </div>
            </div>

            {/* Subscription Requests */}
            <SubscriptionRequestsManager />

            {/* Recent Activity Placeholder */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-8 text-center space-y-4 shadow-lg">
                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto">
                    <Icons.BarChart3 className="w-10 h-10 text-slate-300" />
                </div>
                <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">التقارير التفصيلية</h3>
                    <p className="text-slate-500 max-w-sm mx-auto mt-2">سيتم تفعيل الرسوم البيانية والتحليلات المتقدمة في التحديث القادم للمنصة.</p>
                </div>
            </div>
        </div>
    );
};

export default PlatformDashboard;
