import React, { useState, useEffect } from 'react';
import { Shipment, ShipmentStatus, Role, NotificationCategory, Driver, ShipmentProduct } from '../../../types/types';
import { printShipmentDetails } from '../../../utils/print';
import { formatDateForDisplay } from '../../../utils/dateFormatter';
import { useAppContext } from '../../../providers/AppContext';
import logger from '../../../utils/logger';
import Modal from '../../common/ui/Modal';
import Button from '../../common/ui/Button';
import Input from '../../common/ui/Input';
import ArabicDatePicker from '../../common/ui/ArabicDatePicker';
import { Icons } from '../../Icons';
import FieldValue from '../../common/components/FieldValue';
import ProductDetails from '../../common/components/ProductDetails';
import ShipmentStepper from '../../common/components/ShipmentStepper';

// --- Helper Functions and Sub-components ---

const EditFieldDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (val: number) => void;
  label: string;
  initialValue: number;
}> = ({ isOpen, onClose, onSave, label, initialValue }) => {
  const [value, setValue] = useState(initialValue?.toString() || '');

  useEffect(() => {
    setValue(initialValue?.toString() || '');
  }, [initialValue, isOpen]);

  const handleSave = () => {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      onSave(num);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`تعديل ${label}`} size="sm">
      <div className="p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {label}
          </label>
          <input
            type="number"
            className="w-full px-3 py-2 border rounded-md dark:bg-secondary-800 dark:border-secondary-600 focus:ring-primary-500 focus:border-primary-500"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoFocus
          />
        </div>
        <div className="flex justify-end space-x-3 rtl:space-x-reverse pt-2">
          <Button variant="secondary" onClick={onClose}>إلغاء</Button>
          <Button variant="primary" onClick={handleSave}>حفظ</Button>
        </div>
      </div>
    </Modal>
  );
};

