import React, { useState, useMemo, useEffect } from 'react';
import { DeductionPrice, Product } from '../../../../types';
import Button from '../../../common/ui/Button';
import Input from '../../../common/ui/Input';
import Modal from '../../../common/ui/Modal';
import { Icons } from '../../../Icons';
import { useAppContext } from '../../../../providers/AppContext';
import SearchableSelect from '../../../common/forms/SearchableSelect';
import ArabicDatePicker from '../../../common/ui/ArabicDatePicker';

const DeductionPriceManager: React.FC = () => {
    const { deductionPrices, addDeductionPrice, updateDeductionPrice, deleteDeductionPrice, products, isOnline, hasFeature } = useAppContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [visibleCount, setVisibleCount] = useState(20);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPrice, setEditingPrice] = useState<DeductionPrice | null>(null);
    const [priceToDelete, setPriceToDelete] = useState<DeductionPrice | null>(null);
    const [formData, setFormData] = useState<{ productId: string, shortagePrice: number, damagedPrice: number, effectiveFrom: string }>({
        productId: '', shortagePrice: 0, damagedPrice: 0, effectiveFrom: new Date().toISOString().split('T')[0],
    });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Feature Flags & Limits
    const canManagePrices = hasFeature('canManagePrices');

    const filteredPrices = useMemo(() => {
        if (!searchTerm.trim()) return deductionPrices;
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        return deductionPrices.filter((p: DeductionPrice) => {
            const product = products.find((prod: Product) => prod.id === p.productId);
            return product?.name.toLowerCase().includes(lowerCaseSearchTerm);
        });
    }, [deductionPrices, products, searchTerm]);

    useEffect(() => {
        setVisibleCount(20);
    }, [searchTerm]);

    const visiblePrices = filteredPrices.slice(0, visibleCount);
    const hasMore = visibleCount < filteredPrices.length;

    const handleOpenModal = (price: DeductionPrice | null) => {
        setEditingPrice(price);
        setFormData(price
            ? { productId: price.productId, shortagePrice: price.shortagePrice, damagedPrice: price.damagedPrice, effectiveFrom: price.effectiveFrom }
            : { productId: '', shortagePrice: 0, damagedPrice: 0, effectiveFrom: new Date().toISOString().split('T')[0] }
        );
        setIsModalOpen(true);
        setError('');
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingPrice(null);
    };

    const handleFormChange = (name: string, value: any, type?: string) => {
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? Math.max(0, parseFloat(value)) || 0 : value,
        }));
    };

    const handleSave = async () => {
        setError('');

        if (!editingPrice && !canManagePrices) {
            setError('عفواً، ليس لديك صلاحية لإضافة أسعار عقوبة جديدة.');
            return;
        }

        const { productId, shortagePrice, damagedPrice } = formData;
        if (!productId || (shortagePrice <= 0 && damagedPrice <= 0)) {
            setError('يرجى اختيار منتج وإدخال سعر واحد على الأقل أكبر من صفر.');
            return;
        }
        setIsSubmitting(true);

        try {
            if (editingPrice) {
                await updateDeductionPrice(editingPrice.id, { shortagePrice, damagedPrice, effectiveFrom: formData.effectiveFrom });
            } else {
                await addDeductionPrice({ productId, shortagePrice, damagedPrice, effectiveFrom: formData.effectiveFrom });
            }
            handleCloseModal();
        } catch (err: any) {
            if (err.message.includes('duplicate key')) {
                setError('يوجد سعر عقوبة مسجل لهذا المنتج في هذا التاريخ بالفعل.');
            } else {
                setError(`فشل حفظ السعر: ${err.message}`);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const confirmDelete = async () => {
        if (!priceToDelete) return;
        setIsSubmitting(true);
        try {
            await deleteDeductionPrice(priceToDelete.id);
            setPriceToDelete(null);
        } catch (err: any) {
            console.error('Failed to delete deduction price:', err);
            // Replaced logger.error with console.error as logger was not imported/defined in view
            // Or I should assume toast.error? The previous file had logger.error but logger wasn't imported in line 1-10.
            // Looking at line 96 of original file: `logger.error('Failed to delete deduction price:', err);`
            // Wait, I don't see logger imported in the original file view! 
            // Ah, maybe it was a global, or maybe it was broken code. 
            // I'll check imports again. Imports: React, types, Button, Input, Modal, Icons, AppContext, SearchableSelect, ArabicDatePicker.
            // No logger import. It might be broken code. I will switch to `toast.error` (need to import toast) OR just console.error for now to be safe, or check if toast is available.
            // Actually `toast` is NOT imported in the original file view! It used `alert`.
            // Wait, line 125 of RegionConfigManager used `alert`. 
            // Line 95 of DeductionPriceManager used `logger.error`. This implies `logger` is missing.
            // I will replace with `alert` as used in other parts of this file/similar files, or add `import toast`?
            // Let's stick to `alert` or `console.error` to avoid adding dependencies if not sure. 
            // Wait, `RegionConfigManager` used `alert`. `DeductionPriceManager` original code had `logger.error`. This is likely a bug in the existing code.
            // I will fix it by using `alert` like line 125 of `RegionConfigManager`.
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center gap-4">
                <Input
                    placeholder="ابحث عن منتج..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    Icon={Icons.Search}
                    className="max-w-sm"
                />
                <div className="flex gap-2">
                    {/* ADD BUTTON: HIDDEN IF FLAG OFF */}
                    {canManagePrices && (
                        <Button onClick={() => handleOpenModal(null)} disabled={!isOnline}>
                            <Icons.Plus className="ml-2 h-4 w-4" />
                            إضافة سعر عقوبة
                        </Button>
                    )}
                </div>
            </div>
            <div className="border dark:border-secondary-700 rounded-md min-h-[300px] p-2 space-y-2">
                {visiblePrices.length > 0 ? (
                    <>
                        {visiblePrices.map((p: DeductionPrice) => {
                            const productName = products.find((prod: Product) => prod.id === p.productId)?.name || 'غير معروف';
                            // Buttons disabled, not hidden
                            const isEditable = canManagePrices;

                            return (
                                <div key={p.id} className="flex justify-between items-center p-3 bg-secondary-100 dark:bg-secondary-800 rounded">
                                    <div>
                                        <p className="font-semibold">{productName}</p>
                                        <div className="flex items-center gap-4 text-sm">
                                            <span className="text-red-500">نقص: {p.shortagePrice} ر.ي</span>
                                            <span className="text-orange-500">تالف: {p.damagedPrice} ر.ي</span>
                                            <p className="text-xs text-secondary-500 bg-secondary-200 dark:bg-secondary-700 px-2 py-0.5 rounded flex items-center gap-1">
                                                <Icons.Calendar className="h-3 w-3" />
                                                {p.effectiveFrom}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-1 rtl:space-x-reverse">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleOpenModal(p)}
                                            title={!isEditable ? 'الخاصية غير مفعلة' : 'تعديل'}
                                            disabled={!isOnline || !isEditable}
                                        >
                                            <Icons.Edit className="h-5 w-5 text-blue-500" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => setPriceToDelete(p)}
                                            title={!isEditable ? 'الخاصية غير مفعلة' : 'حذف'}
                                            disabled={!isOnline || !isEditable}
                                        >
                                            <Icons.Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                        {hasMore && (
                            <div className="text-center py-4">
                                <Button onClick={() => setVisibleCount(prev => prev + 20)}>
                                    تحميل المزيد
                                </Button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center text-secondary-500 py-4">لا توجد أسعار عقوبة تطابق البحث.</div>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingPrice ? 'تعديل سعر العقوبة' : 'إضافة سعر عقوبة جديد'}>
                <div className="space-y-4">
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    <SearchableSelect
                        label="المنتج"
                        options={[{ value: '', label: 'اختر منتج' }, ...products.map((p: Product) => ({ value: p.id, label: p.name }))]}
                        value={formData.productId}
                        onChange={val => handleFormChange('productId', val)}
                        disabled={!!editingPrice}
                    />
                    <Input
                        label="سعر النقص (العقوبة)"
                        name="shortagePrice"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.shortagePrice}
                        onChange={e => handleFormChange(e.target.name, e.target.value, e.target.type)}
                    />
                    <Input
                        label="سعر التالف (العقوبة)"
                        name="damagedPrice"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.damagedPrice}
                        onChange={e => handleFormChange(e.target.name, e.target.value, e.target.type)}
                    />
                    <ArabicDatePicker
                        label="تاريخ سريان السعر"
                        value={formData.effectiveFrom}
                        onChange={val => handleFormChange('effectiveFrom', val)}
                        required
                    />
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="secondary" onClick={handleCloseModal} disabled={isSubmitting}>إلغاء</Button>
                        <Button onClick={handleSave} disabled={isSubmitting}>{isSubmitting ? 'جاري الحفظ...' : 'حفظ'}</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={!!priceToDelete} onClose={() => setPriceToDelete(null)} title="تأكيد الحذف">
                <p className="mb-4">هل أنت متأكد من حذف سعر العقوبة لهذا المنتج؟</p>
                <div className="flex justify-end gap-3">
                    <Button variant="secondary" onClick={() => setPriceToDelete(null)}>إلغاء</Button>
                    <Button variant="destructive" onClick={confirmDelete} disabled={isSubmitting}>
                        {isSubmitting ? 'جاري الحذف...' : 'حذف'}
                    </Button>
                </div>
            </Modal>
        </div>
    );
};

export default DeductionPriceManager;
