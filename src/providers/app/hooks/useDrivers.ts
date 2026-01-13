import { useState, useCallback } from 'react';
import { Driver, User } from '../types';
import { driverService } from '../services';

export const useDrivers = (isOnline: boolean, currentUser: User | null, onRefresh: () => Promise<void>) => {
    const [drivers, setDrivers] = useState<Driver[]>([]);

    const addDriver = useCallback(async (driver: Omit<Driver, 'id'>) => {
        await driverService.create(driver, isOnline, currentUser);
        await onRefresh();
    }, [isOnline, currentUser, onRefresh]);

    const updateDriver = useCallback(async (driverId: number, updates: Partial<Driver>) => {
        await driverService.update(driverId, updates, isOnline);
        await onRefresh();
    }, [isOnline, onRefresh]);

    const deleteDriver = useCallback(async (driverId: number) => {
        await driverService.delete(driverId, isOnline);
        await onRefresh();
    }, [isOnline, onRefresh]);

    const batchUpsertDrivers = useCallback(async (drivers: (Omit<Driver, 'id'> & { id?: number })[]) => {
        await driverService.batchUpsertDrivers(drivers, currentUser);
        await onRefresh();
    }, [currentUser, onRefresh]);

    return {
        drivers,
        setDrivers,
        addDriver,
        updateDriver,
        deleteDriver,
        batchUpsertDrivers
    };
};
