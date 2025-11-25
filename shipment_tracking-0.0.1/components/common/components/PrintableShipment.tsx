import React from 'react';
import { Shipment } from '../../types';

interface PrintableShipmentProps {
  shipment: Shipment;
  driverName: string;
  plateNumber: string;
  printedBy: string;
  printTimestamp: string;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyLogo: string;
  isPrintHeaderEnabled: boolean;
}

const PrintableShipment: React.FC<PrintableShipmentProps> = ({
  shipment,
  driverName,
  plateNumber,
  printedBy,
  printTimestamp,
  companyName,
  companyAddress,
  companyPhone,
  companyLogo,
  isPrintHeaderEnabled,
}) => {
  return (
    <div className="print-container" style={{ fontFamily: 'Arial, sans-serif', direction: 'rtl', padding: '20px' }}>
      {isPrintHeaderEnabled && (
        <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '2px solid #000', paddingBottom: '10px' }}>
          {companyLogo && (
            <img
              src={companyLogo}
              alt={companyName}
              style={{ maxHeight: '60px', marginBottom: '10px' }}
            />
          )}
          <h1 style={{ margin: '5px 0', fontSize: '24px', fontWeight: 'bold' }}>{companyName}</h1>
          <p style={{ margin: '2px 0', fontSize: '14px' }}>{companyAddress}</p>
          <p style={{ margin: '2px 0', fontSize: '14px' }}>{companyPhone}</p>
        </div>
      )}

      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0' }}>إيصال شحنة</h2>
        <p style={{ fontSize: '14px', color: '#666', margin: '5px 0' }}>
          تاريخ الطباعة: {printTimestamp}
        </p>
        <p style={{ fontSize: '14px', color: '#666', margin: '5px 0' }}>
          تم الطباعة بواسطة: {printedBy}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px', borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>
            معلومات الشحنة
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ padding: '5px 0', fontWeight: 'bold', width: '40%' }}>رقم الأمر:</td>
                <td style={{ padding: '5px 0' }}>{shipment.salesOrder}</td>
              </tr>
              <tr style={{ backgroundColor: '#f9f9f9' }}>
                <td style={{ padding: '5px 0', fontWeight: 'bold' }}>تاريخ الأمر:</td>
                <td style={{ padding: '5px 0' }}>{new Date(shipment.orderDate).toLocaleDateString('ar-EG')}</td>
              </tr>
              <tr>
                <td style={{ padding: '5px 0', fontWeight: 'bold' }}>تاريخ الإدخال:</td>
                <td style={{ padding: '5px 0' }}>{new Date(shipment.entryTimestamp).toLocaleDateString('ar-EG')}</td>
              </tr>
              <tr style={{ backgroundColor: '#f9f9f9' }}>
                <td style={{ padding: '5px 0', fontWeight: 'bold' }}>الحالة:</td>
                <td style={{ padding: '5px 0' }}>{shipment.status}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px', borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>
            معلومات السائق والمنطقة
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ padding: '5px 0', fontWeight: 'bold', width: '40%' }}>اسم السائق:</td>
                <td style={{ padding: '5px 0' }}>{driverName}</td>
              </tr>
              <tr style={{ backgroundColor: '#f9f9f9' }}>
                <td style={{ padding: '5px 0', fontWeight: 'bold' }}>رقم اللوحة:</td>
                <td style={{ padding: '5px 0' }}>{plateNumber}</td>
              </tr>
              <tr>
                <td style={{ padding: '5px 0', fontWeight: 'bold' }}>المنطقة:</td>
                <td style={{ padding: '5px 0' }}>{shipment.regionId}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px', borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>
          تفاصيل المنتجات
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc' }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <th style={{ padding: '8px', textAlign: 'right', border: '1px solid #ccc', fontWeight: 'bold' }}>المنتج</th>
              <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #ccc', fontWeight: 'bold' }}>الكمية</th>
              <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #ccc', fontWeight: 'bold' }}>السعر</th>
              <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #ccc', fontWeight: 'bold' }}>الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            {shipment.products.map((product, index) => (
              <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #ccc' }}>{product.productName}</td>
                <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #ccc' }}>{product.cartonCount}</td>
                <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #ccc' }}>
                  {product.productWagePrice ? `${product.productWagePrice.toLocaleString()} ر.ي` : 'غير محدد'}
                </td>
                <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #ccc' }}>
                  {product.productWagePrice ? `${(product.productWagePrice * product.cartonCount).toLocaleString()} ر.ي` : 'غير محدد'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px', borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>
          ملخص التكاليف
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>إجمالي الأجر:</div>
            <div style={{ fontSize: '18px', color: '#2d5a2d' }}>
              {shipment.totalWage?.toLocaleString() || 0} ر.ي
            </div>
          </div>
          <div style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>إجمالي الديزل:</div>
            <div style={{ fontSize: '18px', color: '#2d5a2d' }}>
              {shipment.totalDiesel?.toLocaleString() || 0} ر.ي
            </div>
          </div>
          <div style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>رسوم زعيتري:</div>
            <div style={{ fontSize: '18px', color: '#2d5a2d' }}>
              {shipment.zaitriFee?.toLocaleString() || 0} ر.ي
            </div>
          </div>
          <div style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>مصروفات إدارية:</div>
            <div style={{ fontSize: '18px', color: '#2d5a2d' }}>
              {shipment.adminExpenses?.toLocaleString() || 0} ر.ي
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px', borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>
          ملخص الدفع
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          <div style={{ padding: '15px', border: '2px solid #2d5a2d', borderRadius: '5px', backgroundColor: '#f0f8f0' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '16px' }}>المبلغ المستحق:</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2d5a2d' }}>
              {shipment.dueAmount?.toLocaleString() || 0} ر.ي
            </div>
          </div>
          {shipment.dueAmountAfterDiscount && (
            <div style={{ padding: '15px', border: '2px solid #1976d2', borderRadius: '5px', backgroundColor: '#e3f2fd' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '16px' }}>بعد الخصم:</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1976d2' }}>
                {shipment.dueAmountAfterDiscount.toLocaleString()} ر.ي
              </div>
            </div>
          )}
          {shipment.totalDueAmount && (
            <div style={{ padding: '15px', border: '2px solid #d32f2f', borderRadius: '5px', backgroundColor: '#ffebee' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '16px' }}>المبلغ النهائي:</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#d32f2f' }}>
                {shipment.totalDueAmount.toLocaleString()} ر.ي
              </div>
            </div>
          )}
        </div>
      </div>

      {shipment.damagedValue || shipment.shortageValue || shipment.otherAmounts || shipment.improvementBonds || shipment.eveningAllowance || shipment.taxRate ? (
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px', borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>
            التعديلات والخصومات
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
            {shipment.damagedValue && (
              <div style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '3px' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#d32f2f' }}>قيمة التالف:</div>
                <div style={{ fontSize: '14px', color: '#d32f2f' }}>{shipment.damagedValue.toLocaleString()} ر.ي</div>
              </div>
            )}
            {shipment.shortageValue && (
              <div style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '3px' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#d32f2f' }}>قيمة النقص:</div>
                <div style={{ fontSize: '14px', color: '#d32f2f' }}>{shipment.shortageValue.toLocaleString()} ر.ي</div>
              </div>
            )}
            {shipment.otherAmounts && (
              <div style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '3px' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#f57c00' }}>مبالغ أخرى:</div>
                <div style={{ fontSize: '14px', color: '#f57c00' }}>{shipment.otherAmounts.toLocaleString()} ر.ي</div>
              </div>
            )}
            {shipment.improvementBonds && (
              <div style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '3px' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#2e7d32' }}>سندات تحسين:</div>
                <div style={{ fontSize: '14px', color: '#2e7d32' }}>{shipment.improvementBonds.toLocaleString()} ر.ي</div>
              </div>
            )}
            {shipment.eveningAllowance && (
              <div style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '3px' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#2e7d32' }}>بدل مسائي:</div>
                <div style={{ fontSize: '14px', color: '#2e7d32' }}>{shipment.eveningAllowance.toLocaleString()} ر.ي</div>
              </div>
            )}
            {shipment.taxRate && (
              <div style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '3px' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#1976d2' }}>معدل الضريبة:</div>
                <div style={{ fontSize: '14px', color: '#1976d2' }}>{shipment.taxRate}%</div>
              </div>
            )}
          </div>
        </div>
      ) : null}

      <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '2px solid #000', textAlign: 'center', fontSize: '12px', color: '#666' }}>
        <p>تم إصدار هذا الإيصال بواسطة نظام إدارة الشحنات</p>
        <p>تاريخ الإصدار: {new Date().toLocaleString('ar-EG')}</p>
      </div>
    </div>
  );
};

export default PrintableShipment;