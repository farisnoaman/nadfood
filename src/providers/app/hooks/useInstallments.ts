import { useState, useCallback } from 'react';
import { Installment, InstallmentPayment, User, Shipment } from '../types';
import { ShipmentStatus } from '../../../types';
import { installmentService } from '../services';

export const useInstallments = (
    isOnline: boolean,
    currentUser: User | null,
    onRefresh: () => Promise<void>,
    shipments: Shipment[],
    updateShipment: (id: string, updates: Partial<Shipment>) => Promise<void>
) => {
    const [installments, setInstallments] = useState<Installment[]>([]);
    const [installmentPayments, setInstallmentPayments] = useState<InstallmentPayment[]>([]);

    const createInstallment = useCallback(async (installment: Omit<Installment, 'id' | 'createdAt' | 'updatedAt'>) => {
        if (!isOnline) {
            await installmentService.createInstallment(installment, isOnline, currentUser);
            return;
        }

        const existingId = await installmentService.checkExistingInstallment(installment.shipmentId);

        if (existingId) {
            const shipment = shipments.find(s => s.id === installment.shipmentId);
            if (shipment && shipment.status === ShipmentStatus.INSTALLMENTS) {
                throw new Error('Installment already exists for this shipment');
            } else {
                // Installment exists but shipment status is not updated
                await updateShipment(installment.shipmentId, { status: ShipmentStatus.INSTALLMENTS });
                await onRefresh();
                return;
            }
        }

        await installmentService.createInstallment(installment, isOnline, currentUser);
        await updateShipment(installment.shipmentId, { status: ShipmentStatus.INSTALLMENTS });
        await onRefresh();
    }, [isOnline, currentUser, onRefresh, shipments, updateShipment]);

    const updateInstallment = useCallback(async (installmentId: string, updates: Partial<Installment>) => {
        await installmentService.updateInstallment(installmentId, updates, isOnline, currentUser);
        await onRefresh();
    }, [isOnline, currentUser, onRefresh]);

    const addInstallmentPayment = useCallback(async (payment: Omit<InstallmentPayment, 'id' | 'createdAt'>) => {
        await installmentService.addPayment(payment, isOnline, currentUser);
        await onRefresh();
    }, [isOnline, currentUser, onRefresh]);

    const updateInstallmentPayment = useCallback(async (paymentId: string, updates: Partial<InstallmentPayment>) => {
        await installmentService.updatePayment(paymentId, updates, isOnline, currentUser);
        await onRefresh();
    }, [isOnline, currentUser, onRefresh]);

    return {
        installments,
        setInstallments,
        installmentPayments,
        setInstallmentPayments,
        createInstallment,
        updateInstallment,
        addInstallmentPayment,
        updateInstallmentPayment
    };
};
