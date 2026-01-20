import React, { useState, useMemo, useEffect } from 'react';
import { Product } from '../../../../types';
import Button from '../../../common/ui/Button';
import Input from '../../../common/ui/Input';
import Modal from '../../../common/ui/Modal';
import ConfirmationModal from '../../../common/ui/ConfirmationModal';
import { Icons } from '../../../Icons';
import { useAppContext } from '../../../../providers/AppContext';
import BatchImportModal from './BatchImportModal';
import MasterCatalogSelectionModal from './MasterCatalogSelectionModal';
import toast from 'react-hot-toast';

const ProductManager: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct, isOnline, checkLimit, hasFeature } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleCount, setVisibleCount] = useState(20);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [productName, setProductName] = useState('');
  const [productWeight, setProductWeight] = useState<number | string>('');
  const [factoryName, setFactoryName] = useState('');

  const [productToToggleStatus, setProductToToggleStatus] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isMasterCatalogOpen, setIsMasterCatalogOpen] = useState(false);

  // Confirmation for Renaming
  const [isRenameConfirmOpen, setIsRenameConfirmOpen] = useState(false);
  const [pendingSave, setPendingSave] = useState<(() => Promise<void>) | null>(null);

  // Feature Flags & Limits
  // Can add if: 1. Feature is enabled AND 2. Limit is not reached
  const isFeatureEnabled = hasFeature('canManageProducts');
  const isLimitReached = !checkLimit('maxProducts', 1);
  const canAdd = isFeatureEnabled && !isLimitReached;

  // Import: Feature enabled
  const canImport = hasFeature('import_export');

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products;
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return products.filter((p: Product) =>
      p.name.toLowerCase().includes(lowerCaseSearchTerm) ||
      p.id.toLowerCase().includes(lowerCaseSearchTerm)
    );
  }, [products, searchTerm]);

  useEffect(() => {
    setVisibleCount(20);
  }, [searchTerm]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setProductName('');
    setProductWeight('');
    setFactoryName('');
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setProductName(product.name);
    setProductWeight(product.weightKg || '');
    setFactoryName(product.factoryName || '');
    setError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setEditingProduct(null);
      setProductName('');
      setProductWeight('');
      setError('');
    }, 300);
  };

  const executeSave = async () => {
    setIsSubmitting(true);
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, {
          name: productName.trim(),
          weightKg: productWeight ? Number(productWeight) : undefined,
          factoryName: factoryName.trim() || undefined
        });
        toast.success('تم تحديث المنتج بنجاح');
      } else {
        const newProduct: Omit<Product, 'id'> = {
          name: productName.trim(),
          isActive: true,
          weightKg: productWeight ? Number(productWeight) : undefined,
          factoryName: factoryName.trim() || undefined
        };
        await addProduct(newProduct);
        toast.success('تم إضافة المنتج بنجاح');
      }
      handleCloseModal();
    } catch (err: any) {
      const errorMsg = `فشل حفظ المنتج: ${err.message}`;
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
      setPendingSave(null);
    }
  };

  const handleSaveProduct = async () => {
    if (!productName.trim()) {
      setError('يرجى ملء اسم المنتج.');
      return;
    }

    if (!editingProduct && !canAdd) {
      // Should theoretically be unreachable due to hidden button, but safe to keep
      setError('لا يمكن إضافة منتج: تجاوزت الحد أو الخاصية غير مفعلة.');
      return;
    }

    // Check for Renaming
    if (editingProduct && editingProduct.name !== productName.trim()) {
      setPendingSave(() => executeSave);
      setIsRenameConfirmOpen(true);
      return;
    }

    await executeSave();
  };

  const confirmToggleProductStatus = async () => {
    if (!productToToggleStatus) return;
    setIsSubmitting(true);
    try {
      await updateProduct(productToToggleStatus.id, { isActive: !(productToToggleStatus.isActive ?? true) });
      toast.success('تم تحديث حالة المنتج بنجاح');
      setProductToToggleStatus(null);
    } catch (err: any) {
      toast.error(`فشل تحديث المنتج: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;
    setIsSubmitting(true);
    try {
      await deleteProduct(productToDelete.id);
      toast.success('تم حذف المنتج بنجاح');
      setProductToDelete(null);
    } catch (err: any) {
      toast.error(`فشل حذف المنتج: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row flex-wrap justify-between items-start sm:items-center gap-4 mb-4">
        <div className="w-full sm:w-auto sm:flex-1 sm:max-w-xs">
          <Input
            placeholder="ابحث بالاسم..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            Icon={Icons.Search}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {/* ADD BUTTON: HIDDEN IF FLAG OFF OR LIMIT REACHED */}
          {canAdd && (
            <Button
              variant="secondary"
              onClick={handleOpenAddModal}
              disabled={!isOnline}
              title={!isOnline ? 'غير متاح في وضع عدم الاتصال' : ''}
            >
              <Icons.Plus className="ml-2 h-4 w-4" />
              إضافة منتج جديد
            </Button>
          )}

          {canImport && (
            <Button
              variant="ghost"
              onClick={() => setIsImportModalOpen(true)}
              disabled={!isOnline}
              title={!isOnline ? 'غير متاح في وضع عدم الاتصال' : ''}
            >
              <Icons.FileDown className="ml-2 h-4 w-4" />
              استيراد CSV
            </Button>
          )}

          {/* MASTER CATALOG: HIDDEN IF FLAG OFF OR LIMIT REACHED */}
          {canAdd && (
            <Button
              variant="primary"
              onClick={() => setIsMasterCatalogOpen(true)}
              disabled={!isOnline}
              title={!isOnline ? 'غير متاح في وضع عدم الاتصال' : ''}
            >
              <Icons.Database className="ml-2 h-4 w-4" />
              اختيار من الدليل الشامل
            </Button>
          )}
        </div>
      </div>
      <div className="border dark:border-secondary-700 rounded-md min-h-[300px] p-2 space-y-2">
        {visibleProducts.length > 0 ? (
          <div>
            {visibleProducts.map((p: Product) =>
              <div key={p.id} className={`flex justify-between items-center p-3 bg-secondary-100 dark:bg-secondary-800 rounded transition-opacity ${p.isActive ?? true ? '' : 'opacity-50'}`}>
                <div>
                  <span className="font-medium">{p.name}</span>
                  {p.weightKg && (
                    <span className="mx-2 text-sm text-secondary-500">
                      ({p.weightKg} كجم)
                    </span>
                  )}
                  {/* Master vs Custom Badge */}
                  {p.masterProductId ? (
                    <span className="mx-1 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      من الدليل
                    </span>
                  ) : (
                    <span className="mx-1 px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                      مخصص
                    </span>
                  )}
                  <span className={`mx-2 px-2 py-0.5 text-xs rounded-full ${p.isActive ?? true ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                    {p.isActive ?? true ? 'نشط' : 'غير نشط'}
                  </span>
                </div>
                <div className="flex items-center space-x-1 rtl:space-x-reverse">
                  {/* EDIT/DELETE: DISABLED IF FLAG OFF */}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleOpenEditModal(p)}
                    title={!isFeatureEnabled ? 'الخاصية غير مفعلة' : 'تعديل'}
                    disabled={!isOnline || !isFeatureEnabled}
                  >
                    <Icons.Edit className="h-5 w-5 text-blue-500" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setProductToToggleStatus(p)}
                    title={!isFeatureEnabled ? 'الخاصية غير مفعلة' : (p.isActive ?? true ? 'تعطيل' : 'تفعيل')}
                    disabled={!isOnline || !isFeatureEnabled}
                  >
                    {p.isActive ?? true
                      ? <Icons.CircleX className="h-5 w-5 text-red-500" />
                      : <Icons.CircleCheck className="h-5 w-5 text-green-500" />
                    }
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setProductToDelete(p)}
                    title={!isFeatureEnabled ? 'الخاصية غير مفعلة' : 'حذف'}
                    disabled={!isOnline || !isFeatureEnabled}
                  >
                    <Icons.Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            {hasMore && (
              <div className="text-center py-4">
                <Button onClick={() => setVisibleCount(prev => prev + 20)}>
                  تحميل المزيد
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-secondary-500 py-4">لا توجد منتجات تطابق البحث.</div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}>
        <div className="space-y-4">
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <Input label="اسم المنتج" value={productName} onChange={e => setProductName(e.target.value)} required />
          <Input
            label="الوزن (كجم)"
            type="number"
            value={productWeight}
            onChange={e => setProductWeight(e.target.value)}
            placeholder="مثال: 50"
          />
          <Input
            label="اسم المصنع"
            value={factoryName}
            onChange={e => setFactoryName(e.target.value)}
            placeholder="مثال: مصنع أ"
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={handleCloseModal} disabled={isSubmitting}>إلغاء</Button>
            <Button onClick={handleSaveProduct} disabled={isSubmitting}>
              {isSubmitting ? (editingProduct ? 'جاري الحفظ...' : 'جاري الإضافة...') : (editingProduct ? 'حفظ التغييرات' : 'إضافة')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirmation Modal for Renaming */}
      <ConfirmationModal
        isOpen={isRenameConfirmOpen}
        onClose={() => setIsRenameConfirmOpen(false)}
        onConfirm={async () => {
          if (pendingSave) await pendingSave();
        }}
        title="تنبيه هام: تغيير اسم المنتج"
        message="هل أنت متأكد من رغبتك في تغيير اسم هذا المنتج؟ سيتم تحديث الاسم في جميع الشحنات السابقة والتاريخية. هذا الإجراء سيؤدي إلى فقدان الاسم القديم نهائياً."
        confirmButtonVariant="warning"
        confirmText="نعم، تغيير الاسم"
      />

      <Modal isOpen={!!productToToggleStatus} onClose={() => setProductToToggleStatus(null)} title="تأكيد تغيير الحالة">
        <div className="text-center">
          <Icons.AlertTriangle className="mx-auto h-12 w-12 text-yellow-500" />
          <p className="mt-4">
            هل أنت متأكد من رغبتك في
            {productToToggleStatus?.isActive ? ' تعطيل ' : ' تفعيل '}
            المنتج
            <span className="font-bold"> {productToToggleStatus?.name}</span>؟
          </p>
          <p className="text-sm text-secondary-500">
            {productToToggleStatus?.isActive
              ? 'لن يظهر المنتج في قائمة المبيعات بعد التعطيل.'
              : 'سيظهر المنتج في قائمة المبيعات بعد التفعيل.'}
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Button variant="secondary" onClick={() => setProductToToggleStatus(null)} disabled={isSubmitting}>إلغاء</Button>
            <Button variant="primary" onClick={confirmToggleProductStatus} disabled={isSubmitting}>{isSubmitting ? 'جاري التغيير...' : 'نعم، تأكيد'}</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!productToDelete} onClose={() => setProductToDelete(null)} title="تأكيد الحذف">
        <div className="text-center">
          <Icons.AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
          <p className="mt-4">
            هل أنت متأكد من رغبتك في حذف المنتج
            <span className="font-bold"> {productToDelete?.name}</span>؟
          </p>
          <p className="text-sm text-secondary-500">
            هذا الإجراء لا يمكن التراجع عنه. سيتم حذف المنتج نهائياً.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Button variant="secondary" onClick={() => setProductToDelete(null)} disabled={isSubmitting}>إلغاء</Button>
            <Button variant="destructive" onClick={confirmDeleteProduct} disabled={isSubmitting}>{isSubmitting ? 'جاري الحذف...' : 'نعم، حذف'}</Button>
          </div>
        </div>
      </Modal>

      <BatchImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        type="products"
      />

      <MasterCatalogSelectionModal
        isOpen={isMasterCatalogOpen}
        onClose={() => setIsMasterCatalogOpen(false)}
        type="products"
        onSuccess={() => {
          // Refresh products list - the context should auto-update
        }}
      />
    </>
  );
};

export default ProductManager;