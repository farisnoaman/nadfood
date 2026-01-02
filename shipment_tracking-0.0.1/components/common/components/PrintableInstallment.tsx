import React from 'react';
import { Installment, InstallmentPayment, Shipment } from '../../../types';

interface PrintableInstallmentProps {
    installment: Installment;
    payments: InstallmentPayment[];
    shipment?: Shipment;
    driverName: string;
    companyName: string;
    companyAddress: string;
    companyPhone: string;
    companyLogo: string;
    isPrintHeaderEnabled: boolean;
    printedBy: string;
    printTimestamp: string;
}

const PrintableInstallment: React.FC<PrintableInstallmentProps> = ({
    installment,
    payments,
    shipment,
    driverName,
    companyName,
    companyAddress,
    companyPhone,
    companyLogo,
    isPrintHeaderEnabled,
    printedBy,
    printTimestamp,
}) => {
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const isDebtCollection = installment.installmentType === 'debt_collection';
    const completionPercentage = installment.payableAmount > 0
        ? Math.round((totalPaid / installment.payableAmount) * 100)
        : 100;

    return (
        <div className="print-container" style={{ fontFamily: 'Arial, sans-serif', direction: 'rtl', padding: '15px', backgroundColor: '#f9f9f9' }}>
            {isPrintHeaderEnabled && (
                <header style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    alignItems: 'center',
                    marginBottom: '15px',
                    borderBottom: '3px solid #007bff',
                    paddingBottom: '8px',
                    background: '#e3f2fd',
                    borderRadius: '8px',
                    padding: '10px'
                }}>
                    <div style={{ textAlign: 'right' }}>
                        <h1 style={{ margin: '3px 0', fontSize: '18px', fontWeight: 'bold', color: '#007bff' }}>{companyName}</h1>
                        <p style={{ margin: '2px 0', fontSize: '12px', color: '#555' }}>{companyAddress}</p>
                        <p style={{ margin: '2px 0', fontSize: '12px', color: '#555' }}>{companyPhone}</p>
                    </div>
                    <div style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        {companyLogo && (
                            <img src={companyLogo} alt={companyName} crossOrigin="anonymous" style={{ height: '80px', width: 'auto', objectFit: 'contain' }} />
                        )}
                    </div>
                    <div style={{ textAlign: 'left' }}></div>
                </header>
            )}

            {/* Title */}
            <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: isDebtCollection ? '#dc3545' : '#007bff', margin: '0' }}>
                    {isDebtCollection ? 'كشف تسديد دين' : 'كشف تسديد'}
                </h2>
                {shipment && (
                    <p style={{ fontSize: '14px', color: '#666', margin: '5px 0' }}>
                        أمر البيع: {shipment.salesOrder}
                    </p>
                )}
            </div>

            {/* Installment Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div style={{ background: '#f8f9fa', padding: '10px', borderRadius: '6px', border: '1px solid #e9ecef' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', borderBottom: '2px solid #007bff', paddingBottom: '3px', color: '#007bff' }}>ملخص التسديد</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                        <tbody>
                            <tr style={{ borderBottom: '1px solid #dee2e6' }}>
                                <td style={{ padding: '5px', fontWeight: 'bold' }}>المبلغ المستحق:</td>
                                <td style={{ padding: '5px', textAlign: 'left' }}>{installment.payableAmount.toLocaleString()} ر.ي</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid #dee2e6' }}>
                                <td style={{ padding: '5px', fontWeight: 'bold' }}>المبلغ المدفوع:</td>
                                <td style={{ padding: '5px', textAlign: 'left', color: '#28a745' }}>{totalPaid.toLocaleString()} ر.ي</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid #dee2e6' }}>
                                <td style={{ padding: '5px', fontWeight: 'bold' }}>المبلغ المتبقي:</td>
                                <td style={{ padding: '5px', textAlign: 'left', color: installment.remainingAmount > 0 ? '#dc3545' : '#28a745' }}>
                                    {installment.remainingAmount.toLocaleString()} ر.ي
                                </td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid #dee2e6' }}>
                                <td style={{ padding: '5px', fontWeight: 'bold' }}>نسبة الإنجاز:</td>
                                <td style={{ padding: '5px', textAlign: 'left' }}>{completionPercentage}%</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '5px', fontWeight: 'bold' }}>الحالة:</td>
                                <td style={{ padding: '5px', textAlign: 'left' }}>
                                    <span style={{
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        fontSize: '11px',
                                        backgroundColor: installment.status === 'completed' ? '#d4edda' : '#fff3cd',
                                        color: installment.status === 'completed' ? '#155724' : '#856404'
                                    }}>
                                        {installment.status === 'completed' ? 'مكتمل' : 'نشط'}
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Shipment Info */}
                <div style={{ background: '#f8f9fa', padding: '10px', borderRadius: '6px', border: '1px solid #e9ecef' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', borderBottom: '2px solid #007bff', paddingBottom: '3px', color: '#007bff' }}>معلومات الشحنة</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                        <tbody>
                            <tr style={{ borderBottom: '1px solid #dee2e6' }}>
                                <td style={{ padding: '5px', fontWeight: 'bold' }}>أمر البيع:</td>
                                <td style={{ padding: '5px', textAlign: 'left' }}>{shipment?.salesOrder || '-'}</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid #dee2e6' }}>
                                <td style={{ padding: '5px', fontWeight: 'bold' }}>السائق:</td>
                                <td style={{ padding: '5px', textAlign: 'left' }}>{driverName}</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid #dee2e6' }}>
                                <td style={{ padding: '5px', fontWeight: 'bold' }}>تاريخ الإنشاء:</td>
                                <td style={{ padding: '5px', textAlign: 'left' }}>{new Date(installment.createdAt).toLocaleDateString('ar-EG')}</td>
                            </tr>
                            {isDebtCollection && installment.originalAmount !== undefined && (
                                <tr style={{ backgroundColor: '#f8d7da' }}>
                                    <td style={{ padding: '5px', fontWeight: 'bold', color: '#721c24' }}>المبلغ الأصلي:</td>
                                    <td style={{ padding: '5px', textAlign: 'left', color: '#721c24' }}>{installment.originalAmount.toLocaleString()} ر.ي</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Payments Table */}
            <div style={{ marginBottom: '15px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', borderBottom: '2px solid #28a745', paddingBottom: '3px', color: '#28a745' }}>سجل المدفوعات</h3>
                {payments.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', border: '1px solid #dee2e6' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#e9ecef' }}>
                                <th style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'right' }}>#</th>
                                <th style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'right' }}>التاريخ</th>
                                <th style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'right' }}>المبلغ</th>
                                <th style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'right' }}>المجموع التراكمي</th>
                                <th style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'right' }}>ملاحظات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map((payment, index) => {
                                const runningTotal = payments.slice(0, index + 1).reduce((sum, p) => sum + p.amount, 0);
                                return (
                                    <tr key={payment.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                                        <td style={{ padding: '6px', border: '1px solid #dee2e6' }}>{index + 1}</td>
                                        <td style={{ padding: '6px', border: '1px solid #dee2e6' }}>
                                            {new Date(payment.receivedDate).toLocaleDateString('ar-EG')}
                                        </td>
                                        <td style={{ padding: '6px', border: '1px solid #dee2e6', fontWeight: 'bold', color: '#28a745' }}>
                                            {payment.amount.toLocaleString()} ر.ي
                                        </td>
                                        <td style={{ padding: '6px', border: '1px solid #dee2e6' }}>
                                            {runningTotal.toLocaleString()} ر.ي
                                        </td>
                                        <td style={{ padding: '6px', border: '1px solid #dee2e6', fontSize: '11px' }}>
                                            {payment.notes || '-'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                ) : (
                    <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '6px', color: '#6c757d' }}>
                        لا توجد مدفوعات مسجلة
                    </div>
                )}
            </div>

            {/* Notes */}
            {installment.notes && (
                <div style={{ background: '#fff3cd', padding: '10px', borderRadius: '6px', marginBottom: '15px', border: '1px solid #ffc107' }}>
                    <h4 style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', color: '#856404' }}>ملاحظات:</h4>
                    <p style={{ fontSize: '12px', margin: 0, color: '#856404' }}>{installment.notes}</p>
                </div>
            )}

            {/* Footer */}
            <footer style={{ marginTop: '20px', paddingTop: '10px', borderTop: '2px dashed #dee2e6', fontSize: '10px', color: '#6c757d', display: 'flex', justifyContent: 'space-between' }}>
                <span>طبع بواسطة: {printedBy}</span>
                <span>تاريخ الطباعة: {printTimestamp}</span>
            </footer>
        </div>
    );
};

export default PrintableInstallment;
