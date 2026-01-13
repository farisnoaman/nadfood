import React, { useState, useEffect, useMemo } from 'react';
import { Icons } from '../../../Icons';
import Button from '../../../common/ui/Button';
import Input from '../../../common/ui/Input';
import Modal from '../../../common/ui/Modal';
import { MasterProduct, MasterRegion } from '../../../../types';
import { masterCatalogService } from '../../../../providers/app/services/masterCatalogService';
import { useAppContext } from '../../../../providers/AppContext';
import toast from 'react-hot-toast';

interface MasterCatalogSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'products' | 'regions';
    onSuccess: () => void;
}

const MasterCatalogSelectionModal: React.FC<MasterCatalogSelectionModalProps> = ({
    isOpen,
    onClose,
    type,
    onSuccess
}) => {
    const { currentUser } = useAppContext();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [masterItems, setMasterItems] = useState<(MasterProduct | MasterRegion)[]>([]);
    const [linkedItems, setLinkedItems] = useState<Set<string>>(new Set());
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (isOpen) {
            fetchMasterItems();
        }
    }, [isOpen, type]);

    const fetchMasterItems = async () => {
        setLoading(true);
        try {
            if (type === 'products') {
                const products = await masterCatalogService.fetchMasterProducts();
                setMasterItems(products);

                // Check which products are already linked
                const linked = new Set<string>();
                for (const product of products) {
                    const isLinked = await masterCatalogService.isMasterProductLinked(
                        product.id,
                        currentUser?.companyId || ''
                    );
                    if (isLinked) {
                        linked.add(product.id);
                    }
                }
                setLinkedItems(linked);
            } else {
                const regions = await masterCatalogService.fetchMasterRegions();
                setMasterItems(regions);

                // Check which regions are already linked
                const linked = new Set<string>();
                for (const region of regions) {
                    const isLinked = await masterCatalogService.isMasterRegionLinked(
                        region.id,
                        currentUser?.companyId || ''
                    );
                    if (isLinked) {
                        linked.add(region.id);
                    }
                }
                setLinkedItems(linked);
            }
        } catch (error: any) {
            toast.error(`فشل تحميل ${type === 'products' ? 'المنتجات' : 'المناطق'}: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const filteredItems = useMemo(() => {
        if (!searchTerm.trim()) return masterItems;
        const lowerSearch = searchTerm.toLowerCase();
        return masterItems.filter(item =>
            item.name.toLowerCase().includes(lowerSearch)
        );
    }, [masterItems, searchTerm]);

    const handleToggleSelection = (itemId: string) => {
        const newSelected = new Set(selectedItems);
        if (newSelected.has(itemId)) {
            newSelected.delete(itemId);
        } else {
            newSelected.add(itemId);
        }
        setSelectedItems(newSelected);
    };

    const handleSelectAll = () => {
        const availableItems = filteredItems.filter(item => !linkedItems.has(item.id));
        if (selectedItems.size === availableItems.length) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(availableItems.map(item => item.id)));
        }
    };

    const handleSubmit = async () => {
        if (selectedItems.size === 0) {
            toast.error('يرجى اختيار عنصر واحد على الأقل');
            return;
        }

        setSubmitting(true);
        try {
            const itemIds = Array.from(selectedItems);
            let successCount = 0;

            if (type === 'products') {
                successCount = await masterCatalogService.bulkLinkMasterProducts(
                    itemIds,
                    currentUser?.companyId || ''
                );
            } else {
                successCount = await masterCatalogService.bulkLinkMasterRegions(
                    itemIds,
                    currentUser?.companyId || ''
                );
            }

            toast.success(`تمت إضافة ${successCount} ${type === 'products' ? 'منتج' : 'منطقة'} بنجاح`);
            onSuccess();
            handleClose();
        } catch (error: any) {
            toast.error(`فشل الإضافة: ${error.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setSearchTerm('');
        setSelectedItems(new Set());
        onClose();
    };

    const availableCount = filteredItems.filter(item => !linkedItems.has(item.id)).length;

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={`اختيار ${type === 'products' ? 'منتجات' : 'مناطق'} من الدليل الشامل`}
            size="xl"
        >
            <div className="space-y-4">
                {/* Search and Select All */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                        <Input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={`بحث عن ${type === 'products' ? 'منتج' : 'منطقة'}...`}
                            Icon={Icons.Search}
                        />
                    </div>
                    <Button
                        variant="ghost"
                        onClick={handleSelectAll}
                        disabled={loading || availableCount === 0}
                    >
                        {selectedItems.size === availableCount && availableCount > 0 ? 'إلغاء التحديد' : 'تحديد الكل'}
                    </Button>
                </div>

                {/* Stats */}
                <div className="flex gap-4 text-sm text-slate-600 dark:text-slate-400">
                    <span>الإجمالي: {filteredItems.length}</span>
                    <span>متاح: {availableCount}</span>
                    <span>محدد: {selectedItems.size}</span>
                </div>

                {/* Items List */}
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg max-h-96 overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center items-center h-32">
                            <Icons.Loader className="h-6 w-6 animate-spin text-primary-600" />
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-slate-400">
                            <Icons.Database className="h-8 w-8 mb-2" />
                            <p>لا توجد نتائج</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-200 dark:divide-slate-700">
                            {filteredItems.map((item) => {
                                const isLinked = linkedItems.has(item.id);
                                const isSelected = selectedItems.has(item.id);
                                const isProduct = 'unitType' in item;

                                return (
                                    <div
                                        key={item.id}
                                        className={`p-4 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${isLinked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                                            }`}
                                        onClick={() => !isLinked && handleToggleSelection(item.id)}
                                    >
                                        {/* Checkbox */}
                                        <div className="flex-shrink-0">
                                            {isLinked ? (
                                                <div className="w-5 h-5 rounded border-2 border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                                                    <Icons.Check className="h-3 w-3 text-slate-400" />
                                                </div>
                                            ) : (
                                                <div
                                                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${isSelected
                                                        ? 'bg-primary-600 border-primary-600'
                                                        : 'border-slate-300 dark:border-slate-600'
                                                        }`}
                                                >
                                                    {isSelected && <Icons.Check className="h-3 w-3 text-white" />}
                                                </div>
                                            )}
                                        </div>

                                        {/* Item Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-semibold text-slate-900 dark:text-white truncate">
                                                    {item.name}
                                                </h4>
                                                {isLinked && (
                                                    <span className="px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                                                        مضاف
                                                    </span>
                                                )}
                                            </div>
                                            {isProduct && (
                                                <div className="flex gap-3 mt-1 text-sm text-slate-500 dark:text-slate-400">
                                                    <span>الوحدة: {(item as MasterProduct).unitType}</span>
                                                    <span>الوزن: {(item as MasterProduct).weightKg} كجم</span>
                                                    {(item as MasterProduct).category && (
                                                        <span>الفئة: {(item as MasterProduct).category}</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={submitting || selectedItems.size === 0}
                        className="flex-1"
                    >
                        {submitting ? (
                            <>
                                <Icons.Loader className="ml-2 h-4 w-4 animate-spin" />
                                جاري الإضافة...
                            </>
                        ) : (
                            `إضافة ${selectedItems.size > 0 ? `(${selectedItems.size})` : ''}`
                        )}
                    </Button>
                    <Button variant="ghost" onClick={handleClose} disabled={submitting}>
                        إلغاء
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default MasterCatalogSelectionModal;
