import React, { useState, useEffect } from 'react';
import { Icons } from '../../Icons';
import { supabase } from '../../../utils/supabaseClient';
import toast from 'react-hot-toast';

const PlatformPlans: React.FC = () => {
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPlan, setSelectedPlan] = useState<any>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const { data, error } = await supabase.from('subscription_plans' as any).select('*');
            if (error) throw error;
            setPlans(data || []);
        } catch (error) {
            console.error('Error fetching plans:', error);
            toast.error('فشل تحميل الخطط');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (plan: any) => {
        setSelectedPlan({ ...plan });
        setIsEditModalOpen(true);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('subscription_plans' as any)
                .update({
                    name: selectedPlan.name,
                    price_monthly: selectedPlan.price_monthly,
                    max_users: selectedPlan.max_users,
                    max_drivers: selectedPlan.max_drivers,
                    features: selectedPlan.features
                })
                .eq('id', selectedPlan.id);

            if (error) throw error;
            toast.success('تم تحديث الخطة بنجاح');
            setIsEditModalOpen(false);
            fetchPlans();
        } catch (error) {
            toast.error('فشل التحديث');
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Icons.Loader className="w-8 h-8 text-emerald-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 px-1 sm:px-0 pb-12">
            <div>
                <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                    <Icons.CreditCard className="w-6 h-6 text-emerald-600" />
                    باقات الاشتراك
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">تحديد الميزات والحدود لكل عروض المنصة</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map((plan) => (
                    <div key={plan.id} className={`bg-white dark:bg-slate-800 rounded-3xl border ${plan.name === 'Bronze' ? 'border-amber-200 dark:border-amber-900 shadow-amber-100/50' : 'border-slate-200 dark:border-slate-700'} shadow-xl overflow-hidden flex flex-col group hover:-translate-y-2 transition-transform duration-300 relative`}>
                        {plan.name === 'Bronze' && (
                            <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-tighter">الاكثر طلباً</div>
                        )}

                        <div className="p-8 pb-4">
                            <h3 className="text-xl font-black text-slate-900 dark:text-white">{plan.name}</h3>
                            <div className="mt-4 flex items-baseline gap-1">
                                <span className="text-4xl font-black text-slate-900 dark:text-white">{plan.price_monthly}</span>
                                <span className="text-slate-400 font-medium">ر.س / شهر</span>
                            </div>
                        </div>

                        <div className="p-8 pt-4 flex-1 space-y-4">
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                                    <Icons.Users className="w-5 h-5 text-emerald-500" />
                                    <span className="text-sm font-semibold">{plan.max_users || '∞'} مستخدم كحد أقصى</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                                    <Icons.Truck className="w-5 h-5 text-emerald-500" />
                                    <span className="text-sm font-semibold">{plan.max_drivers || '∞'} سائق كحد أقصى</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                                    <Icons.ShieldCheck className="w-5 h-5 text-emerald-500" />
                                    <span className="text-sm font-semibold">دعم فني وتحديثات مستمرة</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700">
                            <button
                                onClick={() => handleEdit(plan)}
                                className="w-full py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <Icons.Edit className="w-4 h-4" />
                                تعديل التفاصيل
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-lg w-full p-8 animate-in zoom-in-95 duration-200 overflow-hidden relative">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white">تعديل باقة {selectedPlan?.name}</h2>
                                <p className="text-sm text-slate-500">تحديث أسعار وحدود الباقة المختارة</p>
                            </div>
                            <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                                <Icons.X className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdate} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">اسم الباقة</label>
                                <input
                                    type="text"
                                    value={selectedPlan?.name}
                                    onChange={e => setSelectedPlan({ ...selectedPlan, name: e.target.value })}
                                    className="w-full px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">السعر الشهري (ر.س)</label>
                                <input
                                    type="number"
                                    value={selectedPlan?.price_monthly}
                                    onChange={e => setSelectedPlan({ ...selectedPlan, price_monthly: Number(e.target.value) })}
                                    className="w-full px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none font-bold"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">أقصى عدد مستخدمين</label>
                                <input
                                    type="number"
                                    value={selectedPlan?.max_users || ''}
                                    onChange={e => setSelectedPlan({ ...selectedPlan, max_users: e.target.value ? Number(e.target.value) : null })}
                                    placeholder="بلا حدود"
                                    className="w-full px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none font-bold"
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">أقصى عدد سائقين</label>
                                <input
                                    type="number"
                                    value={selectedPlan?.max_drivers || ''}
                                    onChange={e => setSelectedPlan({ ...selectedPlan, max_drivers: e.target.value ? Number(e.target.value) : null })}
                                    placeholder="بلا حدود"
                                    className="w-full px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none font-bold"
                                />
                            </div>

                            <div className="sm:col-span-2 pt-6 flex gap-4">
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black text-lg hover:bg-emerald-700 shadow-xl shadow-emerald-500/30 transition-all disabled:opacity-50"
                                >
                                    {isSaving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-8 py-4 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlatformPlans;
