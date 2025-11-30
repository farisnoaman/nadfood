import React, { useState, useEffect, useCallback } from 'react';
import Card from '../../common/display/Card';
import Input from '../../common/ui/Input';
import { Icons } from '../../Icons';
import Button from '../../common/ui/Button';
import { useAppContext } from '../../../providers/AppContext';
import FieldValue from '../../common/components/FieldValue';
import SupabaseService from '../../../utils/supabaseService';
import { runSettingsMigrationIfNeeded } from '../../../utils/settingsMigration';
import logger from '../../../utils/logger';

const AdminSettings: React.FC = () => {
  const {
    accountantPrintAccess, setAccountantPrintAccess,
    isPrintHeaderEnabled, setIsPrintHeaderEnabled,
    appName, setAppName,
    companyName, setCompanyName,
    companyAddress, setCompanyAddress,
    companyPhone, setCompanyPhone,
    companyLogo, setCompanyLogo,
    isTimeWidgetVisible, setIsTimeWidgetVisible,
    currentUser
  } = useAppContext();

  // State for database sync and pending changes
  const [dbSettings, setDbSettings] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [syncNotifications, setSyncNotifications] = useState<string[]>([]);

  // State for edit mode and temporary form data
  const [isEditing, setIsEditing] = useState(false);
  const [tempDetails, setTempDetails] = useState({
    name: companyName,
    address: companyAddress,
    phone: companyPhone,
    logo: companyLogo,
    appName: appName,
  });

  useEffect(() => {
    if (!isEditing) {
      setTempDetails({
        name: companyName,
        address: companyAddress,
        phone: companyPhone,
        logo: companyLogo,
        appName: appName,
      });
    }
  }, [companyName, companyAddress, companyPhone, companyLogo, appName, isEditing]);

  // Fetch current database settings
  const fetchDbSettings = useCallback(async (showError = true) => {
    try {
      setIsLoading(true);
      logger.debug('Fetching settings for user');

      const data = await SupabaseService.getSettings();
      logger.debug('Settings data received');

      const settingsMap = data.reduce((acc, setting) => {
        acc[setting.setting_key] = setting.setting_value || '';
        return acc;
      }, {} as Record<string, string>);

      logger.debug('Settings data received');
      logger.debug('Settings map created');

      // If no settings found, this might indicate migration wasn't applied
      if (data.length === 0) {
        console.warn('No settings found in database. Migration may not have been applied.');
      }
      setDbSettings(settingsMap);
      setLastSync(new Date());
      return settingsMap;
    } catch (error) {
      console.error('Error fetching database settings:', error);
      console.error('Current user:', currentUser);
      console.error('User role:', currentUser?.role);

      if (showError) {
        if (error.message?.includes('permission') || error.message?.includes('policy')) {
          alert('ليس لديك صلاحية للوصول إلى إعدادات النظام. يجب أن تكون مديراً للوصول إلى هذه الصفحة.');
        } else {
          alert('فشل في تحميل إعدادات قاعدة البيانات. يرجى التحقق من الاتصال بالإنترنت.');
        }
      }
      // Return empty settings as fallback
      setDbSettings({});
      return {};
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  // Check if local state differs from database
  const hasChanges = useCallback(() => {
    const localSettings = {
      accountantPrintAccess: accountantPrintAccess.toString(),
      isPrintHeaderEnabled: isPrintHeaderEnabled.toString(),
      appName,
      companyName,
      companyAddress,
      companyPhone,
      companyLogo,
      isTimeWidgetVisible: isTimeWidgetVisible.toString()
    };

    return Object.entries(localSettings).some(([key, value]) => {
      return dbSettings[key] !== value;
    });
  }, [accountantPrintAccess, isPrintHeaderEnabled, appName, companyName, companyAddress, companyPhone, companyLogo, isTimeWidgetVisible, dbSettings]);

  // Update AppContext state when database changes are received
  const updateAppContextFromDatabase = useCallback(async () => {
    try {
      const data = await SupabaseService.getSettings();
      const settingsMap = data.reduce((acc, setting) => {
        acc[setting.setting_key] = setting.setting_value || '';
        return acc;
      }, {} as Record<string, string>);

      // Update all AppContext setters to match database state
      setAccountantPrintAccess(settingsMap['accountantPrintAccess'] === 'true');
      setIsPrintHeaderEnabled(settingsMap['isPrintHeaderEnabled'] === 'true');
      setAppName(settingsMap['appName'] || 'تتبع الشحنات');
      setCompanyName(settingsMap['companyName'] || 'اسم الشركة');
      setCompanyAddress(settingsMap['companyAddress'] || 'عنوان الشركة');
      setCompanyPhone(settingsMap['companyPhone'] || 'رقم الهاتف');
      setCompanyLogo(settingsMap['companyLogo'] || '');
      setIsTimeWidgetVisible(settingsMap['isTimeWidgetVisible'] !== 'false');

      logger.info('AppContext updated from database changes');
    } catch (error) {
      console.error('Failed to update AppContext from database:', error);
    }
  }, [setAccountantPrintAccess, setIsPrintHeaderEnabled, setAppName, setCompanyName, setCompanyAddress, setCompanyPhone, setCompanyLogo, setIsTimeWidgetVisible]);

  // Show notification when settings are updated by another admin
  const showSyncNotification = useCallback((message: string) => {
    setSyncNotifications(prev => [...prev, message]);
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setSyncNotifications(prev => prev.slice(1));
    }, 5000);
  }, []);

  // Run settings migration and initial fetch on component mount
  useEffect(() => {
    logger.info('AdminSettings: Component mounted, starting initialization');

    runSettingsMigrationIfNeeded()
      .then(() => {
        logger.info('AdminSettings: Migration completed, fetching settings');
        return fetchDbSettings(false);
      })
      .then(() => {
        logger.info('AdminSettings: Settings fetched, syncing AppContext');
        // After loading dbSettings, sync AppContext with database state
        return updateAppContextFromDatabase();
      })
      .then(() => {
        logger.info('AdminSettings: Initialization completed successfully');
      })
      .catch((error) => {
        console.error('AdminSettings: Initialization failed:', error);
        // Error will be caught by ErrorBoundary
        throw error;
      });
  }, [updateAppContextFromDatabase]);

  // Subscribe to real-time changes in app_settings (admin users only)
  useEffect(() => {
    // Check if realtime is enabled via environment variable
    const enableRealtime = import.meta.env.VITE_ENABLE_REALTIME !== 'false';

    // Only establish realtime connection for admin users to prevent unnecessary API key exposure
    if (!enableRealtime || !currentUser || currentUser.role !== 'ادمن') {
      return;
    }

    logger.debug('Establishing realtime subscription for admin settings');
    const client = SupabaseService.getClient();
    const channel = client
      .channel('app_settings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'app_settings'
        },
        (payload) => {
          logger.info('Settings changed by another admin');
          // Refresh database state
          fetchDbSettings();
          // Update AppContext state to match database
          updateAppContextFromDatabase();
          // Notify user about the change
          showSyncNotification('تم تحديث الإعدادات بواسطة مدير آخر');
        }
      )
      .subscribe();

    return () => {
      logger.debug('Cleaning up admin settings realtime subscription');
      client.removeChannel(channel);
    };
  }, [fetchDbSettings, updateAppContextFromDatabase]);

  const handleEditClick = () => setIsEditing(true);
  const handleCancelClick = () => {
    setTempDetails({ name: companyName, address: companyAddress, phone: companyPhone, logo: companyLogo, appName: appName });
    setIsEditing(false);
  };
  const handleSaveClick = async () => {
    try {
      // Update local state
      setAppName(tempDetails.appName);
      setCompanyName(tempDetails.name);
      setCompanyAddress(tempDetails.address);
      setCompanyPhone(tempDetails.phone);
      setCompanyLogo(tempDetails.logo);

      // Save to database
      const settingsToUpdate = [
        { setting_key: 'appName', setting_value: tempDetails.appName },
        { setting_key: 'companyName', setting_value: tempDetails.name },
        { setting_key: 'companyAddress', setting_value: tempDetails.address },
        { setting_key: 'companyPhone', setting_value: tempDetails.phone },
        { setting_key: 'companyLogo', setting_value: tempDetails.logo }
      ];

      for (const setting of settingsToUpdate) {
        const { error } = await supabase
          .from('app_settings')
          .upsert(setting, { onConflict: 'setting_key' });

        if (error) {
          console.error('Error saving setting:', setting.setting_key, error);
          throw error;
        }
      }

      setIsEditing(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('حدث خطأ في حفظ الإعدادات. يرجى المحاولة مرة أخرى.');
    }
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempDetails(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Unified save function for all settings
  const handleSaveAll = async () => {
    try {
      setIsLoading(true);

      const settingsToSave = [
        { setting_key: 'accountantPrintAccess', setting_value: accountantPrintAccess.toString() },
        { setting_key: 'isPrintHeaderEnabled', setting_value: isPrintHeaderEnabled.toString() },
        { setting_key: 'isTimeWidgetVisible', setting_value: isTimeWidgetVisible.toString() },
        { setting_key: 'appName', setting_value: tempDetails.appName },
        { setting_key: 'companyName', setting_value: tempDetails.name },
        { setting_key: 'companyAddress', setting_value: tempDetails.address },
        { setting_key: 'companyPhone', setting_value: tempDetails.phone },
        { setting_key: 'companyLogo', setting_value: tempDetails.logo }
      ];

      // Batch save all settings
      for (const setting of settingsToSave) {
        const { error } = await supabase
          .from('app_settings')
          .upsert(setting, { onConflict: 'setting_key' });

        if (error) throw error;
      }

      // Update local state
      setAppName(tempDetails.appName);
      setCompanyName(tempDetails.name);
      setCompanyAddress(tempDetails.address);
      setCompanyPhone(tempDetails.phone);
      setCompanyLogo(tempDetails.logo);
      setIsEditing(false);

      // Refresh database state
      await fetchDbSettings();

      alert('تم حفظ جميع الإعدادات بنجاح!');
    } catch (error) {
      console.error('Error saving all settings:', error);
      alert('حدث خطأ في حفظ الإعدادات. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  const ToggleSetting: React.FC<{ label: string, isChecked: boolean, onToggle: (checked: boolean) => void, id: string }> = ({ label, isChecked, onToggle, id }) => {
    const isSynced = dbSettings[id] === isChecked.toString();

    const handleToggle = async (checked: boolean) => {
      try {
        // Update local state first
        onToggle(checked);

        // Save to database
        await SupabaseService.saveSetting(id, checked.toString());
      } catch (error) {
        console.error('Error saving toggle setting:', id, error);
        // Revert local state on error
        onToggle(!checked);
        alert('حدث خطأ في حفظ الإعداد. يرجى المحاولة مرة أخرى.');
      }
    };

    return (
      <label htmlFor={id} className={`flex flex-col sm:flex-row sm:items-center sm:justify-between cursor-pointer p-2 rounded-md hover:bg-secondary-50 dark:hover:bg-secondary-700/50 gap-2 ${
        !isSynced ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800' : ''
      }`}>
        <span className="text-secondary-800 dark:text-secondary-200 text-sm sm:text-base">{label}</span>
        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
          {!isSynced && (
            <span className="text-xs text-yellow-600 dark:text-yellow-400 flex-shrink-0">
              <span className="hidden sm:inline">غير محفوظ</span>
              <span className="sm:hidden">✏️</span>
            </span>
          )}
          <input
            type="checkbox"
            id={id}
            checked={isChecked}
            onChange={(e) => handleToggle(e.target.checked)}
            className="h-5 w-5 rounded text-primary-600 focus:ring-primary-500 border-secondary-300 dark:border-secondary-600 bg-secondary-100 dark:bg-secondary-900 focus:ring-offset-0 flex-shrink-0"
          />
        </div>
      </label>
    );
  };

  // Debug logging
    logger.debug('AdminSettings: Current user role:', currentUser?.role);
    logger.debug('AdminSettings: Is admin check:', currentUser?.role === 'ادمن');

  // Check if user is admin
  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Icons.User className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-yellow-800 dark:text-yellow-200 mb-2">
            يرجى تسجيل الدخول
          </h2>
          <p className="text-yellow-600 dark:text-yellow-300">
            يجب تسجيل الدخول للوصول إلى إعدادات النظام.
          </p>
        </div>
      </div>
    );
  }

  if (currentUser.role !== 'ادمن') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Icons.Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-800 dark:text-red-200 mb-2">
            غير مصرح لك بالوصول
          </h2>
          <p className="text-red-600 dark:text-red-300">
            يجب أن تكون مديراً للوصول إلى إعدادات النظام. دورك الحالي: {currentUser.role}
          </p>
        </div>
      </div>
    );
  }

  // Show loading state while fetching initial settings
  if (isLoading && Object.keys(dbSettings).length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent mb-4" />
          <p className="text-secondary-600 dark:text-secondary-400">جاري تحميل الإعدادات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sync Status Header */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div className="flex items-center gap-2 sm:gap-4">
            <h3 className="text-base sm:text-lg font-semibold">حالة المزامنة</h3>
            {isLoading && <Icons.RefreshCw className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-blue-500" />}
            {lastSync && (
              <span className="text-xs sm:text-sm text-secondary-500 hidden sm:inline">
                آخر تحديث: {lastSync.toLocaleTimeString('ar-EG')}
              </span>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchDbSettings}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              <Icons.RefreshCw className={`ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">تحديث من قاعدة البيانات</span>
              <span className="sm:hidden">تحديث</span>
            </Button>
            {hasUnsavedChanges && (
              <Button
                onClick={handleSaveAll}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
              >
                <Icons.Save className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">حفظ جميع التغييرات</span>
                <span className="sm:hidden">حفظ</span>
              </Button>
            )}
          </div>
        </div>
        {lastSync && (
          <div className="sm:hidden mt-2">
            <span className="text-xs text-secondary-500">
              آخر تحديث: {lastSync.toLocaleTimeString('ar-EG')}
            </span>
          </div>
        )}
        {hasUnsavedChanges && (
          <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
            <p className="text-xs sm:text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ <span className="hidden sm:inline">لديك تغييرات غير محفوظة. اضغط على "حفظ جميع التغييرات" لحفظها في قاعدة البيانات.</span>
              <span className="sm:hidden">تغييرات غير محفوظة - اضغط حفظ لحفظها</span>
            </p>
          </div>
        )}

        {/* Sync notifications */}
        {syncNotifications.length > 0 && (
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
            <div className="flex items-center gap-2">
              <Icons.Info className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-200">
                {syncNotifications[0]}
              </p>
            </div>
          </div>
        )}
      </Card>

      <Card title="صلاحيات المستخدمين">
        <ToggleSetting
          id="accountantPrintAccess"
          label="السماح للمحاسب بطباعة تقارير الشحنات النهائية"
          isChecked={accountantPrintAccess}
          onToggle={setAccountantPrintAccess}
        />
      </Card>

      <Card title="إعدادات الواجهة">
          <ToggleSetting
            id="isTimeWidgetVisible"
            label="عرض أداة الوقت والتاريخ"
            isChecked={isTimeWidgetVisible}
            onToggle={setIsTimeWidgetVisible}
          />
      </Card>

      <Card>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
          <h4 className="text-base sm:text-lg font-semibold">إعدادات التطبيق والتقارير</h4>
          {!isEditing && (
            <Button onClick={handleEditClick} size="sm" variant="secondary" className="w-full sm:w-auto">
              <Icons.Edit className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">تعديل</span>
              <span className="sm:hidden">✏️ تعديل</span>
            </Button>
          )}
        </div>

        <div className="space-y-4">
          <ToggleSetting
            id="isPrintHeaderEnabled"
            label="تفعيل رأس التقرير المخصص (الاسم والشعار)"
            isChecked={isPrintHeaderEnabled}
            onToggle={setIsPrintHeaderEnabled}
          />

          <div className="pl-4 border-r-2 dark:border-secondary-600">
            {isEditing ? (
              <div className="space-y-4">
                <Input label="اسم التطبيق" name="appName" value={tempDetails.appName} onChange={handleInputChange} />
                <Input label="اسم الشركة" name="name" value={tempDetails.name} onChange={handleInputChange} />
                <Input label="عنوان الشركة" name="address" value={tempDetails.address} onChange={handleInputChange} />
                <Input label="رقم الهاتف" name="phone" value={tempDetails.phone} onChange={handleInputChange} />
                <div>
                  <Input label="رابط شعار الشركة" name="logo" placeholder="https://example.com/logo.png" value={tempDetails.logo} onChange={handleInputChange} />
                  <div className="mt-2 flex items-center gap-4">
                    {tempDetails.logo ? (
                      <img src={tempDetails.logo} alt="Company Logo Preview" className="h-16 w-auto object-contain bg-gray-200 p-1 rounded"/>
                    ) : (
                      <div className="h-16 w-16 flex items-center justify-center bg-secondary-100 dark:bg-secondary-700 rounded text-secondary-500">
                        <Icons.Truck className="h-8 w-8" />
                      </div>
                    )}
                    {tempDetails.logo && <Button variant="secondary" size="sm" onClick={() => setTempDetails(p => ({...p, logo: ''}))}>إزالة الشعار</Button>}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                  <Button variant="secondary" onClick={handleCancelClick} className="w-full sm:w-auto order-2 sm:order-1">
                    <span className="hidden sm:inline">إلغاء</span>
                    <span className="sm:hidden">❌ إلغاء</span>
                  </Button>
                  <Button onClick={() => { handleSaveAll(); setIsEditing(false); }} className="w-full sm:w-auto order-1 sm:order-2">
                    <Icons.Save className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">حفظ التغييرات</span>
                    <span className="sm:hidden">💾 حفظ</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-1 p-2 rounded-md bg-secondary-50 dark:bg-secondary-800/30">
                <FieldValue label="اسم التطبيق" value={appName} currency="" />
                <FieldValue label="اسم الشركة" value={companyName} currency="" />
                <FieldValue label="العنوان" value={companyAddress} currency="" />
                <FieldValue label="الهاتف" value={companyPhone} currency="" />
                <div className="flex justify-between py-1 text-sm">
                  <span className="font-semibold text-secondary-600 dark:text-secondary-400">الشعار:</span>
                  <div className="text-secondary-800 dark:text-secondary-200">
                    {companyLogo ? (
                        <img src={companyLogo} alt="Company Logo" className="h-16 w-auto object-contain p-1 rounded bg-white"/>
                    ) : (
                        <span>-</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdminSettings;