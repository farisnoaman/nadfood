import React, { useState, useEffect } from 'react';
import { supabase } from '../../../utils/supabaseClient';
import { Icons } from '../../Icons';
import Button from '../../common/ui/Button';
import Input from '../../common/ui/Input';
import toast from 'react-hot-toast';
import { Company, CompanyFeatures, UsageLimits } from '../../../types/types';
import { companyFromRow, CompanyRow } from '../../../providers/app/mappers';
import { usePersistedState } from '../../../hooks/usePersistedState';

interface SubscriptionPlan {
    id: string;
    name: string;
    max_users: number | null;
    max_products: number | null;
    max_drivers: number | null;
    max_regions: number | null;
    max_storage_mb: number | null;
    max_shipments: number | null;
    monthly_price: number;
    bi_annual_price: number;
    annual_price: number;
}

interface CompanyEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    companyId: string;
    onSave: () => void;
}

const BILLING_CYCLES = [
    { value: 'monthly', label: 'شهري', months: 1, priceMultiplier: 1, shipmentsMultiplier: 1 },
    { value: 'bi_annual', label: 'نصف سنوي', months: 6, priceMultiplier: 5, shipmentsMultiplier: 5 },
    { value: 'annually', label: 'سنوي', months: 12, priceMultiplier: 10, shipmentsMultiplier: 15 },
];

