import React, { useEffect, useState } from 'react';
import { Icons } from '../../Icons';
import { supabase } from '../../../utils/supabaseClient';

const PlatformDashboard: React.FC = () => {
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
            // Count Companies
            const { count: companiesCount, error: coError } = await supabase
                .from('companies')
                .select('*', { count: 'exact', head: true });

            // Count Active Companies
            const { count: activeCount, error: activeError } = await supabase
                .from('companies')
                .select('*', { count: 'exact', head: true })
                .eq('is_active', true);

            // Count Users
            const { count: usersCount, error: usersError } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true });

            if (coError || activeError || usersError) throw new Error('Failed to fetch stats');

            setStats({
                totalCompanies: companiesCount || 0,
                activeCompanies: activeCount || 0,
                totalUsers: usersCount || 0,
                revenue: (activeCount || 0) * 500, // Dummy revenue estimate
                loading: false
            });

        } catch (err) {
            console.error('Error fetching dashboard stats:', err);
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
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
                    <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
                    {subtext && <p className="mt-1 text-xs text-slate-400">{subtext}</p>}
                </div>
                <div className={`p-3 rounded-full ${color}`}>
                    <Icon className="h-6 w-6 text-white" />
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">نظرة عامة</h1>
                <p className="text-slate-500 dark:text-slate-400">مراقبة أداء المنصة</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="إجمالي الشركات"
                    value={stats.totalCompanies}
                    icon={Icons.Building}
                    color="bg-blue-500"
                />
                <StatCard
                    title="الشركات النشطة"
                    value={stats.activeCompanies}
                    icon={Icons.CheckCircle}
                    color="bg-emerald-500"
                    subtext={`${((stats.activeCompanies / (stats.totalCompanies || 1)) * 100).toFixed(0)}% من الإجمالي`}
                />
                <StatCard
                    title="إجمالي المستخدمين"
                    value={stats.totalUsers}
                    icon={Icons.Users}
                    color="bg-indigo-500"
                />
                <StatCard
                    title="العائد المتوقع (شهري)"
                    value={`${stats.revenue.toLocaleString()} ر.س`}
                    icon={Icons.CreditCard}
                    color="bg-amber-500"
                />
            </div>

            {/* Quick Actions */}
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-8">اجراءات سريعة</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <button className="flex items-center p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm hover:shadow-md transition-shadow group">
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-full group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800/50 transition-colors">
                        <Icons.Plus className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="mr-4 text-right">
                        <p className="font-semibold text-slate-900 dark:text-white">تسجيل شركة جديدة</p>
                        <p className="text-sm text-slate-500">إضافة عميل جديد للنظام</p>
                    </div>
                </button>

                <button className="flex items-center p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm hover:shadow-md transition-shadow group">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-colors">
                        <Icons.Database className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="mr-4 text-right">
                        <p className="font-semibold text-slate-900 dark:text-white">النسخ الاحتياطي</p>
                        <p className="text-sm text-slate-500">أخذ نسخة من بيانات النظام</p>
                    </div>
                </button>
            </div>
        </div>
    );
};

export default PlatformDashboard;
