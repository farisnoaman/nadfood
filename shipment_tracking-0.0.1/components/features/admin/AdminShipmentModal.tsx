import React, { useState, useEffect } from 'react';
import { Shipment, ShipmentStatus, Role, NotificationCategory, Driver, Region, ShipmentProduct, DeductionPrice } from '../../../types';
import Modal from '../../common/ui/Modal';
import Button from '../../common/ui/Button';
import Input from '../../common/ui/Input';
import ArabicDatePicker from '../../common/ui/ArabicDatePicker';
import { Icons } from '../../Icons';
import { printShipmentDetails } from '../../../utils/print';
import { useAppContext } from '../../../providers/AppContext';
import { supabase } from '../../../utils/supabaseClient';

import FieldValue from '../../common/components/FieldValue';
import ProductDetails from '../../common/components/ProductDetails';
import ShipmentStepper from '../../common/components/ShipmentStepper';

// --- Helper Functions and Sub-components ---

/** Basic Information Section - Read-only display of initial calculated values */
const BasicInformationSection: React.FC<{ shipment: Shipment; regionRoadExpenses: number; totalWeight: number }> = ({ shipment, regionRoadExpenses, totalWeight }) => (
  <div className="space-y-2 bg-secondary-50 dark:bg-secondary-900 p-3 rounded-md">
    <h4 className="font-bold text-lg">المعلومات الأساسية</h4>
    <div className="font-bold mb-2 text-primary-700 dark:text-primary-300">
      <FieldValue label="إجمالي الوزن" value={`${totalWeight.toLocaleString('en-US', { minimumFractionDigits: 3 })} طن`} currency="" />
    </div>
    <div className="pt-2 border-t dark:border-secondary-700 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
      <FieldValue label="إجمالي الأجر" value={shipment.totalWage} />
      <FieldValue label="إجمالي الديزل" value={shipment.totalDiesel} />
      <FieldValue label="خرج الطريق" value={regionRoadExpenses} />
      <FieldValue label="رسوم زعيتري" value={shipment.zaitriFee} />
      <FieldValue label="مصروفات إدارية" value={shipment.adminExpenses} />
      <div className="md:col-span-2 pt-2 border-t dark:border-secondary-700">
        <FieldValue label="المبلغ المستحق" value={shipment.dueAmount} />
      </div>
    </div>
  </div>
);

