import { useState, useCallback } from 'react';
import { Region, User, RegionConfig } from '../types';
import { regionService } from '../services';

export const useRegions = (isOnline: boolean, currentUser: User | null, onRefresh: () => Promise<void>) => {
    const [regions, setRegions] = useState<Region[]>([]);
    const [regionConfigs, setRegionConfigs] = useState<RegionConfig[]>([]);

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

    // --- Region Configs ---

    const addRegionConfig = useCallback(async (config: Omit<RegionConfig, 'id'>) => {
        await regionService.createConfig(config, isOnline, currentUser);
        await onRefresh();
    }, [isOnline, currentUser, onRefresh]);

    const updateRegionConfig = useCallback(async (configId: string, updates: Partial<RegionConfig>) => {
        await regionService.updateConfig(configId, updates, isOnline);
        await onRefresh();
    }, [isOnline, onRefresh]);

    const deleteRegionConfig = useCallback(async (configId: string) => {
        await regionService.deleteConfig(configId, isOnline);
        await onRefresh();
    }, [isOnline, onRefresh]);

    const batchUpsertRegionConfigs = useCallback(async (configs: (Omit<RegionConfig, 'id'> & { id?: string })[]) => {
        await regionService.batchUpsertConfigs(configs, currentUser);
        await onRefresh();
    }, [currentUser, onRefresh]);

    const batchUpsertRegions = useCallback(async (regions: (Omit<Region, 'id'> & { id?: string })[]) => {
        await regionService.batchUpsertRegions(regions, currentUser);
        await onRefresh();
    }, [currentUser, onRefresh]);

    return {
        regions,
        setRegions,
        regionConfigs,
        setRegionConfigs,
        addRegion,
        updateRegion,
        deleteRegion,
        addRegionConfig,
        updateRegionConfig,
        deleteRegionConfig,
        batchUpsertRegionConfigs,
        batchUpsertRegions
    };
};
