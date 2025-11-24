import React, { useState, useEffect } from 'react';
import { Shipment, ShipmentStatus, Product, Region, Driver, NotificationCategory, Role, ShipmentProduct } from '../../types';
import { calculateInitialShipmentValues } from '../../utils/calculations';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import SearchableSelect from '../common/SearchableSelect';
import { Icons } from '../Icons';
import { useAppContext } from '../../context/AppContext';
import { checkDuplicateSalesOrder } from '../../utils/validation';

interface FleetShipmentModalProps {
  shipment: Shipment;
  isOpen: boolean;
  onClose: () => void;
}

const FleetShipmentModal: React.FC<FleetShipmentModalProps> = ({ shipment, isOpen, onClose }) => {
  const {
    updateShipment,
    products,
    regions,
    drivers,
    productPrices,
    addNotification
  } = useAppContext();

  const [currentShipment, setCurrentShipment] = useState<Shipment>({ ...shipment });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [driverSearchText, setDriverSearchText] = useState('');
  const [plateSearchText, setPlateSearchText] = useState('');

  // Check if this is a returned shipment that needs restricted editing
  const isReturnedShipment = shipment.status === ShipmentStatus.RETURNED_TO_FLEET;

  useEffect(() => {
    setCurrentShipment({ ...shipment });
    
    // Initialize driver search fields
    const driver = drivers.find((d: Driver) => d.id === shipment.driverId);
    if (driver) {
      setDriverSearchText(driver.name);
      setPlateSearchText(driver.plateNumber);
    }
  }, [shipment, drivers]);

  const handleValueChange = (field: keyof Shipment, value: string | number) => {
    setCurrentShipment(prev => ({ ...prev, [field]: value }));
  };

  const handleDriverSearch = (searchValue: string) => {
    setDriverSearchText(searchValue);
    const driver = drivers.find((d: Driver) => 
      d.name.toLowerCase().includes(searchValue.toLowerCase())
    );
    if (driver) {
      setPlateSearchText(driver.plateNumber);
      handleValueChange('driverId', driver.id);
    }
  };

  const handlePlateSearch = (searchValue: string) => {
    setPlateSearchText(searchValue);
    const driver = drivers.find((d: Driver) => 
      d.plateNumber.toLowerCase().includes(searchValue.toLowerCase())
    );
    if (driver) {
      setDriverSearchText(driver.name);
      handleValueChange('driverId', driver.id);
    }
  };

  const handleProductChange = (index: number, field: keyof ShipmentProduct, value: string | number) => {
    const updatedProducts = [...(currentShipment.products || [])];
    updatedProducts[index] = {
      ...updatedProducts[index],
      [field]: field === 'productId' || field === 'productName' ? String(value) : (value === '' ? 0 : Number(value))
    };
    setCurrentShipment(prev => ({ ...prev, products: updatedProducts }));
  };

  const handleAddProduct = () => {
    const newProduct: ShipmentProduct = {
      productId: '',
      productName: '',
      cartonCount: 0
    };
    setCurrentShipment(prev => ({
      ...prev,
      products: [...(prev.products || []), newProduct]
    }));
  };

  const handleRemoveProduct = (index: number) => {
    setCurrentShipment(prev => ({
      ...prev,
      products: (prev.products || []).filter((_, i) => i !== index)
    }));
  };

  const validateShipment = (): boolean => {
    if (!currentShipment.driverId) {
      alert('يرجى اختيار السائق');
      return false;
    }

    if (!currentShipment.regionId) {
      alert('يرجى اختيار المنطقة');
      return false;
    }

    if (!currentShipment.products || currentShipment.products.length === 0) {
      alert('يرجى إضافة منتج واحد على الأقل');
      return false;
    }

    for (const product of currentShipment.products) {
      if (!product.productId) {
        alert('يرجى اختيار جميع المنتجات');
        return false;
      }
      if (!product.cartonCount || product.cartonCount <= 0) {
        alert('يرجى إدخال عدد الكراتين لجميع المنتجات');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateShipment()) return;

    // Check for duplicate sales order
    const duplicateCheck = checkDuplicateSalesOrder(currentShipment.salesOrder, shipments, currentShipment.id);
    if (!duplicateCheck.isValid) {
      alert(duplicateCheck.error);
      return;
    }

    setIsSubmitting(true);
    try {
      // Recalculate all values based on updated data
      const calculatedValues = calculateInitialShipmentValues(
        currentShipment,
        regions,
        productPrices
      );

      const updatedShipment: Shipment = {
        ...currentShipment,
        ...calculatedValues,
        status: ShipmentStatus.FROM_SALES // Return to accountant after editing
      };

      await updateShipment(updatedShipment.id, updatedShipment);
      
      await addNotification({
        message: `تم تعديل الشحنة (${updatedShipment.salesOrder}) من قبل مسؤول الحركة وإعادة إرسالها للمراجعة.`,
        category: NotificationCategory.USER_ACTION,
        targetRoles: [Role.ACCOUNTANT]
      });

      alert('تم تحديث الشحنة بنجاح وإرسالها للمحاسب');
      onClose();
    } catch (error) {
      console.error('Error updating shipment:', error);
      alert('فشل في تحديث الشحنة. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const regionOptions = regions.map((region: Region) => ({
    value: region.id,
    label: region.name
  }));

  const productOptions = products
    .filter((p: Product) => p.isActive !== false)
    .map((product: Product) => ({
      value: product.id,
      label: product.name
    }));



  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`تعديل الشحنة: ${shipment.salesOrder}`} size="xl">
      <div className="space-y-6 p-1">
        {/* Status Badge */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start">
            <Icons.AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 ml-3 mt-0.5" />
            <div>
              <h4 className="font-bold text-yellow-800 dark:text-yellow-300">شحنة مرتجعة للتعديل</h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                تم إرجاع هذه الشحنة من قبل المحاسب. يمكنك الآن تعديل جميع البيانات بما في ذلك المنتجات وعدد الكراتين، ثم إعادة الإرسال.
              </p>
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="font-bold text-lg border-b pb-2">
            المعلومات الأساسية
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sales Order - Always editable */}
            <Input
              label="رقم أمر البيع (اختياري)"
              placeholder="أدخل رقم أمر البيع"
              value={currentShipment.salesOrder || ''}
              onChange={e => handleValueChange('salesOrder', e.target.value)}
            />
            

          </div>

          {/* Region - Always editable */}
          <SearchableSelect
            label="المنطقة *"
            options={regionOptions}
            value={currentShipment.regionId}
            onChange={(val) => handleValueChange('regionId', String(val))}
            placeholder="اختر المنطقة"
          />
        </div>



        {/* Driver Information */}
        <div className="space-y-4">
          <h3 className="font-bold text-lg border-b pb-2">معلومات السائق</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                اسم السائق *
              </label>
              <input
                type="text"
                placeholder="ابحث عن اسم السائق"
                value={driverSearchText}
                onChange={(e) => handleDriverSearch(e.target.value)}
                className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100"
                list="driver-names"
              />
              <datalist id="driver-names">
                {drivers.map((driver: Driver) => (
                  <option key={driver.id} value={driver.name} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                رقم اللوحة *
              </label>
              <input
                type="text"
                placeholder="ابحث عن رقم اللوحة"
                value={plateSearchText}
                onChange={(e) => handlePlateSearch(e.target.value)}
                className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100"
                list="plate-numbers"
              />
              <datalist id="plate-numbers">
                {drivers.map((driver: Driver) => (
                  <option key={driver.id} value={driver.plateNumber} />
                ))}
              </datalist>
            </div>
          </div>
        </div>

        {/* Products Section - Editable for all shipments */}
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="font-bold text-lg">
              {isReturnedShipment ? 'المنتجات (قابلة للتعديل)' : 'المنتجات'}
            </h3>
            <Button size="sm" variant="secondary" onClick={handleAddProduct}>
              <Icons.Plus className="ml-2 h-4 w-4" />
              إضافة منتج
            </Button>
          </div>

          {currentShipment.products && currentShipment.products.length > 0 ? (
            <div className="space-y-3">
              {currentShipment.products.map((product, index) => (
                <div key={index} className="bg-secondary-50 dark:bg-secondary-900 p-4 rounded-lg space-y-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">منتج {index + 1}</span>
                    {currentShipment.products && currentShipment.products.length > 1 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveProduct(index)}
                      >
                        <Icons.Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                     <SearchableSelect
                       label="المنتج *"
                       options={productOptions}
                       value={product.productId}
                       onChange={(val) => handleProductChange(index, 'productId', String(val))}
                       placeholder="اختر المنتج"
                     />

                     <Input
                       label="عدد الكراتين *"
                       type="number"
                       min="1"
                       placeholder="أدخل عدد الكراتين"
                       value={product.cartonCount === null || product.cartonCount === 0 ? '' : product.cartonCount}
                       onChange={e => handleProductChange(index, 'cartonCount', e.target.value)}
                     />
                   </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-secondary-500">
              <Icons.Package className="mx-auto h-12 w-12 mb-2 opacity-50" />
              <p>لا توجد منتجات. قم بإضافة منتج أولاً.</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            إلغاء
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'جاري الحفظ...' : (
              <>
                <Icons.Send className="ml-2 h-4 w-4" />
                {isReturnedShipment ? 'حفظ التعديلات وإعادة الإرسال' : 'حفظ وإرسال للمحاسب'}
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default FleetShipmentModal;
