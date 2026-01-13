import React from 'react';
import { Shipment } from '../../../types';

interface PrintableShipmentProps {
  shipment: Shipment;
  driverName: string;
  plateNumber: string;
  regionName: string;
  printedBy: string;
  printTimestamp: string;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyLogo: string;
  isPrintHeaderEnabled: boolean;
  productWeights: Record<string, number>;
}

const PrintableShipment: React.FC<PrintableShipmentProps> = ({
  shipment,
  driverName,
  plateNumber,
  regionName,
  printedBy,
  printTimestamp,
  companyName,
  companyAddress,
  companyPhone,
  companyLogo,
  isPrintHeaderEnabled,
  productWeights,
}) => {
  const totalDamagedValue = shipment.products.reduce((sum, p) => sum + (p.damagedValue || 0), 0);
  const totalShortageValue = shipment.products.reduce((sum, p) => sum + (p.shortageValue || 0), 0);

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
          {/* Right Column - Company Info */}
          <div style={{ textAlign: 'right' }}>
            <h1 style={{ margin: '3px 0', fontSize: '18px', fontWeight: 'bold', color: '#007bff' }}>{companyName}</h1>
            <p style={{ margin: '2px 0', fontSize: '12px', color: '#555' }}>{companyAddress}</p>
            <p style={{ margin: '2px 0', fontSize: '12px', color: '#555' }}>{companyPhone}</p>
          </div>
          {/* Center Column - Logo */}
          <div style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {companyLogo && (
              <img src={companyLogo} alt={companyName} crossOrigin="anonymous" style={{ height: '80px', width: 'auto', objectFit: 'contain' }} />
            )}
          </div>
          {/* Left Column - Empty for balance */}
          <div style={{ textAlign: 'left' }}></div>
        </header>
      )}



      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
        <div style={{ background: '#f8f9fa', padding: '10px', borderRadius: '6px', border: '1px solid #e9ecef' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', borderBottom: '2px solid #007bff', paddingBottom: '3px', color: '#007bff' }}>معلومات الشحنة</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <tbody>
              <tr>
                <td style={{ padding: '4px 0', fontWeight: 'bold' }}>رقم الأمر:</td>
                <td style={{ padding: '4px 0' }}>{shipment.salesOrder}</td>
              </tr>
              <tr style={{ backgroundColor: '#f1f3f4' }}>
                <td style={{ padding: '4px 0', fontWeight: 'bold' }}>تاريخ الأمر:</td>
                <td style={{ padding: '4px 0' }}>{new Date(shipment.orderDate).toLocaleDateString('ar-EG')}</td>
              </tr>
              <tr>
                <td style={{ padding: '4px 0', fontWeight: 'bold' }}>تاريخ الإدخال:</td>
                <td style={{ padding: '4px 0' }}>{new Date(shipment.entryTimestamp).toLocaleDateString('ar-EG')}</td>
              </tr>
              <tr style={{ backgroundColor: '#f1f3f4' }}>
                <td style={{ padding: '4px 0', fontWeight: 'bold' }}>الحالة:</td>
                <td style={{ padding: '4px 0' }}>{shipment.status}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ background: '#f8f9fa', padding: '10px', borderRadius: '6px', border: '1px solid #e9ecef' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', borderBottom: '2px solid #007bff', paddingBottom: '3px', color: '#007bff' }}>معلومات السائق والمنطقة</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <tbody>
              <tr>
                <td style={{ padding: '4px 0', fontWeight: 'bold' }}>اسم السائق:</td>
                <td style={{ padding: '4px 0' }}>{driverName}</td>
              </tr>
              <tr style={{ backgroundColor: '#f1f3f4' }}>
                <td style={{ padding: '4px 0', fontWeight: 'bold' }}>رقم اللوحة:</td>
                <td style={{ padding: '4px 0' }}>{plateNumber}</td>
              </tr>
              <tr>
                <td style={{ padding: '4px 0', fontWeight: 'bold' }}>المنطقة:</td>
                <td style={{ padding: '4px 0' }}>{regionName}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', borderBottom: '2px solid #007bff', paddingBottom: '3px', color: '#007bff' }}>تفاصيل المنتجات</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd', fontSize: '11px', background: '#f8f9fa' }}>
          <thead>
            <tr style={{ background: '#007bff', color: 'white' }}>
              <th style={{ padding: '6px', textAlign: 'right', border: '1px solid #ddd', fontWeight: 'bold' }}>المنتج</th>
              <th style={{ padding: '6px', textAlign: 'center', border: '1px solid #ddd', fontWeight: 'bold' }}>الكمية</th>
              <th style={{ padding: '6px', textAlign: 'center', border: '1px solid #ddd', fontWeight: 'bold' }}>السعر</th>
              <th style={{ padding: '6px', textAlign: 'center', border: '1px solid #ddd', fontWeight: 'bold' }}>إجمالي الوزن بالطن</th>
            </tr>
          </thead>
          <tbody>
            {shipment.products.map((product, index) => (
              <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f1f3f4' }}>
                <td style={{ padding: '6px', textAlign: 'right', border: '1px solid #ddd' }}>{product.productName}</td>
                <td style={{ padding: '6px', textAlign: 'center', border: '1px solid #ddd' }}>{product.cartonCount}</td>
                <td style={{ padding: '6px', textAlign: 'center', border: '1px solid #ddd' }}>
                  {product.productWagePrice ? `${product.productWagePrice.toLocaleString()} ر.ي` : 'غير محدد'}
                </td>
                <td style={{ padding: '6px', textAlign: 'center', border: '1px solid #ddd' }}>
                  {(((productWeights[product.productId] ?? 0) * product.cartonCount) / 1000).toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: '#e9ecef', fontWeight: 'bold' }}>
              <td colSpan={2} style={{ padding: '6px', textAlign: 'right', border: '1px solid #ddd' }}>الإجمالي</td>
              <td style={{ padding: '6px', textAlign: 'center', border: '1px solid #ddd' }}>
                {shipment.products.reduce((sum, product) => sum + (product.productWagePrice || 0), 0) > 0 &&
                  `${shipment.products.reduce((sum, product) => sum + (product.productWagePrice || 0), 0).toLocaleString()} ر.ي`
                }
              </td>
              <td style={{ padding: '6px', textAlign: 'center', border: '1px solid #ddd' }}>
                {shipment.products.reduce((sum, product) => sum + ((productWeights[product.productId] ?? 0) * product.cartonCount), 0) / 1000 > 0 &&
                  (shipment.products.reduce((sum, product) => sum + ((productWeights[product.productId] ?? 0) * product.cartonCount), 0) / 1000).toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })
                }
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', borderBottom: '2px solid #007bff', paddingBottom: '3px', color: '#007bff' }}>ملخص التكاليف</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '6px' }}>
          {Object.entries({
            'إجمالي الأجر': shipment.totalWage,
            'إجمالي الديزل': shipment.totalDiesel,
            'رسوم زعيتري': shipment.zaitriFee,
            'مصروفات إدارية': shipment.adminExpenses,
            'خرج الطريق': shipment.roadExpenses,
          }).map(([label, value]) => (
            <div key={label} style={{ padding: '6px', border: '1px solid #ddd', borderRadius: '4px', background: '#e8f5e8', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontWeight: 'bold', fontSize: '11px' }}>{label}:</div>
              <div style={{ fontSize: '12px', color: '#2d5a2d', fontWeight: 'bold' }}>{(value ?? 0).toLocaleString()} ر.ي</div>
            </div>
          ))}
        </div>
      </div>



      <div style={{ marginBottom: '15px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', borderBottom: '2px solid #d32f2f', paddingBottom: '3px', color: '#d32f2f' }}>الاستقطاعات</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '6px' }}>
          {Object.entries({
            'قيمة التالف': totalDamagedValue,
            'قيمة النقص': totalShortageValue,
            'مبالغ أخرى': shipment.otherAmounts,
          }).map(([label, value]) => (
            <div key={label} style={{ padding: '6px', border: '1px solid #ddd', borderRadius: '4px', background: '#ffebee', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#d32f2f' }}>{label}:</div>
              <div style={{ fontSize: '12px', color: '#d32f2f', fontWeight: 'bold' }}>{(value ?? 0).toLocaleString()} ر.ي</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', borderBottom: '2px solid #2e7d32', paddingBottom: '3px', color: '#2e7d32' }}>الاستحقاقات</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '6px' }}>
          {Object.entries({
            'سندات تحسين': shipment.improvementBonds,
            'ممسى ': shipment.eveningAllowance,
            'رسوم التحويل': shipment.transferFee,
          }).map(([label, value]) => (
            <div key={label} style={{ padding: '6px', border: '1px solid #ddd', borderRadius: '4px', background: '#e8f5e8', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#2e7d32' }}>{label}:</div>
              <div style={{ fontSize: '12px', color: '#2e7d32', fontWeight: 'bold' }}>
                {`${(typeof value === 'number' ? value : 0).toLocaleString()} ر.ي`}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', borderBottom: '2px solid #007bff', paddingBottom: '3px', color: '#007bff' }}>ملخص الدفع</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
          {Object.entries({
            'المبلغ المستحق': shipment.dueAmount,
            'بعد الخصم': shipment.dueAmountAfterDiscount,
            'المبلغ النهائي': shipment.totalDueAmount,
          }).map(([label, value]) => (
            value !== undefined && (
              <div key={label} style={{
                padding: '10px',
                border: label === 'المبلغ النهائي' ? '3px solid #d69e2e' : '2px solid #1976d2',
                borderRadius: '6px',
                background: label === 'المبلغ النهائي' ? '#fef5e7' : '#e3f2fd',
                textAlign: 'center'
              }}>
                <div style={{ fontWeight: 'bold', fontSize: '12px' }}>{label}:</div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: label === 'المبلغ النهائي' ? '#d69e2e' : '#1976d2'
                }}>{(value ?? 0).toLocaleString()} ر.ي</div>
              </div>
            )
          ))}
        </div>
        {(shipment.transferNumber || shipment.transferDate) && (
          <div style={{ marginTop: '10px', padding: '8px', backgroundColor: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: '4px', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {shipment.transferNumber && (
              <div style={{ textAlign: 'center', fontSize: '12px', color: '#718096' }}>
                <div style={{ fontWeight: 'bold' }}>رقم الحوالة:</div>
                <div>{shipment.transferNumber}</div>
              </div>
            )}
            {shipment.transferDate && (
              <div style={{ textAlign: 'center', fontSize: '12px', color: '#718096' }}>
                <div style={{ fontWeight: 'bold' }}>تاريخ الحوالة:</div>
                <div>{new Date(shipment.transferDate).toLocaleDateString('ar-EG')}</div>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '15px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', borderBottom: '2px solid #007bff', paddingBottom: '3px', color: '#007bff' }}>الملاحظات</h3>
        <div style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px', background: '#f8f9fa', fontSize: '12px' }}>
          {shipment.notes ? shipment.notes : 'لا توجد اي ملاحظات'}
        </div>
      </div>

      <footer style={{ marginTop: '20px', paddingTop: '10px', borderTop: '2px solid #007bff', textAlign: 'center', fontSize: '10px', color: '#666', background: '#f9f9f9', padding: '8px', borderRadius: '4px' }}>
        <p>تم إصدار هذا الإيصال بواسطة نظام إدارة الشحنات</p>
        <p>طُبع بواسطة: {printedBy}</p>
        <p>تاريخ الطباعة: {printTimestamp}</p>
      </footer>
    </div>
  );
};

export default PrintableShipment;