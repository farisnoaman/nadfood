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
            setNewItem({ name: '', unit_type: 'carton', default_price: 0, weight_kg: 1 });
            fetchItems();
        } catch (error: any) {
            logger.error('Error adding item:', error);
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

    const ActionButton = ({ item }: { item: any }) => (
        <button
            onClick={() => handleDelete(item.id, item.name)}
            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title="حذف"
        >
            <Icons.Trash className="w-4 h-4" />
        </button>
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
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center justify-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                >
                    <Icons.Plus className="w-5 h-5 ml-2" />
                    إضافة {activeTab === 'products' ? 'منتج' : 'منطقة'}
                </button>
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
                                <h3 className="font-bold text-slate-900 dark:text-white">{item.name}</h3>
                                <ActionButton item={item} />
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
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{item.default_price} ر.س</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs">{item.unit_type}</span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{item.weight_kg}</td>
                                    </>
                                )}
                                <td className="px-6 py-4">
                                    <div className="flex justify-center">
                                        <ActionButton item={item} />
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
        </div>
    );
};

export default MasterCatalog;
