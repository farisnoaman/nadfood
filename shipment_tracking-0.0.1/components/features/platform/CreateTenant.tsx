import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../../Icons';
import { supabase } from '../../../utils/supabaseClient';
import toast from 'react-hot-toast';

const CreateTenant: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [plans, setPlans] = useState<any[]>([]);

    // Form State
    const [formData, setFormData] = useState({
        companyName: '',
        slug: '',
        adminEmail: '',
        adminPassword: '',
        planId: '',
    });

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            // Cast to any because subscription_plans type is not yet in generated types
            const { data, error } = await supabase.from('subscription_plans' as any).select('*');
            if (error) throw error;
            const plansData = data as any[];
            setPlans(plansData || []);
            // Set default plan if available
            if (plansData && plansData.length > 0) {
                const defaultPlan = plansData.find((p: any) => p.name === 'Bronze') || plansData[0];
                setFormData(prev => ({ ...prev, planId: String(defaultPlan.id) }));
            }
        } catch (error) {
            console.error('Error fetching plans:', error);
            toast.error('فشل تحميل باقات الاشتراك');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Auto-generate slug from name if slug is empty or matches previous auto-gen
        if (name === 'companyName' && !formData.slug) {
            // Very basic slugify
            const slug = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            setFormData(prev => ({ ...prev, slug, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Call Edge Function
            // Note: This requires the function to be deployed.
            const { data, error } = await supabase.functions.invoke('create-tenant', {
                body: formData
            });

            if (error) throw error;

            toast.success('تم إنشاء الشركة بنجاح!');
            navigate('/platform');
        } catch (error: any) {
            console.error('Creation failed:', error);
            // Handle specific errors potentially returned by the function
            const msg = error.message || 'حدث خطأ أثناء الإنشاء. تأكد من نشر دالة create-tenant.';
            toast.error('فشل العملية: ' + msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">إضافة شركة جديدة</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">إنشاء مستأجر جديد وتعيين مدير النظام</p>
                </div>
                <button
                    onClick={() => navigate('/platform')}
                    className="flex items-center px-4 py-2 text-slate-600 bg-white dark:bg-slate-800 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                >
                    <Icons.ArrowRight className="w-5 h-5 ml-2" />
                    عودة
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <form onSubmit={handleSubmit} className="p-6 space-y-6">

                    {/* Company Details */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                            <Icons.Building className="w-5 h-5" />
                            بيانات الشركة
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">اسم الشركة</label>
                                <input
                                    type="text"
                                    name="companyName"
                                    value={formData.companyName}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                                    placeholder="مثال: شركة النقل السريع"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 text-left" dir="ltr">Company Slug (Subdomain)</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="slug"
                                        value={formData.slug}
                                        onChange={handleChange}
                                        required
                                        pattern="[a-z0-9-]+"
                                        title="Only lowercase letters, numbers, and hyphens"
                                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 text-left"
                                        placeholder="example-corp"
                                        style={{ direction: 'ltr' }}
                                    />
                                </div>
                                <p className="text-xs text-slate-500 mt-1 text-left" dir="ltr">Used for URL: slug.app-domain.com</p>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-slate-200 dark:border-slate-700"></div>

                    {/* Subscription */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                            <Icons.CreditCard className="w-5 h-5" />
                            خطة الاشتراك
                        </h3>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">الباقة</label>
                            <select
                                name="planId"
                                value={formData.planId}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="" disabled>اختر الباقة</option>
                                {plans.map(plan => (
                                    <option key={plan.id} value={plan.id}>
                                        {plan.name} - (Users: {plan.max_users ?? '∞'}, Drivers: {plan.max_drivers ?? '∞'})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="border-t border-slate-200 dark:border-slate-700"></div>

                    {/* Admin User */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                            <Icons.User className="w-5 h-5" />
                            حساب المدير (Admin)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">البريد الإلكتروني</label>
                                <input
                                    type="email"
                                    name="adminEmail"
                                    value={formData.adminEmail}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                                    placeholder="admin@company.com"
                                    dir="ltr"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">كلمة المرور</label>
                                <input
                                    type="password"
                                    name="adminPassword"
                                    value={formData.adminPassword}
                                    onChange={handleChange}
                                    required
                                    minLength={6}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                                    placeholder="******"
                                    dir="ltr"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => navigate('/platform')}
                            className="px-6 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                            إلغاء
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Icons.Loader className="w-5 h-5 ml-2 animate-spin" />
                                    جاري الإنشاء...
                                </>
                            ) : (
                                <>
                                    <Icons.Check className="w-5 h-5 ml-2" />
                                    إنشاء الشركة
                                </>
                            )}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default CreateTenant;
