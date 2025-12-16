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

/** Displays the complete summary of the shipment - read-only for accountant */
const ShipmentSummary: React.FC<{ shipment: Shipment; roadExpenses: number }> = ({ shipment, roadExpenses }) => (
  <div className="bg-secondary-100 dark:bg-secondary-900 p-3 rounded-md">
    <h4 className="font-bold mb-2">معلومات الشحنة</h4>
    <FieldValue label="إجمالي الأجر" value={shipment.totalWage} />
    <FieldValue label="إجمالي الديزل" value={shipment.totalDiesel} />
    <FieldValue label="خرج الطريق" value={roadExpenses} />
    <FieldValue label="رسوم زعيتري" value={shipment.zaitriFee} />
    <FieldValue label="مصروفات إدارية" value={shipment.adminExpenses} />
    <div className="font-bold mt-2"><FieldValue label="المبلغ المستحق" value={shipment.dueAmount} /></div>
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
    isPrintHeaderEnabled, companyName, companyAddress, companyPhone, companyLogo, currentUser
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

           <ShipmentSummary shipment={currentShipment} roadExpenses={roadExpenses} />

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