const ItemizedDeductionsSection: React.FC<{
  products: ShipmentProduct[];
  deductionPrices: DeductionPrice[];
  orderDate: string;
  onProductDeductionChange: (productId: string, field: keyof Pick<ShipmentProduct, 'shortageCartons' | 'shortageExemptionRate' | 'damagedCartons' | 'damagedExemptionRate'>, value: number) => void;
  otherAmounts: number;
  onOtherAmountsChange: (value: string) => void;
  disabled?: boolean;
}> = ({ products, deductionPrices, orderDate, onProductDeductionChange, otherAmounts, onOtherAmountsChange, disabled = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getDeductionPrice = (productId: string): { shortage: number; damaged: number } => {
    const relevantPrices = deductionPrices.filter(dp =>
      dp.productId === productId && dp.effectiveFrom <= orderDate
    );
    const latestPrice = relevantPrices.sort((a, b) =>
      new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime()
    )[0];
    return { shortage: latestPrice?.shortagePrice || 0, damaged: latestPrice?.damagedPrice || 0 };
  };

  return (
    <div className="bg-secondary-50 dark:bg-secondary-900 rounded-md overflow-hidden">
      <button
        className="w-full flex justify-between items-center p-3 hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h4 className="font-bold text-lg">قسم الخصميات (مفصل بالمنتج)</h4>
        <Icons.ChevronDown className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {isExpanded && (
        <div className="p-3 pt-0 space-y-4 border-t dark:border-secondary-700">
          {products.map(product => {
            const prices = getDeductionPrice(product.productId);
            return (
              <div key={product.productId} className="p-3 bg-white dark:bg-secondary-800 rounded-lg border dark:border-secondary-700 shadow-sm">
                <div className="mb-3">
                  <p className="font-bold text-gray-800 dark:text-gray-100 whitespace-nowrap overflow-hidden text-ellipsis" title={product.productName}>
                    {product.productName}
                  </p>
                  <p className="text-xs text-secondary-500 mt-1">
                    سعر النقص: {prices.shortage} ر.ي | سعر التالف: {prices.damaged} ر.ي
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  {/* Shortage Group */}
                  <div className="bg-red-50 dark:bg-red-900/10 p-2 rounded-md border border-red-100 dark:border-red-900/20">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-semibold text-red-700 dark:text-red-400">النقص</span>
                      <span className="text-xs font-bold text-red-600">{product.shortageValue || 0} ر.ي</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-secondary-500 mb-0.5">عدد الكراتين</label>
                        <input
                          type="number" min="0" step="1"
                          value={product.shortageCartons || ''}
                          onChange={e => onProductDeductionChange(product.productId, 'shortageCartons', Number(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 text-sm border rounded bg-white dark:bg-secondary-700 dark:border-secondary-600 focus:ring-1 focus:ring-red-500"
                          disabled={disabled}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-secondary-500 mb-0.5">نسبة الإعفاء %</label>
                        <input
                          type="number" min="0" max="100" step="1"
                          value={product.shortageExemptionRate || ''}
                          onChange={e => onProductDeductionChange(product.productId, 'shortageExemptionRate', Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                          className="w-full px-2 py-1.5 text-sm border rounded bg-white dark:bg-secondary-700 dark:border-secondary-600 focus:ring-1 focus:ring-red-500"
                          disabled={disabled}
                          placeholder="0%"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Damaged Group */}
                  <div className="bg-orange-50 dark:bg-orange-900/10 p-2 rounded-md border border-orange-100 dark:border-orange-900/20">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-semibold text-orange-700 dark:text-orange-400">التالف</span>
                      <span className="text-xs font-bold text-orange-600">{product.damagedValue || 0} ر.ي</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-secondary-500 mb-0.5">عدد الكراتين</label>
                        <input
                          type="number" min="0" step="1"
                          value={product.damagedCartons || ''}
                          onChange={e => onProductDeductionChange(product.productId, 'damagedCartons', Number(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 text-sm border rounded bg-white dark:bg-secondary-700 dark:border-secondary-600 focus:ring-1 focus:ring-orange-500"
                          disabled={disabled}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-secondary-500 mb-0.5">نسبة الإعفاء %</label>
                        <input
                          type="number" min="0" max="100" step="1"
                          value={product.damagedExemptionRate || ''}
                          onChange={e => onProductDeductionChange(product.productId, 'damagedExemptionRate', Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                          className="w-full px-2 py-1.5 text-sm border rounded bg-white dark:bg-secondary-700 dark:border-secondary-600 focus:ring-1 focus:ring-orange-500"
                          disabled={disabled}
                          placeholder="0%"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <Input
            label="مبالغ أخرى"
            type="number"
            min="0"
            value={otherAmounts || ''}
            onChange={e => onOtherAmountsChange(e.target.value)}
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
};

/** Additions Section */
const AdditionsSection: React.FC<{ shipment: Shipment; onValueChange: (field: keyof Shipment, value: string) => void; disabled?: boolean; }> = ({ shipment, onValueChange, disabled = false }) => (
  <div className="space-y-3 bg-secondary-50 dark:bg-secondary-900 p-3 rounded-md">
    <h4 className="font-bold text-lg">قسم الإضافات</h4>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
      <Input label="سندات تحسين" type="number" min="0" value={shipment.improvementBonds || ''} onChange={e => onValueChange('improvementBonds', e.target.value)} disabled={disabled} />
      <Input label="ممسى" type="number" min="0" value={shipment.eveningAllowance || ''} onChange={e => onValueChange('eveningAllowance', e.target.value)} disabled={disabled} />
      <Input label="رسوم التحويل" type="number" min="0" value={shipment.transferFee || ''} onChange={e => onValueChange('transferFee', e.target.value)} disabled={disabled} />
    </div>
  </div>
);

/** Final Calculation Section */
const FinalCalculationSection: React.FC<{ finalAmount: number; shipment: Shipment }> = ({ finalAmount, shipment }) => (
  <div className="space-y-3 bg-green-50 dark:bg-green-900/20 p-3 rounded-md border-2 border-green-200 dark:border-green-800">
    <div className="flex flex-col sm:flex-row justify-between items-center text-center sm:text-right gap-2">
      <span className="font-bold text-xl text-secondary-800 dark:text-secondary-100">إجمالي المبلغ المستحق النهائي</span>
      <span className="font-extrabold text-3xl text-green-700 dark:text-green-400">
        {finalAmount.toLocaleString('en-US')} ر.ي
      </span>
    </div>
    {((shipment.modifiedBy && shipment.modifiedAt)) && (
      <div className="pt-2 border-t border-dashed border-green-300 dark:border-green-700 text-xs text-secondary-600 dark:text-secondary-400">
        <FieldValue label="تم التعديل بواسطة" value={shipment.modifiedBy} currency="" />
        <FieldValue label="تاريخ التعديل" value={new Date(shipment.modifiedAt).toLocaleString('ar-EG')} currency="" />
      </div>
    )}
  </div>
);

/** Notes Section */
const NotesSection: React.FC<{ shipment: Shipment; onValueChange: (field: keyof Shipment, value: string) => void; disabled?: boolean; }> = ({ shipment, onValueChange, disabled = false }) => (
  <div className="space-y-3 bg-secondary-50 dark:bg-secondary-900 p-3 rounded-md">
    <h4 className="font-bold text-lg">الملاحظات</h4>
    <div className="pt-2">
      <textarea
        className="w-full px-3 py-2 border rounded-md dark:bg-secondary-800 dark:border-secondary-600 focus:ring-primary-500 focus:border-primary-500 min-h-[100px]"
        value={shipment.notes || ''}
        onChange={e => onValueChange('notes', e.target.value)}
        disabled={disabled}
        placeholder="أضف ملاحظات هنا..."
      />
    </div>
  </div>
);

/** Transfer Section */
const TransferSection: React.FC<{ shipment: Shipment; onValueChange: (field: keyof Shipment, value: string) => void; disabled?: boolean; }> = ({ shipment, onValueChange, disabled = false }) => (
  <div className="space-y-3 bg-secondary-50 dark:bg-secondary-900 p-3 rounded-md">
    <h4 className="font-bold text-lg">قسم الحوالة</h4>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
      <Input
        label="رقم الحوالة (8 أرقام على الأقل)"
        type="text"
        minLength={8}
        value={shipment.transferNumber || ''}
        onChange={e => onValueChange('transferNumber', e.target.value)}
        disabled={disabled}
        required
      />
      <ArabicDatePicker
        label="تاريخ الحوالة"
        value={shipment.transferDate || ''}
        onChange={(value) => onValueChange('transferDate', value)}
        disabled={disabled}
      />
    </div>
  </div>
);

// --- Main Modal Component ---

interface AdminShipmentModalProps {
  shipment: Shipment;
  isOpen: boolean;
  onClose: () => void;
}

const AdminShipmentModal: React.FC<AdminShipmentModalProps> = ({ shipment, isOpen, onClose }) => {
  const {
    updateShipment, createInstallment, currentUser, addNotification, drivers, regions,
    isPrintHeaderEnabled, companyName, companyAddress, companyPhone, companyLogo, installments, products, deductionPrices
  } = useAppContext();
  const [currentShipment, setCurrentShipment] = useState<Shipment>({ ...shipment });
  const [isProductsExpanded, setIsProductsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const attachmentInputRef = React.useRef<HTMLInputElement>(null);

  // Get region to display road expenses in basic info
  const shipmentRegion = regions.find((r: Region) => r.id === shipment.regionId);
  const regionRoadExpenses = currentShipment.roadExpenses ?? (shipmentRegion?.roadExpenses || 0);

  // Calculate amount after deductions (from itemized product-level values)
  const calculateAmountAfterDeductions = (ship: Shipment): number => {
    const dueAmount = ship.dueAmount || 0;
    const totalDamagedValue = ship.products.reduce((acc, p) => acc + (p.damagedValue || 0), 0);
    const totalShortageValue = ship.products.reduce((acc, p) => acc + (p.shortageValue || 0), 0);
    const otherAmounts = ship.otherAmounts || 0;
    return dueAmount - totalDamagedValue - totalShortageValue - otherAmounts;
  };

  // Calculate final amount
  const calculateFinalAmount = (ship: Shipment): number => {
    const amountAfterDeductions = calculateAmountAfterDeductions(ship);
    const improvementBonds = ship.improvementBonds || 0;
    const eveningAllowance = ship.eveningAllowance || 0;
    const transferFee = ship.transferFee || 0;
    return amountAfterDeductions + improvementBonds + eveningAllowance + transferFee;
  };

  useEffect(() => {
    setCurrentShipment({ ...shipment });
    setIsProductsExpanded(false);
  }, [shipment]);

  const handleValueChange = (field: keyof Shipment, value: string) => {
    let processedValue: string | number = value;
    const additionFields: (keyof Shipment)[] = ['improvementBonds', 'eveningAllowance', 'transferFee'];
    const deductionFields: (keyof Shipment)[] = ['otherAmounts'];

    if (additionFields.includes(field)) {
      processedValue = value === '' ? '' : Math.max(0, Number(value));
    } else if (deductionFields.includes(field)) {
      processedValue = value === '' ? '' : Math.max(0, Number(value));
    } else if (field === 'notes') {
      processedValue = value;
    }

    setCurrentShipment({ ...currentShipment, [field]: processedValue });
  };

  // Handle per-product deduction changes
  const handleProductDeductionChange = (
    productId: string,
    field: keyof Pick<ShipmentProduct, 'shortageCartons' | 'shortageExemptionRate' | 'damagedCartons' | 'damagedExemptionRate'>,
    value: number
  ) => {
    setCurrentShipment(prev => {
      const updatedProducts = prev.products.map(p => {
        if (p.productId !== productId) return p;

        const updatedProduct = { ...p, [field]: value };

        // Recalculate values for this product
        const relevantPrices = deductionPrices.filter(dp =>
          dp.productId === productId && dp.effectiveFrom <= shipment.orderDate
        );
        const latestPrice = relevantPrices.sort((a, b) =>
          new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime()
        )[0];

        const shortagePrice = latestPrice?.shortagePrice || 0;
        const damagedPrice = latestPrice?.damagedPrice || 0;
        const shortageCartons = updatedProduct.shortageCartons || 0;
        const shortageExemptionRate = updatedProduct.shortageExemptionRate || 0;
        const damagedCartons = updatedProduct.damagedCartons || 0;
        const damagedExemptionRate = updatedProduct.damagedExemptionRate || 0;

        updatedProduct.shortageValue = Math.round((shortageCartons * shortagePrice) * (1 - shortageExemptionRate / 100));
        updatedProduct.damagedValue = Math.round((damagedCartons * damagedPrice) * (1 - damagedExemptionRate / 100));

        return updatedProduct;
      });
      return { ...prev, products: updatedProducts };
    });
  };

  // Handle attachment file upload
  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('نوع الملف غير مدعوم. يرجى اختيار PDF أو صورة (JPEG, PNG, GIF, WebP)');
      return;
    }

    // Validate file size (1MB max)
    if (file.size > 1 * 1024 * 1024) {
      alert('حجم الملف كبير جداً. الحد الأقصى هو 1 ميجابايت');
      return;
    }

    try {
      setIsUploadingAttachment(true);

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `shipment-${currentShipment.salesOrder}-${Date.now()}.${fileExt}`;
      const filePath = `attachments/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('shipment-attachments')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        alert('فشل رفع المرفق: ' + uploadError.message);
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('shipment-attachments')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;
      console.log('Attachment uploaded successfully:', publicUrl);

      // Update shipment with attachment URL
      setCurrentShipment(prev => ({ ...prev, attachmentUrl: publicUrl }));
      alert('تم رفع المرفق بنجاح!');

    } catch (error) {
      console.error('Error uploading attachment:', error);
      alert('حدث خطأ أثناء رفع المرفق. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsUploadingAttachment(false);
      // Reset file input
      if (attachmentInputRef.current) {
        attachmentInputRef.current.value = '';
      }
    }
  };

  const handleSaveAsDraft = async () => {
    setIsSubmitting(true);
    try {
      const draftShipment = { ...currentShipment, status: ShipmentStatus.DRAFT };
      await updateShipment(draftShipment.id, draftShipment);
      await addNotification({ message: `تم حفظ الشحنة (${draftShipment.salesOrder}) كمسودة.`, category: NotificationCategory.USER_ACTION, targetRoles: [Role.ADMIN] });
      onClose();
    } catch (err) {
      console.error('Save as draft failed:', err);

      // Check if it's a network/CORS error and offer retry
      if (err.message && (err.message.includes('NetworkError') || err.message.includes('CORS') || err.message.includes('fetch'))) {
        const retry = confirm("فشل الاتصال بالخادم. هل تريد المحاولة مرة أخرى؟");
        if (retry) {
          // Retry after a short delay
          setTimeout(() => handleSaveAsDraft(), 1000);
          return;
        }
      }

      alert("فشل حفظ المسودة: " + (err.message || "خطأ غير معروف"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalize = async () => {
    // Validate transfer number before finalizing
    if (!currentShipment.transferNumber || currentShipment.transferNumber.trim().length < 8) {
      alert('رقم الحوالة يجب أن يكون 8 أرقام على الأقل قبل الاعتماد النهائي');
      return;
    }

    setIsSubmitting(true);
    try {
      let finalStatus = ShipmentStatus.FINAL;
      let modifiedFields = {};
      if (currentUser && (shipment.status === ShipmentStatus.FINAL || shipment.status === ShipmentStatus.FINAL_MODIFIED)) {
        finalStatus = ShipmentStatus.FINAL_MODIFIED;
        modifiedFields = {
          modifiedBy: currentUser.username,
          modifiedAt: new Date().toISOString(),
        }
      }

      // Calculate and save the final amount
      const finalAmount = calculateFinalAmount(currentShipment);
      const amountAfterDeductions = calculateAmountAfterDeductions(currentShipment);

      const finalShipment = {
        ...currentShipment,
        status: finalStatus,
        dueAmountAfterDiscount: amountAfterDeductions,
        totalDueAmount: finalAmount,
        ...modifiedFields
      };

      await updateShipment(finalShipment.id, finalShipment);
      await addNotification({ message: `تم اعتماد الشحنة (${finalShipment.salesOrder}) بشكل نهائي.`, category: NotificationCategory.USER_ACTION, targetRoles: [Role.ACCOUNTANT] });
      onClose();
    } catch (err) {
      console.error(err);
      alert("فشل اعتماد الشحنة");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    if (!currentUser) return;
    const driver = drivers.find((d: Driver) => d.id === currentShipment.driverId);
    const companyDetails = { companyName, companyAddress, companyPhone, companyLogo, isPrintHeaderEnabled };
    printShipmentDetails(currentShipment, driver, companyDetails, currentUser, regions);
  };

  const handleMoveToInstallments = async () => {
    if (!currentUser) return;
    setIsSubmitting(true);
    try {
      const finalAmount = calculateFinalAmount(currentShipment);

      // Convert negative amount to positive for debt collection
      const payableAmount = Math.abs(finalAmount);

      await createInstallment({
        shipmentId: currentShipment.id,
        payableAmount: payableAmount,
        remainingAmount: payableAmount,
        status: 'active',
        installmentType: 'debt_collection',
        originalAmount: finalAmount, // Store the original negative amount
        createdBy: currentUser.id,
        updatedBy: currentUser.id,
      });

      await addNotification({
        message: `تم ترحيل الشحنة (${currentShipment.salesOrder}) إلى التسديدات`,
        category: NotificationCategory.USER_ACTION,
        targetRoles: [Role.ADMIN]
      });

      alert('تم ترحيل الشحنة إلى التسديدات بنجاح');
      onClose();
    } catch (error: any) {
      console.error('Failed to move to installments:', error);
      if (error.message === 'Installment already exists for this shipment') {
        await addNotification({
          message: `فشل في ترحيل الشحنة (${currentShipment.salesOrder}) - يوجد تسديدات مسبق لها`,
          category: NotificationCategory.USER_ACTION,
          targetRoles: [Role.ADMIN]
        });
        alert('يوجد تسديدات مسبق لهذه الشحنة');
      } else {
        alert('فشل في ترحيل الشحنة إلى التسديدات');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturnToFleet = async () => {
    setIsSubmitting(true);
    try {
      const returnedShipment = {
        ...currentShipment,
        status: ShipmentStatus.RETURNED_TO_FLEET
      };

      await updateShipment(returnedShipment.id, returnedShipment);

      // Notify the fleet user who created this shipment
      if (currentShipment.createdBy) {
        await addNotification({
          message: `تم إرجاع الشحنة (${returnedShipment.salesOrder}) من الادمن لإعادة المراجعة.`,
          category: NotificationCategory.USER_ACTION,
          targetUserIds: [currentShipment.createdBy]
        });
      }

      onClose();
    } catch (err) {
      console.error("Failed to return to fleet:", err);
      alert("فشل إرجاع الشحنة إلى مسؤول الحركة.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFinal = currentShipment.status === ShipmentStatus.FINAL || currentShipment.status === ShipmentStatus.FINAL_MODIFIED;
  const hasInstallment = installments.some(i => i.shipmentId === currentShipment.id);
  const isViewOnly = currentShipment.status === ShipmentStatus.INSTALLMENTS || hasInstallment;
  const finalAmount = calculateFinalAmount(currentShipment);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`إدارة الشحنة: ${shipment.salesOrder}`} size="xl">
      <div className="space-y-4 p-1">

        <ShipmentStepper status={currentShipment.status} />

        <ProductDetails
          products={currentShipment.products}
          isExpanded={isProductsExpanded}
          onToggle={() => setIsProductsExpanded(!isProductsExpanded)}
        />

        <BasicInformationSection
          shipment={currentShipment}
          regionRoadExpenses={regionRoadExpenses}
          totalWeight={currentShipment.products.reduce((acc, sp) => {
            const product = products.find(p => p.id === sp.productId);
            return acc + ((product?.weightKg || 0) * sp.cartonCount);
          }, 0) / 1000}
        />

        <AdditionsSection
          shipment={currentShipment}
          onValueChange={handleValueChange}
          disabled={isViewOnly}
        />

        <ItemizedDeductionsSection
          products={currentShipment.products}
          deductionPrices={deductionPrices}
          orderDate={shipment.orderDate}
          onProductDeductionChange={handleProductDeductionChange}
          otherAmounts={currentShipment.otherAmounts || 0}
          onOtherAmountsChange={val => handleValueChange('otherAmounts', val)}
          disabled={isViewOnly}
        />

        <FinalCalculationSection
          finalAmount={finalAmount}
          shipment={currentShipment}
        />

        <NotesSection
          shipment={currentShipment}
          onValueChange={handleValueChange}
          disabled={isViewOnly}
        />

        {/* Attachment Section */}
        <div className="space-y-3 bg-secondary-50 dark:bg-secondary-900 p-3 rounded-md">
          <h4 className="font-bold text-lg">المرفقات</h4>
          <div className="flex flex-col gap-3">
            {/* Upload Button */}
            {!isViewOnly && (
              <div className="flex items-center gap-3">
                <input
                  ref={attachmentInputRef}
                  type="file"
                  accept="application/pdf,image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleAttachmentUpload}
                  className="hidden"
                  id="attachment-upload"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => attachmentInputRef.current?.click()}
                  disabled={isUploadingAttachment}
                >
                  {isUploadingAttachment ? (
                    <>
                      <Icons.RefreshCw className="ml-2 h-4 w-4 animate-spin" />
                      جاري الرفع...
                    </>
                  ) : (
                    <>
                      <Icons.FileText className="ml-2 h-4 w-4" />
                      رفع مرفق (PDF أو صورة)
                    </>
                  )}
                </Button>
                {currentShipment.attachmentUrl && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setCurrentShipment(prev => ({ ...prev, attachmentUrl: undefined }))}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Icons.Trash2 className="ml-1 h-4 w-4" />
                    إزالة
                  </Button>
                )}
              </div>
            )}
            {/* Attachment Preview/Link */}
            {currentShipment.attachmentUrl ? (
              <div className="flex items-center gap-3 p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                <Icons.FileText className="h-6 w-6 text-green-600" />
                <a
                  href={currentShipment.attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 underline text-sm"
                >
                  عرض المرفق
                </a>
                <span className="text-xs text-green-600 dark:text-green-400">✓ مرفق محمّل</span>
              </div>
            ) : (
              <div className="text-sm text-secondary-500 dark:text-secondary-400">
                لا يوجد مرفق (الحد الأقصى 1 ميجابايت - PDF أو صورة)
              </div>
            )}
          </div>
        </div>

        <TransferSection
          shipment={currentShipment}
          onValueChange={handleValueChange}
          disabled={isViewOnly}
        />

        {/* Warning message for negative amounts */}
        {finalAmount < 0 && (
          <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-md">
            <p className="text-sm text-orange-800 dark:text-orange-200 font-medium">
              هذا الشحنة يحتوي على خسارة - سيتم تحويله إلى تسديدات
            </p>
          </div>
        )}

        <div className="pt-6 border-t dark:border-secondary-600">
          {isViewOnly ? (
            // View-only mode: show only close button
            <div className="flex justify-center">
              <Button variant="secondary" onClick={onClose} className="px-8 py-3 text-lg font-semibold">
                إغلاق
              </Button>
            </div>
          ) : finalAmount < 0 ? (
            // Show only "ترحيل الى التسديدات" button for negative amounts
            <div className="flex justify-center">
              <Button
                variant="primary"
                onClick={handleMoveToInstallments}
                disabled={isSubmitting}
                className="px-8 py-3 text-lg font-semibold"
              >
                {isSubmitting ? 'جاري الترحيل...' : <> <Icons.ArrowRight className="ml-2 h-5 w-5" /> ترحيل الى التسديدات </>}
              </Button>
            </div>
          ) : (
            // Show normal buttons for non-negative amounts
            <div className="grid grid-cols-2 gap-3">
              {isFinal && (
                <Button variant="secondary" onClick={handlePrint} className="w-full">
                  <Icons.Printer className="ml-2 h-4 w-4" />
                  طباعة
                </Button>
              )}
              {!isFinal && <div></div>} {/* Empty space when print button is hidden */}

              <Button variant="secondary" onClick={onClose} disabled={isSubmitting} className="w-full">
                إغلاق
              </Button>

              <Button variant="secondary" onClick={handleSaveAsDraft} disabled={isSubmitting} className="w-full">
                {isSubmitting ? 'جاري الحفظ...' : <> <Icons.Save className="ml-2 h-4 w-4" /> حفظ كمسودة </>}
              </Button>

              <Button variant="secondary" onClick={handleReturnToFleet} disabled={isSubmitting} className="w-full">
                {isSubmitting ? 'جاري الإرجاع...' : <> <Icons.ArrowLeft className="ml-2 h-4 w-4" /> إرجاع الى مسؤول الحركة </>}
              </Button>

              <Button variant="primary" onClick={handleFinalize} disabled={isSubmitting} className="w-full">
                {isSubmitting ? 'جاري الحفظ...' : <> <Icons.Check className="ml-2 h-4 w-4" /> {shipment.status === ShipmentStatus.FINAL || shipment.status === ShipmentStatus.FINAL_MODIFIED ? 'تأكيد التعديل' : 'إغلاق نهائي'} </>}
              </Button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default AdminShipmentModal;