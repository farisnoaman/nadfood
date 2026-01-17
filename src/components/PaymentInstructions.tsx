import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { Icons } from './Icons';
import logger from '../utils/logger';

const ADMIN_PHONE = '00967735168359';
const BANK_ACCOUNT = '123456789';

const PaymentInstructions: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [paymentCode, setPaymentCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Auto-fill code from URL parameter
    useEffect(() => {
        const codeFromUrl = searchParams.get('code');
        if (codeFromUrl) {
            setPaymentCode(codeFromUrl.toUpperCase());
        }
    }, [searchParams]);

    const handleWhatsApp = () => {
        window.open(`https://wa.me/${ADMIN_PHONE}`, '_blank');
    };

    const handleSMS = () => {
        window.location.href = `sms:${ADMIN_PHONE}`;
    };

    const copyPhone = () => {
        navigator.clipboard.writeText(ADMIN_PHONE);
    };

    const handleActivate = async () => {
        if (!paymentCode || paymentCode.length !== 12) {
            setError('يرجى إدخال كود الدفع المكون من 12 حرف');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { data, error: activationError } = await supabase.functions.invoke('activate-payment', {
                body: { code: paymentCode }
            });

            // Check for function invocation error
            if (activationError) {
                logger.error('Function invocation error:', activationError);

                // Try to extract error message from response
                let errorMessage = 'كود الدفع غير صالح';
                if (activationError.context?.body) {
                    try {
                        const errorBody = await activationError.context.body;
                        errorMessage = errorBody?.error || errorMessage;
                    } catch {
                        // If parsing fails, use default message
                    }
                }
                throw new Error(errorMessage);
            }

            // Check for error in response data
            if (data?.error) {
                throw new Error(data.error);
            }

            // Check for success
            if (data?.success) {
                setSuccess(true);
                // Wait 2 seconds then redirect to dashboard
                setTimeout(() => {
                    window.location.href = '/'; // Navigate to dashboard root
                }, 2000);
            } else {
                throw new Error('كود الدفع غير صالح');
            }
        } catch (err: any) {
            logger.error('Error activating payment:', err);
            setError(err.message || 'كود الدفع غير صالح. يرجى التأكد من إدخال نفس الكود الذي شاركته مع الإدارة، والانتظار 30 دقيقة بعد المشاركة.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-100 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/20 flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 text-center">
                    <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Icons.CheckCircle className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-3">
                        🎉 مبروك!
                    </h1>
                    <p className="text-slate-600 dark:text-slate-300 mb-6">
                        تم تفعيل حسابك بنجاح. استمتع بإدارة شحناتك بدون أي صداع!
                    </p>
                    <div className="text-sm text-slate-500">
                        جاري تحميل لوحة التحكم...
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/20 py-12 px-4">
            {/* Background Elements */}
            <div className="fixed top-1/4 -right-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="fixed bottom-1/4 -left-20 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-2xl mx-auto relative z-10">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Icons.Truck className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-2">
                        مرحباً بك في <span className="text-emerald-500">نادفود</span>!
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-300">
                        أكمل عملية الدفع لتفعيل حسابك
                    </p>
                </div>

                {/* Main Card */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
                    {/* Steps */}
                    <div className="p-8 space-y-8">
                        {/* Step 1: Make Payment */}
                        <div className="relative">
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold">
                                    1
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                                        قم بالدفع
                                    </h3>
                                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-6 mb-4">
                                        <div className="text-center mb-4">
                                            <div className="inline-block bg-white p-4 rounded-2xl shadow-lg mb-3">
                                                {/* QR Code Placeholder */}
                                                <div className="w-48 h-48 bg-slate-200 dark:bg-slate-600 rounded-xl flex items-center justify-center">
                                                    <Icons.QrCode className="w-24 h-24 text-slate-400" />
                                                </div>
                                            </div>
                                            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                                                امسح الكود ضوئياً أو استخدم رقم الحساب
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600">
                                            <Icons.CreditCard className="w-5 h-5 text-emerald-600" />
                                            <span className="font-mono text-lg font-bold text-slate-900 dark:text-white">
                                                {BANK_ACCOUNT}
                                            </span>
                                        </div>
                                        <p className="text-center text-sm text-slate-500 mt-2">
                                            بنك الكريمي - Al Kuraimi Bank
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Step 2: Get Payment Code */}
                        <div className="relative">
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold">
                                    2
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                                        احصل على كود الدفع
                                    </h3>
                                    <p className="text-slate-600 dark:text-slate-300">
                                        احفظ الكود المكون من 12 حرف من إيصال البنك
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Step 3: Share with Admin */}
                        <div className="relative">
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold">
                                    3
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                                        شارك الكود مع الإدارة
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <button
                                            onClick={handleWhatsApp}
                                            className="flex items-center justify-center gap-2 p-4 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-bold transition-all hover:-translate-y-0.5 shadow-lg"
                                        >
                                            <Icons.MessageCircle className="w-5 h-5" />
                                            WhatsApp
                                        </button>
                                        <button
                                            onClick={handleSMS}
                                            className="flex items-center justify-center gap-2 p-4 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl font-bold transition-all hover:-translate-y-0.5 shadow-lg"
                                        >
                                            <Icons.Mail className="w-5 h-5" />
                                            SMS
                                        </button>
                                    </div>
                                    <button
                                        onClick={copyPhone}
                                        className="w-full flex items-center justify-center gap-2 p-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl text-slate-900 dark:text-white font-mono transition-all"
                                    >
                                        <Icons.Phone className="w-4 h-4" />
                                        {ADMIN_PHONE}
                                        <Icons.Copy className="w-4 h-4" />
                                    </button>
                                    <p className="text-sm text-amber-600 dark:text-amber-400 mt-3 flex items-center gap-2">
                                        <Icons.Clock className="w-4 h-4" />
                                        انتظر ~30 دقيقة بعد مشاركة الكود
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Step 4: Enter Code */}
                        <div className="relative">
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold">
                                    4
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                                        أدخل كود الدفع
                                    </h3>
                                    <div className="space-y-3">
                                        <input
                                            type="text"
                                            value={paymentCode}
                                            onChange={(e) => setPaymentCode(e.target.value.toUpperCase())}
                                            className="w-full px-5 py-4 rounded-2xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-mono text-center text-lg tracking-widest"
                                            placeholder="AB1234567890"
                                            maxLength={12}
                                            dir="ltr"
                                        />
                                        {error && (
                                            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-start gap-3">
                                                <Icons.AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                                <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
                                            </div>
                                        )}
                                        <button
                                            onClick={handleActivate}
                                            disabled={loading || paymentCode.length !== 12}
                                            className="w-full px-8 py-4 bg-emerald-500 text-white rounded-2xl font-black text-lg hover:bg-emerald-600 shadow-xl shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                                        >
                                            {loading ? (
                                                <>
                                                    <Icons.Loader className="w-6 h-6 animate-spin" />
                                                    جاري التفعيل...
                                                </>
                                            ) : (
                                                <>
                                                    <Icons.CheckCircle className="w-6 h-6" />
                                                    تفعيل الحساب
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Help Notice */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        تواجه مشكلة؟ تواصل معنا على{' '}
                        <button onClick={handleWhatsApp} className="text-emerald-600 hover:text-emerald-700 font-bold">
                            WhatsApp
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PaymentInstructions;
