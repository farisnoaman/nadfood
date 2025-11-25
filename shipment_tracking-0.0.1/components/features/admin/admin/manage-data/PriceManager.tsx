import React, { useState, useMemo } from 'react';
import { ProductPrice, Region, Product } from '../../../../../types';
import Button from '../../../../common/ui/Button';
import Input from '../../../../common/ui/Input';
import Modal from '../../../../common/ui/Modal';
import { Icons } from '../../../../Icons';
import { useAppContext } from '../../../../../providers/AppContext';
import SearchableSelect from '../../../../common/forms/SearchableSelect';

const PriceManager: React.FC = () => {
    const { productPrices, addProductPrice, updateProductPrice, deleteProductPrice, regions, products, isOnline } = useAppContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
    const [editingPrice, setEditingPrice] = useState<ProductPrice | null>(null);
    const [priceToDelete, setPriceToDelete] = useState<ProductPrice | null>(null);
    const [priceFormData, setPriceFormData] = useState<{ regionId: string, productId: string, price: number }>({
        regionId: '', productId: '', price: 0,
    });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const filteredPrices = useMemo(() => {
        if (!searchTerm.trim()) return productPrices;
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        return productPrices.filter((p: ProductPrice) => {
            const region = regions.find((r: Region) => r.id === p.regionId);
            const product = products.find((prod: Product) => prod.id === p.productId);
            return (
                region?.name.toLowerCase().includes(lowerCaseSearchTerm) ||
                product?.name.toLowerCase().includes(lowerCaseSearchTerm)
            );
        });
    }, [productPrices, regions, products, searchTerm]);

    const handleOpenPriceModal = (price: ProductPrice | null) => {
        setEditingPrice(price);
        setPriceFormData(price ? { regionId: price.regionId, productId: price.productId, price: price.price } : { regionId: '', productId: '', price: 0 });
        setIsPriceModalOpen(true);
        setError('');
    };

    const handleClosePriceModal = () => {
        setIsPriceModalOpen(false);
        setEditingPrice(null);
    };

    const handlePriceFormChange = (name: string, value: any, type?: string) => {
        setPriceFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? Math.max(0, parseFloat(value)) || 0 : value,
        }));
    };


    const handleSavePrice = async () => {
        setError('');
        const { regionId, productId, price } = priceFormData;
        if (!regionId || !productId || price <= 0) {
            setError('يرجى اختيار منطقة ومنتج وإدخال سعر صحيح أكبر من صفر.');
            return;
        }
        setIsSubmitting(true);
        
        try {
            if (editingPrice) {
                await updateProductPrice(editingPrice.id, { price });
            } else {
                await addProductPrice({ regionId, productId, price });
            }
            handleClosePriceModal();
        } catch(err: any) {
             if (err.message.includes('duplicate key')) {
                setError('يوجد سعر مسجل لهذا المنتج في هذه المنطقة بالفعل. يمكنك تعديله من القائمة.');
            } else {
                setError(`فشل حفظ السعر: ${err.message}`);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const confirmDeletePrice = async () => {
        if (!priceToDelete) return;
        setIsSubmitting(true);
        try {
            await deleteProductPrice(priceToDelete.id);
            setPriceToDelete(null);
        } catch(err: any) {
             alert(`فشل حذف السعر: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <div className="flex flex-col sm:flex-row flex-wrap justify-between items-start sm:items-center gap-4 mb-4">
                <div className="w-full sm:w-auto sm:flex-1 sm:max-w-xs">
                    <Input
                        placeholder="ابحث باسم المنطقة أو المنتج..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        Icon={Icons.Search}
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" onClick={() => handleOpenPriceModal(null)} disabled={!isOnline} title={!isOnline ? 'غير متاح في وضع عدم الاتصال' : ''}>
                        <Icons.Plus className="ml-2 h-4 w-4" />
                        إضافة سعر جديد
                    </Button>
                </div>
            </div>
            <div className="border dark:border-secondary-700 rounded-md min-h-[300px] p-2 space-y-2">
                {filteredPrices.length > 0 ? (
                    filteredPrices.map((p: ProductPrice) => {
                        const regionName = regions.find((r: Region) => r.id === p.regionId)?.name || 'غير معروف';
                        const productName = products.find((prod: Product) => prod.id === p.productId)?.name || 'غير معروف';
                        return (
                            <div key={p.id} className="flex justify-between items-center p-3 bg-secondary-100 dark:bg-secondary-800 rounded">
                                <div>
                                    <p className="font-semibold">{productName} - <span className="text-primary-600">{regionName}</span></p>
                                    <p className="text-lg font-bold text-secondary-800 dark:text-secondary-200">{p.price} ر.ي</p>
                                </div>
                                <div className="flex items-center space-x-1 rtl:space-x-reverse">
                                    <Button size="sm" variant="ghost" onClick={() => handleOpenPriceModal(p)} title="تعديل" disabled={!isOnline}>
                                        <Icons.Edit className="h-5 w-5 text-blue-500" />
                                    </Button>
                                    <Button size="sm" variant="destructive" onClick={() => setPriceToDelete(p)} title="حذف" disabled={!isOnline}>
                                        <Icons.Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center text-secondary-500 py-4">لا توجد أسعار تطابق البحث.</div>
                )}
            </div>

            <Modal isOpen={isPriceModalOpen} onClose={handleClosePriceModal} title={editingPrice ? 'تعديل السعر' : 'إضافة سعر جديد'}>
                <div className="space-y-4">
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    <SearchableSelect 
                        label="المنطقة" 
                        options={[{ value: '', label: 'اختر منطقة'}, ...regions.map((r: Region) => ({ value: r.id, label: r.name }))]}
                        value={priceFormData.regionId} 
                        onChange={val => handlePriceFormChange('regionId', val)} 
                        disabled={!!editingPrice}
                    />
                    <SearchableSelect 
                        label="المنتج" 
                        options={[{value: '', label: 'اختر منتج'}, ...products.map((p: Product) => ({ value: p.id, label: p.name }))]}
                        value={priceFormData.productId} 
                        onChange={val => handlePriceFormChange('productId', val)} 
                        disabled={!!editingPrice}
                    />
                    <Input 
                        label="سعر الكرتون" 
                        name="price" 
                        type="number" 
                        min="0" 
                        step="0.01" 
                        value={priceFormData.price} 
                        onChange={e => handlePriceFormChange(e.target.name, e.target.value, e.target.type)} 
                        required 
                    />
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="secondary" onClick={handleClosePriceModal} disabled={isSubmitting}>إلغاء</Button>
                        <Button onClick={handleSavePrice} disabled={isSubmitting}>{isSubmitting ? 'جاري الحفظ...' : 'حفظ'}</Button>
                    </div>
                </div>
            </Modal>
            
            <Modal isOpen={!!priceToDelete} onClose={() => setPriceToDelete(null)} title="تأكيد الحذف">
                <div className="text-center">
                    <Icons.AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
                    <p className="mt-4">هل أنت متأكد من رغبتك في حذف هذا السعر؟</p>
                    <p className="text-sm text-secondary-500">لا يمكن التراجع عن هذا الإجراء.</p>
                    <div className="mt-6 flex justify-center gap-4">
                        <Button variant="secondary" onClick={() => setPriceToDelete(null)} disabled={isSubmitting}>إلغاء</Button>
                        <Button variant="destructive" onClick={confirmDeletePrice} disabled={isSubmitting}>{isSubmitting ? 'جاري الحذف...' : 'نعم، حذف'}</Button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default PriceManager;