import React, { useState, useRef } from 'react';
import Modal from '../../../common/ui/Modal';
import Button from '../../../common/ui/Button';
import { Icons } from '../../../Icons';
import { parseCSV, formatDateForDB } from '../../../../utils/csvUtils';
import { generatePricesCSV, generateRegionConfigsCSV } from '../../../../utils/templateGenerator';
import { useAppContext } from '../../../../providers/AppContext';

interface BatchImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'prices' | 'regionFees';
}

interface ImportRow {
    data: any;
    originalRow: Record<string, string>;
    errors: string[];
    isConflict: boolean;
    existingId?: string;
}

const BatchImportModal: React.FC<BatchImportModalProps> = ({ isOpen, onClose, type }) => {
    const { regions, products, productPrices, regionConfigs, batchUpsertProductPrices, batchUpsertRegionConfigs } = useAppContext();

    const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'success'>('upload');
    const [rows, setRows] = useState<ImportRow[]>([]);
    const [conflictResolution, setConflictResolution] = useState<'skip' | 'overwrite'>('skip');
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const config = {
        prices: {
            title: 'استيراد أسعار المنتجات',
            headers: ['المنطقة', 'المنتج', 'السعر', 'تاريخ السريان'],
            required: ['المنطقة', 'المنتج', 'السعر', 'تاريخ السريان'],
        },
        regionFees: {
            title: 'استيراد رسوم المناطق',
            headers: ['المنطقة', 'سعر الديزل', 'كمية الديزل', 'رسوم زعيتري', 'خرج الطريق', 'تاريخ السريان'],
            required: ['المنطقة', 'سعر الديزل', 'كمية الديزل', 'رسوم زعيتري', 'خرج الطريق', 'تاريخ السريان'],
        }
    }[type];

    const handleDownloadTemplate = () => {
        let csvContent: string;

        if (type === 'prices') {
            csvContent = generatePricesCSV({ productPrices, regions, products });
        } else {
            csvContent = generateRegionConfigsCSV({ regionConfigs, regions });
        }

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${type === 'prices' ? 'product_prices' : 'region_configs'}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target?.result as string;
            try {
                const parsed = parseCSV(text);
                if (parsed.length === 0) {
                    setError('الملف فارغ أو غير صالح.');
                    return;
                }

                // Validate headers
                const firstRow = parsed[0];
                const missing = config.required.filter(h => !(h in firstRow));
                if (missing.length > 0) {
                    setError(`العناوين التالية مفقودة: ${missing.join(', ')}`);
                    return;
                }

                // Process rows
                const processedRows: ImportRow[] = parsed.map(row => {
                    const errors: string[] = [];
                    let mappedData: any = {};
                    let isConflict = false;
                    let existingId: string | undefined;

                    const regionName = row['المنطقة'];
                    const region = regions.find(r => r.name === regionName);
                    if (!region) errors.push(`المنطقة "${regionName}" غير موجودة`);

                    const effectiveFrom = formatDateForDB(row['تاريخ السريان']);
                    if (!effectiveFrom) errors.push(`تاريخ غير صالح: ${row['تاريخ السريان']}`);

                    if (type === 'prices') {
                        const productName = row['المنتج'];
                        const product = products.find(p => p.name === productName);
                        if (!product) errors.push(`المنتج "${productName}" غير موجود`);

                        const price = parseFloat(row['السعر']);
                        if (isNaN(price)) errors.push('سعر غير صالح');

                        if (region && product && effectiveFrom) {
                            mappedData = { regionId: region.id, productId: product.id, price, effectiveFrom };
                            const existing = productPrices.find(p =>
                                p.regionId === region.id &&
                                p.productId === product.id &&
                                p.effectiveFrom === effectiveFrom
                            );
                            if (existing) {
                                isConflict = true;
                                existingId = existing.id;
                            }
                        }
                    } else {
                        const dieselPrice = parseFloat(row['سعر الديزل']);
                        const dieselLiters = parseFloat(row['كمية الديزل']);
                        const zaitriFee = parseFloat(row['رسوم زعيتري']);
                        const roadExpenses = parseFloat(row['خرج الطريق']);

                        if (isNaN(dieselPrice) || isNaN(dieselLiters) || isNaN(zaitriFee) || isNaN(roadExpenses)) {
                            errors.push('توجد قيم عددية غير صالحة');
                        }

                        if (region && effectiveFrom) {
                            mappedData = {
                                regionId: region.id,
                                dieselLiterPrice: dieselPrice,
                                dieselLiters,
                                zaitriFee,
                                roadExpenses,
                                effectiveFrom
                            };
                            const existing = regionConfigs.find(c =>
                                c.regionId === region.id &&
                                c.effectiveFrom === effectiveFrom
                            );
                            if (existing) {
                                isConflict = true;
                                existingId = existing.id;
                            }
                        }
                    }

                    return { data: mappedData, originalRow: row, errors, isConflict, existingId };
                });

                setRows(processedRows);
                setStep('preview');
                setError(null);
            } catch (err) {
                setError('حدث خطأ أثناء معالجة الملف.');
            }
        };
        reader.readAsText(file);
    };

    const handleImport = async () => {
        setStep('importing');
        try {
            const validRows = rows.filter(r => r.errors.length === 0);
            const rowsToProcess = conflictResolution === 'skip'
                ? validRows.filter(r => !r.isConflict)
                : validRows;

            const dataToSubmit = rowsToProcess.map(r => ({
                ...r.data,
                id: conflictResolution === 'overwrite' ? r.existingId : undefined
            }));

            if (type === 'prices') {
                await batchUpsertProductPrices(dataToSubmit);
            } else {
                await batchUpsertRegionConfigs(dataToSubmit);
            }
            setStep('success');
        } catch (err: any) {
            setError(`فشل الاستيراد: ${err.message}`);
            setStep('preview');
        }
    };

    const reset = () => {
        setStep('upload');
        setRows([]);
        setError(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={config.title} size="xl">
            <div className="space-y-6">
                {step === 'upload' && (
                    <div className="space-y-4">
                        <div className="flex justify-end">
                            <Button variant="secondary" size="sm" onClick={handleDownloadTemplate}>
                                <Icons.Download className="ml-2 h-4 w-4" />
                                تحميل نموذج
                            </Button>
                        </div>
                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-secondary-300 dark:border-secondary-600 rounded-lg p-12 hover:border-primary-500 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <Icons.FileDown className="h-12 w-12 text-secondary-400 mb-4" />
                            <p className="text-secondary-600 dark:text-secondary-400 text-center">
                                انقر هنا لاختيار ملف CSV للاستيراد
                            </p>
                            <p className="text-xs text-secondary-400 mt-2">
                                العناوين المطلوبة: {config.headers.join(', ')}
                            </p>
                            <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileChange} />
                        </div>
                    </div>
                )}

                {step === 'preview' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="font-semibold text-lg">مراجعة البيانات ({rows.length} سجل)</p>
                                <p className="text-sm text-secondary-500">
                                    السجلات الصالحة: {rows.filter(r => r.errors.length === 0).length} |
                                    الأخطاء: {rows.filter(r => r.errors.length > 0).length} |
                                    التضاربات: {rows.filter(r => r.isConflict && r.errors.length === 0).length}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="secondary" onClick={reset}>تغيير الملف</Button>
                            </div>
                        </div>

                        {rows.some(r => r.isConflict && r.errors.length === 0) && (
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3 rounded-md flex items-center justify-between">
                                <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-300">
                                    <Icons.AlertTriangle className="h-5 w-5" />
                                    <span>تم العثور على سجلات موجودة بالفعل لنفس التاريخ. كيف تريد التعامل معها؟</span>
                                </div>
                                <div className="flex gap-2">
                                    <label className="flex items-center gap-1 cursor-pointer">
                                        <input type="radio" name="conflict" checked={conflictResolution === 'skip'} onChange={() => setConflictResolution('skip')} />
                                        تخطي
                                    </label>
                                    <label className="flex items-center gap-1 cursor-pointer">
                                        <input type="radio" name="conflict" checked={conflictResolution === 'overwrite'} onChange={() => setConflictResolution('overwrite')} />
                                        تحديث (استبدال)
                                    </label>
                                </div>
                            </div>
                        )}

                        <div className="max-h-[400px] overflow-auto border dark:border-secondary-700 rounded-md">
                            <table className="w-full text-sm text-right">
                                <thead className="bg-secondary-50 dark:bg-secondary-800 sticky top-0">
                                    <tr>
                                        {config.headers.map(h => <th key={h} className="p-2 border-b">{h}</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row, idx) => (
                                        <tr key={idx} className={row.errors.length > 0 ? 'bg-red-50 dark:bg-red-900/20' : row.isConflict ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}>
                                            {config.headers.map(h => (
                                                <td key={h} className="p-2 border-b">{row.originalRow[h] || '-'}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Error Summary */}
                        {rows.some(r => r.errors.length > 0) && (
                            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                                <h4 className="font-semibold text-red-800 dark:text-red-300 mb-2">الأخطاء المكتشفة:</h4>
                                <ul className="list-disc list-inside space-y-1 text-sm text-red-700 dark:text-red-400">
                                    {rows.filter(r => r.errors.length > 0).map((row, idx) => (
                                        <li key={idx}>
                                            السطر {idx + 2}: {row.errors.join(', ')}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button variant="secondary" onClick={onClose}>إلغاء</Button>
                            <Button onClick={handleImport} disabled={rows.filter(r => r.errors.length === 0).length === 0}>
                                بدء الاستيراد
                            </Button>
                        </div>
                    </div>
                )}

                {step === 'importing' && (
                    <div className="text-center py-12">
                        <Icons.RefreshCw className="h-12 w-12 text-primary-500 animate-spin mx-auto mb-4" />
                        <p>جاري استيراد البيانات، يرجى الانتظار...</p>
                    </div>
                )}

                {step === 'success' && (
                    <div className="text-center py-12 space-y-4">
                        <Icons.CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                        <h3 className="text-xl font-bold">تم الاستيراد بنجاح!</h3>
                        <p className="text-secondary-500">تمت معالجة جميع السجلات بنجاح.</p>
                        <Button onClick={onClose} className="mt-4">إغلاق</Button>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-md text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                        <Icons.AlertTriangle className="h-5 w-5" />
                        {error}
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default BatchImportModal;
