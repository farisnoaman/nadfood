import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '../../Icons';
import { supabase } from '../../../utils/supabaseClient';
import toast from 'react-hot-toast';
import logger from '../../../utils/logger';
import { usePersistedState } from '../../../hooks/usePersistedState';
import Papa from 'papaparse';

type Tab = 'products' | 'regions';

const MasterCatalog: React.FC = () => {
    const [activeTab, setActiveTab] = usePersistedState<Tab>('masterCatalog_activeTab', 'products');
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState<any[]>([]);

    // Add Item State
    const [showAddModal, setShowAddModal] = useState(false);
    const [newItem, setNewItem] = useState<any>({ name: '', unit_type: 'carton', default_price: 0, weight_kg: 1, factory_name: '' });

    // Edit Item State
    const [editingItem, setEditingItem] = useState<any>(null);
    const [showEditModal, setShowEditModal] = useState(false);

    // Import State
    const [showImportModal, setShowImportModal] = useState(false);
    const [importData, setImportData] = useState<any[]>([]);
    const [importLoading, setImportLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchItems();
    }, [activeTab]);

    const fetchItems = async () => {
        setLoading(true);
        const table = activeTab === 'products' ? 'master_products' : 'master_regions';
        try {
            const { data, error } = await supabase.from(table as any).select('*').order('created_at', { ascending: false });
            if (error) throw error;
            setItems(data || []);
        } catch (error) {
            logger.error('Error fetching catalog:', error);
            toast.error('فشل تحميل البيانات');
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const table = activeTab === 'products' ? 'master_products' : 'master_regions';
            const payload = activeTab === 'products'
                ? {
                    name: newItem.name,
                    unit_type: newItem.unit_type,
                    default_price: newItem.default_price,
                    weight_kg: newItem.weight_kg
                }
                : { name: newItem.name };

            const { error } = await supabase.from(table as any).insert(payload);
            if (error) throw error;

            toast.success('تمت الإضافة بنجاح');
            setShowAddModal(false);
            setNewItem({ name: '', unit_type: 'carton', default_price: 0, weight_kg: 1, factory_name: '' });
            fetchItems();
        } catch (error: any) {
            logger.error('Error adding item:', error);
            toast.error('فشل الإضافة: ' + error.message);
        }
    };

    // Handle CSV file selection
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.errors.length > 0) {
                    toast.error('خطأ في قراءة الملف');
                    return;
                }
                setImportData(results.data);
                setShowImportModal(true);
            },
            error: () => {
                toast.error('فشل قراءة الملف');
            }
        });
        // Reset file input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // Handle Import
    const handleImport = async () => {
        if (importData.length === 0) return;
        setImportLoading(true);

        try {
            const table = activeTab === 'products' ? 'master_products' : 'master_regions';
            const records = importData.map(row => {
                if (activeTab === 'products') {
                    return {
                        name: row['اسم المنتج'] || row['name'] || '',
                        unit_type: row['الوحدة'] || row['unit_type'] || 'carton',
                        default_price: parseFloat(row['السعر الافتراضي'] || row['default_price']) || 0,
                        weight_kg: parseFloat(row['الوزن (كجم)'] || row['weight_kg']) || 1,
                        factory_name: row['اسم المصنع'] || row['factory_name'] || null,
                    };
                } else {
                    return {
                        name: row['اسم المنطقة'] || row['name'] || '',
                    };
                }
            }).filter(r => r.name);

            if (records.length === 0) {
                toast.error('لا توجد بيانات صالحة للاستيراد');
                setImportLoading(false);
                return;
            }

            const { error } = await supabase.from(table as any).insert(records);
            if (error) throw error;

            toast.success(`تم استيراد ${records.length} سجل بنجاح`);
            setShowImportModal(false);
            setImportData([]);
            fetchItems();
        } catch (error: any) {
            logger.error('Import error:', error);
            toast.error('فشل الاستيراد: ' + error.message);
        } finally {
            setImportLoading(false);
        }
    };

    // Handle Export
    const handleExport = () => {
        if (items.length === 0) {
            toast.error('لا توجد بيانات للتصدير');
            return;
        }

        let csvContent: string;
        if (activeTab === 'products') {
            const headers = ['اسم المنتج', 'الوحدة', 'السعر الافتراضي', 'الوزن (كجم)', 'اسم المصنع'];
            const rows = items.map(item => [
                item.name,
                item.unit_type,
                item.default_price,
                item.weight_kg,
                item.factory_name || ''
            ]);
            csvContent = Papa.unparse({ fields: headers, data: rows });
        } else {
            const headers = ['اسم المنطقة'];
            const rows = items.map(item => [item.name]);
            csvContent = Papa.unparse({ fields: headers, data: rows });
        }

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `master_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success('تم تصدير البيانات بنجاح');
    };

    const handleEdit = (item: any) => {
        setEditingItem(item);
        setShowEditModal(true);
    };

    const handleUpdateItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem) return;

        try {
            const table = activeTab === 'products' ? 'master_products' : 'master_regions';
            const payload = activeTab === 'products'
                ? {
                    name: editingItem.name,
                    unit_type: editingItem.unit_type,
                    default_price: editingItem.default_price,
                    weight_kg: editingItem.weight_kg,
                    factory_name: editingItem.factory_name || null,
                }
                : { name: editingItem.name };

            const { error } = await supabase
                .from(table as any)
                .update(payload)
                .eq('id', editingItem.id);

            if (error) throw error;

            toast.success('تم التحديث بنجاح');
            setShowEditModal(false);
            setEditingItem(null);
            fetchItems();
        } catch (error: any) {
            logger.error('Error updating item:', error);
            toast.error('فشل التحديث: ' + error.message);
        }
    };

    const handleToggleActive = async (item: any) => {
        const newStatus = !item.is_active;
        const action = newStatus ? 'تفعيل' : 'إلغاء تفعيل';
        if (!confirm(`هل أنت متأكد من ${action} "${item.name}"؟\n\nملاحظة: العناصر غير المفعلة لن تظهر على مستوى الشركات.`)) return;

        try {
            const table = activeTab === 'products' ? 'master_products' : 'master_regions';
            const { error } = await supabase
                .from(table as any)
                .update({ is_active: newStatus })
                .eq('id', item.id);

            if (error) throw error;
            toast.success(`تم ${action} بنجاح`);
            fetchItems();
        } catch (error) {
            logger.error('Toggle active error:', error);
            toast.error(`فشل ${action}`);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`هل أنت متأكد من حذف "${name}"؟`)) return;

        try {
            const table = activeTab === 'products' ? 'master_products' : 'master_regions';
            const { error } = await supabase.from(table as any).delete().eq('id', id);
            if (error) throw error;
            toast.success('تم الحذف بنجاح');
            fetchItems();
        } catch (error) {
            toast.error('فشل الحذف');
        }
    }

    const ActionButtons = ({ item }: { item: any }) => (
        <div className="flex items-center gap-1">
            <button
                onClick={() => handleEdit(item)}
                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                title="تعديل"
            >
                <Icons.Edit className="w-4 h-4" />
            </button>
            <button
                onClick={() => handleToggleActive(item)}
                className={`p-2 rounded-lg transition-colors ${item.is_active
                    ? 'text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                    : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                    }`}
                title={item.is_active ? 'إلغاء التفعيل' : 'تفعيل'}
            >
                {item.is_active ? <Icons.EyeOff className="w-4 h-4" /> : <Icons.Eye className="w-4 h-4" />}
            </button>
            <button
                onClick={() => handleDelete(item.id, item.name)}
                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="حذف"
            >
                <Icons.Trash className="w-4 h-4" />
            </button>
        </div>
    );

    if (loading && items.length === 0) {
        return (
            <div className="flex justify-center items-center h-64">
                <Icons.Loader className="w-8 h-8 text-emerald-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 px-1 sm:px-0 pb-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">الدليل الشامل</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">إدارة المنتجات والمناطق المركزية للشركة</p>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="csv-import"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        <Icons.FileInput className="w-5 h-5 ml-2" />
                        استيراد CSV
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex items-center justify-center px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors shadow-sm"
                    >
                        <Icons.FileOutput className="w-5 h-5 ml-2" />
                        تصدير CSV
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center justify-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                    >
                        <Icons.Plus className="w-5 h-5 ml-2" />
                        إضافة {activeTab === 'products' ? 'منتج' : 'منطقة'}
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-fit">
                <button
                    onClick={() => setActiveTab('products')}
                    className={`flex-1 sm:flex-none px-6 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'products'
                        ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                >
                    المنتجات
                </button>
                <button
                    onClick={() => setActiveTab('regions')}
                    className={`flex-1 sm:flex-none px-6 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'regions'
                        ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                >
                    المناطق
                </button>
            </div>

            {/* Mobile View: Cards */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
                {items.length === 0 ? (
                    <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                        <Icons.Database className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                        <p className="text-slate-400">لا توجد بيانات</p>
                    </div>
                ) : (
                    items.map((item) => (
                        <div key={item.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-slate-900 dark:text-white">{item.name}</h3>
                                    {!item.is_active && (
                                        <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">غير مفعل</span>
                                    )}
                                </div>
                                <ActionButtons item={item} />
                            </div>

                            {activeTab === 'products' && (
                                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-50 dark:border-slate-700/50">
                                    <div className="text-center">
                                        <div className="text-[10px] text-slate-400 uppercase">السعر</div>
                                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">{item.default_price}</div>
                                    </div>
                                    <div className="text-center border-x border-slate-100 dark:border-slate-700">
                                        <div className="text-[10px] text-slate-400 uppercase">الوحدة</div>
                                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">{item.unit_type}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-[10px] text-slate-400 uppercase">الوزن</div>
                                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">{item.weight_kg}كجم</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden md:block bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <table className="w-full text-right">
                    <thead className="bg-slate-50 dark:bg-slate-700/30 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">الاسم</th>
                            {activeTab === 'products' && (
                                <>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">السعر الافتراضي</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">الوحدة</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">الوزن (كجم)</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">اسم المصنع</th>
                                </>
                            )}
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {items.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                                <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{item.name}</td>
                                {activeTab === 'products' && (
                                    <>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{item.default_price} ر.ي</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs">{item.unit_type}</span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{item.weight_kg}</td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{item.factory_name || '-'}</td>
                                    </>
                                )}
                                <td className="px-6 py-4">
                                    <div className="flex justify-center items-center gap-2">
                                        {!item.is_active && (
                                            <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">غير مفعل</span>
                                        )}
                                        <ActionButtons item={item} />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                                إضافة {activeTab === 'products' ? 'منتج جديد' : 'منطقة جديدة'}
                            </h2>
                            <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
                                <Icons.X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleAddItem} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">الاسم</label>
                                <input
                                    type="text"
                                    value={newItem.name}
                                    onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                    required
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                                    placeholder="ادخل الاسم هنا..."
                                />
                            </div>

                            {activeTab === 'products' && (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">السعر</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={newItem.default_price}
                                                onChange={e => setNewItem({ ...newItem, default_price: parseFloat(e.target.value) })}
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-emerald-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">الوزن (كجم)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.001"
                                                value={newItem.weight_kg}
                                                onChange={e => setNewItem({ ...newItem, weight_kg: parseFloat(e.target.value) })}
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-emerald-500"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">الوحدة</label>
                                        <select
                                            value={newItem.unit_type}
                                            onChange={e => setNewItem({ ...newItem, unit_type: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-emerald-500"
                                        >
                                            <option value="carton">كرتون</option>
                                            <option value="piece">حبة</option>
                                            <option value="kilo">كيلو</option>
                                        </select>
                                    </div>
                                </>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20"
                                >
                                    حفظ البيانات
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && editingItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                                تعديل {activeTab === 'products' ? 'المنتج' : 'المنطقة'}
                            </h2>
                            <button onClick={() => { setShowEditModal(false); setEditingItem(null); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
                                <Icons.X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateItem} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">الاسم</label>
                                <input
                                    type="text"
                                    value={editingItem.name}
                                    onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                                    required
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                                    placeholder="ادخل الاسم هنا..."
                                />
                            </div>

                            {activeTab === 'products' && (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">السعر</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={editingItem.default_price}
                                                onChange={e => setEditingItem({ ...editingItem, default_price: parseFloat(e.target.value) })}
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-emerald-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">الوزن (كجم)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.001"
                                                value={editingItem.weight_kg}
                                                onChange={e => setEditingItem({ ...editingItem, weight_kg: parseFloat(e.target.value) })}
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-emerald-500"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">الوحدة</label>
                                        <select
                                            value={editingItem.unit_type}
                                            onChange={e => setEditingItem({ ...editingItem, unit_type: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-emerald-500"
                                        >
                                            <option value="carton">كرتون</option>
                                            <option value="piece">حبة</option>
                                            <option value="kilo">كيلو</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">اسم المصنع (اختياري)</label>
                                        <input
                                            type="text"
                                            value={editingItem.factory_name || ''}
                                            onChange={e => setEditingItem({ ...editingItem, factory_name: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                                            placeholder="مثال: مصنع أ"
                                        />
                                    </div>
                                </>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20"
                                >
                                    حفظ التعديلات
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setShowEditModal(false); setEditingItem(null); }}
                                    className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Import Modal */}
            {showImportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6 animate-in zoom-in-95 duration-200 max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                                معاينة البيانات المستوردة ({importData.length} سجل)
                            </h2>
                            <button onClick={() => { setShowImportModal(false); setImportData([]); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
                                <Icons.X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-auto border border-slate-200 dark:border-slate-700 rounded-lg mb-4">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-700 sticky top-0">
                                    <tr>
                                        {importData[0] && Object.keys(importData[0]).map(key => (
                                            <th key={key} className="px-3 py-2 text-right font-semibold text-slate-600 dark:text-slate-300">{key}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {importData.slice(0, 20).map((row, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                            {Object.values(row).map((val, vIdx) => (
                                                <td key={vIdx} className="px-3 py-2 text-slate-700 dark:text-slate-300">{String(val)}</td>
                                            ))}
                                        </tr>
                                    ))}
                                    {importData.length > 20 && (
                                        <tr>
                                            <td colSpan={100} className="px-3 py-2 text-center text-slate-400">... و {importData.length - 20} سجل آخر</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleImport}
                                disabled={importLoading}
                                className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                            >
                                {importLoading ? 'جاري الاستيراد...' : 'تأكيد الاستيراد'}
                            </button>
                            <button
                                onClick={() => { setShowImportModal(false); setImportData([]); }}
                                disabled={importLoading}
                                className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MasterCatalog;
