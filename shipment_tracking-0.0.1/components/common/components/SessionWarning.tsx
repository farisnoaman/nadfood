/**
 * Session Expiry Warning Component
 * Shows warnings when sessions or credentials are about to expire
 */

import React, { useState, useEffect } from 'react';
import { Icons } from '../../Icons';

interface SessionWarningProps {
  onRenewCredentials?: () => void;
  onLogout?: () => void;
}

const SessionWarning: React.FC<SessionWarningProps> = ({
  onRenewCredentials,
  onLogout
}) => {
  const [showWarning, setShowWarning] = useState(false);
  const [warningType, setWarningType] = useState<'session' | 'credentials' | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    // Check for session expiry warnings
    const checkSessionStatus = () => {
      // This would be implemented to check actual session status
      // For now, we'll show a demo warning
      const sessionExpiry = localStorage.getItem('session_expiry');
      if (sessionExpiry) {
        const expiryTime = new Date(sessionExpiry).getTime();
        const now = Date.now();
        const timeLeft = expiryTime - now;

        if (timeLeft > 0 && timeLeft < 30 * 60 * 1000) { // 30 minutes
          setWarningType('session');
          setTimeRemaining(Math.floor(timeLeft / (60 * 1000))); // minutes
          setShowWarning(true);
        }
      }
    };

    checkSessionStatus();
    const interval = setInterval(checkSessionStatus, 60 * 1000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  if (!showWarning) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-50 max-w-md mx-auto">
      <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-600 rounded-lg p-4 shadow-lg">
        <div className="flex items-center gap-3">
          <Icons.AlertTriangle className="h-5 w-5 text-yellow-700 dark:text-yellow-400 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              {warningType === 'session' ? 'انتهاء صلاحية الجلسة قريباً' : 'انتهاء صلاحية البيانات المحفوظة'}
            </h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              {warningType === 'session'
                ? `ستنتهي صلاحية جلستك خلال ${timeRemaining} دقيقة. يرجى حفظ عملك.`
                : 'انتهت صلاحية بيانات الدخول المحفوظة. يرجى تسجيل الدخول مرة أخرى.'
              }
            </p>
          </div>
          <div className="flex gap-2">
            {onRenewCredentials && (
              <button
                onClick={() => {
                  onRenewCredentials();
                  setShowWarning(false);
                }}
                className="px-3 py-1 text-sm bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 rounded hover:bg-yellow-300 dark:hover:bg-yellow-700 transition-colors"
              >
                تجديد
              </button>
            )}
            {onLogout && (
              <button
                onClick={() => {
                  onLogout();
                  setShowWarning(false);
                }}
                className="px-3 py-1 text-sm bg-yellow-300 dark:bg-yellow-700 text-yellow-800 dark:text-yellow-200 rounded hover:bg-yellow-400 dark:hover:bg-yellow-600 transition-colors"
              >
                خروج
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionWarning;