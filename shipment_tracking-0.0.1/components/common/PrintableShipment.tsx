import React from 'react';
import { Shipment } from '../../types';
import { Icons } from '../Icons';

interface PrintableShipmentProps {
  shipment: Shipment;
  driverName: string;
  plateNumber: string;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyLogo: string;
  isPrintHeaderEnabled: boolean;
  printedBy: string;
  printTimestamp: string;
}

const PrintableShipment: React.FC<PrintableShipmentProps> = ({ 
    shipment, driverName, plateNumber,
    companyName, companyAddress, companyPhone, companyLogo,
    isPrintHeaderEnabled, printedBy, printTimestamp
}) => {

  const InfoItem: React.FC<{ label: string, value?: string | number, icon: React.ElementType }> = ({ label, value, icon: Icon }) => (
    <div className="flex items-start">
        <Icon className="h-4 w-4 text-gray-500 mt-1 ml-2 flex-shrink-0" />
        <div>
            <p className="text-xs text-gray-600">{label}</p>
            <p className="font-bold text-sm">{value || '---'}</p>
        </div>
    </div>
  );

  const FinancialRow: React.FC<{ label: string, value?: number, isTotal?: boolean, isSub?: boolean, type?: 'add' | 'subtract' | 'neutral' }> = ({ label, value = 0, isTotal = false, isSub = false, type = 'neutral' }) => {
    const valueColor = type === 'add' ? 'text-green-600' : type === 'subtract' ? 'text-red-600' : 'text-gray-800';
    const sign = type === 'add' ? '+ ' : type === 'subtract' ? '- ' : '';
    
    return (
        <div className={`flex justify-between py-1.5 px-2 ${isSub ? 'border-t border-dashed border-gray-200 mt-1 pt-2' : ''} ${isTotal ? 'border-t-2 border-black font-bold' : ''}`}>
            <span className={`${isTotal ? 'text-base' : 'text-sm'} ${isSub ? 'font-semibold' : ''}`}>{label}</span>
            <span className={`${valueColor} ${isTotal ? 'text-base' : 'text-sm'} font-mono`}>{sign}{Math.abs(value).toLocaleString('en-US')} ر.ي</span>
        </div>
    );
  };
  
  const totalDueBeforeTax = (shipment.totalDueAmount || 0) - (shipment.totalTax || 0);

  return (
    <div className="p-5 bg-white text-black font-sans text-sm flex flex-col" dir="rtl">
      <div className="flex-grow">
        {isPrintHeaderEnabled && (
            <header className="flex justify-between items-center mb-4 pb-4 border-b-2 border-gray-800">
                <div className="text-right flex-grow">
                    <h1 className="font-extrabold text-2xl text-gray-800 mb-1">{companyName}</h1>
                    <p className="text-xs text-gray-600">{companyAddress}</p>
                    <p className="text-xs text-gray-600">{companyPhone}</p>
                </div>
                {companyLogo && (
                    <div className="flex-shrink-0 mr-6">
                        <img src={companyLogo} alt="شعار الشركة" className="h-20 w-auto object-contain" />
                    </div>
                )}
            </header>
        )}
        
        <main>
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold inline-block bg-gray-100 py-1 px-6 rounded-md text-gray-700">كشف حساب شحنة</h2>
            </div>

            <section className="grid grid-cols-2 gap-x-6 gap-y-3 mb-4 p-3 border border-gray-200 rounded-lg bg-gray-50">
                <InfoItem label="أمر المبيعات" value={shipment.salesOrder} icon={Icons.Hash} />
                <InfoItem label="اسم السائق" value={driverName} icon={Icons.User} />
                <InfoItem label="تاريخ الأمر" value={new Date(shipment.orderDate).toLocaleDateString('ar-EG')} icon={Icons.Calendar} />
                <InfoItem label="رقم اللوحة" value={plateNumber} icon={Icons.Truck} />
                {shipment.transferNumber && <InfoItem label="رقم الحوالة" value={shipment.transferNumber} icon={Icons.ChevronsRightLeft} />}
                {shipment.transferDate && <InfoItem label="تاريخ الحوالة" value={new Date(shipment.transferDate).toLocaleDateString('ar-EG')} icon={Icons.Calendar} />}
            </section>

            <section className="mb-4">
                <h3 className="text-base font-bold mb-2 border-b-2 border-gray-200 pb-1 text-gray-800">تفاصيل المنتجات</h3>
                <table className="w-full text-right border-collapse">
                    <thead>
                        <tr className="border-b-2 border-gray-300 bg-gray-100">
                            <th className="p-2 text-right text-xs font-bold uppercase text-gray-600">المنتج</th>
                            <th className="p-2 text-center text-xs font-bold uppercase text-gray-600">الكمية</th>
                            <th className="p-2 text-center text-xs font-bold uppercase text-gray-600">سعر الوحدة</th>
                            <th className="p-2 text-left text-xs font-bold uppercase text-gray-600">الأجر المستحق</th>
                        </tr>
                    </thead>
                    <tbody>
                        {shipment.products.map(p => (
                            <tr key={p.productId} className="border-b border-gray-200 odd:bg-gray-50/70">
                                <td className="p-2 font-medium">{p.productName}</td>
                                <td className="p-2 text-center font-mono">{p.cartonCount.toLocaleString('en-US')}</td>
                                <td className="p-2 text-center font-mono">
                                    {p.cartonCount > 0 && p.productWagePrice ? (p.productWagePrice / p.cartonCount).toFixed(2) : 'N/A'} ر.ي
                                </td>
                                <td className="p-2 text-left font-semibold font-mono">{(p.productWagePrice || 0).toLocaleString('en-US')} ر.ي</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="font-bold bg-gray-100 border-t-2 border-gray-300">
                            <td colSpan={3} className="p-2 text-left text-sm">إجمالي أجر المنتجات</td>
                            <td className="p-2 text-left text-base font-mono">{(shipment.totalWage || 0).toLocaleString('en-US')} ر.ي</td>
                        </tr>
                    </tfoot>
                </table>
            </section>
            
            <section>
                <h3 className="text-base font-bold mb-2 border-b-2 border-gray-200 pb-1 text-gray-800">الملخص المالي</h3>
                <div className="border border-gray-200 rounded-lg p-3 bg-gray-50/50">
                    <FinancialRow label="إجمالي أجر المنتجات" value={shipment.totalWage} type="neutral" />
                    
                    <p className="font-semibold text-gray-500 text-xs mt-2 mb-1 px-2 uppercase">الخصميات</p>
                    <div className="border-r-2 border-red-200 pr-2 space-y-1">
                        <FinancialRow label="إجمالي الديزل" value={shipment.totalDiesel} type="subtract" />
                        <FinancialRow label="رسوم زعيتري" value={shipment.zaitriFee} type="subtract" />
                        <FinancialRow label="مصروفات إدارية" value={shipment.adminExpenses} type="subtract" />
                        <FinancialRow label="التالف" value={shipment.damagedValue} type="subtract" />
                        <FinancialRow label="النقص" value={shipment.shortageValue} type="subtract" />
                        <FinancialRow label="خرج الطريق" value={shipment.roadExpenses} type="subtract" />
                        <FinancialRow label="خصميات (مبالغ أخرى)" value={shipment.otherAmounts} type="subtract" />
                    </div>
                    <FinancialRow label="المبلغ المستحق بعد الخصم" value={shipment.dueAmountAfterDiscount} isSub />

                    <p className="font-semibold text-gray-500 text-xs mt-2 mb-1 px-2 uppercase">الإضافات</p>
                     <div className="border-r-2 border-green-200 pr-2 space-y-1">
                        <FinancialRow label="إضافات (سندات تحسين)" value={shipment.improvementBonds} type="add" />
                        <FinancialRow label="إضافات (ممسى)" value={shipment.eveningAllowance} type="add" />
                    </div>
                    
                    <FinancialRow label="المجموع قبل الضريبة" value={totalDueBeforeTax} isSub />
                    <FinancialRow label="الضريبة" value={shipment.totalTax} type="add" />

                    <div className="mt-4 pt-3 border-t-2 border-gray-800">
                        <div className="flex justify-between items-center py-2 px-3 rounded-lg font-bold text-xl bg-gray-800 text-white">
                            <span>إجمالي المبلغ المستحق النهائي</span>
                            <span className="font-mono">{(shipment.totalDueAmount || 0).toLocaleString('en-US')} ر.ي</span>
                        </div>
                    </div>
                </div>
            </section>
        </main>
      </div>
      <footer className="text-xs text-gray-500 pt-3 mt-4 border-t border-gray-300">
        <div className="flex justify-between">
            <span>طبع بواسطة: {printedBy}</span>
            <span>تاريخ الطباعة: {printTimestamp}</span>
        </div>
      </footer>
    </div>
  );
};

export default PrintableShipment;