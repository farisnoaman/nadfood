import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../../Icons';
import { supabase } from '../../../utils/supabaseClient';
import toast from 'react-hot-toast';
import logger from '../../../utils/logger';

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
            const { data, error } = await supabase.from('subscription_plans' as any).select('*');
            if (error) throw error;
            const plansData = data as any[];
            logger.info('Fetched plans:', plansData);
            setPlans(plansData || []);
            if (plansData && plansData.length > 0) {
                const defaultPlan = plansData.find((p: any) => p.name === 'Bronze') || plansData[0];
                logger.info('Setting default plan:', defaultPlan);
                setFormData(prev => ({ ...prev, planId: String(defaultPlan.id) }));
            } else {
                logger.warn('No subscription plans found in database!');
            }
        } catch (error) {
            logger.error('Error fetching plans:', error);
            toast.error('فشل تحميل باقات الاشتراك');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        let finalValue = value;

        if (name === 'slug') {
            finalValue = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
        }

        setFormData(prev => ({ ...prev, [name]: finalValue }));

        if (name === 'companyName' && !formData.slug) {
            const slug = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            setFormData(prev => ({ ...prev, slug: slug }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!formData.planId) {
                throw new Error('يرجى اختيار باقة الاشتراك');
            }

            logger.info('Submitting tenant data:', formData);

            const { data, error } = await supabase.functions.invoke('create-tenant', {
                body: formData
            });

            if (error) {
                logger.error('Edge Function error object:', error);
                // Try to get the actual error message from the response
                let errorMsg = 'حدث خطأ أثناء الإنشاء';
                if (error.context?.body) {
                    try {
                        const body = await error.context.json();
                        errorMsg = body.error || errorMsg;
                    } catch {
                        // If response isn't JSON, use the message
                        errorMsg = error.message || errorMsg;
                    }
                } else {
                    errorMsg = error.message || errorMsg;
                }
                throw new Error(errorMsg);
            }

            // Check if the response has an error field (Edge Function returning 200 with error)
            if (data?.error) {
                throw new Error(data.error);
            }

            toast.success('تم إنشاء الشركة بنجاح!');
            navigate('/platform');
        } catch (error: any) {
            logger.error('Creation failed:', error);
            const msg = error.message || 'حدث خطأ أثناء الإنشاء. تأكد من نشر دالة create-tenant.';
            toast.error('فشل العملية: ' + msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 px-1 sm:px-0 pb-12">
            <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white">إضافة شركة جديدة</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">تجهيز مستأجر جديد في المنصة</p>
                </div>
                <button
                    onClick={() => navigate('/platform')}
                    className="p-2 sm:px-4 sm:py-2 flex items-center bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-colors"
                >
                    <Icons.ArrowRight className="w-5 h-5 sm:ml-2" />
                    <span className="hidden sm:inline font-bold">عودة</span>
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
                <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">

                    {/* Company Details */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-black flex items-center gap-2 text-emerald-600">
                            <Icons.Building className="w-6 h-6 p-1 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg" />
                            بيانات الشركة
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">اسم الشركة</label>
                                <input
                                    type="text"
                                    name="companyName"
                                    value={formData.companyName}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium"
                                    placeholder="مثال: ناد فود للنقل"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 text-left" dir="ltr">Company Slug (Subdomain)</label>
                                <input
                                    type="text"
                                    name="slug"
                                    value={formData.slug}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none text-left font-mono"
                                    placeholder="nadfood-express"
                                    style={{ direction: 'ltr' }}
                                />
                                <p className="text-[10px] text-slate-400 mt-1 text-left" dir="ltr">http://{formData.slug || 'slug'}.domain.com</p>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-slate-100 dark:bg-slate-700"></div>

                    {/* Subscription */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-black flex items-center gap-2 text-emerald-600">
                            <Icons.Palette className="w-6 h-6 p-1 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg" />
                            باقة الخدمة
                        </h3>
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">اختر الخطة</label>
                            <select
                                name="planId"
                                value={formData.planId}
                                onChange={handleChange}
                                required
                                className="w-full px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none font-bold"
                            >
                                <option value="" disabled>اختر الباقة</option>
                                {plans.length > 0 ? (
                                    plans.map(plan => (
                                        <option key={plan.id} value={plan.id}>
                                            {plan.name} - ({plan.max_users || '∞'} مستخدم، {plan.max_drivers || '∞'} سائق)
                                        </option>
                                    ))
                                ) : (
                                    <option value="" disabled>لا توجد باقات متاحة - يرجى إضافة باقات في قاعدة البيانات</option>
                                )}
                            </select>
                        </div>
                    </div>

                    <div className="h-px bg-slate-100 dark:bg-slate-700"></div>

                    {/* Admin User */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-black flex items-center gap-2 text-emerald-600">
                            <Icons.User className="w-6 h-6 p-1 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg" />
                            بيانات المدير
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">البريد الإلكتروني</label>
                                <input
                                    type="email"
                                    name="adminEmail"
                                    value={formData.adminEmail}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none font-medium text-left"
                                    placeholder="admin@company.com"
                                    dir="ltr"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">كلمة المرور</label>
                                <input
                                    type="password"
                                    name="adminPassword"
                                    value={formData.adminPassword}
                                    onChange={handleChange}
                                    required
                                    minLength={6}
                                    className="w-full px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none text-left"
                                    placeholder="••••••••"
                                    dir="ltr"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-8 flex flex-col sm:flex-row justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => navigate('/platform')}
                            className="w-full sm:w-auto px-8 py-3 rounded-2xl text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        >
                            إلغاء العملية
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full sm:w-auto flex items-center justify-center px-10 py-4 bg-emerald-600 text-white rounded-2xl font-black text-lg hover:bg-emerald-700 shadow-xl shadow-emerald-500/30 transition-all disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <Icons.Loader className="w-6 h-6 ml-2 animate-spin" />
                                    جاري المعالجة...
                                </>
                            ) : (
                                <>
                                    <Icons.CheckCircle className="w-6 h-6 ml-2" />
                                    تأكيد وإنشاء الشركة
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
