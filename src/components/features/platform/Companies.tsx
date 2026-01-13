import React, { useState, useEffect } from 'react';
import { supabase } from '../../../utils/supabaseClient';
import { Icons } from '../../Icons';
import toast from 'react-hot-toast';
import logger from '../../../utils/logger';
import CompanyEditModal from './CompanyEditModal';

const PlatformCompanies: React.FC = () => {
    const [companies, setCompanies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [snapshotting, setSnapshotting] = useState<string | null>(null);
    const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);

    useEffect(() => {
        fetchCompanies();
    }, []);

    const fetchCompanies = async () => {
        try {
            const { data, error } = await supabase
                .from('companies' as any)
                .select('*, subscription_plans(name)')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCompanies(data || []);
        } catch (error) {
            logger.error('Error fetching companies:', error);
            toast.error('فشل تحميل الشركات');
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        if (!window.confirm('هل أنت متأكد من تغيير حالة الشركة؟')) return;
        try {
            const { error } = await supabase
                .from('companies' as any)
                .update({ is_active: !currentStatus })
                .eq('id', id);

            if (error) throw error;
            toast.success('تم تغيير الحالة بنجاح');
            fetchCompanies();
        } catch (error: any) {
            toast.error('فشل التغيير');
        }
    };

    const handleSnapshot = async (companyId: string) => {
        if (!window.confirm('هل تريد أخذ نسخة احتياطية لهذه الشركة الآن؟')) return;
        setSnapshotting(companyId);
        const toastId = toast.loading('جاري إنشاء النسخة الاحتياطية...');

        try {
            const { error } = await supabase.functions.invoke('snapshot-tenant', {
                body: { companyId }
            });

            if (error) throw error;
            toast.success('تم إنشاء النسخة الاحتياطية بنجاح', { id: toastId });
        } catch (error: any) {
            logger.error('Snapshot failed:', error);
            toast.error('فشل إنشاء النسخة: ' + error.message, { id: toastId });
        } finally {
            setSnapshotting(null);
        }
    };

    const StatusBadge = ({ active }: { active: boolean }) => (
        active ? (
            <span className="text-emerald-600 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full text-xs border border-emerald-100 dark:border-emerald-800/50">
                <Icons.CheckCircle className="w-3 h-3" /> نشط
            </span>
        ) : (
            <span className="text-red-500 flex items-center gap-1 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-full text-xs border border-red-100 dark:border-red-800/50">
                <Icons.X className="w-3 h-3" /> متوقف
            </span>
        )
    );

    const ActionButtons = ({ co }: { co: any }) => (
        <div className="flex items-center gap-2">
            <button
                onClick={() => setEditingCompanyId(co.id)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-blue-600 transition-colors"
                title="تعديل الباقة والحدود"
            >
                <Icons.Edit className="w-5 h-5" />
            </button>
            <button
                onClick={() => toggleStatus(co.id, co.is_active)}
                className={`p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${co.is_active ? 'text-red-500' : 'text-emerald-500'}`}
                title={co.is_active ? 'إيقاف النشاط' : 'تفعيل'}
            >
                {co.is_active ? <Icons.WifiOff className="w-5 h-5" /> : <Icons.Wifi className="w-5 h-5" />}
            </button>
            <button
                onClick={() => handleSnapshot(co.id)}
                disabled={snapshotting === co.id}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-amber-500 transition-colors disabled:opacity-50"
                title="أخذ نسخة احتياطية"
            >
                {snapshotting === co.id ? <Icons.Loader className="w-5 h-5 animate-spin" /> : <Icons.Save className="w-5 h-5" />}
            </button>
            <button
                onClick={() => window.open(`${window.location.protocol}//${co.slug}.${window.location.host.split('.').slice(-2).join('.') === 'localhost' ? 'localhost:3000' : window.location.host}`, '_blank')}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-blue-500 transition-colors"
                title="زيارة لوحة التحكم"
            >
                <Icons.ExternalLink className="w-5 h-5" />
            </button>
        </div>
    );

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Icons.Loader className="w-8 h-8 text-emerald-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 px-1 sm:px-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Icons.Building className="w-6 h-6 text-emerald-600" />
                        الشركات المسجلة
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">إدارة جميع العملاء والمستأجرين في النظام</p>
                </div>
            </div>

            {/* Mobile View: Card List */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
                {companies.length === 0 ? (
                    <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-400">
                        لا توجد شركات مسجلة
                    </div>
                ) : (
                    companies.map((co) => (
                        <div key={co.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">{co.name}</h3>
                                    <p className="text-sm font-mono text-slate-400" dir="ltr">{co.slug}</p>
                                </div>
                                <StatusBadge active={co.is_active} />
                            </div>

                            <div className="grid grid-cols-2 gap-y-2 text-sm pt-2">
                                <div className="text-slate-500 font-medium">الباقة:</div>
                                <div className="text-slate-900 dark:text-slate-200 text-left">
                                    <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded text-xs">
                                        {co.subscription_plans?.name || 'غ/م'}
                                    </span>
                                </div>

                                <div className="text-slate-500 font-medium">تاريخ التسجيل:</div>
                                <div className="text-slate-900 dark:text-slate-200 text-left">
                                    {new Date(co.created_at).toLocaleDateString('ar-EG')}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-center">
                                <ActionButtons co={co} />
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden md:block bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                <table className="w-full text-right">
                    <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">اسم الشركة</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Slug</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">الباقة</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">الحالة</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">تاريخ التسجيل</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {companies.length === 0 ? (
                            <tr><td colSpan={6} className="p-12 text-center text-slate-400">لا توجد شركات</td></tr>
                        ) : (
                            companies.map((co) => (
                                <tr key={co.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-900 dark:text-white">{co.name}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-slate-500 dark:text-slate-400 font-mono text-xs" dir="ltr">{co.slug}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-md text-xs font-medium">
                                            {co.subscription_plans?.name || 'غ/م'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge active={co.is_active} />
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-sm">
                                        {new Date(co.created_at).toLocaleDateString('ar-EG')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center">
                                            <ActionButtons co={co} />
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Edit Modal */}
            {editingCompanyId && (
                <CompanyEditModal
                    isOpen={!!editingCompanyId}
                    onClose={() => setEditingCompanyId(null)}
                    companyId={editingCompanyId}
                    onSave={fetchCompanies}
                />
            )}
        </div>
    );
};

export default PlatformCompanies;
