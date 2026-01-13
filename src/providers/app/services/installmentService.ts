/**
 * Installment service - CRUD operations for installments and payments
 */

import { supabase } from '../../../utils/supabaseClient';
import { Installment, InstallmentPayment } from '../../../types';
import { installmentFromRow, installmentPaymentFromRow } from '../mappers';
import logger from '../../../utils/logger';
import * as IndexedDB from '../../../utils/indexedDB';
import { STORES } from '../../../utils/constants';

export const installmentService = {
    // --- Installments ---

    async fetchAllInstallments(signal?: AbortSignal): Promise<Installment[]> {
        const { data, error } = await (supabase as any)
            .from('installments')
            .select('*')
            .abortSignal(signal);

        if (error) {
            logger.error('Error fetching installments:', error);
            throw error;
        }

        return (data || []).map(installmentFromRow);
    },

    async fetchAllPayments(signal?: AbortSignal): Promise<InstallmentPayment[]> {
        const { data, error } = await (supabase as any)
            .from('installment_payments')
            .select('*')
            .order('received_date', { ascending: false })
            .abortSignal(signal);

        if (error) {
            logger.error('Error fetching installment payments:', error);
            throw error;
        }

        return (data || []).map(installmentPaymentFromRow);
    },

    async checkExistingInstallment(shipmentId: string): Promise<string | null> {
        const { data, error } = await (supabase as any)
            .from('installments')
            .select('id')
            .eq('shipment_id', shipmentId)
            .maybeSingle();

        if (error) throw error;
        return data ? data.id : null;
    },

    async createInstallment(installment: Omit<Installment, 'id' | 'createdAt' | 'updatedAt'>, isOnline: boolean, currentUser: any): Promise<void> {
        if (isOnline) {
            const { error } = await (supabase as any).from('installments').insert({
                shipment_id: installment.shipmentId,
                payable_amount: installment.payableAmount,
                remaining_amount: installment.payableAmount, // Initially same as payable
                status: installment.status,
                installment_type: installment.installmentType || 'regular',
                original_amount: installment.originalAmount,
                notes: installment.notes,
                company_id: currentUser?.companyId,
                created_by: currentUser?.id,
                updated_by: currentUser?.id,
            });

            if (error) throw error;
        } else {
            // Offline
            const tempInstallment: Installment = {
                ...installment,
                id: `temp-${Date.now()}`,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            } as Installment;

            await IndexedDB.saveToStore(STORES.INSTALLMENTS, tempInstallment);
            await IndexedDB.addToMutationQueue({
                type: 'createInstallment',
                payload: installment,
                userId: currentUser?.id
            });
        }
    },

    async updateInstallment(installmentId: string, updates: Partial<Installment>, isOnline: boolean, currentUser: any): Promise<void> {
        const updateData: any = {};
        if (updates.payableAmount !== undefined) updateData.payable_amount = updates.payableAmount;
        if (updates.remainingAmount !== undefined) updateData.remaining_amount = updates.remainingAmount;
        if (updates.status !== undefined) updateData.status = updates.status;
        if (updates.installmentType !== undefined) updateData.installment_type = updates.installmentType;
        if (updates.originalAmount !== undefined) updateData.original_amount = updates.originalAmount;
        if (updates.notes !== undefined) updateData.notes = updates.notes;
        if (updates.updatedBy !== undefined) updateData.updated_by = updates.updatedBy;

        if (isOnline) {
            const { error } = await (supabase as any)
                .from('installments')
                .update(updateData)
                .eq('id', installmentId);

            if (error) throw error;
        } else {
            await IndexedDB.addToMutationQueue({
                type: 'updateInstallment',
                payload: { installmentId, updates },
                userId: currentUser?.id
            });
        }
    },

    // --- Payments ---

    async addPayment(payment: Omit<InstallmentPayment, 'id' | 'createdAt'>, isOnline: boolean, currentUser: any): Promise<void> {
        if (isOnline) {
            const { error } = await (supabase as any).from('installment_payments').insert({
                installment_id: payment.installmentId,
                amount: payment.amount,
                received_date: payment.receivedDate,
                notes: payment.notes,
                company_id: currentUser?.companyId,
                created_by: currentUser?.id,
            });

            if (error) throw error;
        } else {
            const tempPayment: InstallmentPayment = {
                ...payment,
                id: `temp-${Date.now()}`,
                createdAt: new Date().toISOString()
            } as InstallmentPayment;

            await IndexedDB.saveToStore(STORES.INSTALLMENT_PAYMENTS, tempPayment);
            await IndexedDB.addToMutationQueue({
                type: 'addInstallmentPayment',
                payload: payment,
                userId: currentUser?.id
            });
        }
    },

    async updatePayment(paymentId: string, updates: Partial<InstallmentPayment>, isOnline: boolean, currentUser: any): Promise<void> {
        const updateData: any = {};
        if (updates.amount !== undefined) updateData.amount = updates.amount;
        if (updates.receivedDate !== undefined) updateData.received_date = updates.receivedDate;
        if (updates.paymentMethod !== undefined) updateData.payment_method = updates.paymentMethod;
        if (updates.referenceNumber !== undefined) updateData.reference_number = updates.referenceNumber;
        if (updates.notes !== undefined) updateData.notes = updates.notes;

        if (isOnline) {
            const { error } = await (supabase as any)
                .from('installment_payments')
                .update(updateData)
                .eq('id', paymentId);

            if (error) throw error;
        } else {
            await IndexedDB.addToMutationQueue({
                type: 'updateInstallmentPayment',
                payload: { paymentId, updates },
                userId: currentUser?.id
            });
        }
    }
};
