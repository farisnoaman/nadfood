import React, { useState, useEffect } from 'react';
import { Notification, NotificationCategory } from '../../types/types';
import { Icons } from '../Icons';
import { useAppContext } from '../../providers/AppContext';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen }) => {
  const { notifications, currentUser, markNotificationAsRead, markAllNotificationsAsRead } = useAppContext();
  const [filter, setFilter] = useState<NotificationCategory | 'all'>('all');
  const [view, setView] = useState<'list' | 'settings'>('list');

  const [settings, setSettings] = useState<Record<NotificationCategory, boolean>>({
      [NotificationCategory.USER_ACTION]: true,
      [NotificationCategory.PRICE_ALERT]: true,
      [NotificationCategory.SYSTEM]: true,
  });
  
  useEffect(() => {
    if (isOpen) {
        // Reset to list view when panel is opened
        setView('list');
    }
  }, [isOpen]);

  const handleSettingChange = (category: NotificationCategory, isEnabled: boolean) => {
    setSettings(prev => ({ ...prev, [category]: isEnabled }));
  };

  const filteredUserNotifications = notifications
    .filter((n: Notification) => {
        if (!currentUser) return false;

        const isEnabledInSettings = settings[n.category] ?? true;
        if (!isEnabledInSettings) return false;

        const roleMatch = n.targetRoles?.includes(currentUser.role);
        const userMatch = n.targetUserIds?.includes(currentUser.id);
        const categoryMatch = filter === 'all' || n.category === filter;
        return (roleMatch || userMatch) && categoryMatch;
    })
    .sort((a: Notification, b: Notification) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const handleMarkAsRead = (id: string) => {
    markNotificationAsRead(id);
  };
  
  const handleMarkAllAsRead = () => {
    markAllNotificationsAsRead();
  };

  if (!isOpen) return null;
  
  const filters: { value: NotificationCategory | 'all', label: string }[] = [
    { value: 'all', label: 'الكل'},
    { value: NotificationCategory.USER_ACTION, label: 'إجراءات'},
    { value: NotificationCategory.PRICE_ALERT, label: 'أسعار'},
    { value: NotificationCategory.SYSTEM, label: 'نظام'},
  ];

  const renderListView = () => (
    <>
      <div className="p-3 border-b dark:border-secondary-700">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold">الإشعارات</h3>
          <div className="flex items-center gap-2">
            {filteredUserNotifications.some(n => !n.read) && (
              <button onClick={handleMarkAllAsRead} className="text-sm text-primary-600 hover:underline">
                تحديد الكل كمقروء
              </button>
            )}
             <button onClick={() => setView('settings')} className="p-1 rounded-full text-secondary-500 hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors" aria-label="الإعدادات">
                <Icons.Settings className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="flex justify-start gap-2 mt-2">
            {filters.map(f => {
                const isActive = filter === f.value;
                return (
                    <button
                        key={f.value}
                        onClick={() => setFilter(f.value)}
                        className={`px-2 py-1 text-xs rounded-full transition-colors ${
                            isActive 
                            ? 'bg-primary-600 text-white font-semibold'
                            : 'bg-secondary-200 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-200 hover:bg-secondary-300 dark:hover:bg-secondary-600'
                        }`}
                    >
                        {f.label}
                    </button>
                )
            })}
        </div>
      </div>
      <div className="max-h-60 sm:max-h-80 overflow-y-auto">
        {filteredUserNotifications.length > 0 ? (
          filteredUserNotifications.map(notification => (
            <div
              key={notification.id}
              onClick={() => handleMarkAsRead(notification.id)}
              className={`p-3 border-b dark:border-secondary-700 last:border-b-0 cursor-pointer hover:bg-secondary-50 dark:hover:bg-secondary-700/50 ${
                !notification.read ? 'bg-primary-50 dark:bg-primary-900/30' : ''
              }`}
            >
              <p className="text-sm" dangerouslySetInnerHTML={{ __html: notification.message }}></p>
              <p className="text-xs text-secondary-500 mt-1">
                {new Date(notification.timestamp).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}
              </p>
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-secondary-500">
            لا توجد إشعارات تطابق هذا الفلتر.
          </div>
        )}
      </div>
    </>
  );

  const renderSettingsView = () => (
     <div className="p-3">
        <div className="flex items-center mb-4 pb-2 border-b dark:border-secondary-700">
            <button onClick={() => setView('list')} className="p-1 rounded-full text-secondary-500 hover:bg-secondary-100 dark:hover:bg-secondary-700 ml-2" aria-label="عودة">
                <Icons.ArrowRight className="h-5 w-5" />
            </button>
            <h4 className="font-semibold">إعدادات الإشعارات</h4>
        </div>
        <div className="space-y-4">
            {Object.values(NotificationCategory).map(category => (
                <label key={category} htmlFor={`toggle-${category}`} className="flex justify-between items-center cursor-pointer p-2 rounded-md hover:bg-secondary-50 dark:hover:bg-secondary-700/50">
                    <span className="text-sm text-secondary-800 dark:text-secondary-200">{category}</span>
                    <input
                        type="checkbox"
                        id={`toggle-${category}`}
                        checked={settings[category] ?? true}
                        onChange={(e) => handleSettingChange(category, e.target.checked)}
                        className="h-5 w-5 rounded text-primary-600 focus:ring-primary-500 border-secondary-300 dark:border-secondary-600 bg-secondary-100 dark:bg-secondary-900 focus:ring-offset-0"
                    />
                </label>
            ))}
        </div>
    </div>
  );

  return (
    <div className="fixed sm:absolute top-16 right-4 sm:top-14 sm:right-0 sm:left-auto z-50 w-[calc(100vw-2rem)] max-w-sm bg-white dark:bg-secondary-800 rounded-lg shadow-lg border dark:border-secondary-700">
      {view === 'list' ? renderListView() : renderSettingsView()}
    </div>
  );
};

export default NotificationPanel;