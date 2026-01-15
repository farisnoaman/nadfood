import React, { useState, useEffect, useCallback } from 'react';
import Card from '../../common/display/Card';
import Button from '../../common/ui/Button';
import { Icons } from '../../Icons';
import { subscriptionService } from '../../../providers/app/services/subscriptionService';
import { SubscriptionRequest } from '../../../types';
import logger from '../../../utils/logger';

const SubscriptionRequestsManager: React.FC = () => {
    const [requests, setRequests] = useState<SubscriptionRequest[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const loadRequests = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await subscriptionService.fetchAllPendingRequests();
            setRequests(data);
        } catch (error) {
            logger.error('Error loading subscription requests:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadRequests();
    }, [loadRequests]);

    const handleApprove = async (requestId: string) => {
        if (!confirm('هل أنت متأكد من الموافقة على هذا الطلب؟ سيتم تفعيل الاشتراك تلقائياً.')) return;

        setProcessingId(requestId);
        try {
            await subscriptionService.approveRequest(requestId);
            alert('تم الموافقة على الطلب وتفعيل الاشتراك بنجاح!');
            await loadRequests();
        } catch (error) {
            logger.error('Error approving request:', error);
            alert('حدث خطأ أثناء الموافقة على الطلب.');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (requestId: string) => {
        const reason = prompt('يرجى إدخال سبب الرفض (اختياري):');

        setProcessingId(requestId);
        try {
            await subscriptionService.rejectRequest(requestId, reason || undefined);
            alert('تم رفض الطلب.');
            await loadRequests();
        } catch (error) {
            logger.error('Error rejecting request:', error);
            alert('حدث خطأ أثناء رفض الطلب.');
        } finally {
            setProcessingId(null);
        }
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <Card title="طلبات الاشتراك المعلقة">
            <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-secondary-600 dark:text-secondary-400">
                    طلبات التجديد والترقية في انتظار الموافقة
                </p>
                <Button variant="secondary" size="sm" onClick={loadRequests} disabled={isLoading}>
                    <Icons.RefreshCw className={`ml-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    تحديث
                </Button>
            </div>

            {isLoading && requests.length === 0 ? (
                <div className="flex justify-center py-8">
                    <Icons.RefreshCw className="h-6 w-6 animate-spin text-primary-500" />
                </div>
            ) : requests.length === 0 ? (
                <div className="text-center py-8 text-secondary-500 dark:text-secondary-400">
                    <Icons.Check className="h-12 w-12 mx-auto mb-2 text-green-500" />
                    <p>لا توجد طلبات معلقة</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-secondary-200 dark:border-secondary-700">
                                <th className="text-right py-3 px-3 font-semibold">الشركة</th>
                                <th className="text-right py-3 px-3 font-semibold">الباقة المطلوبة</th>
                                <th className="text-right py-3 px-3 font-semibold">نوع الطلب</th>
                                <th className="text-right py-3 px-3 font-semibold">رمز الدفع</th>
                                <th className="text-right py-3 px-3 font-semibold">التاريخ</th>
                                <th className="text-right py-3 px-3 font-semibold">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.map(req => (
                                <tr key={req.id} className="border-b border-secondary-100 dark:border-secondary-800 hover:bg-secondary-50 dark:hover:bg-secondary-800/50">
                                    <td className="py-3 px-3 font-medium">{req.companyName || '-'}</td>
                                    <td className="py-3 px-3">{req.requestedPlanName || '-'}</td>
                                    <td className="py-3 px-3">
                                        <span className={`px-2 py-1 rounded-full text-xs ${req.requestType === 'upgrade'
                                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                                : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                            }`}>
                                            {req.requestType === 'renewal' ? 'تجديد' : 'ترقية'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-3 font-mono text-xs bg-secondary-100 dark:bg-secondary-800 rounded">
                                        {req.paymentReference}
                                    </td>
                                    <td className="py-3 px-3 text-xs text-secondary-500">{formatDate(req.createdAt)}</td>
                                    <td className="py-3 px-3">
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                onClick={() => handleApprove(req.id)}
                                                disabled={processingId === req.id}
                                                className="bg-green-600 hover:bg-green-700"
                                            >
                                                {processingId === req.id ? (
                                                    <Icons.RefreshCw className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <>
                                                        <Icons.Check className="ml-1 h-4 w-4" />
                                                        موافقة
                                                    </>
                                                )}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={() => handleReject(req.id)}
                                                disabled={processingId === req.id}
                                                className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                                            >
                                                <Icons.X className="ml-1 h-4 w-4" />
                                                رفض
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </Card>
    );
};

export default SubscriptionRequestsManager;
