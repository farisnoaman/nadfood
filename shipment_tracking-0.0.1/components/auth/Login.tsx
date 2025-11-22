import React, { useState, useEffect } from 'react';
import Button from '../common/Button';
import Input from '../common/Input';
import Card from '../common/Card';
import { Icons } from '../Icons';
import TimeWidget from '../common/TimeWidget';
import InstallPrompt from '../common/InstallPrompt';
import { useAppContext } from '../../context/AppContext';
import { supabase } from '../../utils/supabaseClient';
import {
  validateOfflineCredentials,
  createOfflineSession,
  hasOfflineCredentials,
  storeOfflineCredentials,
  shouldReauthenticateOnline,
} from '../../utils/offlineAuth';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [hasStoredCredentials, setHasStoredCredentials] = useState(false);
  const [showReauthWarning, setShowReauthWarning] = useState(false);
  const { isTimeWidgetVisible } = useAppContext();

  // Check online status and stored credentials
  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOffline(!navigator.onLine);
    };

    const checkStoredCredentials = async () => {
      const hasCredentials = await hasOfflineCredentials();
      setHasStoredCredentials(hasCredentials);
      
      if (hasCredentials) {
        const shouldReauth = await shouldReauthenticateOnline();
        setShowReauthWarning(shouldReauth && navigator.onLine);
      }
    };

    updateOnlineStatus();
    checkStoredCredentials();

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Check if offline
      if (!navigator.onLine) {
        // Try offline login
        if (!hasStoredCredentials) {
          setError('لا يمكن تسجيل الدخول دون اتصال بالإنترنت. يرجى الاتصال بالإنترنت لأول مرة.');
          setLoading(false);
          return;
        }

        const validation = await validateOfflineCredentials(email, password);
        
        if (!validation.valid) {
          setError('اسم المستخدم أو كلمة المرور غير صحيحة');
          setLoading(false);
          return;
        }

        // Create offline session
        await createOfflineSession(validation.userId!, email);
        
        // User will be set by onAuthStateChange in AppContext
        console.log('Offline login successful');
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
          console.log('Online login successful - credentials stored for offline use');
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
      <InstallPrompt />
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
                        {isOffline && hasStoredCredentials ? 'دخول (غير متصل)' : 'دخول'}
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
