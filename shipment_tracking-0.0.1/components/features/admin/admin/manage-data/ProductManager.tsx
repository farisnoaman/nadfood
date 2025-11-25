import React, { useState, useMemo } from 'react';
import { Product } from '../../../../../types';
import Button from '../../../../common/ui/Button';
import Input from '../../../../common/ui/Input';
import Modal from '../../../../common/ui/Modal';
import { Icons } from '../../../../Icons';
import { useAppContext } from '../../../../../providers/AppContext';

const ProductManager: React.FC = () => {
  const { products, addProduct, updateProduct, isOnline } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productName, setProductName] = useState('');
  
  const [productToToggleStatus, setProductToToggleStatus] = useState<Product | null>(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products;
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return products.filter((p: Product) =>
      p.name.toLowerCase().includes(lowerCaseSearchTerm) ||
      p.id.toLowerCase().includes(lowerCaseSearchTerm)
    );
  }, [products, searchTerm]);

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setProductName('');
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setProductName(product.name);
    setError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // A small delay to allow the modal to animate out before clearing the form
    setTimeout(() => {
      setEditingProduct(null);
      setProductName('');
      setError('');
    }, 300);
  };

  const handleSaveProduct = async () => {
    if (!productName.trim()) {
      setError('يرجى ملء اسم المنتج.');
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, { name: productName.trim() });
      } else {
        const newProduct: Omit<Product, 'id'> = { name: productName.trim(), isActive: true };
        await addProduct(newProduct);
      }
      handleCloseModal();
    } catch(err: any) {
        setError(`فشل حفظ المنتج: ${err.message}`);
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const confirmToggleProductStatus = async () => {
    if (!productToToggleStatus) return;
    setIsSubmitting(true);
    try {
        await updateProduct(productToToggleStatus.id, { isActive: !(productToToggleStatus.isActive ?? true) });
        setProductToToggleStatus(null);
    } catch (err: any) {
        alert(`فشل تحديث المنتج: ${err.message}`);
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
          <Button variant="secondary" onClick={handleOpenAddModal} disabled={!isOnline} title={!isOnline ? 'غير متاح في وضع عدم الاتصال' : ''}>
            <Icons.Plus className="ml-2 h-4 w-4" />
            إضافة منتج جديد
          </Button>
        </div>
      </div>
      <div className="border dark:border-secondary-700 rounded-md min-h-[300px] p-2 space-y-2">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((p: Product) => (
            <div key={p.id} className={`flex justify-between items-center p-3 bg-secondary-100 dark:bg-secondary-800 rounded transition-opacity ${p.isActive ?? true ? '' : 'opacity-50'}`}>
              <div>
                <span>{p.name}</span>
                <span className={`mx-2 px-2 py-0.5 text-xs rounded-full ${p.isActive ?? true ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                  {p.isActive ?? true ? 'نشط' : 'غير نشط'}
                </span>
              </div>
              <div className="flex items-center space-x-1 rtl:space-x-reverse">
                <Button size="sm" variant="ghost" onClick={() => handleOpenEditModal(p)} title="تعديل" disabled={!isOnline}>
                  <Icons.Edit className="h-5 w-5 text-blue-500" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setProductToToggleStatus(p)} title={p.isActive ?? true ? 'تعطيل' : 'تفعيل'} disabled={!isOnline}>
                  {p.isActive ?? true
                    ? <Icons.CircleX className="h-5 w-5 text-red-500" />
                    : <Icons.CircleCheck className="h-5 w-5 text-green-500" />
                  }
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-secondary-500 py-4">لا توجد منتجات تطابق البحث.</div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}>
        <div className="space-y-4">
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <Input label="اسم المنتج" value={productName} onChange={e => setProductName(e.target.value)} required />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={handleCloseModal} disabled={isSubmitting}>إلغاء</Button>
            <Button onClick={handleSaveProduct} disabled={isSubmitting}>
              {isSubmitting ? (editingProduct ? 'جاري الحفظ...' : 'جاري الإضافة...') : (editingProduct ? 'حفظ التغييرات' : 'إضافة')}
            </Button>
          </div>
        </div>
      </Modal>

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
    </>
  );
};

export default ProductManager;