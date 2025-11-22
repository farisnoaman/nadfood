import React, { useState, useEffect } from 'react';
import { Shipment, ShipmentStatus, Role, NotificationCategory, Driver, Region } from '../../types';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import { Icons } from '../Icons';
import { printShipmentDetails } from '../../utils/print';
import { useAppContext } from '../../context/AppContext';
import FieldValue from '../common/FieldValue';
import ProductDetails from '../common/ProductDetails';
import ShipmentStepper from '../common/ShipmentStepper';

// --- Helper Functions and Sub-components ---

/** Basic Information Section - Read-only display of initial calculated values */
const BasicInformationSection: React.FC<{ shipment: Shipment; regionRoadExpenses: number }> = ({ shipment, regionRoadExpenses }) => (
    <div className="space-y-2 bg-secondary-50 dark:bg-secondary-900 p-3 rounded-md">
        <h4 className="font-bold text-lg">المعلومات الأساسية</h4>
        <div className="pt-2 border-t dark:border-secondary-700 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
            <FieldValue label="إجمالي الأجر" value={shipment.totalWage} />
            <FieldValue label="إجمالي الديزل" value={shipment.totalDiesel} />
            <FieldValue label="رسوم زعيتري" value={shipment.zaitriFee} />
            <FieldValue label="مصروفات إدارية" value={shipment.adminExpenses} />
            <FieldValue label="خرج الطريق" value={regionRoadExpenses} />
            <div className="md:col-span-2 pt-2 border-t dark:border-secondary-700">
                <FieldValue label="المبلغ المستحق" value={shipment.dueAmount} />
            </div>
        </div>
    </div>
);

/** Deductions Section - Editable form for all deductions */
const DeductionsSection: React.FC<{ 
    shipment: Shipment;
    isEditable: boolean; 
    onValueChange: (field: keyof Shipment, value: string) => void;
    onEditClick: () => void;
    amountAfterDeductions: number;
}> = ({ shipment, isEditable, onValueChange, onEditClick, amountAfterDeductions }) => (
    <div className="space-y-2 bg-secondary-50 dark:bg-secondary-900 p-3 rounded-md">
        <div className="flex justify-between items-center">
            <h4 className="font-bold text-lg">قسم الخصميات</h4>
            {!isEditable && (
                <Button size="sm" variant="ghost" onClick={onEditClick}>
                    <Icons.Edit className="ml-2 h-4 w-4" />
                    تعديل الخصميات
                </Button>
            )}
        </div>
        <div className="pt-2 border-t dark:border-secondary-700">
            {isEditable ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 py-2">
                    <Input label="التالف" type="number" min="0" value={shipment.damagedValue || ''} onChange={e => onValueChange('damagedValue', e.target.value)} />
                    <Input label="النقص" type="number" min="0" value={shipment.shortageValue || ''} onChange={e => onValueChange('shortageValue', e.target.value)} />
                    <Input label="مبالغ أخرى" type="number" min="0" value={shipment.otherAmounts || ''} onChange={e => onValueChange('otherAmounts', e.target.value)} />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2">
                    <FieldValue label="التالف" value={shipment.damagedValue} />
                    <FieldValue label="النقص" value={shipment.shortageValue} />
                    <FieldValue label="مبالغ أخرى" value={shipment.otherAmounts} />
                </div>
            )}
            {shipment.deductionsEditedBy && shipment.deductionsEditedAt && (
                <div className="text-xs text-yellow-600 dark:text-yellow-400 pt-2 mt-2 border-t border-dashed dark:border-secondary-600/50">
                    تم تعديل الخصميات بواسطة {shipment.deductionsEditedBy} في {new Date(shipment.deductionsEditedAt).toLocaleString('ar-EG')}
                </div>
            )}
            <div className="font-bold pt-2 mt-2 border-t dark:border-secondary-700">
                <FieldValue label="المبلغ بعد الخصم" value={amountAfterDeductions} />
            </div>
        </div>
    </div>
);

