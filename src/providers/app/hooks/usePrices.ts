import { useState, useCallback } from 'react';
import { ProductPrice, DeductionPrice, User } from '../types';
import { priceService } from '../services';

export const usePrices = (isOnline: boolean, currentUser: User | null, onRefresh: () => Promise<void>) => {
    const [productPrices, setProductPrices] = useState<ProductPrice[]>([]);
    const [deductionPrices, setDeductionPrices] = useState<DeductionPrice[]>([]);

    // --- Product Prices ---
    const addProductPrice = useCallback(async (price: Omit<ProductPrice, 'id'>) => {
        await priceService.createProductPrice(price, isOnline, currentUser);
        await onRefresh();
    }, [isOnline, currentUser, onRefresh]);

    const updateProductPrice = useCallback(async (priceId: string, updates: Partial<ProductPrice>) => {
        await priceService.updateProductPrice(priceId, updates, isOnline);
        await onRefresh();
    }, [isOnline, onRefresh]);

    const deleteProductPrice = useCallback(async (priceId: string) => {
        await priceService.deleteProductPrice(priceId, isOnline);
        await onRefresh();
    }, [isOnline, onRefresh]);

    // --- Deduction Prices ---
    const addDeductionPrice = useCallback(async (price: Omit<DeductionPrice, 'id'>) => {
        await priceService.createDeductionPrice(price, isOnline, currentUser);
        await onRefresh();
    }, [isOnline, currentUser, onRefresh]);

    const updateDeductionPrice = useCallback(async (priceId: string, updates: Partial<DeductionPrice>) => {
        await priceService.updateDeductionPrice(priceId, updates, isOnline);
        await onRefresh();
    }, [isOnline, onRefresh]);

    const deleteDeductionPrice = useCallback(async (priceId: string) => {
        await priceService.deleteDeductionPrice(priceId, isOnline);
        await onRefresh();
    }, [isOnline, onRefresh]);

    return {
        productPrices,
        setProductPrices,
        deductionPrices,
        setDeductionPrices,
        addProductPrice,
        updateProductPrice,
        deleteProductPrice,
        addDeductionPrice,
        updateDeductionPrice,
        deleteDeductionPrice
    };
};
