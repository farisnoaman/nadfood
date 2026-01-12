import { useState, useCallback } from 'react';
import { Region, User } from '../types';
import { regionService } from '../services';

export const useRegions = (isOnline: boolean, currentUser: User | null, onRefresh: () => Promise<void>) => {
    const [regions, setRegions] = useState<Region[]>([]);

    const addRegion = useCallback(async (region: Omit<Region, 'id'>) => {
        await regionService.create(region, isOnline, currentUser);
        await onRefresh();
    }, [isOnline, currentUser, onRefresh]);

    const updateRegion = useCallback(async (regionId: string, updates: Partial<Region>) => {
        await regionService.update(regionId, updates, isOnline);
        await onRefresh();
    }, [isOnline, onRefresh]);

    const deleteRegion = useCallback(async (regionId: string) => {
        await regionService.delete(regionId, isOnline);
        await onRefresh();
    }, [isOnline, onRefresh]);

    return {
        regions,
        setRegions,
        addRegion,
        updateRegion,
        deleteRegion
    };
};
