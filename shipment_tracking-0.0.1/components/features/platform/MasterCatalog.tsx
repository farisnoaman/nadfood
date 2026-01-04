import React, { useState, useEffect } from 'react';
import { Icons } from '../../Icons';
import { supabase } from '../../../utils/supabaseClient';
import toast from 'react-hot-toast';

type Tab = 'products' | 'regions';

const MasterCatalog: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('products');
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState<any[]>([]);

    // Add Item State
    const [showAddModal, setShowAddModal] = useState(false);
    const [newItem, setNewItem] = useState<any>({ name: '', unit_type: 'carton', default_price: 0, weight_kg: 1 });

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
            console.error('Error fetching catalog:', error);
            toast.error('فشل تحميل البيانات');
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const table = activeTab === 'products' ? 'master_products' : 'master_regions';
            // Filter fields based on tab
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
            setNewItem({ name: '', unit_type: 'carton', default_price: 0, weight_kg: 1 });
            fetchItems();
        } catch (error: any) {
            console.error('Error adding item:', error);
            toast.error('فشل الإضافة: ' + error.message);
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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">الدليل الشامل (Master Catalog)</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">إدارة المنتجات والمناطق الأساسية للنظام</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                >
                    <Icons.Plus className="w-5 h-5 ml-2" />
                    إضافة {activeTab === 'products' ? 'منتج' : 'منطقة'}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex space-x-4 border-b border-slate-200 dark:border-slate-700 pb-1">
                <button
                    onClick={() => setActiveTab('products')}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'products'
                            ? 'bg-white dark:bg-slate-800 text-emerald-600 border-b-2 border-emerald-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                >
                    المنتجات الأساسية
                </button>
                <button
                    onClick={() => setActiveTab('regions')}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'regions'
                            ? 'bg-white dark:bg-slate-800 text-emerald-600 border-b-2 border-emerald-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                >
                    المناطق الأساسية
                </button>
            </div>

            {/* Content */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-slate-500">جاري التحميل...</div>
                ) : items.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        <Icons.Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>لا توجد بيانات في الدليل</p>
                    </div>
                ) : (
                    <table className="w-full text-right">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr>
                                <th className="px-6 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">الاسم</th>
                                {activeTab === 'products' && (
                                    <>
                                        <th className="px-6 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">السعر الافتراضي</th>
                                        <th className="px-6 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">الوحدة</th>
                                        <th className="px-6 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">الوزن (كجم)</th>
                                    </>
                                )}
                                <th className="px-6 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {items.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{item.name}</td>
                                    {activeTab === 'products' && (
                                        <>
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{item.default_price}</td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{item.unit_type}</td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{item.weight_kg}</td>
                                        </>
                                    )}
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleDelete(item.id, item.name)}
                                            className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                                            title="حذف"
                                        >
                                            <Icons.Trash className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6 animate-in slide-in-from-bottom-4 duration-200">
                        <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">
                            إضافة {activeTab === 'products' ? 'منتج جديد' : 'منطقة جديدة'}
                        </h2>

                        <form onSubmit={handleAddItem} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">الاسم</label>
                                <input
                                    type="text"
                                    value={newItem.name}
                                    onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                    required
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                />
                            </div>

                            {activeTab === 'products' && (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">السعر</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={newItem.default_price}
                                                onChange={e => setNewItem({ ...newItem, default_price: parseFloat(e.target.value) })}
                                                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">الوزن (كجم)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.001"
                                                value={newItem.weight_kg}
                                                onChange={e => setNewItem({ ...newItem, weight_kg: parseFloat(e.target.value) })}
                                                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">الوحدة</label>
                                        <select
                                            value={newItem.unit_type}
                                            onChange={e => setNewItem({ ...newItem, unit_type: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                        >
                                            <option value="carton">كرتون</option>
                                            <option value="piece">حبة</option>
                                            <option value="kilo">كيلو</option>
                                        </select>
                                    </div>
                                </>
                            )}

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg"
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                                >
                                    حفظ
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MasterCatalog;
