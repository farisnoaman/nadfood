import React, { useState, useEffect } from 'react';
import { Shipment, ShipmentStatus, Role, NotificationCategory, Driver } from '../../../types';
import { printShipmentDetails } from '../../../utils/print';
import { formatDateForDisplay } from '../../../utils/dateFormatter';
import { useAppContext } from '../../../providers/AppContext';
import Modal from '../../common/ui/Modal';
import Button from '../../common/ui/Button';
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
  totalWeight: number;
  onUpdateDiesel?: (val: number) => void;
  onUpdateRoadExpenses?: (val: number) => void;
  isEditable?: boolean;
}> = ({ shipment, roadExpenses, totalWeight, onUpdateDiesel, onUpdateRoadExpenses, isEditable }) => {
  const [editingField, setEditingField] = useState<{ label: string; value: number; onSave: (val: number) => void } | null>(null);

  // Helper to open the edit modal
  const handleEdit = (label: string, value: number, onSave: (val: number) => void) => {
    setEditingField({ label, value, onSave });
  };

  return (
    <div className="bg-secondary-100 dark:bg-secondary-900 p-3 rounded-md relative">
      <h4 className="font-bold mb-2">معلومات الشحنة</h4>
      <div className="font-bold mb-2 text-primary-700 dark:text-primary-300">
        <FieldValue label="إجمالي الوزن" value={`${totalWeight.toLocaleString('en-US', { minimumFractionDigits: 3 })} طن`} currency="" />
      </div>
      <FieldValue label="إجمالي الأجر" value={shipment.totalWage} />

      <EditableFieldValue
        label="إجمالي الديزل"
        value={shipment.totalDiesel}
        onEdit={() => handleEdit('إجمالي الديزل', shipment.totalDiesel || 0, onUpdateDiesel || (() => { }))}
        isEditable={isEditable}
      />

      <EditableFieldValue
        label="خرج الطريق"
        value={roadExpenses}
        onEdit={() => handleEdit('خرج الطريق', roadExpenses || 0, onUpdateRoadExpenses || (() => { }))}
        isEditable={isEditable}
      />

      <FieldValue label="رسوم زعيتري" value={shipment.zaitriFee} />
      <FieldValue label="مصروفات إدارية" value={shipment.adminExpenses} />
      <div className="font-bold mt-2"><FieldValue label="المبلغ المستحق" value={shipment.dueAmount} /></div>

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
    isPrintHeaderEnabled, companyName, companyAddress, companyPhone, companyLogo, currentUser, products
  } = useAppContext();
  const [currentShipment, setCurrentShipment] = useState<Shipment>({ ...shipment });
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [zeroFields, setZeroFields] = useState<string[]>([]);
  const [isProductsExpanded, setIsProductsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasMissingPrice, setHasMissingPrice] = useState(false);

  const shipmentRegion = regions.find((r) => r.id === shipment.regionId);
  const roadExpenses = currentShipment.roadExpenses ?? (shipmentRegion?.roadExpenses || 0);

  useEffect(() => {
    setCurrentShipment({ ...shipment });
    setIsProductsExpanded(false);

    // Check for missing prices
    let missingPrice = false;
    if (shipment.products && shipment.products.length > 0) {
      for (const product of shipment.products) {
        const priceInfo = productPrices.find(pp => pp.regionId === shipment.regionId && pp.productId === product.productId);
        if (!priceInfo || priceInfo.price <= 0) {
          missingPrice = true;
          break;
        }
      }
    }
    setHasMissingPrice(missingPrice);
  }, [shipment, productPrices]);

  const updateFinancials = (updates: Partial<Shipment>) => {
    setCurrentShipment(prev => {
      const newState = { ...prev, ...updates };
      // Recalculate dueAmount
      // dueAmount = totalWage - totalDiesel - zaitriFee - adminExpenses - roadExpenses
      const rExp = newState.roadExpenses ?? (shipmentRegion?.roadExpenses || 0);
      const tDiesel = newState.totalDiesel || 0;
      const tWage = newState.totalWage || 0;
      const zFee = newState.zaitriFee || 0;
      const aExp = newState.adminExpenses || 0;

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
      console.error("Failed to return to fleet:", err);
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
        status: ShipmentStatus.SENT_TO_ADMIN
      };

      await updateShipment(finalShipmentToSend.id, finalShipmentToSend);
      await addNotification({
        message: `تم ترحيل الشحنة (${finalShipmentToSend.salesOrder}) إلى المدير للمراجعة.`,
        category: NotificationCategory.USER_ACTION,
        targetRoles: [Role.ADMIN]
      });
      onClose();
    } catch (err) {
      console.error("Failed to send to admin:", err);
      alert("فشل إرسال الشحنة للمدير.");
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

  const isFinal = currentShipment.status === ShipmentStatus.FINAL || currentShipment.status === ShipmentStatus.FINAL_MODIFIED;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={`تفاصيل الشحنة: ${shipment.salesOrder}`} size="lg">
        <div className="space-y-4 p-1">
          <div className="text-sm text-secondary-500 dark:text-secondary-400">
            تاريخ الطلب: {formatDateForDisplay(shipment.orderDate)}
          </div>
          <ShipmentStepper status={currentShipment.status} />

          <ProductDetails
            products={currentShipment.products}
            isExpanded={isProductsExpanded}
            onToggle={() => setIsProductsExpanded(!isProductsExpanded)}
            title="المنتجات"
          />

          <ShipmentSummary
            shipment={currentShipment}
            roadExpenses={roadExpenses}
            onUpdateDiesel={handleUpdateDiesel}
            onUpdateRoadExpenses={handleUpdateRoadExpenses}
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
              <div className="flex justify-end space-x-3 rtl:space-x-reverse">
                <Button variant="secondary" onClick={handleReturnToFleet} disabled={isSubmitting}>
                  {isSubmitting ? 'جاري الإرسال...' : <> <Icons.ArrowLeft className="ml-2 h-4 w-4" /> إرجاع الى مسؤول الحركة </>}
                </Button>
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
