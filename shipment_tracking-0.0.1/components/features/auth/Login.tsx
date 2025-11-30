import React, { useState, useEffect } from 'react';
import Button from '../../common/ui/Button';
import Input from '../../common/ui/Input';
import Card from '../../common/display/Card';
import { Icons } from '../../Icons';
import TimeWidget from '../../common/display/TimeWidget';

import { useAppContext } from '../../../providers/AppContext';
import { supabase } from '../../../utils/supabaseClient';
import {
  storeOfflineCredentials,
  refreshOfflineCredentials,
} from '../../../utils/offlineAuth';
import { useOfflineAuth } from '../../../hooks/useOfflineAuth';
import logger from '../../../utils/logger';
import { getCSRFTokenForForm } from '../../../utils/csrf';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { isTimeWidgetVisible, loadOfflineUser } = useAppContext();
  
  const {
    isOffline,
    hasStoredCredentials,
    hasOfflineSession,
    showReauthWarning,
    validateCredentials,
    createSession,
  } = useOfflineAuth();

  // Pre-cache auth resources when online
  useEffect(() => {
    if (!isOffline && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_AUTH_RESOURCES',
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co',
        supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'
      });
    }
  }, [isOffline]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Check if offline
      if (isOffline) {
        // Try offline login
        if (!hasStoredCredentials) {
          setError('لا يمكن تسجيل الدخول دون اتصال بالإنترنت. يرجى الاتصال بالإنترنت لأول مرة.');
          setLoading(false);
          return;
        }

        const validation = await validateCredentials(email, password);

        if (!validation.valid) {
          if (validation.expired) {
            setError('انتهت صلاحية بيانات الدخول المحفوظة. يرجى الاتصال بالإنترنت لتسجيل الدخول مرة أخرى.');
          } else {
            setError('اسم المستخدم أو كلمة المرور غير صحيحة');
          }
          setLoading(false);
          return;
        }

        // Create offline session
        await createSession(validation.userId!, email);

        // Load offline user manually since no Supabase auth state change
        await loadOfflineUser();
        logger.info('Offline login successful');
        setLoading(false);
        return;
      }

      // Online login
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      clearTimeout(timeoutId);

      if (authError) {
        // Handle specific error cases
        if (authError.message.includes("Invalid login credentials")) {
          setError('اسم المستخدم أو كلمة المرور غير صحيحة');
        } else if (authError.message.includes("fetch") || authError.message.includes("network") || authError.name === 'AbortError') {
          setError('فشل الاتصال بالخادم. يرجى التحقق من الاتصال بالإنترنت.');
        } else if (!authError.message || authError.message === '{}' || authError.message === '') {
          setError('فشل تسجيل الدخول. يرجى التحقق من الاتصال بالإنترنت.');
        } else {
          setError(authError.message);
        }
        setLoading(false);
        return;
      }

      // Fetch user profile
      if (data.user) {
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (!profileError && userProfile) {
          // Store credentials for offline use
          await storeOfflineCredentials(email, password, data.user.id, userProfile);
          logger.info('Online login successful - credentials stored for offline use');
        } else {
          // Even if profile fetch failed, refresh existing credentials expiry
          await refreshOfflineCredentials();
        }
      }

      // onAuthStateChange in AppContext will handle the rest
    } catch (err: any) {
      // Handle network errors and timeouts
      if (err.name === 'AbortError') {
        setError('انتهت مهلة الاتصال. يرجى المحاولة مرة أخرى.');
      } else if (err.message && (err.message.includes('fetch') || err.message.includes('network'))) {
        setError('فشل الاتصال بالخادم. يرجى التحقق من الاتصال بالإنترنت.');
      } else {
        setError('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-secondary-100 dark:bg-secondary-900">
      {isTimeWidgetVisible && <TimeWidget />}
      <div className="flex-grow flex items-center justify-center">
        <div className="w-full max-w-md px-4">
          <div className="flex justify-center mb-6">
              <Icons.Truck className="h-12 w-12 text-primary-600" />
          </div>
          <Card>
              <h2 className="text-2xl font-bold text-center text-secondary-900 dark:text-secondary-100 mb-6">تسجيل الدخول</h2>
              
              {/* Offline indicator */}
              {isOffline && (
                <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-600 rounded-lg flex items-center gap-2">
                  <Icons.WifiOff className="h-5 w-5 text-yellow-700 dark:text-yellow-400" />
                  <span className="text-sm text-yellow-800 dark:text-yellow-300">
                    {hasStoredCredentials ? 'وضع غير متصل - استخدام البيانات المحفوظة' : 'لا يوجد اتصال بالإنترنت'}
                  </span>
                </div>
              )}
              
              {/* Offline session indicator */}
              {hasOfflineSession && !isOffline && (
                <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-600 rounded-lg flex items-center gap-2">
                  <Icons.CheckCircle className="h-5 w-5 text-green-700 dark:text-green-400" />
                  <span className="text-sm text-green-800 dark:text-green-300">
                    جلسة غير متصلة نشطة - يمكنك المتابعة بدون إنترنت
                  </span>
                </div>
              )}
              
              {/* Reauth warning */}
              {showReauthWarning && !isOffline && (
                <div className="mb-4 p-3 bg-blue-100 dark:bg-blue-900/30 border border-blue-400 dark:border-blue-600 rounded-lg">
                  <span className="text-sm text-blue-800 dark:text-blue-300">
                    ℹ️ لم تقم بتسجيل الدخول عبر الإنترنت منذ أكثر من 7 أيام. يُنصح بتسجيل الدخول الآن لمزامنة بياناتك.
                  </span>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6">
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
              <Input
                  id="email"
                  label="البريد الإلكتروني"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  Icon={Icons.User}
              />
              <Input
                  id="password"
                  label="كلمة المرور"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  Icon={Icons.KeyRound}
              />
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? 'جاري الدخول...' : (
                      <>
                        <Icons.LogIn className="ml-2 h-5 w-5" />
                        {isOffline && hasStoredCredentials ? 'دخول (غير متصل)' : 
                         hasOfflineSession && !isOffline ? 'متابعة (جلسة نشطة)' : 'دخول'}
                      </>
                  )}
              </Button>
              </form>
          </Card>
        </div>
      </div>
      <footer className="py-4 px-4 text-center text-sm text-secondary-500 dark:text-secondary-400">
        <p>Copyright Reserved @ {new Date().getFullYear()}</p>
        <p>Designed with ❤️ by Faris Alsolmi</p>
      </footer>
    </div>
  );
};

export default Login;
