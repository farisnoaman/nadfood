import React, { useState, useEffect, useCallback } from 'react';
import Card from '../../../common/display/Card';
import Button from '../../../common/ui/Button';
import Input from '../../../common/ui/Input';
import { Icons } from '../../../Icons';
import { useAppContext } from '../../../../providers/AppContext';
import { subscriptionService } from '../../../../providers/app/services/subscriptionService';
import { SubscriptionPlan, SubscriptionRequest } from '../../../../types';
import logger from '../../../../utils/logger';

const SubscriptionSettings: React.FC = () => {
    const { company, currentUser, fetchCompany } = useAppContext();

    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [requests, setRequests] = useState<SubscriptionRequest[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showRequestModal, setShowRequestModal] = useState(false);

    // Request form state
    const [selectedPlanId, setSelectedPlanId] = useState('');
    const [paymentReference, setPaymentReference] = useState('');
    const [requestType, setRequestType] = useState<'renewal' | 'upgrade'>('renewal');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Load plans and requests
    const loadData = useCallback(async () => {
        if (!company?.id) return;
        setIsLoading(true);
        try {
            const [plansData, requestsData] = await Promise.all([
                subscriptionService.fetchPlans(),
                subscriptionService.fetchRequestsByCompany(company.id),
            ]);
            setPlans(plansData);
            setRequests(requestsData);
        } catch (error) {
            logger.error('Error loading subscription data:', error);
        } finally {
            setIsLoading(false);
        }
    }, [company?.id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Calculate days until expiry
    const daysUntilExpiry = company?.subscriptionEndDate
        ? Math.ceil((new Date(company.subscriptionEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null;

    const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 5 && daysUntilExpiry > 0;
    const isExpired = daysUntilExpiry !== null && daysUntilExpiry <= 0;

    // Submit request
    const handleSubmitRequest = async () => {
        if (!company?.id || !selectedPlanId || !paymentReference.trim()) {
            alert('يرجى تعبئة جميع الحقول المطلوبة');
            return;
        }

        setIsSubmitting(true);
        try {
            await subscriptionService.createRequest(
                company.id,
                selectedPlanId,
                paymentReference.trim(),
                requestType
            );
            alert('تم إرسال طلب الاشتراك بنجاح! سيتم مراجعته من قبل مدير المنصة.');
            setShowRequestModal(false);
            setPaymentReference('');
            setSelectedPlanId('');
            await loadData();
        } catch (error) {
            logger.error('Error submitting subscription request:', error);
            alert('حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Get current plan name
    const currentPlanName = plans.find(p => p.id === company?.planId)?.name || company?.subscriptionPlan || 'غير محدد';

    // Format date
    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    // Status badge
    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
            approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
            rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
            active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
            suspended: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
            expired: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
        };
        const labels: Record<string, string> = {
            pending: 'قيد المراجعة',
            approved: 'مقبول',
            rejected: 'مرفوض',
            active: 'نشط',
            suspended: 'موقوف',
            expired: 'منتهي',
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
                {labels[status] || status}
            </span>
        );
    };

    if (isLoading && !company) {
        return (
            <div className="flex justify-center items-center py-8">
                <Icons.RefreshCw className="h-6 w-6 animate-spin text-primary-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Expiry Warning */}
            {(isExpiringSoon || isExpired) && (
                <div className={`p-4 rounded-lg border ${isExpired ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'}`}>
                    <div className="flex items-center gap-3">
                        <Icons.AlertTriangle className={`h-6 w-6 ${isExpired ? 'text-red-500' : 'text-yellow-500'}`} />
                        <div>
                            <h4 className={`font-semibold ${isExpired ? 'text-red-800 dark:text-red-200' : 'text-yellow-800 dark:text-yellow-200'}`}>
                                {isExpired ? 'انتهى الاشتراك!' : 'اشتراكك على وشك الانتهاء'}
                            </h4>
                            <p className={`text-sm ${isExpired ? 'text-red-600 dark:text-red-300' : 'text-yellow-600 dark:text-yellow-300'}`}>
                                {isExpired
                                    ? 'يرجى تجديد اشتراكك للاستمرار في استخدام النظام.'
                                    : `سينتهي اشتراكك خلال ${daysUntilExpiry} ${daysUntilExpiry === 1 ? 'يوم' : 'أيام'}. يرجى التجديد قبل انتهاء الصلاحية.`}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Current Subscription */}
            <Card title="تفاصيل الاشتراك الحالي">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-secondary-200 dark:border-secondary-700">
                            <span className="text-secondary-600 dark:text-secondary-400">الباقة</span>
                            <span className="font-semibold text-secondary-800 dark:text-secondary-200">{currentPlanName}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-secondary-200 dark:border-secondary-700">
                            <span className="text-secondary-600 dark:text-secondary-400">الحالة</span>
                            {getStatusBadge(company?.subscriptionStatus || 'active')}
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-secondary-200 dark:border-secondary-700">
                            <span className="text-secondary-600 dark:text-secondary-400">تاريخ البداية</span>
                            <span className="text-secondary-800 dark:text-secondary-200">{formatDate(company?.subscriptionStartDate)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-secondary-200 dark:border-secondary-700">
                            <span className="text-secondary-600 dark:text-secondary-400">تاريخ الانتهاء</span>
                            <span className={`font-semibold ${isExpiringSoon || isExpired ? 'text-red-600 dark:text-red-400' : 'text-secondary-800 dark:text-secondary-200'}`}>
                                {formatDate(company?.subscriptionEndDate)}
                            </span>
                        </div>
                    </div>

                    {/* Usage Limits */}
                    <div className="space-y-3">
                        <h4 className="font-semibold text-secondary-700 dark:text-secondary-300 mb-2">حدود الاستخدام</h4>
                        {company?.usageLimits && company?.currentUsage && (
                            <>
                                <UsageBar label="المستخدمين" current={company.currentUsage.users} max={company.usageLimits.maxUsers} />
                                <UsageBar label="السائقين" current={company.currentUsage.drivers} max={company.usageLimits.maxDrivers} />
                                <UsageBar label="المنتجات" current={company.currentUsage.products} max={company.usageLimits.maxProducts} />
                                <UsageBar label="المناطق" current={company.currentUsage.regions} max={company.usageLimits.maxRegions} />
                            </>
                        )}
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <Button onClick={() => setShowRequestModal(true)}>
                        <Icons.ArrowUp className="ml-2 h-4 w-4" />
                        تجديد أو ترقية الاشتراك
                    </Button>
                </div>
            </Card>

            {/* Request History */}
            <Card title="سجل طلبات الاشتراك">
                {requests.length === 0 ? (
                    <p className="text-secondary-500 dark:text-secondary-400 text-center py-4">لا توجد طلبات سابقة</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-secondary-200 dark:border-secondary-700">
                                    <th className="text-right py-2 px-3">التاريخ</th>
                                    <th className="text-right py-2 px-3">الباقة</th>
                                    <th className="text-right py-2 px-3">نوع الطلب</th>
                                    <th className="text-right py-2 px-3">الفترة (للمقبولة)</th>
                                    <th className="text-right py-2 px-3">ملاحظات</th>
                                    <th className="text-right py-2 px-3">الحالة</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.map(req => (
                                    <tr key={req.id} className="border-b border-secondary-100 dark:border-secondary-800">
                                        <td className="py-2 px-3 text-secondary-500">{formatDate(req.createdAt)}</td>
                                        <td className="py-2 px-3">{req.requestedPlanName || '-'}</td>
                                        <td className="py-2 px-3">
                                            <span className={`px-2 py-0.5 rounded text-xs ${req.requestType === 'upgrade' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'}`}>
                                                {req.requestType === 'renewal' ? 'تجديد' : 'ترقية'}
                                            </span>
                                        </td>
                                        <td className="py-2 px-3 text-sm">
                                            {req.effectiveStartDate && req.effectiveEndDate ? (
                                                <span className="text-green-700 dark:text-green-400">
                                                    {new Date(req.effectiveStartDate).toLocaleDateString('ar-EG')} - {new Date(req.effectiveEndDate).toLocaleDateString('ar-EG')}
                                                </span>
                                            ) : (
                                                <span className="text-secondary-400">-</span>
                                            )}
                                        </td>
                                        <td className="py-2 px-3 text-sm max-w-xs truncate text-secondary-600 dark:text-secondary-400" title={req.adminNotes}>
                                            {req.adminNotes || '-'}
                                        </td>
                                        <td className="py-2 px-3">{getStatusBadge(req.status)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Request Modal */}
            {showRequestModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-xl max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-secondary-800 dark:text-secondary-200">
                                طلب تجديد أو ترقية
                            </h3>
                            <button onClick={() => setShowRequestModal(false)} className="text-secondary-400 hover:text-secondary-600">
                                <Icons.X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Request Type */}
                            <div>
                                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                                    نوع الطلب
                                </label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="requestType"
                                            value="renewal"
                                            checked={requestType === 'renewal'}
                                            onChange={() => setRequestType('renewal')}
                                            className="text-primary-600"
                                        />
                                        <span className="text-secondary-700 dark:text-secondary-300">تجديد</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="requestType"
                                            value="upgrade"
                                            checked={requestType === 'upgrade'}
                                            onChange={() => setRequestType('upgrade')}
                                            className="text-primary-600"
                                        />
                                        <span className="text-secondary-700 dark:text-secondary-300">ترقية</span>
                                    </label>
                                </div>
                            </div>

                            {/* Plan Selection */}
                            <div>
                                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                                    الباقة المطلوبة
                                </label>
                                <select
                                    value={selectedPlanId}
                                    onChange={(e) => setSelectedPlanId(e.target.value)}
                                    className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md bg-white dark:bg-secondary-700 text-secondary-800 dark:text-secondary-200"
                                >
                                    <option value="">اختر الباقة</option>
                                    {plans.map(plan => (
                                        <option key={plan.id} value={plan.id}>
                                            {plan.name} - {plan.monthlyPrice} ر.س/شهر
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Payment Reference */}
                            <Input
                                label="رمز الدفع / رقم الحوالة"
                                value={paymentReference}
                                onChange={(e) => setPaymentReference(e.target.value)}
                                placeholder="أدخل رقم الحوالة أو رمز الدفع"
                            />

                            <p className="text-xs text-secondary-500 dark:text-secondary-400">
                                بعد إرسال الطلب، سيتم مراجعته من قبل مدير المنصة وتفعيل الاشتراك تلقائياً عند القبول.
                            </p>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <Button variant="secondary" onClick={() => setShowRequestModal(false)}>
                                إلغاء
                            </Button>
                            <Button onClick={handleSubmitRequest} disabled={isSubmitting || !selectedPlanId || !paymentReference.trim()}>
                                {isSubmitting ? (
                                    <>
                                        <Icons.RefreshCw className="ml-2 h-4 w-4 animate-spin" />
                                        جاري الإرسال...
                                    </>
                                ) : (
                                    <>
                                        <Icons.Send className="ml-2 h-4 w-4" />
                                        إرسال الطلب
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Usage bar component
const UsageBar: React.FC<{ label: string; current: number; max: number }> = ({ label, current, max }) => {
    const percentage = max > 0 ? Math.min((current / max) * 100, 100) : 0;
    const isNearLimit = percentage >= 80;
    const isAtLimit = percentage >= 100;

    return (
        <div>
            <div className="flex justify-between text-xs mb-1">
                <span className="text-secondary-600 dark:text-secondary-400">{label}</span>
                <span className={`font-medium ${isAtLimit ? 'text-red-600' : isNearLimit ? 'text-yellow-600' : 'text-secondary-600 dark:text-secondary-400'}`}>
                    {current} / {max}
                </span>
            </div>
            <div className="h-2 bg-secondary-200 dark:bg-secondary-700 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all ${isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-yellow-500' : 'bg-primary-500'}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
};

export default SubscriptionSettings;
