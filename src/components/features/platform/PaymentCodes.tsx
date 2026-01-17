import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../utils/supabaseClient';
import { Icons } from '../../Icons';
import logger from '../../../utils/logger';

interface Company {
    id: string;
    name: string;
    slug: string;
    payment_status: string | null;
    created_at: string;
    plan?: {
        name: string;
        monthly_price: number;
    };
}

interface PaymentCode {
    id: string;
    code: string;
    company_id: string;
    company_name?: string;
    is_activated: boolean;
    activated_at: string | null;
    expires_at: string | null;
    created_at: string;
}

// Generate a random payment code: 2 capital letters + 10 alphanumeric uppercase
const generatePaymentCode = (): string => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const alphanumeric = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

    let code = '';
    // First 2 characters: letters only
    for (let i = 0; i < 2; i++) {
        code += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    // Next 10 characters: alphanumeric
    for (let i = 0; i < 10; i++) {
        code += alphanumeric.charAt(Math.floor(Math.random() * alphanumeric.length));
    }
    return code;
};

const PaymentCodes: React.FC = () => {
    const [pendingCompanies, setPendingCompanies] = useState<Company[]>([]);
    const [paymentCodes, setPaymentCodes] = useState<PaymentCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'pending' | 'codes'>('pending');

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch companies with pending payment
            const { data: companies, error: compError } = await supabase
                .from('companies')
                .select(`
          id, name, slug, payment_status, created_at, admin_phone, preferred_contact_method,
          plan:subscription_plans!plan_id(name, monthly_price)
        `)
                .eq('payment_status', 'pending_payment')
                .order('created_at', { ascending: false });

            if (compError) throw compError;
            setPendingCompanies((companies || []).map((c: any) => ({
                ...c,
                plan: c.plan
            })));

            // Fetch all payment codes (cast to any until types are regenerated)
            const { data: codes, error: codesError } = await (supabase as any)
                .from('payment_codes')
                .select(`
          id, code, company_id, is_activated, activated_at, expires_at, created_at,
          company:companies!company_id(name, admin_phone, preferred_contact_method)
        `)
                .order('created_at', { ascending: false });

            if (codesError) throw codesError;
            setPaymentCodes((codes || []).map((c: any) => ({
                ...c,
                company_name: c.company?.name
            })));

        } catch (err: any) {
            logger.error('Error fetching payment data:', err);
            setError('فشل تحميل البيانات');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const createPaymentCode = async (companyId: string) => {
        setCreating(companyId);
        setError(null);
        setSuccess(null);

        try {
            const code = generatePaymentCode();

            const { error: insertError } = await (supabase as any)
                .from('payment_codes')
                .insert({
                    code,
                    company_id: companyId,
                    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
                });

            if (insertError) throw insertError;

            setSuccess(`تم إنشاء كود الدفع: ${code}`);
            await fetchData();
        } catch (err: any) {
            logger.error('Error creating payment code:', err);
            setError('فشل إنشاء كود الدفع');
        } finally {
            setCreating(null);
        }
    };

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        setSuccess(`تم نسخ الكود: ${code}`);
        setTimeout(() => setSuccess(null), 2000);
    };

    // Helper function to create activation message with deep link
    const createActivationMessage = (code: string, companyName: string) => {
        const activationLink = `${window.location.origin}/payment-instructions?code=${code}`;
        return `السلام عليكم،\n\nشكراً لانضمامكم إلى منصتنا ${companyName}. نتمنى لكم وقتاً ممتعاً!\n\nكود التفعيل هو: ${code}\n\nيمكنكم تفعيل حسابكم مباشرة من خلال الضغط على الرابط:\n${activationLink}`;
    };

    // Get code for a specific company
    const getCompanyCode = (companyId: string) => {
        return paymentCodes.find(pc => pc.company_id === companyId && !pc.is_activated)?.code;
    };

    const cardClasses = "bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700";
    const tabClasses = (active: boolean) => `px-6 py-3 font-bold transition-all ${active
        ? 'bg-emerald-500 text-white rounded-xl'
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl'
        }`;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                        إدارة أكواد الدفع
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        إنشاء وإدارة أكواد تفعيل الشركات
                    </p>
                </div>
                <button
                    onClick={fetchData}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl font-medium transition-all"
                >
                    <Icons.RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    تحديث
                </button>
            </div>

            {/* Alerts */}
            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-center gap-3">
                    <Icons.AlertCircle className="w-5 h-5 text-red-500" />
                    <p className="text-red-700 dark:text-red-300 font-medium">{error}</p>
                </div>
            )}
            {success && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-3">
                    <Icons.CheckCircle className="w-5 h-5 text-emerald-500" />
                    <p className="text-emerald-700 dark:text-emerald-300 font-medium font-mono">{success}</p>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={tabClasses(activeTab === 'pending')}
                >
                    <span className="flex items-center gap-2">
                        <Icons.Clock className="w-4 h-4" />
                        شركات في الانتظار ({pendingCompanies.length})
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab('codes')}
                    className={tabClasses(activeTab === 'codes')}
                >
                    <span className="flex items-center gap-2">
                        <Icons.Key className="w-4 h-4" />
                        أكواد الدفع ({paymentCodes.length})
                    </span>
                </button>
            </div>

            {/* Loading */}
            {loading ? (
                <div className={`${cardClasses} p-12 text-center`}>
                    <Icons.Loader className="w-8 h-8 text-emerald-500 animate-spin mx-auto" />
                    <p className="mt-4 text-slate-500">جاري التحميل...</p>
                </div>
            ) : (
                <>
                    {/* Pending Companies Tab */}
                    {activeTab === 'pending' && (
                        <div className={cardClasses}>
                            {pendingCompanies.length === 0 ? (
                                <div className="p-12 text-center">
                                    <Icons.CheckCircle className="w-16 h-16 text-emerald-200 dark:text-emerald-800 mx-auto" />
                                    <h3 className="mt-4 text-lg font-bold text-slate-700 dark:text-slate-300">
                                        لا توجد شركات في انتظار التفعيل
                                    </h3>
                                    <p className="text-slate-500 text-sm">
                                        جميع الشركات مفعلة حالياً
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                                            <tr>
                                                <th className="text-right p-4 font-bold text-slate-600 dark:text-slate-300">الشركة</th>
                                                <th className="text-right p-4 font-bold text-slate-600 dark:text-slate-300">الباقة</th>
                                                <th className="text-right p-4 font-bold text-slate-600 dark:text-slate-300">رقم الهاتف</th>
                                                <th className="text-right p-4 font-bold text-slate-600 dark:text-slate-300">تاريخ التسجيل</th>
                                                <th className="text-center p-4 font-bold text-slate-600 dark:text-slate-300">إجراءات</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                            {pendingCompanies.map((company: any) => (
                                                <tr key={company.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                                    <td className="p-4">
                                                        <div>
                                                            <p className="font-bold text-slate-900 dark:text-white">{company.name}</p>
                                                            <p className="text-sm text-slate-500 font-mono">{company.slug}.nadfood.com</p>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-sm font-medium">
                                                            {company.plan?.name || 'غير محدد'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        {company.admin_phone ? (
                                                            <div>
                                                                <p className="font-mono text-sm text-slate-900 dark:text-white">+{company.admin_phone}</p>
                                                                <p className="text-xs text-slate-500">
                                                                    {company.preferred_contact_method === 'whatsapp' && '📱 واتساب'}
                                                                    {company.preferred_contact_method === 'sms' && '💬 SMS'}
                                                                    {company.preferred_contact_method === 'call' && '📞 مكالمة'}
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-slate-400">غير متوفر</span>
                                                        )}
                                                    </td>
                                                    <td className="p-4 text-slate-600 dark:text-slate-400">
                                                        {new Date(company.created_at).toLocaleDateString('ar-SA')}
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex flex-col gap-2">
                                                            <button
                                                                onClick={() => createPaymentCode(company.id)}
                                                                disabled={creating === company.id}
                                                                className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/30 disabled:opacity-50 transition-all"
                                                            >
                                                                {creating === company.id ? (
                                                                    <Icons.Loader className="w-4 h-4 animate-spin" />
                                                                ) : (
                                                                    <Icons.Plus className="w-4 h-4" />
                                                                )}
                                                                إنشاء كود
                                                            </button>
                                                            {company.admin_phone && (
                                                                <div className="flex gap-1">
                                                                    <button
                                                                        onClick={() => {
                                                                            const code = getCompanyCode(company.id);
                                                                            const message = code
                                                                                ? createActivationMessage(code, company.name)
                                                                                : 'السلام عليكم، شكراً لانضمامكم إلى منصتنا. سيتم إرسال كود التفعيل قريباً.';
                                                                            window.open(`https://wa.me/${company.admin_phone}?text=${encodeURIComponent(message)}`, '_blank');
                                                                        }}
                                                                        className="flex-1 p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all"
                                                                        title="واتساب"
                                                                    >
                                                                        <Icons.MessageCircle className="w-4 h-4 mx-auto" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            const code = getCompanyCode(company.id);
                                                                            const message = code
                                                                                ? createActivationMessage(code, company.name)
                                                                                : 'السلام عليكم، شكراً لانضمامكم إلى منصتنا.';
                                                                            window.location.href = `sms:+${company.admin_phone}?body=${encodeURIComponent(message)}`;
                                                                        }}
                                                                        className="flex-1 p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all"
                                                                        title="SMS"
                                                                    >
                                                                        <Icons.Mail className="w-4 h-4 mx-auto" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => window.location.href = `tel:+${company.admin_phone}`}
                                                                        className="flex-1 p-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-all"
                                                                        title="اتصال"
                                                                    >
                                                                        <Icons.Phone className="w-4 h-4 mx-auto" />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Payment Codes Tab */}
                    {activeTab === 'codes' && (
                        <div className={cardClasses}>
                            {paymentCodes.length === 0 ? (
                                <div className="p-12 text-center">
                                    <Icons.Key className="w-16 h-16 text-slate-200 dark:text-slate-700 mx-auto" />
                                    <h3 className="mt-4 text-lg font-bold text-slate-700 dark:text-slate-300">
                                        لا توجد أكواد دفع
                                    </h3>
                                    <p className="text-slate-500 text-sm">
                                        قم بإنشاء كود من قائمة الشركات المنتظرة
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                                            <tr>
                                                <th className="text-right p-4 font-bold text-slate-600 dark:text-slate-300">الكود</th>
                                                <th className="text-right p-4 font-bold text-slate-600 dark:text-slate-300">الشركة</th>
                                                <th className="text-center p-4 font-bold text-slate-600 dark:text-slate-300">الحالة</th>
                                                <th className="text-right p-4 font-bold text-slate-600 dark:text-slate-300">تاريخ الإنشاء</th>
                                                <th className="text-center p-4 font-bold text-slate-600 dark:text-slate-300">إجراءات</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                            {paymentCodes.map((code) => (
                                                <tr key={code.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                                    <td className="p-4">
                                                        <code className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg font-mono text-lg font-bold text-slate-900 dark:text-white">
                                                            {code.code}
                                                        </code>
                                                    </td>
                                                    <td className="p-4 text-slate-700 dark:text-slate-300 font-medium">
                                                        {code.company_name || 'غير معروف'}
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        {code.is_activated ? (
                                                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-medium">
                                                                <Icons.CheckCircle className="w-4 h-4" />
                                                                مفعّل
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-sm font-medium">
                                                                <Icons.Clock className="w-4 h-4" />
                                                                في الانتظار
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="p-4 text-slate-600 dark:text-slate-400">
                                                        {new Date(code.created_at).toLocaleDateString('ar-SA')}
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex justify-center">
                                                            <button
                                                                onClick={() => copyCode(code.code)}
                                                                className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-slate-700 dark:text-slate-300 transition-all"
                                                            >
                                                                <Icons.Copy className="w-4 h-4" />
                                                                نسخ
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default PaymentCodes;
