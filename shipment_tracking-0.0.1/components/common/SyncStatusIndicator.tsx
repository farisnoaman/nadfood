import React, { useState, useEffect } from 'react';
import { Icons } from '../Icons';
import {
  getSyncStatus,
  subscribeSyncStatus,
  processSyncQueue,
  SyncStatus
} from '../../utils/syncQueue';


const SyncStatusIndicator: React.FC = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(getSyncStatus());
  const [showDetails, setShowDetails] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    // Subscribe to sync status changes
    const unsubscribe = subscribeSyncStatus((status) => {
      setSyncStatus(status);
    });

    // Listen for online/offline status changes
    const handleOnlineStatus = (event: CustomEvent) => {
      setSyncStatus(prev => ({ ...prev, isOnline: event.detail.online }));
    };

    window.addEventListener('app-online-status', handleOnlineStatus as EventListener);

    return () => {
      unsubscribe();
      window.removeEventListener('app-online-status', handleOnlineStatus as EventListener);
    };
  }, []);

  const handleManualSync = async () => {
    if (syncing || !syncStatus.isOnline) return;
    
    setSyncing(true);
    try {
      await processSyncQueue();
    } finally {
      setSyncing(false);
    }
  };

  const formatLastSync = (timestamp: string | null): string => {
    if (!timestamp) return 'لم تتم المزامنة بعد';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `منذ ${diffDays} يوم`;
  };

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className="relative">
        {/* Status Badge */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg transition-all ${
            syncStatus.isOnline
              ? 'bg-green-500 hover:bg-green-600'
              : 'bg-gray-500 hover:bg-gray-600'
          } text-white`}
          title={syncStatus.isOnline ? 'متصل' : 'غير متصل'}
        >
          {syncStatus.isOnline ? (
            <Icons.Wifi className="h-4 w-4" />
          ) : (
            <Icons.WifiOff className="h-4 w-4" />
          )}

          {syncStatus.pendingCount > 0 && (
            <span className="flex items-center gap-1">
              <span className="text-xs font-semibold">{syncStatus.pendingCount}</span>
              {syncStatus.isSyncing && (
                <Icons.RefreshCw className="h-3 w-3 animate-spin" />
              )}
            </span>
          )}
        </button>

        {/* Details Panel */}
        {showDetails && (
          <div className="absolute bottom-full left-0 mb-2 w-72 bg-white dark:bg-secondary-800 rounded-lg shadow-2xl border border-secondary-200 dark:border-secondary-700 p-4">
            <div className="space-y-3">
               {/* Connection Status */}
               <div className="flex items-center justify-between pb-3 border-b border-secondary-200 dark:border-secondary-700">
                 <span className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                   حالة الاتصال
                 </span>
                 <div className="flex items-center gap-2">
                   {syncStatus.isOnline ? (
                     <>
                       <Icons.Wifi className="h-4 w-4 text-green-500" />
                       <span className="text-sm text-green-600 dark:text-green-400">متصل</span>
                     </>
                   ) : (
                     <>
                       <Icons.WifiOff className="h-4 w-4 text-gray-500" />
                       <span className="text-sm text-gray-600 dark:text-gray-400">غير متصل</span>
                     </>
                   )}
                 </div>
               </div>

              {/* Pending Count */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                  العمليات المعلقة
                </span>
                <span className={`text-sm font-semibold ${
                  syncStatus.pendingCount > 0
                    ? 'text-orange-600 dark:text-orange-400'
                    : 'text-green-600 dark:text-green-400'
                }`}>
                  {syncStatus.pendingCount}
                </span>
              </div>

              {/* Last Sync */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                  آخر مزامنة
                </span>
                <span className="text-xs text-secondary-600 dark:text-secondary-400">
                  {formatLastSync(syncStatus.lastSyncTime)}
                </span>
              </div>

              {/* Error */}
              {syncStatus.lastSyncError && (
                <div className="pt-2 border-t border-secondary-200 dark:border-secondary-700">
                  <div className="flex items-start gap-2">
                    <Icons.AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <span className="text-xs text-red-600 dark:text-red-400">
                      {syncStatus.lastSyncError}
                    </span>
                  </div>
                </div>
              )}

              {/* Manual Sync Button */}
              {syncStatus.isOnline && syncStatus.pendingCount > 0 && (
                <button
                  onClick={handleManualSync}
                  disabled={syncing}
                  className="w-full mt-2 px-3 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-secondary-400 text-white rounded-lg flex items-center justify-center gap-2 transition-colors text-sm font-medium"
                >
                  <Icons.RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'جاري المزامنة...' : 'مزامنة الآن'}
                </button>
              )}

              {/* Offline Mode Info */}
              {!syncStatus.isOnline && (
                <div className="pt-2 border-t border-secondary-200 dark:border-secondary-700">
                  <p className="text-xs text-secondary-600 dark:text-secondary-400">
                    ℹ️ ستتم مزامنة التغييرات تلقائياً عند الاتصال بالإنترنت
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SyncStatusIndicator;
