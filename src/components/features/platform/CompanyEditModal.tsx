import React, { useState, useEffect } from 'react';
import { supabase } from '../../../utils/supabaseClient';
import { Icons } from '../../Icons';
import Button from '../../common/ui/Button';
import Input from '../../common/ui/Input';
import toast from 'react-hot-toast';
import { Company, CompanyFeatures, UsageLimits } from '../../../types/types';

interface CompanyEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    companyId: string;
    onSave: () => void;
}

const CompanyEditModal: React.FC<CompanyEditModalProps> = ({ isOpen, onClose, companyId, onSave }) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'plan' | 'limits' | 'features'>('plan');
    const [company, setCompany] = useState<Company | null>(null);

    // Form State
    const [plan, setPlan] = useState('');
    const [status, setStatus] = useState<any>('active');
    const [limits, setLimits] = useState<UsageLimits>({
        maxUsers: 0,
        maxDrivers: 0,
        maxRegions: 0,
        maxProducts: 0,
        maxStorageMb: 0
    });
    const [features, setFeatures] = useState<CompanyFeatures>({
        canImportData: false,
        canExportData: false,
        import_export: false,
        canManageDrivers: false,
        canManageRegions: false,
        canManageProducts: false,
        canManagePrices: false
    });

    useEffect(() => {
        if (isOpen && companyId) {
            fetchCompanyDetails();
        }
    }, [isOpen, companyId]);

    const fetchCompanyDetails = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('companies' as any)
                .select('*')
                .eq('id', companyId)
                .single();

            if (error) throw error;

            const co = data as unknown as Company;
            setCompany(co);
            setPlan(co.subscriptionPlan || 'free_trial');
            setStatus(co.subscriptionStatus || 'active');

            // Ensure we handle potentially missing keys by merging with defaults
            setLimits({
                maxUsers: co.usageLimits?.maxUsers ?? 3,
                maxDrivers: co.usageLimits?.maxDrivers ?? 3,
                maxRegions: co.usageLimits?.maxRegions ?? 3,
                maxProducts: co.usageLimits?.maxProducts ?? 50,
                maxStorageMb: co.usageLimits?.maxStorageMb ?? 10
            });

            setFeatures({
                canImportData: co.features?.canImportData ?? false,
                canExportData: co.features?.canExportData ?? false,
                import_export: co.features?.import_export ?? false,
                canManageDrivers: co.features?.canManageDrivers ?? true,
                canManageRegions: co.features?.canManageRegions ?? true,
                canManageProducts: co.features?.canManageProducts ?? true,
                canManagePrices: co.features?.canManagePrices ?? true,
            });

        } catch (error) {
            console.error('Error fetching company:', error);
            toast.error('فشل تحميل تفاصيل الشركة');
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('companies' as any)
                .update({
                    subscription_plan: plan,
                    subscription_status: status,
                    usage_limits: limits,
                    features: features
                })
                .eq('id', companyId);

            if (error) throw error;

            toast.success('تم تحديث الشركة بنجاح');
            onSave();
            onClose();
        } catch (error: any) {
            console.error('Error updating company:', error);
            toast.error('فشل تحديث الشركة');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
                        <Icons.Edit className="w-5 h-5 text-emerald-600" />
                        تعديل الشركة: {loading ? 'جاري التحميل...' : company?.name}
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
                        <Icons.X className="w-6 h-6 text-slate-500" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                    <button
                        onClick={() => setActiveTab('plan')}
                        className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'plan' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        خطة الاشتراك
                    </button>
                    <button
                        onClick={() => setActiveTab('limits')}
                        className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'limits' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        حدود الاستخدام
                    </button>
                    <button
                        onClick={() => setActiveTab('features')}
                        className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'features' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        المميزات
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Icons.Loader className="w-8 h-8 animate-spin text-emerald-500" />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* TAB 1: Subscription */}
                            {activeTab === 'plan' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">الباقة</label>
                                            <select
                                                value={plan}
                                                onChange={(e) => setPlan(e.target.value)}
                                                className="w-full rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-700 p-2.5"
                                            >
                                                <option value="free_trial">تجربة مجانية</option>
                                                <option value="basic">أساسي</option>
                                                <option value="pro">احترافي</option>
                                                <option value="enterprise">مؤسسات</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">الحالة</label>
                                            <select
                                                value={status}
                                                onChange={(e) => setStatus(e.target.value)}
                                                className="w-full rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-700 p-2.5"
                                            >
                                                <option value="active">نشط</option>
                                                <option value="suspended">موقوف</option>
                                                <option value="cancelled">ملغي</option>
                                                <option value="expired">منتهي</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-700 dark:text-blue-300">
                                        <p>تغيير الباقة لا يحدّث الحدود تلقائياً. يرجى تحديث الحدود في تبويب "حدود الاستخدام" إذا لزم الأمر.</p>
                                    </div>
                                </div>
                            )}

                            {/* TAB 2: Limits */}
                            {activeTab === 'limits' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="الحد الأقصى للمستخدمين"
                                        type="number"
                                        value={limits.maxUsers}
                                        onChange={(e) => setLimits({ ...limits, maxUsers: parseInt(e.target.value) || 0 })}
                                    />
                                    <div className="flex items-center text-sm text-slate-500 mt-6">الحالي: {company?.currentUsage?.users || 0}</div>

                                    <Input
                                        label="الحد الأقصى للسائقين"
                                        type="number"
                                        value={limits.maxDrivers}
                                        onChange={(e) => setLimits({ ...limits, maxDrivers: parseInt(e.target.value) || 0 })}
                                    />
                                    <div className="flex items-center text-sm text-slate-500 mt-6">الحالي: {company?.currentUsage?.drivers || 0}</div>

                                    <Input
                                        label="الحد الأقصى للمناطق"
                                        type="number"
                                        value={limits.maxRegions}
                                        onChange={(e) => setLimits({ ...limits, maxRegions: parseInt(e.target.value) || 0 })}
                                    />
                                    <div className="flex items-center text-sm text-slate-500 mt-6">الحالي: {company?.currentUsage?.regions || 0}</div>

                                    <Input
                                        label="الحد الأقصى للمنتجات"
                                        type="number"
                                        value={limits.maxProducts}
                                        onChange={(e) => setLimits({ ...limits, maxProducts: parseInt(e.target.value) || 0 })}
                                    />
                                    <div className="flex items-center text-sm text-slate-500 mt-6">الحالي: {company?.currentUsage?.products || 0}</div>

                                    <Input
                                        label="الحد الأقصى للتخزين (ميغابايت)"
                                        type="number"
                                        value={limits.maxStorageMb}
                                        onChange={(e) => setLimits({ ...limits, maxStorageMb: parseInt(e.target.value) || 0 })}
                                    />
                                    <div className="flex items-center text-sm text-slate-500 mt-6">الحالي: {company?.currentUsage?.storageMb || 0} MB</div>
                                </div>
                            )}

                            {/* TAB 3: Features */}
                            {activeTab === 'features' && (
                                <div className="space-y-4">
                                    <div className="space-y-4">
                                        {Object.entries(features).map(([key, value]) => {
                                            // Arabic labels for feature flags
                                            const featureLabels: Record<string, string> = {
                                                canImportData: 'استيراد البيانات',
                                                canExportData: 'تصدير البيانات',
                                                import_export: 'استيراد/تصدير',
                                                canManageDrivers: 'إدارة السائقين',
                                                canManageRegions: 'إدارة المناطق',
                                                canManageProducts: 'إدارة المنتجات',
                                                canManagePrices: 'إدارة الأسعار'
                                            };

                                            return (
                                                <div key={key} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-700">
                                                    <div className="font-medium text-slate-700 dark:text-slate-200 text-sm">{featureLabels[key] || key}</div>
                                                    <label className="inline-flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={value}
                                                            onChange={() => setFeatures({ ...features, [key]: !value })}
                                                            className="sr-only peer"
                                                        />
                                                        <div className="relative w-11 h-6 bg-slate-300 dark:bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-500/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                                    </label>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                                        <p className="text-xs text-slate-500">ملاحظة: المميزات الجديدة المضافة إلى تعريف الأنواع ستظهر هنا تلقائياً.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
                    <Button variant="secondary" onClick={onClose} disabled={saving}>
                        إلغاء
                    </Button>
                    <Button variant="primary" onClick={handleSave} disabled={saving || loading}>
                        {saving ? (
                            <>
                                <Icons.Loader className="w-4 h-4 mr-2 animate-spin" />
                                جاري الحفظ...
                            </>
                        ) : (
                            <>
                                <Icons.Save className="w-4 h-4 mr-2" />
                                حفظ التغييرات
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default CompanyEditModal;
