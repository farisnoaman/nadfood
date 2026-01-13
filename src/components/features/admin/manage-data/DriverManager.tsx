import React, { useState } from 'react';
import { Driver } from '../../../../types';
import Button from '../../../common/ui/Button';
import Input from '../../../common/ui/Input';
import Modal from '../../../common/ui/Modal';
import { Icons } from '../../../Icons';
import { useAppContext } from '../../../../providers/AppContext';
import BatchImportModal from './BatchImportModal';

const DriverManager: React.FC = () => {
    const { drivers, addDriver, updateDriver, deleteDriver, isOnline, checkLimit, hasFeature } = useAppContext();
    const [visibleCount, setVisibleCount] = useState(20);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newDriverName, setNewDriverName] = useState('');
    const [newDriverPlate, setNewDriverPlate] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [driverToEdit, setDriverToEdit] = useState<Driver | null>(null);
    const [editDriverName, setEditDriverName] = useState('');
    const [editDriverPlate, setEditDriverPlate] = useState('');
    const [driverToDelete, setDriverToDelete] = useState<Driver | null>(null);
    const [driverToToggleStatus, setDriverToToggleStatus] = useState<Driver | null>(null);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    // Feature Flags & Limits
    const canAddDriver = checkLimit('maxDrivers', 1);
    const canImport = hasFeature('import_export');

    const handleCloseAddModal = () => {
        setIsAddModalOpen(false);
        setError('');
        setNewDriverName('');
        setNewDriverPlate('');
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setError('');
        setDriverToEdit(null);
        setEditDriverName('');
        setEditDriverPlate('');
    };

    const handleEditDriver = (driver: Driver) => {
        setDriverToEdit(driver);
        setEditDriverName(driver.name);
        setEditDriverPlate(driver.plateNumber);
        setIsEditModalOpen(true);
    };

    const handleAddNewDriver = async () => {
        if (!canAddDriver) {
            setError('لقد تجاوزت الحد المسموح به لعدد السائقين في باقتك الحالية.');
            return;
        }

        if (!newDriverName.trim() || !newDriverPlate.trim()) {
            setError('يرجى ملء جميع الحقول.');
            return;
        }
        setIsSubmitting(true);
        try {
            const newDriver: Omit<Driver, 'id'> = { name: newDriverName.trim(), plateNumber: newDriverPlate.trim(), isActive: true };
            await addDriver(newDriver);
            handleCloseAddModal();
        } catch (err: any) {
            if (err?.message?.includes('duplicate key')) {
                setError('اسم السائق هذا موجود بالفعل.');
            } else {
                setError(`فشل إضافة السائق: ${err?.message || 'خطأ غير معروف'}`);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateDriver = async () => {
        if (!driverToEdit || !editDriverName.trim() || !editDriverPlate.trim()) {
            setError('يرجى ملء جميع الحقول.');
            return;
        }
        setIsSubmitting(true);
        try {
            await updateDriver(driverToEdit.id, {
                name: editDriverName.trim(),
                plateNumber: editDriverPlate.trim()
            });
            handleCloseEditModal();
        } catch (err: any) {
            if (err?.message?.includes('duplicate key')) {
                setError('اسم السائق هذا موجود بالفعل.');
            } else {
                setError(`فشل تحديث السائق: ${err?.message || 'خطأ غير معروف'}`);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const confirmToggleDriverStatus = async () => {
        if (!driverToToggleStatus) return;
        setIsSubmitting(true);
        try {
            await updateDriver(driverToToggleStatus.id, { isActive: !(driverToToggleStatus.isActive ?? true) });
            setDriverToToggleStatus(null);
        } catch (err: any) {
            alert(`فشل تحديث السائق: ${err?.message || 'خطأ غير معروف'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const confirmDeleteDriver = async () => {
        if (!driverToDelete) return;
        setIsSubmitting(true);
        try {
            await deleteDriver(driverToDelete.id);
            setDriverToDelete(null);
        } catch (err: any) {
            alert(`فشل حذف السائق: ${err?.message || 'خطأ غير معروف'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const visibleDrivers = drivers.slice(0, visibleCount);
    const hasMore = visibleCount < drivers.length;

    return (
        <>
            <div className="flex flex-col sm:flex-row flex-wrap justify-end items-start sm:items-center gap-4 mb-4">
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant="secondary"
                        onClick={() => setIsAddModalOpen(true)}
                        disabled={!isOnline || !canAddDriver}
                        title={!isOnline ? 'غير متاح في وضع عدم الاتصال' : (!canAddDriver ? 'عفواً، لقد تجاوزت الحد المسموح به في باقتك' : '')}
                    >
                        <Icons.Plus className="ml-2 h-4 w-4" />
                        إضافة سائق جديد
                    </Button>

                    {canImport && (
                        <Button
                            variant="ghost"
                            onClick={() => setIsImportModalOpen(true)}
                            disabled={!isOnline || !canAddDriver}
                            title={!isOnline ? 'غير متاح في وضع عدم الاتصال' : (!canAddDriver ? 'لا يمكنك الاستيراد لأنك وصلت للحد الأقصى للسائقين' : '')}
                        >
                            <Icons.FileDown className="ml-2 h-4 w-4" />
                            استيراد CSV
                        </Button>
                    )}
                </div>
            </div>
            <div className="border dark:border-secondary-700 rounded-md min-h-[300px] p-2 space-y-2">
                {visibleDrivers.length > 0 ? (
                    <>
                        {visibleDrivers.map((d: Driver) => (
                            <div key={d.id} className={`flex justify-between items-center p-3 bg-secondary-100 dark:bg-secondary-800 rounded transition-opacity ${d.isActive ?? true ? '' : 'opacity-50'}`}>
                                <div>
                                    <span>{d.name} ({d.plateNumber})</span>
                                    <span className={`mx-2 px-2 py-0.5 text-xs rounded-full ${d.isActive ?? true ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                                        {d.isActive ?? true ? 'نشط' : 'غير نشط'}
                                    </span>
                                </div>
                                <div className="flex items-center space-x-1 rtl:space-x-reverse">
                                    <Button size="sm" variant="ghost" onClick={() => handleEditDriver(d)} title="تعديل" disabled={!isOnline}>
                                        <Icons.Edit className="h-5 w-5 text-blue-500" />
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => setDriverToToggleStatus(d)} title={d.isActive ?? true ? 'تعطيل' : 'تفعيل'} disabled={!isOnline}>
                                        {d.isActive ?? true
                                            ? <Icons.CircleX className="h-5 w-5 text-red-500" />
                                            : <Icons.CircleCheck className="h-5 w-5 text-green-500" />
                                        }
                                    </Button>
                                    <Button size="sm" variant="destructive" onClick={() => setDriverToDelete(d)} title="حذف" disabled={!isOnline}>
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
                    <div className="text-center text-secondary-500 py-4">لا توجد سائقين.</div>
                )}
            </div>

            <Modal isOpen={isAddModalOpen} onClose={handleCloseAddModal} title="إضافة سائق جديد">
                <div className="space-y-4">
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    <Input label="اسم السائق" value={newDriverName} onChange={e => setNewDriverName(e.target.value)} required />
                    <Input label="رقم اللوحة" value={newDriverPlate} onChange={e => setNewDriverPlate(e.target.value)} required />
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="secondary" onClick={handleCloseAddModal} disabled={isSubmitting}>إلغاء</Button>
                        <Button onClick={handleAddNewDriver} disabled={isSubmitting}>{isSubmitting ? 'جاري الإضافة...' : 'إضافة'}</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isEditModalOpen} onClose={handleCloseEditModal} title="تعديل السائق">
                <div className="space-y-4">
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    <Input label="اسم السائق" value={editDriverName} onChange={e => setEditDriverName(e.target.value)} required />
                    <Input label="رقم اللوحة" value={editDriverPlate} onChange={e => setEditDriverPlate(e.target.value)} required />
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="secondary" onClick={handleCloseEditModal} disabled={isSubmitting}>إلغاء</Button>
                        <Button onClick={handleUpdateDriver} disabled={isSubmitting}>{isSubmitting ? 'جاري التحديث...' : 'تحديث'}</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={!!driverToDelete} onClose={() => setDriverToDelete(null)} title="تأكيد الحذف">
                <div className="text-center">
                    <Icons.AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
                    <p className="mt-4">هل أنت متأكد من رغبتك في حذف السائق <span className="font-bold">{driverToDelete?.name}</span>؟</p>
                    <p className="text-sm text-secondary-500">لا يمكن التراجع عن هذا الإجراء.</p>
                    <div className="mt-6 flex justify-center gap-4">
                        <Button variant="secondary" onClick={() => setDriverToDelete(null)} disabled={isSubmitting}>إلغاء</Button>
                        <Button variant="destructive" onClick={confirmDeleteDriver} disabled={isSubmitting}>{isSubmitting ? 'جاري الحذف...' : 'نعم، حذف'}</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={!!driverToToggleStatus} onClose={() => setDriverToToggleStatus(null)} title="تأكيد تغيير الحالة">
                <div className="text-center">
                    <Icons.AlertTriangle className="mx-auto h-12 w-12 text-yellow-500" />
                    <p className="mt-4">
                        هل أنت متأكد من رغبتك في
                        {driverToToggleStatus?.isActive ? ' تعطيل ' : ' تفعيل '}
                        السائق
                        <span className="font-bold"> {driverToToggleStatus?.name}</span>؟
                    </p>
                    <p className="text-sm text-secondary-500">
                        {driverToToggleStatus?.isActive
                            ? 'لن يظهر السائق في قائمة المبيعات بعد التعطيل.'
                            : 'سيظهر السائق في قائمة المبيعات بعد التفعيل.'}
                    </p>
                    <div className="mt-6 flex justify-center gap-4">
                        <Button variant="secondary" onClick={() => setDriverToToggleStatus(null)} disabled={isSubmitting}>إلغاء</Button>
                        <Button variant="primary" onClick={confirmToggleDriverStatus} disabled={isSubmitting}>{isSubmitting ? 'جاري التغيير...' : 'نعم، تأكيد'}</Button>
                    </div>
                </div>
            </Modal>

            <BatchImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                type="drivers"
            />
        </>
    );
};

export default DriverManager;