import React, { useState, useMemo } from 'react';
import { Installment, InstallmentPayment } from '../../../types';
import { useAppContext } from '../../../providers/AppContext';
import { Icons } from '../../Icons';
import Button from '../../common/ui/Button';
import Modal from '../../common/ui/Modal';
import FieldValue from '../../common/components/FieldValue';
import Input from '../../common/ui/Input';

interface AdminInstallmentsProps {
  // Empty interface for future props
}

const AdminInstallments: React.FC<AdminInstallmentsProps> = () => {
  const { installments, installmentPayments, addInstallmentPayment, updateInstallment, currentUser, shipments } = useAppContext();
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPaymentAmount, setNewPaymentAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const installmentPaymentsMap = useMemo(() => {
    const map = new Map<string, InstallmentPayment[]>();
    installmentPayments.forEach(payment => {
      if (!map.has(payment.installmentId)) {
        map.set(payment.installmentId, []);
      }
      map.get(payment.installmentId)!.push(payment);
    });
    return map;
  }, [installmentPayments]);

  const handleViewDetails = (installment: Installment) => {
    setSelectedInstallment(installment);
    setIsModalOpen(true);
  };

  const handleAddPayment = async () => {
    if (!selectedInstallment || !newPaymentAmount || !currentUser) return;

    const amount = parseFloat(newPaymentAmount);
    if (amount <= 0 || amount > selectedInstallment.remainingAmount) {
      alert('مبلغ الدفعة غير صالح أو يتجاوز المبلغ المتبقي');
      return;
    }

    setIsSubmitting(true);
    try {
      await addInstallmentPayment({
        installmentId: selectedInstallment.id,
        amount,
        receivedDate: new Date().toISOString().split('T')[0],
        createdBy: currentUser.id,
      });

      // Update remaining amount and status
      const newRemaining = selectedInstallment.remainingAmount - amount;
      const newStatus = newRemaining <= 0 ? 'completed' : 'active';

      await updateInstallment(selectedInstallment.id, {
        remainingAmount: Math.max(0, newRemaining),
        status: newStatus,
        updatedBy: currentUser.id,
      });

      // Update local state for immediate UI feedback
      setSelectedInstallment({
        ...selectedInstallment,
        remainingAmount: Math.max(0, newRemaining),
        status: newStatus,
      });

      setNewPaymentAmount('');
      alert('تم إضافة الدفعة بنجاح');
    } catch (error) {
      console.error('Failed to add payment:', error);
      alert('فشل في إضافة الدفعة');
    } finally {
      setIsSubmitting(false);
    }
  };

  const InstallmentCard: React.FC<{ installment: Installment }> = ({ installment }) => {
    const payments = installmentPaymentsMap.get(installment.id) || [];
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const isDebtCollection = installment.installmentType === 'debt_collection';
    const relatedShipment = shipments.find(s => s.id === installment.shipmentId);

    return (
      <div className={`bg-gradient-to-br from-white via-blue-50 to-indigo-100 dark:from-secondary-800 dark:via-secondary-750 dark:to-secondary-700 shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg overflow-hidden flex flex-col border border-gray-200 dark:border-secondary-600 ${
        isDebtCollection ? 'ring-2 ring-orange-200 dark:ring-orange-800' : ''
      }`}>
        {/* Header */}
        <div className="px-4 py-3 bg-blue-200 dark:bg-blue-800 flex justify-between items-center border-b border-secondary-200 dark:border-secondary-700">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg text-primary-600 dark:text-primary-400">
              {relatedShipment ? `شحنة ${relatedShipment.salesOrder}` : `شحنة #${installment.shipmentId.slice(-8)}`}
            </h3>
            {isDebtCollection && (
              <span className="px-2 py-0.5 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 text-xs font-medium rounded-full">
                تسديد دين
              </span>
            )}
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            installment.status === 'completed'
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
          }`}>
            {installment.status === 'completed' ? 'مكتمل' : 'نشط'}
          </span>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 flex-grow">
          {isDebtCollection && installment.originalAmount !== undefined && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
              <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                المبلغ الأصلي (سالب): {installment.originalAmount.toLocaleString()} ر.ي
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center">
              <Icons.DollarSign className="h-5 w-5 text-secondary-500 ml-2 flex-shrink-0" />
              <div>
                <p className="text-secondary-500 text-xs">المبلغ المستحق</p>
                <p className="font-semibold">{installment.payableAmount.toLocaleString()} ر.ي</p>
              </div>
            </div>
            <div className="flex items-center">
              <Icons.Truck className="h-5 w-5 text-secondary-500 ml-2 flex-shrink-0" />
              <div>
                <p className="text-secondary-500 text-xs">المبلغ المتبقي</p>
                <p className="font-semibold">{installment.remainingAmount.toLocaleString()} ر.ي</p>
              </div>
            </div>
            <div className="flex items-center col-span-full">
              <Icons.CheckCircle className="h-5 w-5 text-secondary-500 ml-2 flex-shrink-0" />
              <div>
                <p className="text-secondary-500 text-xs">المدفوع</p>
                <p className="font-semibold">{totalPaid.toLocaleString()} ر.ي</p>
              </div>
            </div>
          </div>

          {payments.length > 0 && (
            <div className="pt-3 border-t border-dashed border-secondary-200 dark:border-secondary-700">
              <p className="text-sm font-semibold mb-2">آخر المدفوعات:</p>
              <div className="space-y-1 text-sm max-h-20 overflow-y-auto">
                {payments.slice(-3).map((payment, index) => (
                  <div key={payment.id} className="flex justify-between items-center text-secondary-700 dark:text-secondary-300 bg-secondary-50 dark:bg-secondary-800/50 px-2 py-1 rounded">
                    <span>{new Date(payment.receivedDate).toLocaleDateString('ar-EG')}</span>
                    <span className="font-mono bg-secondary-100 dark:bg-secondary-700 px-2 py-0.5 rounded text-xs">
                      {payment.amount.toLocaleString()} ر.ي
                    </span>
                  </div>
                ))}
                {payments.length > 3 && (
                  <p className="text-xs text-secondary-500 text-center">+{payments.length - 3} مدفوعات أخرى</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-100 dark:from-secondary-800/50 dark:to-secondary-700/50 flex justify-between items-center border-t border-secondary-200 dark:border-secondary-700 mt-auto">
          <div>
            <p className="text-xs text-secondary-500">نسبة الإنجاز</p>
            <p className="font-bold text-lg text-purple-600">
              {installment.payableAmount > 0 ? Math.round(((totalPaid / installment.payableAmount) * 100)) : 100}%
            </p>
          </div>
          <Button
            variant={isDebtCollection ? "warning" : "primary"}
            size="sm"
            onClick={() => handleViewDetails(installment)}
            className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Icons.Eye className="ml-1 h-3 w-3" />
            عرض التفاصيل
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">التسديدات</h2>
        <p className="text-sm text-secondary-600 dark:text-secondary-400">
          إدارة التسديدات والمدفوعات للشحنات
        </p>
      </div>

      {installments.length === 0 ? (
        <div className="text-center py-12">
          <Icons.DollarSign className="h-16 w-16 text-secondary-300 dark:text-secondary-600 mx-auto mb-4" />
          <p className="text-lg font-medium text-secondary-500 dark:text-secondary-400">
            لا توجد تسديدات حالياً
          </p>
          <p className="text-sm text-secondary-400 dark:text-secondary-500 mt-2">
            الشحنات ذات المبالغ السالبة ستظهر هنا بعد ترحيلها للتسديدات
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {installments.map(installment => (
            <InstallmentCard key={installment.id} installment={installment} />
          ))}
        </div>
      )}

      {/* Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`تفاصيل التسديد - شحنة ${selectedInstallment?.shipmentId.slice(-8)}`}
        size="xl"
      >
        {selectedInstallment && (
          <div className="space-y-6">
            {/* Installment Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-secondary-800 dark:to-secondary-700 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-secondary-600 dark:text-secondary-400">المبلغ المستحق</p>
                  <p className="text-2xl font-bold text-primary-600">{selectedInstallment.payableAmount.toLocaleString()} ر.ي</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-secondary-600 dark:text-secondary-400">المبلغ المتبقي</p>
                  <p className="text-2xl font-bold text-orange-600">{selectedInstallment.remainingAmount.toLocaleString()} ر.ي</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-secondary-600 dark:text-secondary-400">نسبة الإنجاز</p>
                  <p className="text-2xl font-bold text-green-600">
                    {selectedInstallment.payableAmount > 0 ? Math.round((((selectedInstallment.payableAmount - selectedInstallment.remainingAmount) / selectedInstallment.payableAmount) * 100)) : 100}%
                  </p>
                </div>
              </div>

              {selectedInstallment.installmentType === 'debt_collection' && selectedInstallment.originalAmount !== undefined && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  <p className="text-sm text-red-800 dark:text-red-200 font-medium text-center">
                    هذا التسديد ناتج عن شحنة بمبلغ أصلي سالب: {selectedInstallment.originalAmount.toLocaleString()} ر.ي
                  </p>
                </div>
              )}
            </div>

            {/* Payment History */}
            <div>
              <h4 className="font-semibold mb-4 flex items-center">
                <Icons.CheckCircle className="ml-2 h-5 w-5 text-green-600" />
                سجل المدفوعات
              </h4>
              {installmentPaymentsMap.get(selectedInstallment.id)?.length ? (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {installmentPaymentsMap.get(selectedInstallment.id)!.map((payment, index) => {
                    // Calculate running total
                    const allPayments = installmentPaymentsMap.get(selectedInstallment.id)!;
                    const runningTotal = allPayments.slice(0, index + 1).reduce((sum, p) => sum + p.amount, 0);

                    return (
                      <div key={payment.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-secondary-50 to-secondary-100 dark:from-secondary-800 dark:to-secondary-700 rounded-lg border border-secondary-200 dark:border-secondary-600">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                            <Icons.CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <p className="font-semibold text-lg">{payment.amount.toLocaleString()} ر.ي</p>
                            <p className="text-sm text-secondary-600 dark:text-secondary-400">
                              {new Date(payment.receivedDate).toLocaleDateString('ar-EG', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="text-left">
                          <p className="text-sm text-secondary-500">المجموع التراكمي</p>
                          <p className="font-bold text-primary-600">{runningTotal.toLocaleString()} ر.ي</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Icons.DollarSign className="h-12 w-12 text-secondary-300 dark:text-secondary-600 mx-auto mb-3" />
                  <p className="text-secondary-500">لا توجد مدفوعات مسجلة لهذا التسديد</p>
                </div>
              )}
            </div>

            {/* Add Payment Section */}
            {selectedInstallment.remainingAmount > 0 && selectedInstallment.status !== 'completed' && (
              <div className="border-t border-secondary-200 dark:border-secondary-600 pt-6">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4">
                  <h4 className="font-semibold mb-3 flex items-center">
                    <Icons.Plus className="ml-2 h-5 w-5 text-green-600" />
                    إضافة دفعة جديدة
                  </h4>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <Input
                        type="number"
                        placeholder={`المبلغ (حد أقصى: ${selectedInstallment.remainingAmount.toLocaleString()} ر.ي)`}
                        value={newPaymentAmount}
                        onChange={(e) => setNewPaymentAmount(e.target.value)}
                        min="0.01"
                        max={selectedInstallment.remainingAmount.toString()}
                        step="0.01"
                        className="w-full"
                      />
                    </div>
                    <Button
                      variant="primary"
                      onClick={handleAddPayment}
                      disabled={!newPaymentAmount || isSubmitting}
                      className="px-6"
                    >
                      {isSubmitting ? (
                        <>
                          <Icons.RefreshCw className="ml-2 h-4 w-4 animate-spin" />
                          جاري الحفظ...
                        </>
                      ) : (
                        <>
                          <Icons.Plus className="ml-2 h-4 w-4" />
                          إضافة الدفعة
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-secondary-500 mt-2">
                    سيتم تسجيل تاريخ اليوم تلقائياً كتاريخ استلام الدفعة
                  </p>
                </div>
              </div>
            )}

            {/* Completion Notice */}
            {selectedInstallment.status === 'completed' && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Icons.CheckCircle className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-800 dark:text-green-200">تم إكمال التسديد</p>
                    <p className="text-sm text-green-600 dark:text-green-300">
                      تم سداد المبلغ المستحق بالكامل
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminInstallments;