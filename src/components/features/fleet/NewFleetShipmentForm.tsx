import React, { useState } from 'react';
import { Region, Driver, Product, ShipmentProduct, Shipment, ShipmentStatus, ProductPrice, Role, NotificationCategory } from '../../../types/types';
import { calculateInitialShipmentValues } from '../../../utils/calculations';
import { sanitizeInput } from '../../../utils/sanitization';
import Button from '../../common/ui/Button';
import Card from '../../common/display/Card';
import Input from '../../common/ui/Input';
import Modal from '../../common/ui/Modal';
import ArabicDatePicker from '../../common/ui/ArabicDatePicker';
import { Icons } from '../../Icons';
import SearchableSelect from '../../common/forms/SearchableSelect';
import { useAppContext } from '../../../providers/AppContext';
import { checkDuplicateSalesOrder } from '../../../utils/validation';
import toast from 'react-hot-toast';
import logger from '../../../utils/logger';

/**
 * Enhanced SearchableSelect for drivers that allows searching by name or plate number
 */
const DriverSearchableSelect: React.FC<{
  drivers: Driver[];
  value: number | '';
  onChange: (val: number) => void;
  label: string;
  id: string;
}> = ({ drivers, value, onChange, label, id }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  const selectedDriver = drivers.find(driver => driver.id === value);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [wrapperRef]);

  // Filter by both name and plate number
  const filteredDrivers = drivers.filter(driver =>
    driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.plateNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (driver: Driver) => {
    onChange(driver.id);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (!isOpen) setIsOpen(true);
  };

  const displayValue = isOpen ? searchTerm : selectedDriver ? `${selectedDriver.name} - ${selectedDriver.plateNumber}` : '';

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="w-full" ref={wrapperRef}>
      {label && <label htmlFor={id} className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">{label}</label>}
      <div className="relative">
        <input
          id={id}
          type="text"
          className="block w-full rounded-lg border-2 text-base py-2.5 transition-colors duration-200 focus:outline-none focus:ring-2 border-secondary-300 bg-secondary-50 text-secondary-900 placeholder-secondary-400 focus:border-primary-500 focus:ring-primary-500/30 dark:border-secondary-600 dark:bg-secondary-700 dark:text-secondary-100 dark:placeholder-secondary-500 ps-4 pe-10"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={() => {
            setSearchTerm('');
            setIsOpen(true);
          }}
          onClick={toggleOpen}
          placeholder={selectedDriver ? `${selectedDriver.name} - ${selectedDriver.plateNumber}` : "ابحث باسم السائق أو رقم اللوحة"}
        />
        <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-3">
          <Icons.ChevronDown className={`h-5 w-5 text-secondary-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
        </div>
        {isOpen && (
          <div className="absolute z-10 mt-1 w-full rounded-md bg-white dark:bg-secondary-700 shadow-lg border dark:border-secondary-600 max-h-60 overflow-auto">
            <ul className="py-1">
              {filteredDrivers.length > 0 ? (
                filteredDrivers.map(driver => (
                  <li
                    key={driver.id}
                    className="cursor-pointer select-none relative py-2 ps-10 pe-4 text-secondary-900 dark:text-secondary-100 hover:bg-primary-100 dark:hover:bg-primary-900"
                    onClick={() => handleSelect(driver)}
                  >
                    <div className={`block ${selectedDriver?.id === driver.id ? 'font-semibold' : 'font-normal'}`}>
                      <div>{driver.name}</div>
                      <div className="text-xs text-secondary-500 dark:text-secondary-400">{driver.plateNumber}</div>
                    </div>
                    {selectedDriver?.id === driver.id && (
                      <span className="absolute inset-y-0 start-0 flex items-center ps-3 text-primary-600">
                        <Icons.Check className="h-5 w-5" aria-hidden="true" />
                      </span>
                    )}
                  </li>
                ))
              ) : (
                <li className="cursor-default select-none relative py-2 px-4 text-secondary-500">
                  لا توجد نتائج
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * A dedicated component for a single product row in the New Shipment Form.
 * It encapsulates the logic for selecting a product, entering carton count, and displaying price info.
 */
const ProductInputRow: React.FC<{
  index: number;
  product: ShipmentProduct;
  activeProducts: Product[];
  productPrices: ProductPrice[];
  regionId: string;
  orderDate: string;
  onProductChange: <K extends keyof ShipmentProduct>(index: number, field: K, value: ShipmentProduct[K]) => void;
  onRemove: (index: number) => void;
  isRemovable: boolean;
}> = ({ index, product, activeProducts, productPrices, regionId, orderDate, onProductChange, onRemove, isRemovable }) => {

  const relevantPrices = productPrices.filter((p: ProductPrice) =>
    p.regionId === regionId &&
    p.productId === product.productId &&
    p.effectiveFrom <= orderDate
  );

  const priceInfo = relevantPrices.sort((a, b) =>
    new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime()
  )[0];

  const price = priceInfo ? priceInfo.price : null;

  return (
    <div className="relative mt-4 p-4 border dark:border-secondary-600 rounded-lg space-y-3 bg-secondary-50/50 dark:bg-secondary-800/20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SearchableSelect
          label="المنتج"
          options={activeProducts.map((p: Product) => ({ value: p.id, label: p.name }))}
          value={product.productId}
          onChange={val => onProductChange(index, 'productId', String(val))}
          placeholder="ابحث أو اختر منتج"
        />
        <div className="relative">
          <Input
            label="عدد الكراتين"
            type="number"
            min="1"
            value={product.cartonCount || ''}
            onChange={e => {
              const val = e.target.value;
              onProductChange(index, 'cartonCount', val === '' ? 0 : Math.max(1, Number(val)));
            }}
            placeholder="أدخل العدد"
          />
          {product.productId && price === null && (
            <div className="absolute top-0 end-4 pt-0 pe-2 text-yellow-500" title="لا يوجد سعر محدد لهذا المنتج في المنطقة المختارة. سيتم إعلام المدير.">
              <Icons.AlertTriangle className="h-6 w-6" />
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 bg-secondary-100 dark:bg-secondary-800 p-2 rounded-md">
        <div className="text-sm flex justify-between">
          <span>السعر: </span>
          <span className="font-semibold">{price !== null ? `${price} ر.ي` : 'غير محدد'}</span>
        </div>
        <div className="text-sm flex justify-between">
          <span>الوزن: </span>
          <span className="font-semibold">{(activeProducts.find(p => p.id === product.productId)?.weightKg || 0)} كجم</span>
        </div>
        <div className="text-sm flex justify-between border-t border-secondary-300 dark:border-secondary-600 pt-1 mt-1">
          <span>إجمالي السعر: </span>
          <span className="font-semibold text-primary-600 dark:text-primary-400">{(price !== null ? price * product.cartonCount : 0).toLocaleString('en-US')} ر.ي</span>
        </div>
        <div className="text-sm flex justify-between border-t border-secondary-300 dark:border-secondary-600 pt-1 mt-1">
          <span>إجمالي الوزن: </span>
          <span className="font-semibold text-secondary-900 dark:text-secondary-100">{((activeProducts.find(p => p.id === product.productId)?.weightKg || 0) * product.cartonCount / 1000).toLocaleString('en-US', { minimumFractionDigits: 3 })} طن</span>
        </div>
      </div>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={() => onRemove(index)}
        disabled={!isRemovable}
        className="absolute top-0 end-1 !p-1.5 h-auto text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-600 dark:hover:text-red-400 rounded-full transition-colors"
        aria-label="إزالة المنتج"
      >
        <Icons.Trash2 className="h-4 w-4 stroke-[2.5]" />
      </Button>
    </div>
  );
};


const NewFleetShipmentForm: React.FC = () => {
  const { regions, drivers, products: allProducts, addShipment, productPrices, addNotification, currentUser, shipments } = useAppContext();

  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [salesOrder, setSalesOrder] = useState('');
  const [regionId, setRegionId] = useState(regions[0]?.id || '');
  const [driverId, setDriverId] = useState<number>(0);
  const [selectedProducts, setSelectedProducts] = useState<ShipmentProduct[]>([{ productId: '', productName: '', cartonCount: 0 }]);
  const [submitting, setSubmitting] = useState(false);
  const [showMissingPriceModal, setShowMissingPriceModal] = useState(false);
  const [missingPriceProducts, setMissingPriceProducts] = useState<string[]>([]);

  const activeProducts = allProducts.filter((p: Product) => p.isActive ?? true);
  const activeDrivers = drivers.filter((d: Driver) => d.isActive ?? true);

  const handleAddProduct = () => {
    setSelectedProducts([...selectedProducts, { productId: '', productName: '', cartonCount: '' as any }]);
  };

  const handleRemoveProduct = (index: number) => {
    // Fix M-10: Prevent removing last product
    if (selectedProducts.length <= 1) {
      alert('يجب أن يحتوي الطلب على منتج واحد على الأقل');
      return;
    }
    const newProducts = selectedProducts.filter((_, i) => i !== index);
    setSelectedProducts(newProducts);
  };

  const handleProductChange = <K extends keyof ShipmentProduct>(index: number, field: K, value: ShipmentProduct[K]) => {
    const newProducts = [...selectedProducts];
    newProducts[index][field] = value;
    if (field === 'productId') {
      const product = allProducts.find((p: Product) => p.id === value);
      newProducts[index].productName = product?.name || '';
    }
    setSelectedProducts(newProducts);
  };

  const getSelectedDriver = () => activeDrivers.find((d: Driver) => d.id === driverId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // Sanitize sales order input
    const sanitizedSalesOrder = sanitizeInput(salesOrder);

    if (!orderDate || !sanitizedSalesOrder || !regionId || driverId === 0 || selectedProducts.some(p => !p.productId || p.cartonCount <= 0)) {
      toast.error('يرجى ملء جميع الحقول المطلوبة والتأكد من أن عدد الكراتين أكبر من صفر.');
      setSubmitting(false);
      return;
    }

    // Check for duplicate sales order
    const duplicateCheck = checkDuplicateSalesOrder(sanitizedSalesOrder, shipments);
    if (!duplicateCheck.isValid) {
      toast.error(duplicateCheck.error || 'رقم الشحنة موجود بالفعل');
      setSubmitting(false);
      return;
    }

    const finalProducts = selectedProducts.filter(p => p.productId && p.cartonCount > 0);

    // Check for missing or zero prices using date-based lookup
    const productsWithMissingPrice: string[] = [];
    finalProducts.forEach(product => {
      const relevantPrices = productPrices.filter((pp: ProductPrice) =>
        pp.regionId === regionId &&
        pp.productId === product.productId &&
        pp.effectiveFrom <= orderDate
      );
      const priceInfo = relevantPrices.sort((a, b) =>
        new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime()
      )[0];

      if (!priceInfo || priceInfo.price === 0) {
        const productDetails = allProducts.find((p: Product) => p.id === product.productId);
        if (productDetails) {
          productsWithMissingPrice.push(productDetails.name);
        }
      }
    });

    // If any prices are missing or zero, send notifications and show confirmation modal
    if (productsWithMissingPrice.length > 0) {
      // Send notifications to admins about missing prices for blocked shipment
      // Use setTimeout to make it non-blocking and avoid React render issues
      setTimeout(() => {
        finalProducts.forEach(product => {
          const priceExists = productPrices.some((pp: ProductPrice) =>
            pp.regionId === regionId &&
            pp.productId === product.productId &&
            pp.effectiveFrom <= orderDate
          );
          if (!priceExists) {
            const region = regions.find((r: Region) => r.id === regionId);
            const productDetails = allProducts.find((p: Product) => p.id === product.productId);
            if (region && productDetails) {
              addNotification({
                message: `طلب تسعير: مطلوب تحديد سعر للمنتج "<strong style="color:red;">${productDetails.name}</strong>" في منطقة "<strong style="color:green;">${region.name}</strong>" اعتباراً من تاريخ ${orderDate}. رقم الأمر: ${sanitizedSalesOrder}`,
                category: NotificationCategory.PRICE_ALERT,
                targetRoles: [Role.ADMIN]
              }).catch(error => {
                logger.error('Failed to send price alert notification:', error);
              });
            }
          }
        });
      }, 100); // Small delay to ensure modal renders first

      setMissingPriceProducts(productsWithMissingPrice);
      setShowMissingPriceModal(true);
      setSubmitting(false);
      return;
    }

    await proceedWithSubmission(sanitizedSalesOrder, finalProducts);
  };

  const proceedWithSubmission = async (sanitizedSalesOrder: string, finalProducts: ShipmentProduct[]) => {
    setSubmitting(true);
    const notificationPromises: Promise<any>[] = [];

    try {
      const newShipmentBase: Omit<Shipment, 'id' | 'entryTimestamp' | 'status'> = {
        orderDate,
        salesOrder: sanitizedSalesOrder,
        regionId,
        driverId: driverId,
        products: finalProducts,
        hasMissingPrices: false,
      };

      const calculatedValues = calculateInitialShipmentValues(newShipmentBase, regions, productPrices);

      const newShipment: Omit<Shipment, 'id'> = {
        ...newShipmentBase,
        entryTimestamp: new Date().toISOString(),
        status: ShipmentStatus.FROM_SALES,
        ...calculatedValues,
      };

      await addShipment(newShipment);

      // Group notifications together
      notificationPromises.push(addNotification({ message: `شحنة جديدة (${newShipment.salesOrder}) تم استلامها من مسؤول الحركة.`, category: NotificationCategory.USER_ACTION, targetRoles: [Role.ACCOUNTANT] }));
      if (currentUser) {
        notificationPromises.push(addNotification({ message: `تم إرسال شحنتك (${newShipment.salesOrder}) بنجاح للمراجعة.`, category: NotificationCategory.USER_ACTION, targetUserIds: [currentUser.id] }));
      }

      await Promise.all(notificationPromises);

      // Show success toast
      toast.success(`تم إرسال الشحنة بنجاح! رقم الأمر: ${newShipment.salesOrder}`);

      // Reset the form
      setSalesOrder('');
      setRegionId(regions[0]?.id || '');
      setDriverId(0);
      setSelectedProducts([{ productId: '', productName: '', cartonCount: 0 }]);

    } catch (err: any) {
      logger.error("Failed to submit shipment:", err);
      // Show error toast - do NOT reset form
      if (err.message.includes('رقم الشحنة موجود')) {
        toast.error(err.message);
      } else {
        toast.error(`فشل إرسال الشحنة: ${err.message}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Card title="بيانات الشحنة الجديدة">
        <form onSubmit={handleSubmit} className="space-y-8">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ArabicDatePicker label="تاريخ الأمر" value={orderDate} onChange={setOrderDate} required />
            <Input
              label="رقم الامر"
              type="text"
              value={salesOrder}
              onChange={e => setSalesOrder(e.target.value)}
              placeholder="أدخل رقم الامر"
              required
            />
            <SearchableSelect
              id="region"
              label="المنطقة"
              options={regions.map((r: Region) => ({ value: r.id, label: r.name }))}
              value={regionId}
              onChange={(val) => setRegionId(String(val))}
              placeholder="ابحث أو اختر منطقة"
            />
            <DriverSearchableSelect
              id="driver"
              label="اسم السائق"
              drivers={activeDrivers}
              value={driverId}
              onChange={(val) => setDriverId(Number(val))}
            />
            {driverId && (
              <Input label="رقم اللوحة" type="text" value={getSelectedDriver()?.plateNumber || ''} readOnly disabled />
            )}
          </div>

          <div className="border-t border-secondary-200 dark:border-secondary-700 pt-6">
            <h3 className="text-lg font-medium">المنتجات</h3>
            {selectedProducts.map((product, index) => (
              <ProductInputRow
                key={index}
                index={index}
                product={product}
                activeProducts={activeProducts}
                productPrices={productPrices}
                regionId={regionId}
                orderDate={orderDate}
                onProductChange={handleProductChange}
                onRemove={handleRemoveProduct}
                isRemovable={selectedProducts.length > 1}
              />
            ))}
            <Button type="button" variant="secondary" onClick={handleAddProduct} className="mt-4">
              <Icons.Plus className="ml-2 h-5 w-5" />
              إضافة منتج آخر
            </Button>
          </div>

          <div className="bg-secondary-50 dark:bg-secondary-800/50 p-4 rounded-lg border border-secondary-200 dark:border-secondary-700">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-secondary-500 dark:text-secondary-400">إجمالي السعر</p>
                <p className="text-xl font-bold text-primary-600 dark:text-primary-400">
                  {selectedProducts.reduce((sum, p) => {
                    const relevantPrices = productPrices.filter(price =>
                      price.regionId === regionId &&
                      price.productId === p.productId &&
                      price.effectiveFrom <= orderDate
                    );
                    const latestPrice = relevantPrices.sort((a, b) =>
                      new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime()
                    )[0];

                    return sum + ((latestPrice?.price || 0) * (p.cartonCount || 0));
                  }, 0).toLocaleString('en-US')} ر.ي
                </p>
              </div>
              <div>
                <p className="text-sm text-secondary-500 dark:text-secondary-400">إجمالي الوزن</p>
                <p className="text-xl font-bold text-secondary-900 dark:text-secondary-100">
                  {(selectedProducts.reduce((sum, p) => {
                    const product = allProducts.find(prod => prod.id === p.productId);
                    return sum + ((product?.weightKg || 0) * (p.cartonCount || 0));
                  }, 0) / 1000).toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} طن
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t border-secondary-200 dark:border-secondary-700">
            <Button type="submit" size="lg" disabled={submitting}>
              {submitting ? 'جاري الإرسال...' : (
                <>
                  <Icons.Send className="ml-2 h-5 w-5" />
                  إرسال البيانات
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>

      {/* Missing Price Confirmation Modal */}
      <Modal
        isOpen={showMissingPriceModal}
        onClose={() => setShowMissingPriceModal(false)}
        title="تنبيه: أسعار مفقودة"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <Icons.AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                المنتجات التالية ليس لها سعر محدد أو السعر يساوي صفر:
              </p>
              <ul className="mt-2 list-disc list-inside text-sm text-yellow-700 dark:text-yellow-300">
                {missingPriceProducts.map((productName, idx) => (
                  <li key={idx}>{productName}</li>
                ))}
              </ul>
            </div>
          </div>
          <p className="text-sm text-secondary-600 dark:text-secondary-400">
            لا يمكن إرسال الشحنة بدون تحديد الأسعار. يرجى إضافة الأسعار من لوحة تحكم الإدارة.
          </p>
          <div className="flex justify-end">
            <Button onClick={() => setShowMissingPriceModal(false)}>
              حسناً
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default NewFleetShipmentForm;