const EditableFieldValue: React.FC<{
  label: string;
  value: number | undefined;
  onEdit: () => void;
  isEditable?: boolean
}> = ({ label, value, onEdit, isEditable }) => {
  if (!isEditable) return <FieldValue label={label} value={value} />;

  return (
    <div className="flex justify-between py-1 text-sm items-center">
      <span className="font-semibold text-secondary-600 dark:text-secondary-400">{label}:</span>
      <div className="flex items-center gap-2">
        <span className="text-secondary-800 dark:text-secondary-200">
          {value !== undefined ? `${Number(value).toLocaleString('en-US')} ر.ي` : '-'}
        </span>
        <button onClick={onEdit} className="text-primary-600 hover:text-primary-700 p-1 hover:bg-secondary-200 dark:hover:bg-secondary-700 rounded transition-colors" title="تعديل">
          <Icons.Edit className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

/** Displays the complete summary of the shipment - read-only for accountant */
const ShipmentSummary: React.FC<{
  shipment: Shipment;
  roadExpenses: number;
  adminExpenses: number;
  totalWeight: number;
  onUpdateDiesel?: (val: number) => void;
  onUpdateRoadExpenses?: (val: number) => void;
  onUpdateAdminExpenses?: (val: number) => void;
  isEditable?: boolean;
}> = ({ shipment, roadExpenses, adminExpenses, totalWeight, onUpdateDiesel, onUpdateRoadExpenses, onUpdateAdminExpenses, isEditable }) => {
  const [editingField, setEditingField] = useState<{ label: string; value: number; onSave: (val: number) => void } | null>(null);

  // Helper to open the edit modal
  const handleEdit = (label: string, value: number, onSave: (val: number) => void) => {
    setEditingField({ label, value, onSave });
  };

  return (
    <div className="bg-secondary-100 dark:bg-secondary-900 p-3 rounded-md relative text-sm">
      <h4 className="font-bold mb-3 text-base">معلومات الشحنة</h4>

      <div className="font-bold mb-2 pb-2 border-b border-gray-400 dark:border-gray-600 text-primary-700 dark:text-primary-300">
        <FieldValue label="إجمالي الوزن" value={`${totalWeight.toLocaleString('en-US', { minimumFractionDigits: 3 })} طن`} currency="" />
      </div>

      <div className="mb-2 pb-2 border-b border-gray-400 dark:border-gray-600">
        <FieldValue label="إجمالي الأجر" value={shipment.totalWage} />
      </div>

      <div className="mb-2 pb-2 border-b border-gray-400 dark:border-gray-600">
        <EditableFieldValue
          label="إجمالي الديزل"
          value={shipment.totalDiesel}
          onEdit={() => handleEdit('إجمالي الديزل', shipment.totalDiesel || 0, onUpdateDiesel || (() => { }))}
          isEditable={isEditable}
        />
      </div>

      <div className="mb-2 pb-2 border-b border-gray-400 dark:border-gray-600">
        <EditableFieldValue
          label="خرج الطريق"
          value={roadExpenses}
          onEdit={() => handleEdit('خرج الطريق', roadExpenses || 0, onUpdateRoadExpenses || (() => { }))}
          isEditable={isEditable}
        />
      </div>

      <div className="mb-2 pb-2 border-b border-gray-400 dark:border-gray-600">
        <FieldValue label="رسوم زعيتري" value={shipment.zaitriFee} />
      </div>

      <div className="mb-2 pb-2 border-b border-gray-400 dark:border-gray-600">
        <EditableFieldValue
          label="مصروفات إدارية"
          value={adminExpenses}
          onEdit={() => handleEdit('مصروفات إدارية', adminExpenses || 0, onUpdateAdminExpenses || (() => { }))}
          isEditable={isEditable}
        />
      </div>

      <div className="font-bold mt-2 pt-1"><FieldValue label="المبلغ المستحق" value={shipment.dueAmount} /></div>

      {/* Edit Dialog - Rendered here to be part of the tree, but Modal typically portals out */}
      {editingField && (
        <EditFieldDialog
          isOpen={!!editingField}
          onClose={() => setEditingField(null)}
          onSave={editingField.onSave}
          label={editingField.label}
          initialValue={editingField.value}
        />
      )}
    </div>
  );
};

/** A helper component for collapsible sections */
const CollapsibleSection: React.FC<{
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  className?: string; // Optional
}> = ({ title, isOpen, onToggle, children, className = "" }) => (
  <div className={`bg-secondary-50 dark:bg-secondary-900 rounded-md ${className}`}>
    <button
      type="button"
      className="w-full flex justify-between items-center p-3 text-right font-bold"
      onClick={onToggle}
      aria-expanded={isOpen}
    >
      <span>{title}</span>
      <Icons.ChevronDown className={`h-5 w-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
    </button>
    {isOpen && (
      <div className="p-3 border-t border-secondary-200 dark:border-secondary-700 space-y-2">
        {children}
      </div>
    )}
  </div>
);

/** A confirmation dialog for sending with zero values. */
const ConfirmationDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  zeroFields: string[];
}> = ({ isOpen, onClose, onConfirm, isSubmitting, zeroFields }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="تأكيد الإرسال">
    <div className="p-4 text-center">
      <Icons.AlertTriangle className="mx-auto h-12 w-12 text-yellow-500" />
      <p className="mt-4 mb-2">الحقول التالية تساوي صفر:</p>
      <ul className="text-sm text-yellow-800 dark:text-yellow-200 mb-4">
        {zeroFields.map((field, idx) => <li key={idx}>• {field}</li>)}
      </ul>
      <p>هل أنت متأكد من الإرسال؟</p>
      <div className="mt-6 flex justify-center space-x-4 rtl:space-x-reverse">
        <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>إلغاء</Button>
        <Button variant="primary" onClick={onConfirm} disabled={isSubmitting}>{isSubmitting ? 'جاري التأكيد...' : 'نعم، تأكيد'}</Button>
      </div>
    </div>
  </Modal>
);


// --- Main Modal Component ---

interface AccountantShipmentModalProps {
  shipment: Shipment;
  isOpen: boolean;
  onClose: () => void;
  isEditable: boolean;
}

const AccountantShipmentModal: React.FC<AccountantShipmentModalProps> = ({ shipment, isOpen, onClose, isEditable }) => {
  const {
    updateShipment, addNotification, accountantPrintAccess, drivers, productPrices, regions,
    regionConfigs, deductionPrices,
    isPrintHeaderEnabled, companyName, companyAddress, companyPhone, companyLogo, currentUser, products,
    accountantDeductionsAccess, accountantAdditionsAccess, accountantTransferAccess
  } = useAppContext();
  const [currentShipment, setCurrentShipment] = useState<Shipment>({ ...shipment });
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [zeroFields, setZeroFields] = useState<string[]>([]);
  const [isProductsExpanded, setIsProductsExpanded] = useState(false);
  const [isDeductionsExpanded, setIsDeductionsExpanded] = useState(false);
  const [isAdditionsExpanded, setIsAdditionsExpanded] = useState(false);
  const [isNotesExpanded, setIsNotesExpanded] = useState(false);
  const [isTransferExpanded, setIsTransferExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasMissingPrice, setHasMissingPrice] = useState(false);

  // Get region config based on order date (for versioned pricing)
  const getRegionConfig = (regionId: string, orderDate: string) => {
    const relevantConfigs = regionConfigs.filter(rc =>
      rc.regionId === regionId &&
      rc.effectiveFrom <= orderDate
    );

    return relevantConfigs.sort((a, b) =>
      new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime()
    )[0];
  };

  const regionConfig = getRegionConfig(shipment.regionId, shipment.orderDate);
  const roadExpenses = currentShipment.roadExpenses ?? (regionConfig?.roadExpenses || 0);

  useEffect(() => {
    const updatedShipment = { ...shipment };

    // Auto-calculate defaults from RegionConfig if missing or zero
    if (regionConfig) {
      if (!updatedShipment.totalDiesel && regionConfig.dieselLiters && regionConfig.dieselLiterPrice) {
        updatedShipment.totalDiesel = regionConfig.dieselLiters * regionConfig.dieselLiterPrice;
      }
      if (!updatedShipment.roadExpenses && regionConfig.roadExpenses) {
        updatedShipment.roadExpenses = regionConfig.roadExpenses;
      }
      if (!updatedShipment.zaitriFee && regionConfig.zaitriFee) {
        updatedShipment.zaitriFee = regionConfig.zaitriFee;
      }
      if (!updatedShipment.adminExpenses && regionConfig.adminExpenses) {
        updatedShipment.adminExpenses = regionConfig.adminExpenses;
      }

      // Recalculate dueAmount
      const tWage = updatedShipment.totalWage || 0;
      const tDiesel = updatedShipment.totalDiesel || 0;
      const zFee = updatedShipment.zaitriFee || 0;
      const aExp = updatedShipment.adminExpenses || 0;
      const rExp = updatedShipment.roadExpenses || 0;

      updatedShipment.dueAmount = tWage - tDiesel - zFee - aExp - rExp;
    }

    setCurrentShipment(updatedShipment);
    setIsProductsExpanded(false);

    // Check for missing prices using date-based lookup
    let missingPrice = false;
    if (shipment.products && shipment.products.length > 0) {
      for (const product of shipment.products) {
        const relevantPrices = productPrices.filter(pp =>
          pp.regionId === shipment.regionId &&
          pp.productId === product.productId &&
          pp.effectiveFrom <= shipment.orderDate
        );
        const priceInfo = relevantPrices.sort((a, b) =>
          new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime()
        )[0];

        if (!priceInfo || priceInfo.price <= 0) {
          missingPrice = true;
          break;
        }
      }
    }
    setHasMissingPrice(missingPrice);
  }, [shipment, productPrices, regionConfigs]);

  const updateFinancials = (updates: Partial<Shipment>) => {
    setCurrentShipment(prev => {
      const newState = { ...prev, ...updates };
      // Recalculate dueAmount
      // dueAmount = totalWage - totalDiesel - zaitriFee - adminExpenses - roadExpenses
      const rExp = newState.roadExpenses ?? (regionConfig?.roadExpenses || 0);
      const tDiesel = newState.totalDiesel || 0;
      const tWage = newState.totalWage || 0;
      const zFee = newState.zaitriFee || 0;
      const aExp = newState.adminExpenses ?? (regionConfig?.adminExpenses || 0);

      newState.dueAmount = tWage - tDiesel - zFee - aExp - rExp;
      return newState;
    });
  };

  const handleUpdateDiesel = (val: number) => {
    updateFinancials({ totalDiesel: val });
  };

  const handleUpdateRoadExpenses = (val: number) => {
    updateFinancials({ roadExpenses: val });
  };

  const handleUpdateAdminExpenses = (val: number) => {
    updateFinancials({ adminExpenses: val });
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
          message: `تم إرجاع الشحنة (${returnedShipment.salesOrder}) من المحاسب لإعادة المراجعة.`,
          category: NotificationCategory.USER_ACTION,
          targetUserIds: [currentShipment.createdBy]
        });
      }

      onClose();
    } catch (err) {
      logger.error("Failed to return to fleet:", err);
      alert("فشل إرجاع الشحنة إلى مسؤول الحركة.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmAndSend = () => {
    // Check for zero values
    const zeros: string[] = [];
    if (!currentShipment.totalDiesel || currentShipment.totalDiesel === 0) zeros.push('إجمالي الديزل');
    if (!currentShipment.zaitriFee || currentShipment.zaitriFee === 0) zeros.push('رسوم زعيتري');
    if (!currentShipment.adminExpenses || currentShipment.adminExpenses === 0) zeros.push('مصروفات إدارية');
    if (!roadExpenses || roadExpenses === 0) zeros.push('خرج الطريق');

    if (zeros.length > 0) {
      setZeroFields(zeros);
      setShowConfirmation(true);
    } else {
      confirmAndSend();
    }
  };

  const confirmAndSend = async () => {
    setIsSubmitting(true);
    setShowConfirmation(false);
    try {
      const finalShipmentToSend = {
        ...currentShipment,
        status: ShipmentStatus.SENT_TO_ADMIN,
        lastUpdatedRole: currentUser?.role
      };

      await updateShipment(finalShipmentToSend.id, finalShipmentToSend);
      await addNotification({
        message: `تم ترحيل الشحنة (${finalShipmentToSend.salesOrder}) إلى المدير للمراجعة.`,
        category: NotificationCategory.USER_ACTION,
        targetRoles: [Role.ADMIN]
      });
      onClose();
    } catch (err) {
      logger.error("Failed to send to admin:", err);
      alert("فشل إرسال الشحنة للمدير.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAsDraft = async () => {
    setIsSubmitting(true);
    try {
      const draftShipment = {
        ...currentShipment,
        status: ShipmentStatus.ACCOUNTANT_DRAFT,
        lastUpdatedRole: currentUser?.role
      };
      await updateShipment(draftShipment.id, draftShipment);
      await addNotification({
        message: `تم حفظ الشحنة (${draftShipment.salesOrder}) كمسودة.`,
        category: NotificationCategory.USER_ACTION,
        targetRoles: [Role.ACCOUNTANT]
      });
      onClose();
    } catch (err) {
      logger.error('Save as draft failed:', err);
      alert("فشل حفظ المسودة: " + ((err as any).message || "خطأ غير معروف"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handlers for deduction changes (if allowed)
  const handleProductDeductionChange = (
    productId: string,
    field: keyof Pick<ShipmentProduct, 'shortageCartons' | 'shortageExemptionRate' | 'damagedCartons' | 'damagedExemptionRate'>,
    value: number
  ) => {
    setCurrentShipment(prev => {
      const updatedProducts = prev.products.map(p => {
        if (p.productId !== productId) return p;
        const updatedProduct = { ...p, [field]: value };
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

  const handleValueChange = (field: keyof Shipment, value: string | number) => {
    setCurrentShipment(prev => ({ ...prev, [field]: value }));
  };

  // Check if any admin-assigned section is enabled for accountant
  const hasAdminAssignedSections = accountantDeductionsAccess || accountantAdditionsAccess || accountantTransferAccess;

  const handlePrint = () => {
    if (!currentUser) return;
    const driver = drivers.find((d: Driver) => d.id === currentShipment.driverId);
    const companyDetails = { companyName, companyAddress, companyPhone, companyLogo, isPrintHeaderEnabled };
    printShipmentDetails(currentShipment, driver, companyDetails, currentUser, regions, products);
  };

  const isFinal = currentShipment.status === ShipmentStatus.FINAL || currentShipment.status === ShipmentStatus.FINAL_MODIFIED;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={`تفاصيل الشحنة: ${shipment.salesOrder}`} size="lg">
        <div className="space-y-4 p-1">
          <div className="text-sm text-secondary-500 dark:text-secondary-400">
            تاريخ الطلب: {formatDateForDisplay(shipment.orderDate)}
          </div>
          <ShipmentStepper
            status={currentShipment.status}
            dates={{
              traffic: currentShipment.orderDate,
              accounting: currentShipment.modifiedAt,
              admin: currentShipment.updated_at
            }}
          />

          <ProductDetails
            products={currentShipment.products}
            isExpanded={isProductsExpanded}
            onToggle={() => setIsProductsExpanded(!isProductsExpanded)}
            title="المنتجات"
          />

          <ShipmentSummary
            shipment={currentShipment}
            roadExpenses={roadExpenses}
            adminExpenses={currentShipment.adminExpenses ?? (regionConfig?.adminExpenses || 0)}
            onUpdateDiesel={handleUpdateDiesel}
            onUpdateRoadExpenses={handleUpdateRoadExpenses}
            onUpdateAdminExpenses={handleUpdateAdminExpenses}
            isEditable={isEditable}
            totalWeight={currentShipment.products.reduce((acc, sp) => {
              const product = products.find(p => p.id === sp.productId);
              return acc + ((product?.weightKg || 0) * sp.cartonCount);
            }, 0) / 1000}
          />

          {/* Warning for missing prices */}
          {isEditable && hasMissingPrice && (
            <div className="p-3 bg-red-100 dark:bg-red-900/40 border border-red-300 dark:border-red-700 rounded-md text-center">
              <div className="flex items-center justify-center">
                <Icons.AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 ml-2" />
                <p className="text-sm font-semibold text-red-800 dark:text-red-200">
                  سعر المنتج مفقود. الرجاء إبلاغ المدير بإدخال سعر المنتج
                </p>
              </div>
            </div>
          )}

          {/* Deductions Section - Only if enabled for accountant */}
          {accountantDeductionsAccess && isEditable && (
            <CollapsibleSection
              title="قسم الاستقطاعات (مفصل بالمنتج)"
              isOpen={isDeductionsExpanded}
              onToggle={() => setIsDeductionsExpanded(!isDeductionsExpanded)}
            >
              <div className="space-y-4">
                {currentShipment.products.map(product => {
                  const relevantPrices = deductionPrices.filter(dp =>
                    dp.productId === product.productId && dp.effectiveFrom <= shipment.orderDate
                  );
                  const latestPrice = relevantPrices.sort((a, b) =>
                    new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime()
                  )[0];
                  const prices = { shortage: latestPrice?.shortagePrice || 0, damaged: latestPrice?.damagedPrice || 0 };
                  return (
                    <div key={product.productId} className="p-3 bg-white dark:bg-secondary-800 rounded-lg border dark:border-secondary-700 shadow-sm">
                      <div className="mb-3">
                        <p className="font-bold text-gray-800 dark:text-gray-100">{product.productName}</p>
                        <p className="text-xs text-secondary-500 mt-1">سعر النقص: {prices.shortage} ر.ي | سعر التالف: {prices.damaged} ر.ي</p>
                      </div>
                      <div className="flex flex-col gap-3">
                        <div className="bg-red-50 dark:bg-red-900/10 p-2 rounded-md border border-red-100 dark:border-red-900/20">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-semibold text-red-700 dark:text-red-400">النقص</span>
                            <span className="text-xs font-bold text-red-600">{product.shortageValue || 0} ر.ي</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Input label="عدد الكراتين" type="number" min={0} value={product.shortageCartons || ''} onChange={e => handleProductDeductionChange(product.productId, 'shortageCartons', Number(e.target.value) || 0)} />
                            <Input label="نسبة الإعفاء %" type="number" min={0} max={100} value={product.shortageExemptionRate || ''} onChange={e => handleProductDeductionChange(product.productId, 'shortageExemptionRate', Math.min(100, Math.max(0, Number(e.target.value) || 0)))} />
                          </div>
                        </div>
                        <div className="bg-orange-50 dark:bg-orange-900/10 p-2 rounded-md border border-orange-100 dark:border-orange-900/20">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-semibold text-orange-700 dark:text-orange-400">التالف</span>
                            <span className="text-xs font-bold text-orange-600">{product.damagedValue || 0} ر.ي</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Input label="عدد الكراتين" type="number" min={0} value={product.damagedCartons || ''} onChange={e => handleProductDeductionChange(product.productId, 'damagedCartons', Number(e.target.value) || 0)} />
                            <Input label="نسبة الإعفاء %" type="number" min={0} max={100} value={product.damagedExemptionRate || ''} onChange={e => handleProductDeductionChange(product.productId, 'damagedExemptionRate', Math.min(100, Math.max(0, Number(e.target.value) || 0)))} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <Input label="مبالغ أخرى" type="number" min={0} value={currentShipment.otherAmounts || ''} onChange={e => handleValueChange('otherAmounts', Number(e.target.value) || 0)} />
              </div>
            </CollapsibleSection>
          )}

          {/* Additions Section - Only if enabled for accountant */}
          {accountantAdditionsAccess && isEditable && (
            <CollapsibleSection
              title="قسم الاستحقاقات (الإضافات)"
              isOpen={isAdditionsExpanded}
              onToggle={() => setIsAdditionsExpanded(!isAdditionsExpanded)}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input label="سندات تحسين" type="number" min={0} value={currentShipment.improvementBonds || ''} onChange={e => handleValueChange('improvementBonds', Number(e.target.value) || 0)} />
                <Input label="ممسى" type="number" min={0} value={currentShipment.eveningAllowance || ''} onChange={e => handleValueChange('eveningAllowance', Number(e.target.value) || 0)} />
                <Input label="رسوم التحويل" type="number" min={0} value={currentShipment.transferFee || ''} onChange={e => handleValueChange('transferFee', Number(e.target.value) || 0)} />
              </div>
            </CollapsibleSection>
          )}

          {/* Notes Section - Always visible if any section is assigned */}
          {hasAdminAssignedSections && isEditable && (
            <CollapsibleSection
              title="الملاحظات"
              isOpen={isNotesExpanded}
              onToggle={() => setIsNotesExpanded(!isNotesExpanded)}
            >
              <textarea
                className="w-full px-3 py-2 border rounded-md dark:bg-secondary-800 dark:border-secondary-600 focus:ring-primary-500 focus:border-primary-500 min-h-[100px]"
                value={currentShipment.notes || ''}
                onChange={e => handleValueChange('notes', e.target.value)}
                placeholder="أضف ملاحظات هنا..."
              />
            </CollapsibleSection>
          )}

          {/* Transfer Section - Only if enabled for accountant */}
          {accountantTransferAccess && isEditable && (
            <CollapsibleSection
              title="قسم الحوالة"
              isOpen={isTransferExpanded}
              onToggle={() => setIsTransferExpanded(!isTransferExpanded)}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="رقم الحوالة (8 أرقام على الأقل)"
                  type="text"
                  minLength={8}
                  value={currentShipment.transferNumber || ''}
                  onChange={e => handleValueChange('transferNumber', e.target.value)}
                  required
                />
                <ArabicDatePicker
                  label="تاريخ الحوالة"
                  value={currentShipment.transferDate || ''}
                  onChange={(value) => handleValueChange('transferDate', value)}
                />
              </div>
            </CollapsibleSection>
          )}

          <div className="flex flex-wrap justify-between items-center gap-3 pt-4 border-t dark:border-secondary-600">
            <div>
              {isFinal && accountantPrintAccess && (
                <Button variant="secondary" onClick={handlePrint}>
                  <Icons.Printer className="ml-2 h-4 w-4" />
                  طباعة
                </Button>
              )}
            </div>

            {isEditable && (
              <div className="flex flex-wrap justify-end gap-3">
                <Button variant="secondary" onClick={handleReturnToFleet} disabled={isSubmitting}>
                  {isSubmitting ? 'جاري الإرسال...' : <> <Icons.ArrowLeft className="ml-2 h-4 w-4" /> إرجاع الى مسؤول الحركة </>}
                </Button>
                {hasAdminAssignedSections && (
                  <Button variant="secondary" onClick={handleSaveAsDraft} disabled={isSubmitting}>
                    {isSubmitting ? 'جاري الحفظ...' : <> <Icons.Save className="ml-2 h-4 w-4" /> حفظ كمسودة </>}
                  </Button>
                )}
                <Button
                  variant="primary"
                  onClick={handleConfirmAndSend}
                  disabled={isSubmitting || hasMissingPrice}
                >
                  {isSubmitting ? 'جاري الإرسال...' : <> <Icons.Send className="ml-2 h-4 w-4" /> تأكيد و إرسال للمدير </>}
                </Button>
              </div>
            )}

          </div>
        </div>
      </Modal>

      <ConfirmationDialog
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={confirmAndSend}
        isSubmitting={isSubmitting}
        zeroFields={zeroFields}
      />
    </>
  );
};

export default AccountantShipmentModal;
