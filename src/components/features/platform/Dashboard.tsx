import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../../Icons';
import { supabase } from '../../../utils/supabaseClient';

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
            const { count: companiesCount, error: coError } = await supabase
                .from('companies' as any)
                .select('*', { count: 'exact', head: true });

            const { count: activeCount, error: activeError } = await supabase
                .from('companies' as any)
                .select('*', { count: 'exact', head: true })
                .eq('is_active', true);

            const { count: usersCount, error: usersError } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true });

            if (coError || activeError || usersError) throw new Error('Failed to fetch stats');

            setStats({
                totalCompanies: companiesCount || 0,
                activeCompanies: activeCount || 0,
                totalUsers: usersCount || 0,
                revenue: (activeCount || 0) * 500,
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
                <Icons.Loader className="animate-spin h-8 w-8 text-emerald-600" />
            </div>
        );
    }

    const StatCard = ({ title, value, icon: Icon, color, subtext }: any) => (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all group">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</p>
                    <p className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{value}</p>
                    {subtext && <p className="mt-1 text-[10px] text-slate-400 font-medium">{subtext}</p>}
                </div>
                <div className={`p-3 rounded-xl ${color} shadow-lg shadow-current/20 group-hover:scale-110 transition-transform`}>
                    <Icon className="h-6 w-6 text-white" />
                </div>
            </div>
        </div>
    );

    const QuickAction = ({ title, desc, icon: Icon, onClick, color }: any) => (
        <button
            onClick={onClick}
            className="flex items-center p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group text-right w-full"
        >
            <div className={`p-4 ${color} rounded-2xl group-hover:rotate-6 transition-transform`}>
                <Icon className="h-7 w-7" />
            </div>
            <div className="mr-4">
                <p className="font-bold text-slate-900 dark:text-white text-lg">{title}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{desc}</p>
            </div>
        </button>
    );

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">لوحة القيادة</h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium">مرحباً بك في نظام الإدارة المركزي للمنصة</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <StatCard
                    title="الشركات المسجلة"
                    value={stats.totalCompanies}
                    icon={Icons.Building}
                    color="bg-blue-600"
                />
                <StatCard
                    title="الشركات النشطة"
                    value={stats.activeCompanies}
                    icon={Icons.CheckCircle}
                    color="bg-emerald-600"
                    subtext={`${((stats.activeCompanies / (stats.totalCompanies || 1)) * 100).toFixed(0)}% من الإجمالي`}
                />
                <StatCard
                    title="إجمالي المستخدمين"
                    value={stats.totalUsers}
                    icon={Icons.Users}
                    color="bg-violet-600"
                />
                <StatCard
                    title="العائد المتوقع"
                    value={`${stats.revenue.toLocaleString()} ر.س`}
                    icon={Icons.CreditCard}
                    color="bg-amber-600"
                />
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
                <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <div className="w-2 h-6 bg-emerald-500 rounded-full"></div>
                    وصول سريع
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <QuickAction
                        title="شركة جديدة"
                        desc="ربط عميل جديد بالنظام"
                        icon={Icons.Plus}
                        color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
                        onClick={() => navigate('/platform/create-tenant')}
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
                        icon={Icons.Palette}
                        color="bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400"
                        onClick={() => navigate('/platform/plans')}
                    />
                </div>
            </div>

            {/* Recent Activity Placeholder */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-8 text-center space-y-4">
                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto">
                    <Icons.BarChart3 className="w-10 h-10 text-slate-300" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">التقارير التفصيلية</h3>
                    <p className="text-slate-500 max-w-sm mx-auto mt-2">سيتم تفعيل الرسوم البيانية والتحليلات المتقدمة في التحديث القادم للمنصة.</p>
                </div>
            </div>
        </div>
    );
};

export default PlatformDashboard;