const CompanyEditModal: React.FC<CompanyEditModalProps> = ({ isOpen, onClose, companyId, onSave }) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = usePersistedState<'plan' | 'limits' | 'features'>('companyEditModal_activeTab', 'plan');
    const [company, setCompany] = useState<Company | null>(null);
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);

    // Form State
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
    const [status, setStatus] = useState<string>('active');
    const [billingCycle, setBillingCycle] = useState<string>('monthly');
    const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState<string>('');
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
        canManagePrices: false,
        canManageRegionFees: false,
    });

    useEffect(() => {
        if (isOpen && companyId) {
            fetchPlans();
            fetchCompanyDetails();
        }
    }, [isOpen, companyId]);

    // Auto-calculate end date when start date or billing cycle changes
    useEffect(() => {
        if (startDate && billingCycle) {
            const start = new Date(startDate);
            const cycle = BILLING_CYCLES.find(c => c.value === billingCycle);
            if (cycle) {
                start.setMonth(start.getMonth() + cycle.months);
                setEndDate(start.toISOString().split('T')[0]);
            }
        }
    }, [startDate, billingCycle]);

    const fetchPlans = async () => {
        try {
            const { data, error } = await supabase
                .from('subscription_plans' as any)
                .select('*')
                .eq('is_active', true)
                .order('monthly_price');

            if (error) throw error;
            setPlans((data || []) as unknown as SubscriptionPlan[]);
        } catch (error) {
            console.error('Error fetching plans:', error);
        }
    };

    const fetchCompanyDetails = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('companies' as any)
                .select('*')
                .eq('id', companyId)
                .single();

            if (error) throw error;

            const co = companyFromRow(data as unknown as CompanyRow);
            setCompany(co);
            setSelectedPlanId(co.planId || null);
            setStatus(co.subscriptionStatus || 'active');
            setBillingCycle(co.billingCycle || 'monthly');
            setStartDate(co.subscriptionStartDate?.split('T')[0] || new Date().toISOString().split('T')[0]);
            setEndDate(co.subscriptionEndDate?.split('T')[0] || '');

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
                canManageRegionFees: co.features?.canManageRegionFees ?? true,
            });

        } catch (error) {
            console.error('Error fetching company:', error);
            toast.error('فشل تحميل تفاصيل الشركة');
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const handlePlanChange = (planId: string) => {
        setSelectedPlanId(planId);
        const selectedPlan = plans.find(p => p.id === planId);
        if (selectedPlan) {
            // Auto-populate limits from plan (use base values, multipliers apply on save)
            setLimits({
                maxUsers: selectedPlan.max_users ?? limits.maxUsers,
                maxDrivers: selectedPlan.max_drivers ?? limits.maxDrivers,
                maxRegions: selectedPlan.max_regions ?? limits.maxRegions,
                maxProducts: selectedPlan.max_products ?? limits.maxProducts,
                maxStorageMb: selectedPlan.max_storage_mb ?? limits.maxStorageMb,
                maxShipments: selectedPlan.max_shipments ?? 0,
            });
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const selectedPlan = plans.find(p => p.id === selectedPlanId);
            const planSlug = selectedPlan?.name?.toLowerCase().replace(/\s+/g, '_') || 'free_trial';
            const cycleConfig = BILLING_CYCLES.find(c => c.value === billingCycle) || BILLING_CYCLES[0];

            // Calculate effective limits based on billing cycle
            const effectiveLimits = {
                ...limits,
                // Shipments scale with billing cycle, others remain base
                maxShipments: limits.maxShipments != null ? limits.maxShipments * cycleConfig.shipmentsMultiplier : null,
            };

            const { error } = await supabase
                .from('companies' as any)
                .update({
                    plan_id: selectedPlanId,
                    subscription_plan: planSlug,
                    subscription_status: status,
                    billing_cycle: billingCycle,
                    subscription_start_date: startDate,
                    subscription_end_date: endDate,
                    usage_limits: effectiveLimits,
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

    const selectedPlan = plans.find(p => p.id === selectedPlanId);

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
                                                value={selectedPlanId || ''}
                                                onChange={(e) => handlePlanChange(e.target.value)}
                                                className="w-full rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-700 p-2.5"
                                            >
                                                <option value="">-- اختر باقة --</option>
                                                {plans.map(p => (
                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                ))}
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

                                    {/* Billing Cycle & Dates */}
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">دورة الفوترة</label>
                                            <select
                                                value={billingCycle}
                                                onChange={(e) => setBillingCycle(e.target.value)}
                                                className="w-full rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-700 p-2.5"
                                            >
                                                {BILLING_CYCLES.map(c => (
                                                    <option key={c.value} value={c.value}>{c.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">تاريخ البدء</label>
                                            <input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="w-full rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-700 p-2.5"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">تاريخ الانتهاء</label>
                                            <input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className="w-full rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-700 p-2.5"
                                            />
                                        </div>
                                    </div>

                                    {selectedPlan && (
                                        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-sm">
                                            <p className="font-medium text-emerald-700 dark:text-emerald-300 mb-2">تفاصيل الباقة: {selectedPlan.name}</p>
                                            <div className="grid grid-cols-2 gap-y-2 text-emerald-600 dark:text-emerald-400">
                                                <span>المستخدمين: {selectedPlan.max_users}</span>
                                                <span>السائقين: {selectedPlan.max_drivers}</span>
                                                <span>المنتجات: {selectedPlan.max_products}</span>
                                                <span>التخزين: {selectedPlan.max_storage_mb || 'غير محدود'} MB</span>
                                                <div className="col-span-2 pt-2 border-t border-emerald-200/50 dark:border-emerald-800/50 mt-1 flex flex-wrap gap-x-4">
                                                    <span>شهري: <b>{selectedPlan.monthly_price}</b></span>
                                                    <span>نصف سنوي: <b>{selectedPlan.bi_annual_price}</b></span>
                                                    <span>سنوي: <b>{selectedPlan.annual_price}</b></span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-700 dark:text-blue-300">
                                        <p>💡 عند اختيار باقة جديدة، سيتم تحديث الحدود تلقائياً. يمكنك تعديلها يدوياً من تبويب "حدود الاستخدام".</p>
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
                                            const featureLabels: Record<string, string> = {
                                                canImportData: 'استيراد البيانات',
                                                canExportData: 'تصدير البيانات',
                                                import_export: 'استيراد/تصدير',
                                                canManageDrivers: 'إدارة السائقين',
                                                canManageRegions: 'إدارة المناطق',
                                                canManageProducts: 'إدارة المنتجات',
                                                canManagePrices: 'إدارة الأسعار',
                                                canManageRegionFees: 'إدارة رسوم المناطق'
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
