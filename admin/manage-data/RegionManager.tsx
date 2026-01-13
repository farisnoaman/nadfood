import React, { useState, useMemo, useEffect } from 'react';
import { Region } from '../../../../types';
import Button from '../../../common/ui/Button';
import Input from '../../../common/ui/Input';
import Modal from '../../../common/ui/Modal';
import { Icons } from '../../../Icons';
import { useAppContext } from '../../../../providers/AppContext';

interface RegionManagerProps {
    onExport?: () => void;
}

const RegionManager: React.FC<RegionManagerProps> = ({ onExport }) => {
    const { regions, addRegion, updateRegion, deleteRegion, isOnline } = useAppContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [visibleCount, setVisibleCount] = useState(20);
    const [isRegionModalOpen, setIsRegionModalOpen] = useState(false);
    const [editingRegion, setEditingRegion] = useState<Region | null>(null);
    const [regionToDelete, setRegionToDelete] = useState<Region | null>(null);
    const [regionFormData, setRegionFormData] = useState<Omit<Region, 'id'>>({
        name: '',
    });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const filteredRegions = useMemo(() => {
        if (!searchTerm.trim()) return regions;
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        return regions.filter((r: Region) =>
            r.name.toLowerCase().includes(lowerCaseSearchTerm)
        );
    }, [regions, searchTerm]);

    useEffect(() => {
        setVisibleCount(20);
    }, [searchTerm]);

    const visibleRegions = filteredRegions.slice(0, visibleCount);
    const hasMore = visibleCount < filteredRegions.length;

    const handleOpenRegionModal = (region: Region | null) => {
        setEditingRegion(region);
        setRegionFormData(region ? { name: region.name } : { name: '' });
        setIsRegionModalOpen(true);
        setError('');
    };

    const handleCloseRegionModal = () => {
        setIsRegionModalOpen(false);
        setEditingRegion(null);
    };

    const handleRegionFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setRegionFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? Math.max(0, parseFloat(value)) || 0 : value,
        }));
    };

    const handleSaveRegion = async () => {
        setError('');
        if (!regionFormData.name.trim()) {
            setError('يرجى إدخال اسم المنطقة.');
            return;
        }
        setIsSubmitting(true);

        try {
            if (editingRegion) {
                await updateRegion(editingRegion.id, regionFormData);
            } else {
                await addRegion(regionFormData);
            }
            handleCloseRegionModal();
        } catch (err: any) {
            if (err.message.includes('duplicate key')) {
                setError('اسم المنطقة هذا موجود بالفعل.');
            } else {
                setError(`فشل حفظ المنطقة: ${err.message}`);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const confirmDeleteRegion = async () => {
        if (!regionToDelete) return;
        setIsSubmitting(true);
        try {
            await deleteRegion(regionToDelete.id);
            setRegionToDelete(null);
        } catch (err: any) {
            alert(`فشل حذف المنطقة: ${err.message}`);
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
                    <Button variant="secondary" onClick={() => handleOpenRegionModal(null)} disabled={!isOnline} title={!isOnline ? 'غير متاح في وضع عدم الاتصال' : ''}>
                        <Icons.Plus className="ml-2 h-4 w-4" />
                        إضافة منطقة جديدة
                    </Button>
                    {onExport && (
                        <Button onClick={onExport}>
                            <Icons.FileOutput className="ml-2 h-4 w-4" />
                            تصدير
                        </Button>
                    )}
                </div>
            </div>
            <div className="border dark:border-secondary-700 rounded-md min-h-[300px] p-2 space-y-2">
                {visibleRegions.length > 0 ? (
                    <>
                        {visibleRegions.map((r: Region) => (
                            <div key={r.id} className="flex justify-between items-center p-3 bg-secondary-100 dark:bg-secondary-800 rounded">
                                <div>
                                    <p className="font-semibold">{r.name}</p>
                                </div>
                                <div className="flex items-center space-x-1 rtl:space-x-reverse">
                                    <Button size="sm" variant="ghost" onClick={() => handleOpenRegionModal(r)} title="تعديل" disabled={!isOnline}>
                                        <Icons.Edit className="h-5 w-5 text-blue-500" />
                                    </Button>
                                    <Button size="sm" variant="destructive" onClick={() => setRegionToDelete(r)} title="حذف" disabled={!isOnline}>
                                        <Icons.Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {hasMore && (
                            <div className="text-center py-4">
                                <Button onClick={() => setVisibleCount(prev => prev + 20)}>
                                    تحميل المزيد
                                </Button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center text-secondary-500 py-4">لا توجد مناطق تطابق البحث.</div>
                )}
            </div>

            <Modal isOpen={isRegionModalOpen} onClose={handleCloseRegionModal} title={editingRegion ? 'تعديل منطقة' : 'إضافة منطقة جديدة'}>
                <div className="space-y-4">
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    <Input label="اسم المنطقة" name="name" value={regionFormData.name} onChange={handleRegionFormChange} required />
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="secondary" onClick={handleCloseRegionModal} disabled={isSubmitting}>إلغاء</Button>
                        <Button onClick={handleSaveRegion} disabled={isSubmitting}>{isSubmitting ? 'جاري الحفظ...' : 'حفظ'}</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={!!regionToDelete} onClose={() => setRegionToDelete(null)} title="تأكيد الحذف">
                <div className="text-center">
                    <Icons.AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
                    <p className="mt-4">هل أنت متأكد من رغبتك في حذف منطقة <span className="font-bold">{regionToDelete?.name}</span>؟</p>
                    <p className="text-sm text-secondary-500">سيؤثر هذا على إمكانية إضافة شحنات جديدة لهذه المنطقة.</p>
                    <div className="mt-6 flex justify-center gap-4">
                        <Button variant="secondary" onClick={() => setRegionToDelete(null)} disabled={isSubmitting}>إلغاء</Button>
                        <Button variant="destructive" onClick={confirmDeleteRegion} disabled={isSubmitting}>{isSubmitting ? 'جاري الحذف...' : 'نعم، حذف'}</Button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default RegionManager;