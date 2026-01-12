import { useState, useCallback } from 'react';
import { Product, User } from '../types';
import { productService } from '../services';

export const useProducts = (isOnline: boolean, currentUser: User | null, onRefresh: () => Promise<void>) => {
    const [products, setProducts] = useState<Product[]>([]);

    const addProduct = useCallback(async (product: Omit<Product, 'id'>) => {
        await productService.create(product, isOnline, currentUser);
        await onRefresh();
    }, [isOnline, currentUser, onRefresh]);

    const updateProduct = useCallback(async (productId: string, updates: Partial<Product>) => {
        await productService.update(productId, updates, isOnline);
        await onRefresh();
    }, [isOnline, onRefresh]);

    const deleteProduct = useCallback(async (productId: string) => {
        await productService.delete(productId, isOnline);
        await onRefresh();
    }, [isOnline, onRefresh]);

    return {
        products,
        setProducts,
        addProduct,
        updateProduct,
        deleteProduct
    };
};
