import React, { useState, useMemo, useEffect } from 'react';
import { Region, RegionConfig } from '../../../../types';
import Button from '../../../common/ui/Button';
import Input from '../../../common/ui/Input';
import Modal from '../../../common/ui/Modal';
import { Icons } from '../../../Icons';
import { useAppContext } from '../../../../providers/AppContext';
import SearchableSelect from '../../../common/forms/SearchableSelect';
import ArabicDatePicker from '../../../common/ui/ArabicDatePicker';
import BatchImportModal from './BatchImportModal';

const RegionConfigManager: React.FC = () => {
    const { regions, regionConfigs, addRegionConfig, updateRegionConfig, deleteRegionConfig, isOnline } = useAppContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [visibleCount, setVisibleCount] = useState(20);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingConfig, setEditingConfig] = useState<RegionConfig | null>(null);
    const [configToDelete, setConfigToDelete] = useState<RegionConfig | null>(null);
    const [formData, setFormData] = useState<Omit<RegionConfig, 'id'>>({
        regionId: '',
        dieselLiterPrice: 0,
        dieselLiters: 0,
        zaitriFee: 0,
        roadExpenses: 0,
        effectiveFrom: new Date().toISOString().split('T')[0],
    });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    const filteredConfigs = useMemo(() => {
        // Sort by effective date descending
        const sorted = [...regionConfigs].sort((a, b) =>
            new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime()
        );

        if (!searchTerm.trim()) return sorted;
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        return sorted.filter((c: RegionConfig) => {
            const region = regions.find((r: Region) => r.id === c.regionId);
            return region?.name.toLowerCase().includes(lowerCaseSearchTerm);
        });
    }, [regionConfigs, regions, searchTerm]);

    useEffect(() => {
        setVisibleCount(20);
    }, [searchTerm]);

    const visibleConfigs = filteredConfigs.slice(0, visibleCount);
    const hasMore = visibleCount < filteredConfigs.length;

    const handleOpenModal = (config: RegionConfig | null) => {
        setEditingConfig(config);
        setFormData(config
            ? {
                regionId: config.regionId,
                dieselLiterPrice: config.dieselLiterPrice,
                dieselLiters: config.dieselLiters,
                zaitriFee: config.zaitriFee,
                roadExpenses: config.roadExpenses,
                effectiveFrom: config.effectiveFrom
            }
            : {
                regionId: '',
                dieselLiterPrice: 0,
                dieselLiters: 0,
                zaitriFee: 0,
                roadExpenses: 0,
                effectiveFrom: new Date().toISOString().split('T')[0]
            }
        );
        setIsModalOpen(true);
        setError('');
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingConfig(null);
    };

    const handleFormChange = (name: string, value: any, type?: string) => {
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? Math.max(0, parseFloat(value)) || 0 : value,
        }));
    };

    const handleSave = async () => {
        setError('');
        const { regionId } = formData;
        if (!regionId) {
            setError('يرجى اختيار المنطقة.');
            return;
        }
        setIsSubmitting(true);

        try {
            if (editingConfig) {
                await updateRegionConfig(editingConfig.id, formData);
            } else {
                await addRegionConfig(formData);
            }
            handleCloseModal();
        } catch (err: any) {
            if (err.message.includes('duplicate key')) {
                setError('يوجد إعداد مسجل لهذه المنطقة بنفس التاريخ بالفعل.');
            } else {
                setError(`فشل حفظ الإعدادات: ${err.message}`);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const confirmDelete = async () => {
        if (!configToDelete) return;
        setIsSubmitting(true);
        try {
            await deleteRegionConfig(configToDelete.id);
            setConfigToDelete(null);
        } catch (err: any) {
            alert(`فشل الحذف: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <div className="flex flex-col sm:flex-row flex-wrap justify-between items-start sm:items-center gap-4 mb-4">
                <div className="w-full sm:w-auto sm:flex-1 sm:max-w-xs">
                    <Input
                        placeholder="ابحث باسم المنطقة..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        Icon={Icons.Search}
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" onClick={() => handleOpenModal(null)} disabled={!isOnline}>
                        <Icons.Plus className="ml-2 h-4 w-4" />
                        إضافة إعدادات جديدة
                    </Button>
                    <Button variant="ghost" onClick={() => setIsImportModalOpen(true)} disabled={!isOnline} title={!isOnline ? 'غير متاح في وضع عدم الاتصال' : ''}>
                        <Icons.FileDown className="ml-2 h-4 w-4" />
                        استيراد CSV
                    </Button>
                </div>
            </div>
            <div className="border dark:border-secondary-700 rounded-md min-h-[300px] p-2 space-y-2">
                {visibleConfigs.length > 0 ? (
                    <>
                        {visibleConfigs.map((c: RegionConfig) => {
                            const regionName = regions.find((r: Region) => r.id === c.regionId)?.name || 'غير معروف';
                            return (
                                <div key={c.id} className="flex justify-between items-start p-3 bg-secondary-100 dark:bg-secondary-800 rounded">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
                                        <div className="col-span-1 sm:col-span-2">
                                            <p className="font-semibold text-lg text-primary-600">{regionName}</p>
                                            <p className="text-xs text-secondary-500 flex items-center gap-1 mb-2">
                                                <Icons.Calendar className="h-3 w-3" />
                                                ساري من: {c.effectiveFrom}
                                            </p>
                                        </div>
                                        <div className="text-sm">
                                            <p><span className="text-secondary-500">سعر الديزل:</span> {c.dieselLiterPrice} ر.ي</p>
                                            <p><span className="text-secondary-500">لترات الديزل:</span> {c.dieselLiters} لتر</p>
                                        </div>
                                        <div className="text-sm">
                                            <p><span className="text-secondary-500">رسوم الوزارة:</span> {c.zaitriFee} ر.ي</p>
                                            <p><span className="text-secondary-500">مخاسير الطريق:</span> {c.roadExpenses} ر.ي</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-1 rtl:space-x-reverse">
                                        <Button size="sm" variant="ghost" onClick={() => handleOpenModal(c)} title="تعديل" disabled={!isOnline}>
                                            <Icons.Edit className="h-5 w-5 text-blue-500" />
                                        </Button>
                                        <Button size="sm" variant="destructive" onClick={() => setConfigToDelete(c)} title="حذف" disabled={!isOnline}>
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
                    <div className="text-center text-secondary-500 py-4">لا توجد إعدادات تطابق البحث.</div>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingConfig ? 'تعديل إعدادات المنطقة' : 'إضافة إعدادات منطقة جديدة'}>
                <div className="space-y-4">
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    <SearchableSelect
                        label="المنطقة"
                        options={[{ value: '', label: 'اختر منطقة' }, ...regions.map((r: Region) => ({ value: r.id, label: r.name }))]}
                        value={formData.regionId}
                        onChange={val => handleFormChange('regionId', val)}
                        disabled={!!editingConfig}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="سعر لتر الديزل"
                            name="dieselLiterPrice"
                            type="number"
                            value={formData.dieselLiterPrice}
                            onChange={e => handleFormChange(e.target.name, e.target.value, e.target.type)}
                            required
                        />
                        <Input
                            label="كمية الديزل (لتر)"
                            name="dieselLiters"
                            type="number"
                            value={formData.dieselLiters}
                            onChange={e => handleFormChange(e.target.name, e.target.value, e.target.type)}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="رسوم الوزارة"
                            name="zaitriFee"
                            type="number"
                            value={formData.zaitriFee}
                            onChange={e => handleFormChange(e.target.name, e.target.value, e.target.type)}
                            required
                        />
                        <Input
                            label="مخاسير الطريق"
                            name="roadExpenses"
                            type="number"
                            value={formData.roadExpenses}
                            onChange={e => handleFormChange(e.target.name, e.target.value, e.target.type)}
                            required
                        />
                    </div>
                    <ArabicDatePicker
                        label="تاريخ سريان الإعدادات"
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

            <Modal isOpen={!!configToDelete} onClose={() => setConfigToDelete(null)} title="تأكيد الحذف">
                <div className="text-center">
                    <Icons.AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
                    <p className="mt-4">هل أنت متأكد من رغبتك في حذف هذه الإعدادات؟</p>
                    <p className="text-sm text-secondary-500">لا يمكن التراجع عن هذا الإجراء.</p>
                    <div className="mt-6 flex justify-center gap-4">
                        <Button variant="secondary" onClick={() => setConfigToDelete(null)} disabled={isSubmitting}>إلغاء</Button>
                        <Button variant="destructive" onClick={confirmDelete} disabled={isSubmitting}>{isSubmitting ? 'جاري الحذف...' : 'نعم، حذف'}</Button>
                    </div>
                </div>
            </Modal>

            <BatchImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                type="regionFees"
            />
        </>
    );
};

export default RegionConfigManager;
