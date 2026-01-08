import React, { useState, useEffect } from 'react';
import { supabase } from '../../../utils/supabaseClient';
import { Icons } from '../../Icons';
import toast from 'react-hot-toast';

const PlatformBackups: React.FC = () => {
    const [backups, setBackups] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState<string | null>(null);

    useEffect(() => {
        fetchBackups();
    }, []);

    const fetchBackups = async () => {
        try {
            const { data, error } = await supabase
                .from('backups' as any)
                .select('*, companies(name)')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setBackups(data || []);
        } catch (error) {
            console.error('Error fetching backups:', error);
            toast.error('فشل تحميل النسخ الاحتياطية');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (backupId: string, path: string, fileName: string) => {
        setDownloading(backupId);
        try {
            const { data, error } = await supabase.storage
                .from('backups')
                .createSignedUrl(path, 300);

            if (error) throw error;
            if (data?.signedUrl) {
                window.open(data.signedUrl, '_blank');
                toast.success('بدء التحميل...');
            }
        } catch (error) {
            console.error('Download failed:', error);
            toast.error('فشل تحميل الملف');
        } finally {
            setDownloading(null);
        }
    };

    const formatSize = (bytes: number) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const ActionButton = ({ backup }: { backup: any }) => (
        <button
            onClick={() => handleDownload(backup.id, backup.storage_path, backup.name)}
            disabled={downloading === backup.id}
            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-800/40 rounded-lg transition-colors border border-emerald-100 dark:border-emerald-800/50 disabled:opacity-50 text-sm font-medium"
        >
            {downloading === backup.id ? (
                <Icons.Loader className="w-4 h-4 animate-spin" />
            ) : (
                <Icons.FileDown className="w-4 h-4" />
            )}
            تحميل JSON
        </button>
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
            <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Icons.Database className="w-6 h-6 text-emerald-600" />
                    النسخ الاحتياطي
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">تاريخ النسخ الاحتياطية لجميع الشركات</p>
            </div>

            {/* Mobile View: Card List */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
                {backups.length === 0 ? (
                    <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-400">
                        لا توجد نسخ احتياطية حالياً
                    </div>
                ) : (
                    backups.map((backup) => (
                        <div key={backup.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                            <div className="flex justify-between items-start border-b border-slate-50 dark:border-slate-700 pb-2">
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1">{backup.name}</h3>
                                    <p className="text-xs text-slate-400 mt-0.5">{new Date(backup.created_at).toLocaleString('ar-EG')}</p>
                                </div>
                                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-[10px] font-mono whitespace-nowrap">
                                    {formatSize(backup.size_bytes)}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 text-sm">
                                <Icons.Building className="w-4 h-4 text-slate-400" />
                                <span className="text-slate-600 dark:text-slate-300">الشركة:</span>
                                <span className="font-semibold text-slate-900 dark:text-white">{backup.companies?.name || 'شركة محذوفة'}</span>
                            </div>

                            <div className="pt-2 flex justify-center">
                                <ActionButton backup={backup} />
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
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">اسم الملف</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">الشركة</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">الحجم</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">التاريخ</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {backups.length === 0 ? (
                            <tr><td colSpan={5} className="p-12 text-center text-slate-400">لا توجد نسخ احتياطية</td></tr>
                        ) : (
                            backups.map((backup) => (
                                <tr key={backup.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-900 dark:text-white">{backup.name}</div>
                                        <div className="text-xs text-slate-400 font-mono mt-0.5 line-clamp-1" title={backup.storage_path}>{backup.storage_path}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500">
                                                <Icons.Building className="w-4 h-4" />
                                            </div>
                                            <span className="font-semibold">{backup.companies?.name || 'شركة محذوفة'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-slate-600 dark:text-slate-400">{formatSize(backup.size_bytes)}</span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-sm">
                                        {new Date(backup.created_at).toLocaleString('ar-EG')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center">
                                            <ActionButton backup={backup} />
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PlatformBackups;