/** Additions Section */
const AdditionsSection: React.FC<{ shipment: Shipment; onValueChange: (field: keyof Shipment, value: string) => void; }> = ({ shipment, onValueChange }) => (
    <div className="space-y-3 bg-secondary-50 dark:bg-secondary-900 p-3 rounded-md">
        <h4 className="font-bold text-lg">قسم الإضافات</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <Input label="سندات تحسين" type="number" min="0" value={shipment.improvementBonds || ''} onChange={e => onValueChange('improvementBonds', e.target.value)} />
            <Input label="ممسى" type="number" min="0" value={shipment.eveningAllowance || ''} onChange={e => onValueChange('eveningAllowance', e.target.value)} />
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

/** Transfer Section */
const TransferSection: React.FC<{ shipment: Shipment; onValueChange: (field: keyof Shipment, value: string) => void; }> = ({ shipment, onValueChange }) => (
    <div className="space-y-3 bg-secondary-50 dark:bg-secondary-900 p-3 rounded-md">
        <h4 className="font-bold text-lg">قسم الحوالة</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <Input 
                label="رقم الحوالة (8 أرقام على الأقل)" 
                type="text" 
                minLength={8} 
                value={shipment.transferNumber || ''} 
                onChange={e => onValueChange('transferNumber', e.target.value)} 
                required
            />
            <Input 
                label="تاريخ الحوالة" 
                type="date" 
                value={shipment.transferDate || ''} 
                onChange={e => onValueChange('transferDate', e.target.value)} 
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
    updateShipment, currentUser, addNotification, drivers, regions,
    isPrintHeaderEnabled, companyName, companyAddress, companyPhone, companyLogo 
  } = useAppContext();
  const [currentShipment, setCurrentShipment] = useState<Shipment>({ ...shipment });
  const [isProductsExpanded, setIsProductsExpanded] = useState(false);
  const [isDeductionsEditable, setIsDeductionsEditable] = useState(false);
  const [showDeductionsEditConfirm, setShowDeductionsEditConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get region to display road expenses in basic info
  const shipmentRegion = regions.find((r: Region) => r.id === shipment.regionId);
  const regionRoadExpenses = shipmentRegion?.roadExpenses || 0;

  // Calculate amount after deductions
  const calculateAmountAfterDeductions = (ship: Shipment): number => {
    const dueAmount = ship.dueAmount || 0;
    const damagedValue = ship.damagedValue || 0;
    const shortageValue = ship.shortageValue || 0;
    const otherAmounts = ship.otherAmounts || 0;
    return dueAmount - damagedValue - shortageValue - otherAmounts;
  };

  // Calculate final amount
  const calculateFinalAmount = (ship: Shipment): number => {
    const amountAfterDeductions = calculateAmountAfterDeductions(ship);
    const improvementBonds = ship.improvementBonds || 0;
    const eveningAllowance = ship.eveningAllowance || 0;
    return amountAfterDeductions + improvementBonds + eveningAllowance;
  };

  useEffect(() => {
    setCurrentShipment({ ...shipment });
    setIsProductsExpanded(false);
    setIsDeductionsEditable(false);
    setShowDeductionsEditConfirm(false);
  }, [shipment]);

  const handleValueChange = (field: keyof Shipment, value: string) => {
    let processedValue: string | number = value;
    const numericFields: (keyof Shipment)[] = ['otherAmounts', 'improvementBonds', 'eveningAllowance', 'damagedValue', 'shortageValue'];
  
    if (numericFields.includes(field)) {
      processedValue = Math.max(0, Number(value));
    }
    
    let updatedShipment = { ...currentShipment, [field]: processedValue };
    
    // Track deductions editing
    const deductionFields: (keyof Shipment)[] = ['damagedValue', 'shortageValue', 'otherAmounts'];
    if (deductionFields.includes(field) && isDeductionsEditable && currentUser) {
        if (Number(processedValue) > 0) {
            updatedShipment = {
                ...updatedShipment,
                deductionsEditedBy: currentUser.username,
                deductionsEditedAt: new Date().toISOString(),
            };
        }
    }
    
    setCurrentShipment(updatedShipment);
  };
  
  const handleReturnToAccountant = async () => {
    setIsSubmitting(true);
    try {
        const returnedShipment = { ...currentShipment, status: ShipmentStatus.RETURNED_FOR_EDIT };
        await updateShipment(returnedShipment.id, returnedShipment);
        await addNotification({ message: `تم إرجاع الشحنة (${returnedShipment.salesOrder}) للتعديل.`, category: NotificationCategory.USER_ACTION, targetRoles: [Role.ACCOUNTANT] });
        onClose();
    } catch(err) {
        console.error(err);
        alert("فشل إرجاع الشحنة");
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
    } catch(err) {
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
    printShipmentDetails(currentShipment, driver, companyDetails, currentUser);
  };

  const isFinal = currentShipment.status === ShipmentStatus.FINAL || currentShipment.status === ShipmentStatus.FINAL_MODIFIED;
  const amountAfterDeductions = calculateAmountAfterDeductions(currentShipment);
  const finalAmount = calculateFinalAmount(currentShipment);

  return (
    <>
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
        />

        <DeductionsSection
            shipment={currentShipment}
            isEditable={isDeductionsEditable}
            onValueChange={handleValueChange}
            onEditClick={() => setShowDeductionsEditConfirm(true)}
            amountAfterDeductions={amountAfterDeductions}
        />
        
        <AdditionsSection 
            shipment={currentShipment} 
            onValueChange={handleValueChange} 
        />
        
        <FinalCalculationSection
            finalAmount={finalAmount}
            shipment={currentShipment}
        />
        
        <TransferSection
            shipment={currentShipment}
            onValueChange={handleValueChange}
        />

        <div className="flex flex-wrap justify-between items-center gap-3 pt-6 border-t dark:border-secondary-600">
            <div>
                 {isFinal && (
                    <Button variant="secondary" onClick={handlePrint}>
                        <Icons.Printer className="ml-2 h-4 w-4" />
                        طباعة
                    </Button>
                )}
            </div>
            <div className="flex flex-wrap justify-end gap-3">
                <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
                    إغلاق
                </Button>
                <Button variant="destructive" onClick={handleReturnToAccountant} disabled={isSubmitting}>
                    {isSubmitting ? 'جاري الإرجاع...' : <> <Icons.Undo2 className="ml-2 h-4 w-4" /> إرجاع للمحاسب </>}
                </Button>
                <Button variant="primary" onClick={handleFinalize} disabled={isSubmitting}>
                    {isSubmitting ? 'جاري الحفظ...' : <> <Icons.Check className="ml-2 h-4 w-4" /> {shipment.status === ShipmentStatus.FINAL || shipment.status === ShipmentStatus.FINAL_MODIFIED ? 'تأكيد التعديل' : 'اعتماد نهائي'} </>}
                </Button>
            </div>
        </div>
      </div>
    </Modal>
    
    <Modal isOpen={showDeductionsEditConfirm} onClose={() => setShowDeductionsEditConfirm(false)} title="تأكيد تعديل الخصميات">
        <div className="p-4 text-center">
            <Icons.AlertTriangle className="mx-auto h-12 w-12 text-yellow-500" />
            <p className="mt-4 text-lg">أنت على وشك تعديل بيانات تم إدخالها من قبل المحاسب.</p>
            <p className="mt-2 text-secondary-500">سيتم تسجيل هذا التغيير باسمك والتوقيت الحالي. هل أنت متأكد؟</p>
            <div className="mt-6 flex justify-center space-x-4 rtl:space-x-reverse">
                <Button variant="secondary" onClick={() => setShowDeductionsEditConfirm(false)}>إلغاء</Button>
                <Button variant="primary" onClick={() => { setIsDeductionsEditable(true); setShowDeductionsEditConfirm(false); }}>نعم، تأكيد ومتابعة</Button>
            </div>
        </div>
    </Modal>
    </>
  );
};

export default AdminShipmentModal;