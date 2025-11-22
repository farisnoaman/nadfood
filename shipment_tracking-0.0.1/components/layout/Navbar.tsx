
import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Icons } from '../Icons';
import Button from '../common/Button';
import { Notification } from '../../types';
import NotificationPanel from './NotificationPanel';
import { useAppContext } from '../../context/AppContext';

const Navbar: React.FC = () => {
  const { currentUser, handleLogout, notifications, appName } = useAppContext();
  const { theme, setTheme } = useTheme();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const unreadCount = notifications.filter((n: Notification) => {
    if (!currentUser || n.read) return false;
    const roleMatch = n.targetRoles?.includes(currentUser.role);
    // FIX: Corrected typo from targtUserIds to targetUserIds
    const userMatch = n.targetUserIds?.includes(currentUser.id);
    return roleMatch || userMatch;
  }).length;

  // Click outside handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsPanelOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [panelRef]);


  return (
    <nav className="bg-white dark:bg-secondary-800 shadow-sm sticky top-0 z-40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <a href="/#" className="flex items-center no-underline">
             <Icons.Truck className="h-8 w-8 text-primary-600" />
             <span className="mr-3 text-2xl font-extrabold text-secondary-800 dark:text-secondary-100">{appName}</span>
          </a>
          <div className="flex items-center">
            <div className="mr-3">
                <Button variant="ghost" size="sm" onClick={toggleTheme} aria-label="Toggle theme">
                  {theme === 'light' ? <Icons.Moon className="h-5 w-5" /> : <Icons.Sun className="h-5 w-5" />}
                </Button>
            </div>
            {currentUser && (
              <div className="flex items-center">
                <div ref={panelRef} className="relative">
                  <Button variant="ghost" size="sm" onClick={() => setIsPanelOpen(prev => !prev)} aria-label="Notifications">
                    <Icons.Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white ring-2 ring-white dark:ring-secondary-800">
                        {unreadCount}
                      </span>
                    )}
                  </Button>
                  <NotificationPanel isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />
                </div>

                 <div className="h-8 w-px bg-secondary-200 dark:bg-secondary-700 mx-3"></div>

                <div className="text-right">
                  <div className="text-sm font-medium text-secondary-800 dark:text-secondary-100">{currentUser.username}</div>
                  <div className="text-xs text-secondary-500 dark:text-secondary-400">{currentUser.role}</div>
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="mr-2 text-red-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50" aria-label="Logout">
                  <Icons.LogOut className="h-5 w-5" />
                  <span className="hidden sm:inline mr-2 font-semibold">خروج</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
